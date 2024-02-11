// This file is used to scrape the documentation from http://wiki.garrysmod.com and convert it
// into usable VSCode snippets.

package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/PuerkitoBio/goquery"
	"github.com/remeh/sizedwaitgroup"
)

const baseURL = "http://wiki.garrysmod.com"

const (
	scopeServer = iota
	scopeClient
	scopeMenu
	scopeClientMenu
	scopeShared
	scopeSharedMenu
)

type method struct {
	Category    string
	Name        string
	Description string
	Arguments   []argument
	Return      struct {
		Type        string
		Description string
	}
	Scope uint8
}

type argument struct {
	Type        string
	Name        string
	Description string
}

type mainCategory struct {
	subCategories []method
	directMethods []method
}

type snippet struct {
	Body        []string `json:"body"`
	Description string   `json:"description"`
	Prefix      string   `json:"prefix"`
}

var (
	mainCategoryNames = [5]string{
		"hooks",
		"libraries",
		"global",
		"classes",
		"panels",
	}
)

func init() {
	log.SetFlags(log.Lshortfile)
}

func main() {
	doc, err := goquery.NewDocument(baseURL + "/navbar")
	if err != nil {
		log.Fatal(err)
	}

	//var lastCategory string

	doc.Find("ul > li > h1").Each(func(i int, s *goquery.Selection) {
		for _, categoryName := range mainCategoryNames {
			if strings.ToLower(s.Text()) == categoryName {
				var folderMutex sync.Mutex
				folder := make(map[string][]*snippet)

				fmt.Println(categoryName)
				ul := s.SiblingsFiltered("ul").Last()
				if ul == nil {
					log.Printf("ul does not exist for category '%s'\n", s.Text())
					continue
				}

				swg := sizedwaitgroup.New(30)
				ul.Find("li > a").Each(func(i int, s *goquery.Selection) {
					swg.Add()
					go func(i int, s *goquery.Selection, folder map[string][]*snippet) {
						defer swg.Done()

						href, exists := s.Attr("href")
						if exists {
							doc, err := goquery.NewDocument(baseURL + href)
							if err != nil {
								log.Fatal(err)
							}

							var m method

							scope := doc.Find("div.function_line > span").FilterFunction(func(i int, s *goquery.Selection) bool {
								return !s.HasClass("function_args")
							})
							if scope.HasClass("client") {
								m.Scope = scopeClient
							} else if scope.HasClass("server") {
								m.Scope = scopeServer
							} else if scope.HasClass("shared") {
								m.Scope = scopeShared
							} else if scope.HasClass("menu") {
								m.Scope = scopeMenu
							} else if scope.HasClass("client_m") {
								m.Scope = scopeClientMenu
							} else if scope.HasClass("shared_m") {
								m.Scope = scopeSharedMenu
							}

							methodName := strings.TrimSpace(doc.Find("div.function_line").Text())

							parts := strings.Split(methodName, ":")
							if len(parts) > 1 {
								m.Category = strings.TrimSpace(parts[0])
								methodName = strings.TrimSpace(parts[1])
							} else {
								parts = strings.Split(methodName, ".")
								if len(parts) > 1 {
									m.Category = parts[0]
								}
							}

							methodName = strings.Replace(methodName, " ", "", -1)
							methodName = strings.Replace(methodName, "(", "", -1)
							methodName = strings.Replace(methodName, ")", "", -1)
							if methodName == "" {
								return
							}
							m.Name = methodName

							s = doc.Find("table#toc").Next().Next()
							for goquery.NodeName(s) == "p" {
								s.Find("table").Remove()
								if m.Description != "" {
									m.Description += " "
								}
								m.Description += strings.TrimSpace(s.Text())
								s = s.Next()
							}

							doc.Find("div.argument").Each(func(i int, s *goquery.Selection) {
								var arg argument
								arg.Type = strings.Replace(s.Find("p span.arg_chunk a").Text(), " ", "", -1)
								arg.Name = strings.Replace(s.Find("p span.arg_chunk").Clone().Children().Remove().End().Text(), " ", "", -1)
								s.Find("table").Remove()
								arg.Description = strings.TrimSpace(s.Find("div").Text())
								m.Arguments = append(m.Arguments, arg)
							})

							s = doc.Find("div.return")
							m.Return.Type = strings.Replace(s.Find("p span.ret_chunk a").Text(), " ", "", -1)
							s.Find("table").Remove()
							m.Return.Description = strings.TrimSpace(s.Find("div").Text())

							folderMutex.Lock()
							var snip snippet
							var snipBody string
							snipBody += m.Name + "("
							for i, arg := range m.Arguments {
								argStr := fmt.Sprintf("${%d:%s}", i+1, arg.Name)
								if i < len(m.Arguments)-1 {
									argStr += ", "
								}
								snipBody += argStr
							}
							snipBody += ")$0"

							snip.Body = []string{snipBody}
							snip.Description = strings.ToUpper(m.Category)
							switch m.Scope {
							case scopeClient:
								snip.Description += " [Client] "
							case scopeServer:
								snip.Description += " [Server] "
							case scopeShared:
								snip.Description += " [Shared] "
							case scopeMenu:
								snip.Description += " [Menu] "
							case scopeClientMenu:
								snip.Description += " [Client/Menu] "
							case scopeSharedMenu:
								snip.Description += " [Shared/Menu] "
							}
							snip.Description += m.Description + "\n\n"
							for _, arg := range m.Arguments {
								argStr := fmt.Sprintf("[%s] %s\n  %s\n\n", arg.Type, arg.Name, arg.Description)
								snip.Description += argStr
							}
							snip.Description = strings.TrimSpace(snip.Description)

							snip.Prefix = m.Name

							_, exists := folder[m.Category]
							if !exists {
								folder[m.Category] = make([]*snippet, 0)
							}
							folder[m.Category] = append(folder[m.Category], &snip)
							folderMutex.Unlock()
						}
					}(i, s, folder)
				})
				swg.Wait()

				os.Mkdir("./snippets", os.ModeDir)
				for fileName := range folder {
					if fileName != "" {
						os.Mkdir("./snippets/"+categoryName, os.ModeDir)
						break
					}
				}

				for fileName, snippets := range folder {
					snippetsMap := make(map[string]*snippet)
					for _, snip := range snippets {
						snippetsMap[snip.Prefix] = snip
					}

					fileBody, err := json.MarshalIndent(snippetsMap, "", "    ")
					if err != nil {
						log.Fatal(err)
					}

					if fileName == "" {
						fileName = ".json"
					} else {
						fileName = "/" + fileName + ".json"
					}
					err = ioutil.WriteFile("./snippets/"+categoryName+fileName, fileBody, os.ModePerm)
					if err != nil {
						log.Fatal(err)
					}
				}
			}
		}
	})
}
