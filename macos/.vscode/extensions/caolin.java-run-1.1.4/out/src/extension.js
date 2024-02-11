"use strict";
// tslint:disable:typedef
// tslint:disable:quotemark
// the module 'vscode' contains the VS Code extensibility API
// import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const Compiler_1 = require("./Compiler");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let compiler = new Compiler_1.default(vscode);
    let disposable = vscode.commands.registerCommand("java.run", () => compiler.start());
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map