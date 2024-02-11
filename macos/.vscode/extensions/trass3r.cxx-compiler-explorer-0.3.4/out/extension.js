"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const provider_1 = require("./provider");
const decorator_1 = require("./decorator");
const compile_commands_1 = require("./compile_commands");
function activate(context) {
    const provider = new provider_1.AsmProvider();
    // register content provider for scheme `disassembly`
    const providerRegistration = vscode_1.workspace.registerTextDocumentContentProvider(provider_1.AsmProvider.scheme, provider);
    // Output channel to send compilation errors
    const errorChannel = vscode_1.window.createOutputChannel("C++ Compiler Explorer");
    if (!compile_commands_1.CompileCommands.init(errorChannel)) {
        vscode_1.window.showErrorMessage("Cannot find compilation database. Update `compilerexplorer.compilationDirectory`.");
    }
    function openAsmDocumentForEditor(srcEditor) {
        let asmUri = compile_commands_1.CompileCommands.getAsmUri(srcEditor.document.uri);
        if (!asmUri) {
            vscode_1.window.showErrorMessage(srcEditor.document.uri +
                " is not found in compile_commands.json");
            return;
        }
        vscode_1.workspace.openTextDocument(asmUri).then(doc => {
            vscode_1.window
                .showTextDocument(doc, srcEditor.viewColumn + 1, true)
                .then(asmEditor => {
                const decorator = new decorator_1.AsmDecorator(srcEditor, asmEditor, provider);
                // dirty way to get decorations work after showing disassembly
                setTimeout(_ => decorator.updateSelection(srcEditor), 500);
            });
        });
        //workspace.onDidCloseTextDocument(,)
        provider.notifyCompileArgsChange(asmUri);
    }
    // register command that crafts an uri with the `disassembly` scheme,
    // open the dynamic document, and shows it in the next editor
    const disassCommand = vscode_1.commands.registerTextEditorCommand("compilerexplorer.disassOutput", srcEditor => {
        openAsmDocumentForEditor(srcEditor);
    });
    const disassWithArgsCommand = vscode_1.commands.registerTextEditorCommand("compilerexplorer.disassOutputWithExtraArgs", srcEditor => {
        vscode_1.window
            .showInputBox({
            value: compile_commands_1.CompileCommands.getExtraCompileArgs()
        })
            .then(extraArgs => {
            if (extraArgs) {
                compile_commands_1.CompileCommands.setExtraCompileArgs(extraArgs.split(" "));
            }
            openAsmDocumentForEditor(srcEditor);
        });
    });
    context.subscriptions.push(provider, disassCommand, disassWithArgsCommand, providerRegistration, errorChannel);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map