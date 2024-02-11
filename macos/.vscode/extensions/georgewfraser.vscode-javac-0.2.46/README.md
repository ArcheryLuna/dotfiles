# Language Server for Java using the [Java compiler API](https://docs.oracle.com/javase/10/docs/api/jdk.compiler-summary.html)

A Java [language server](https://github.com/Microsoft/vscode-languageserver-protocol) based on v3.0 of the protocol and implemented using the Java compiler API.

## Installation (VS Code)

[Install from the VS Code marketplace](https://marketplace.visualstudio.com/items?itemName=georgewfraser.vscode-javac)

## Installation (other editors)

### Vim (with vim-lsc)

- Checkout this repository
- Run `./scripts/link_{linux|mac|windows}.sh`
- Run `mvn package -DskipTests`
- Add the vim plugin [natebosch/vim-lsc](https://github.com/natebosch/vim-lsc) to your vimrc
- Add vim-lsc configuration:
  ```vimrc
  let g:lsc_server_commands = {'java': '<path-to-java-language-server>/java-language-server/dist/lang_server_{linux|mac|windows}.sh'}
  ```
- See the [vim-lsc README](https://github.com/natebosch/vim-lsc/blob/master/README.md) for other configuration options.

Note: This tool is not compatible with [vim-lsp](https://github.com/prabirshrestha/vim-lsp) as it only supports LSPv2.0.

### KDE Kate

- Checkout this repository
- Run `./scripts/link_{linux|mac|windows}.sh`
- Run `mvn package -DskipTests`
- Open your Kate editor
- Go to Settings > Configure Kate... > LSP Client > User Server Settings
- Add this lines to your User Server Settings:
```json
{
    "servers":
    {
        "java":
        {
            "command": ["bash","<path-to-java-language-server>/java-language-server/dist/lang_server_{linux|mac|windows}.sh"],
            "url": "https://github.com/georgewfraser/java-language-server",
            "highlightingModeRegex": "^Java$"
        }
    }
}
```


### Sublime 3 (with LSP)

- Checkout this repository
- Run `./scripts/link_{linux|mac|windows}.sh`
- Run `mvn package -DskipTests`
- Open your Sublime 3
- Install Package Control (if missing)
- Install the [LSP Package](https://packagecontrol.io/packages/LSP) (if missing)
- In Sublime, go to Preferences > Package Settings > LSP > Settings
- Add this lines to your LSP Settings:
```json
{
    "clients":
    {
        "jls":
        {
            "enabled": true,
            "command": ["bash", "<path-to-java-language-server>/java-language-server/dist/lang_server_{linux|mac|windows}.sh"],
            "scopes": ["source.java"],
            "syntaxes": ["Packages/Java/Java.sublime-syntax"],
            "languageId": "java"
        }
    }
}
```

## [Issues](https://github.com/georgewfraser/java-language-server/issues)

## Features

### Javadoc

![Javadoc](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/Javadoc.png)

### Signature help

![Signature help](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/SignatureHelp.png)

### Autocomplete symbols (with auto-import)

![Auto import 1](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/AutoImport1.png)

![Auto import 2](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/AutoImport2.png)

### Autocomplete members

![Autocomplete members](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/AutocompleteMembers.png)

### Go-to-definition

![Goto 1](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/Goto1.png)

![Goto 2](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/Goto2.png)

### Find symbols

![Find workspace symbols](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/FindWorkspaceSymbols.png)

![Find document symbols](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/FindDocumentSymbols.png)

### Lint

![Error highlight](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/ErrorHighlight.png)

### Type information on hover

![Type hover](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/TypeHover.png)

### Find references

![Find references 1](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/FindReferences1.png)

![Find references 2](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/FindReferences2.png)

### Debug

![Debug test](https://github.com/georgewfraser/java-language-server/raw/HEAD/images/DebugTest.png)

## Usage

The language server will provide autocomplete and other features using:
* .java files anywhere in your workspace
* Java platform classes
* External dependencies specified using `pom.xml`, Bazel, or [settings](#Settings)

## Settings

If the language server doesn't detect your external dependencies automatically, you can specify them using [.vscode/settings.json](https://code.visualstudio.com/docs/getstarted/settings)

```json
{
    "java.externalDependencies": [
        "junit:junit:jar:4.12:test", // Maven format
        "junit:junit:4.12" // Gradle-style format is also allowed
    ]
}
```

If all else fails, you can specify the Java class path and the locations of
source jars manually:

```json
{
    "java.classPath": [
        "lib/some-dependency.jar"
    ],
    "java.docPath": [
        "lib/some-dependency-sources.jar"
    ]
}
```

You can generate a list of external dependencies using your build tool:
* Maven: `mvn dependency:list`
* Gradle: `gradle dependencies`

The Java language server will look for the dependencies you specify in `java.externalDependencies` in your Maven and Gradle caches `~/.m2` and `~/.gradle`. You should use your build tool to download the library *and* source jars of all your dependencies so that the Java language server can find them:
* Maven
  * `mvn dependency:resolve` for compilation and autocomplete
  * `mvn dependency:resolve -Dclassifier=sources` for inline Javadoc help
* Gradle
  * `gradle dependencies` for compilation and autocomplete
  * Include `classifier: sources` in your build.gradle for inline Javadoc help, for example:
    ```
    dependencies {
        testCompile group: 'junit', name: 'junit', version: '4.+'
        testCompile group: 'junit', name: 'junit', version: '4.+', classifier: 'sources'
    }
    ```

## Design

The Java language server uses the [Java compiler API](https://docs.oracle.com/javase/10/docs/api/jdk.compiler-summary.html) to implement language features like linting, autocomplete, and smart navigation, and the [language server protocol](https://github.com/Microsoft/vscode-languageserver-protocol) to communicate with text editors like VSCode.

### Incremental updates

The Java compiler API provides incremental compilation at the level of files: you can create a long-lived instance of the Java compiler, and as the user edits, you only need to recompile files that have changed. The Java language server optimizes this further by *focusing* compilation on the region of interest by erasing irrelevant code. For example, suppose we want to provide autocomplete after `print` in the below code:

```java
class Printer {
    void printFoo() {
        System.out.println("foo");
    }
    void printBar() {
        System.out.println("bar");
    }
    void main() {
        print // Autocomplete here
    }
}
```

None of the code inside `printFoo()` and `printBar()` is relevant to autocompleting `print`. Before servicing the autocomplete request, the Java language server erases the contents of these methods:

```java
class Printer {
    void printFoo() {

    }
    void printBar() {

    }
    void main() {
        print // Autocomplete here
    }
}
```

For most requests, the vast majority of code can be erased, dramatically speeding up compilation.

## Logs

The java service process will output a log file to stderr, which is visible in VSCode using View / Output, under "Java".

## Contributing

### Installing

Before installing locally, you need to install prerequisites: npm, maven, protobuf. For example on Mac OS, you can install these using [Brew](https://brew.sh):

    brew install npm maven protobuf

You also need to have [Java 13](https://www.oracle.com/technetwork/java/javase/downloads/index.html) installed. Point the `JAVA_HOME` environment variable to it. For example, on Mac OS:

    export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-13.0.1.jdk/Contents/Home/

Assuming you have these prerequisites, you should be able to install locally using:

    npm install -g vsce
    npm install
    ./scripts/build.sh

### Editing

Please run ./configure before your first commit to install a pre-commit hook that formats the code.
