'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var completionItemProvider_1 = require("./features/completionItemProvider");
var signatureHelpProvider_1 = require("./features/signatureHelpProvider");
var hoverProvider_1 = require("./features/hoverProvider");
var resourceGenerator_1 = require("./features/resourceGenerator");
var serverInteractions_1 = require("./features/serverInteractions");
var documentLinkProvider_1 = require("./features/documentLinkProvider");
function activate(context) {
    console.log("MTA:SA LUA: Init");
    context.subscriptions.push(vscode.commands.registerCommand("extension.mta-new-resource", resourceGenerator_1.generateResource));
    context.subscriptions.push(vscode.commands.registerCommand("extension.mta-new-meta", resourceGenerator_1.generateMeta));
    context.subscriptions.push(vscode.commands.registerCommand("extension.mta-new-client", resourceGenerator_1.generateClient));
    context.subscriptions.push(vscode.commands.registerCommand("extension.mta-new-server", resourceGenerator_1.generateServer));
    if (vscode.workspace.getConfiguration("mtalua-http").get("enabled", true)) {
        context.subscriptions.push(vscode.commands.registerCommand("extension.mta-start-resource", serverInteractions_1.startResource));
        context.subscriptions.push(vscode.commands.registerCommand("extension.mta-stop-resource", serverInteractions_1.stopResource));
        context.subscriptions.push(vscode.commands.registerCommand("extension.mta-restart-resource", serverInteractions_1.restartResource));
    }
    vscode.workspace.onDidSaveTextDocument(function (document) {
        if (!vscode.workspace.getConfiguration("mtalua-http").get("enable_restart_on_save", false))
            return;
        serverInteractions_1.restartResourceSave(document);
    });
    // TODO: Write a CompletionItemProvider/SignatureHelpProvider/HoverProvider for meta.xml files. See https://github.com/Subtixx/vscode-mtalua/issues/10
    if (vscode.workspace.getConfiguration("mtalua-sense").get("show_reference_links", false))
        vscode.languages.registerDocumentLinkProvider({ scheme: "file", language: "mtalua" }, new documentLinkProvider_1.documentLinkProvider(context.extensionPath));
    // Register the built-in function definitions
    vscode.languages.registerCompletionItemProvider({ scheme: "file", language: "mtalua" }, new completionItemProvider_1.functionProvider(context.extensionPath), ".");
    vscode.languages.registerHoverProvider({ scheme: "file", language: "mtalua" }, new hoverProvider_1.hoverProvider(context.extensionPath));
    if (!vscode.workspace.getConfiguration("mtalua-sense").get("activate_signature_help_parentheses", true))
        vscode.languages.registerSignatureHelpProvider({ scheme: "file", language: "mtalua" }, new signatureHelpProvider_1.signatureProvider(context.extensionPath), "");
    else
        vscode.languages.registerSignatureHelpProvider({ scheme: "file", language: "mtalua" }, new signatureHelpProvider_1.signatureProvider(context.extensionPath), "(");
}
exports.activate = activate;
function deactivate() {
    console.log("MTA:SA LUA: Free");
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map