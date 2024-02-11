package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type snippet struct {
	Language string `json:"language"`
	Path     string `json:"path"`
}

func main() {
	snippets := make([]snippet, 0)
	filepath.Walk("./snippets", func(path string, info os.FileInfo, err error) error {
		if !info.IsDir() {
			snippets = append(snippets, snippet{
				"lua",
				"./" + strings.Replace(path, "\\", "/", -1),
			})
		}
		return nil
	})
	b, err := json.MarshalIndent(snippets, "", "    ")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(string(b))
}
