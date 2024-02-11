"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const fs = require("fs/promises");
const vscode = require("vscode");
const model_1 = require("./model");
const options_1 = require("./options");
const TAG_REGEX = /\%(\w+)\%/gm;
function activate(context) {
    const disposable = vscode.workspace.onDidChangeConfiguration(e => onConfigurationChanged(context, e));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function onConfigurationChanged(context, e) {
    if (!e.affectsConfiguration(model_1.EXT_ID)) {
        return;
    }
    const conf = vscode.workspace.getConfiguration(model_1.EXT_ID);
    createSnippets(context, (0, options_1.parseOptions)(conf))
        .then(content => saveSnippets(context, content))
        .then(() => {
        vscode.window.showInformationMessage('Restart VSCode to apply the snippets', 'Restart')
            .then(result => { if (result === 'Restart') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        } });
    })
        .catch(showError);
}
async function createSnippets(context, options) {
    const contents = await Promise.all(model_1.TEMPLATES
        .map(file => options.autoComplete[file]
        ? replaceOnTemplate(context.asAbsolutePath(`${model_1.TEMPLATES_BASEPATH}/${file}.json`), options.replaces)
        : null)
        .filter(e => e));
    let result = {};
    contents.forEach(content => result = Object.assign(result, JSON.parse(content)));
    return JSON.stringify(result, null, '\t');
}
async function replaceOnTemplate(filePath, replaces) {
    const content = await fs.readFile(filePath, { encoding: 'utf-8' });
    return content.replace(TAG_REGEX, (_match, p1) => replaces[p1] ?? p1);
}
async function saveSnippets(context, content) {
    const dest = context.asAbsolutePath(model_1.DEST_PATH);
    return fs.writeFile(dest, content, { encoding: 'utf-8' });
}
function showError(e) {
    console.error(e);
    vscode.window.showErrorMessage(`Oh, no! An error has happened!\nPlease try to reinstall the extension and if this does not solve the issue, please report it on github: ${e.toString()}`, 'Open Extension', 'Report')
        .then(res => {
        if (res === 'Open Extension') {
            vscode.commands.executeCommand('extension.open', `kleber-swf.${model_1.EXT_ID}`);
        }
        else if (res === 'Report') {
            vscode.env.openExternal(vscode.Uri.parse(model_1.ISSUES_URL));
        }
    });
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map