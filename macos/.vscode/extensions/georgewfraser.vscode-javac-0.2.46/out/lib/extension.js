'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const Path = require("path");
const FS = require("fs");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const textMate_1 = require("./textMate");
const AdmZip = require("adm-zip");
// If we want to profile using VisualVM, we have to run the language server using regular java, not jlink
const visualVm = false;
/** Called when extension is activated */
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Activating Java');
        // Teach VSCode to open JAR files
        vscode_1.workspace.registerTextDocumentContentProvider('jar', new JarFileSystemProvider());
        // Options to control the language client
        let clientOptions = {
            // Register the server for java documents
            documentSelector: [{ scheme: 'file', language: 'java' }],
            synchronize: {
                // Synchronize the setting section 'java' to the server
                // NOTE: this currently doesn't do anything
                configurationSection: 'java',
                // Notify the server about file changes to 'javaconfig.json' files contain in the workspace
                fileEvents: [
                    vscode_1.workspace.createFileSystemWatcher('**/javaconfig.json'),
                    vscode_1.workspace.createFileSystemWatcher('**/pom.xml'),
                    vscode_1.workspace.createFileSystemWatcher('**/WORKSPACE'),
                    vscode_1.workspace.createFileSystemWatcher('**/BUILD'),
                    vscode_1.workspace.createFileSystemWatcher('**/*.java')
                ]
            },
            outputChannelName: 'Java',
            revealOutputChannelOn: 4 // never
        };
        let launcherRelativePath = platformSpecificLangServer();
        let launcherPath = [context.extensionPath].concat(launcherRelativePath);
        let launcher = Path.resolve(...launcherPath);
        // Start the child java process
        let serverOptions = {
            command: launcher,
            args: [],
            options: { cwd: context.extensionPath }
        };
        if (visualVm) {
            serverOptions = visualVmConfig(context);
        }
        enableJavadocSymbols();
        // Create the language client and start the client.
        let client = new vscode_languageclient_1.LanguageClient('java', 'Java Language Server', serverOptions, clientOptions);
        let disposable = client.start();
        // Push the disposable to the context's subscriptions so that the 
        // client can be deactivated on extension deactivation
        context.subscriptions.push(disposable);
        // Register test commands
        vscode_1.commands.registerCommand('java.command.test.run', runTest);
        vscode_1.commands.registerCommand('java.command.test.debug', debugTest);
        vscode_1.commands.registerCommand('java.command.findReferences', runFindReferences);
        // When the language client activates, register a progress-listener
        client.onReady().then(() => createProgressListeners(client));
        // Apply semantic colors using custom notification
        function asRange(r) {
            return new vscode_1.Range(asPosition(r.start), asPosition(r.end));
        }
        function asPosition(p) {
            return new vscode_1.Position(p.line, p.character);
        }
        const statics = vscode_1.window.createTextEditorDecorationType({
            fontStyle: 'italic'
        });
        const colors = new Map();
        function cacheSemanticColors(event) {
            colors.set(event.uri, event);
            applySemanticColors();
        }
        function applySemanticColors() {
            for (const editor of vscode_1.window.visibleTextEditors) {
                if (editor.document.languageId != 'java')
                    continue;
                const c = colors.get(editor.document.uri.toString());
                if (c == null) {
                    console.warn('No semantic colors for ' + editor.document.uri);
                    continue;
                }
                function decorate(scope, ranges) {
                    const d = textMate_1.decoration(scope);
                    if (d == null) {
                        console.warn(scope + ' is not defined in the current theme');
                        return;
                    }
                    editor.setDecorations(d, ranges.map(asRange));
                }
                decorate('variable', c.fields);
                editor.setDecorations(statics, c.statics.map(asRange));
            }
        }
        function forgetSemanticColors(doc) {
            colors.delete(doc.uri.toString());
        }
        // Load active color theme
        function onChangeConfiguration(event) {
            return __awaiter(this, void 0, void 0, function* () {
                let colorizationNeedsReload = event.affectsConfiguration('workbench.colorTheme')
                    || event.affectsConfiguration('editor.tokenColorCustomizations');
                if (colorizationNeedsReload) {
                    yield textMate_1.loadStyles();
                    applySemanticColors();
                }
            });
        }
        client.onReady().then(() => {
            client.onNotification(new vscode_languageclient_1.NotificationType('java/colors'), cacheSemanticColors);
            context.subscriptions.push(vscode_1.window.onDidChangeVisibleTextEditors(applySemanticColors));
            context.subscriptions.push(vscode_1.workspace.onDidCloseTextDocument(forgetSemanticColors));
            context.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(onChangeConfiguration));
        });
        yield textMate_1.loadStyles();
        applySemanticColors();
    });
}
exports.activate = activate;
// Allows VSCode to open files like jar:file:///path/to/dep.jar!/com/foo/Thing.java
class JarFileSystemProvider {
    constructor() {
        this.cache = new Map();
    }
    provideTextDocumentContent(uri, _token) {
        const { zip, file } = this.splitZipUri(uri);
        return this.readZip(zip, file);
    }
    splitZipUri(uri) {
        const path = uri.fsPath.substring("file://".length);
        const [zip, file] = path.split('!/');
        return { zip, file };
    }
    readZip(zip, file) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.cache.has(zip)) {
                    this.cache.set(zip, new AdmZip(zip));
                }
                this.cache.get(zip).readAsTextAsync(file, resolve);
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
function runFindReferences(uri, lineNumber, column) {
    // LSP is 0-based but VSCode is 1-based
    return vscode_1.commands.executeCommand('editor.action.findReferences', vscode_1.Uri.parse(uri), { lineNumber: lineNumber + 1, column: column + 1 });
}
function runTest(sourceUri, className, methodName) {
    let file = vscode_1.Uri.parse(sourceUri).fsPath;
    file = Path.relative(vscode_1.workspace.rootPath, file);
    let test = {
        type: 'java.task.test',
        className: className,
        methodName: methodName,
    };
    let shell = testShell(file, className, methodName);
    if (shell == null)
        return null;
    let workspaceFolder = vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.parse(sourceUri));
    let testTask = new vscode_1.Task(test, workspaceFolder, 'Java Test', 'Java Language Server', shell);
    return vscode_1.tasks.executeTask(testTask);
}
function testShell(file, className, methodName) {
    let config = vscode_1.workspace.getConfiguration('java');
    // Run method or class
    if (methodName != null) {
        let command = config.get('testMethod');
        if (command.length == 0) {
            vscode_1.window.showErrorMessage('Set "java.testMethod" in .vscode/settings.json');
            return null;
        }
        else {
            return templateCommand(command, file, className, methodName);
        }
    }
    else {
        let command = config.get('testClass');
        if (command.length == 0) {
            vscode_1.window.showErrorMessage('Set "java.testClass" in .vscode/settings.json');
            return null;
        }
        else {
            return templateCommand(command, file, className, methodName);
        }
    }
}
function debugTest(sourceUri, className, methodName, sourceRoots) {
    return __awaiter(this, void 0, void 0, function* () {
        let file = vscode_1.Uri.parse(sourceUri).fsPath;
        file = Path.relative(vscode_1.workspace.rootPath, file);
        // Run the test in its own shell
        let test = {
            type: 'java.task.test',
            className: className,
            methodName: methodName,
        };
        let shell = debugTestShell(file, className, methodName);
        if (shell == null)
            return null;
        let workspaceFolder = vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.parse(sourceUri));
        let testTask = new vscode_1.Task(test, workspaceFolder, 'Java Test', 'Java Language Server', shell);
        yield vscode_1.tasks.executeTask(testTask);
        // Attach to the running test
        let attach = {
            name: 'Java Debug',
            type: 'java',
            request: 'attach',
            port: 5005,
            sourceRoots: sourceRoots,
        };
        console.log('Debug', JSON.stringify(attach));
        return vscode_1.debug.startDebugging(workspaceFolder, attach);
    });
}
function debugTestShell(file, className, methodName) {
    let config = vscode_1.workspace.getConfiguration('java');
    let command = config.get('debugTestMethod');
    if (command.length == 0) {
        vscode_1.window.showErrorMessage('Set "java.debugTestMethod" in .vscode/settings.json');
        return null;
    }
    else {
        return templateCommand(command, file, className, methodName);
    }
}
function templateCommand(command, file, className, methodName) {
    // Replace template parameters
    var replaced = [];
    for (var i = 0; i < command.length; i++) {
        let c = command[i];
        c = c.replace('${file}', file);
        c = c.replace('${class}', className);
        c = c.replace('${method}', methodName);
        replaced[i] = c;
    }
    // Populate env
    let env = Object.assign({}, process.env);
    return new vscode_1.ShellExecution(replaced[0], replaced.slice(1), { env });
}
function createProgressListeners(client) {
    // Create a "checking files" progress indicator
    let progressListener = new class {
        startProgress(message) {
            if (this.progress != null)
                this.endProgress();
            vscode_1.window.withProgress({ title: message, location: vscode_1.ProgressLocation.Notification }, progress => new Promise((resolve, _reject) => {
                this.progress = progress;
                this.resolve = resolve;
            }));
        }
        reportProgress(message, increment) {
            if (increment == -1)
                this.progress.report({ message });
            else
                this.progress.report({ message, increment });
        }
        endProgress() {
            if (this.progress != null) {
                this.resolve({});
                this.progress = null;
                this.resolve = null;
            }
        }
    };
    // Use custom notifications to drive progressListener
    client.onNotification(new vscode_languageclient_1.NotificationType('java/startProgress'), (event) => {
        progressListener.startProgress(event.message);
    });
    client.onNotification(new vscode_languageclient_1.NotificationType('java/reportProgress'), (event) => {
        progressListener.reportProgress(event.message, event.increment);
    });
    client.onNotification(new vscode_languageclient_1.NotificationType('java/endProgress'), () => {
        progressListener.endProgress();
    });
}
;
function platformSpecificLangServer() {
    switch (process.platform) {
        case 'win32':
            return ['dist', 'lang_server_windows.sh'];
        case 'darwin':
            return ['dist', 'lang_server_mac.sh'];
        case 'linux':
            return ['dist', 'lang_server_linux.sh'];
    }
    throw `unsupported platform: ${process.platform}`;
}
// Alternative server options if you want to use visualvm
function visualVmConfig(context) {
    let javaExecutablePath = findJavaExecutable('java');
    if (javaExecutablePath == null) {
        vscode_1.window.showErrorMessage("Couldn't locate java in $JAVA_HOME or $PATH");
        throw "Gave up";
    }
    const jars = [
        'gson-2.8.9.jar',
        'java-language-server.jar',
        'protobuf-java-3.19.3.jar',
    ];
    const classpath = jars.map(jar => Path.resolve(context.extensionPath, "dist", "classpath", jar)).join(':');
    let args = [
        '-cp', classpath,
        '-Xverify:none',
        '-Xdebug',
        // '-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005',
        'org.javacs.Main',
        // Exports, needed at compile and runtime for access
        "--add-exports", "jdk.compiler/com.sun.tools.javac.api=javacs",
        "--add-exports", "jdk.compiler/com.sun.tools.javac.code=javacs",
        "--add-exports", "jdk.compiler/com.sun.tools.javac.comp=javacs",
        "--add-exports", "jdk.compiler/com.sun.tools.javac.main=javacs",
        "--add-exports", "jdk.compiler/com.sun.tools.javac.tree=javacs",
        "--add-exports", "jdk.compiler/com.sun.tools.javac.model=javacs",
        "--add-exports", "jdk.compiler/com.sun.tools.javac.util=javacs",
        // Opens, needed at runtime for reflection
        "--add-opens", "jdk.compiler/com.sun.tools.javac.api=javacs",
    ];
    console.log(javaExecutablePath + ' ' + args.join(' '));
    // Start the child java process
    return {
        command: javaExecutablePath,
        args: args,
        options: { cwd: context.extensionPath }
    };
}
function findJavaExecutable(binname) {
    binname = correctBinname(binname);
    // First search java.home setting
    let userJavaHome = vscode_1.workspace.getConfiguration('java').get('home');
    if (userJavaHome != null) {
        console.log('Looking for java in settings java.home ' + userJavaHome + '...');
        let candidate = findJavaExecutableInJavaHome(userJavaHome, binname);
        if (candidate != null)
            return candidate;
    }
    // Then search each JAVA_HOME
    let envJavaHome = process.env['JAVA_HOME'];
    if (envJavaHome) {
        console.log('Looking for java in environment variable JAVA_HOME ' + envJavaHome + '...');
        let candidate = findJavaExecutableInJavaHome(envJavaHome, binname);
        if (candidate != null)
            return candidate;
    }
    // Then search PATH parts
    if (process.env['PATH']) {
        console.log('Looking for java in PATH');
        let pathparts = process.env['PATH'].split(Path.delimiter);
        for (let i = 0; i < pathparts.length; i++) {
            let binpath = Path.join(pathparts[i], binname);
            if (FS.existsSync(binpath)) {
                return binpath;
            }
        }
    }
    // Else return the binary name directly (this will likely always fail downstream) 
    return null;
}
function correctBinname(binname) {
    if (process.platform === 'win32')
        return binname + '.exe';
    else
        return binname;
}
function findJavaExecutableInJavaHome(javaHome, binname) {
    let workspaces = javaHome.split(Path.delimiter);
    for (let i = 0; i < workspaces.length; i++) {
        let binpath = Path.join(workspaces[i], 'bin', binname);
        if (FS.existsSync(binpath))
            return binpath;
    }
    return null;
}
function enableJavadocSymbols() {
    // Let's enable Javadoc symbols autocompletion, shamelessly copied from MIT licensed code at
    // https://github.com/Microsoft/vscode/blob/9d611d4dfd5a4a101b5201b8c9e21af97f06e7a7/extensions/typescript/src/typescriptMain.ts#L186
    vscode_1.languages.setLanguageConfiguration('java', {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/
        },
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        onEnterRules: [
            {
                // e.g. /** | */
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                afterText: /^\s*\*\/$/,
                action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
            },
            {
                // e.g. /** ...|
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                action: { indentAction: vscode_1.IndentAction.None, appendText: ' * ' }
            },
            {
                // e.g.  * ...|
                beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                action: { indentAction: vscode_1.IndentAction.None, appendText: '* ' }
            },
            {
                // e.g.  */|
                beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
            },
            {
                // e.g.  *-----*/|
                beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
                action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
            }
        ]
    });
}
//# sourceMappingURL=extension.js.map