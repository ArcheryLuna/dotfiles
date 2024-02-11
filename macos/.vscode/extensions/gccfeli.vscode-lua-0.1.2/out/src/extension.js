/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var vscode = require('vscode');
var path = require('path');
var vscode_languageclient_1 = require('vscode-languageclient');
var formatProvider_1 = require('./formatProvider');
var LUA = { language: 'lua', scheme: 'file' };
function activate(context) {
    // The server is implemented in node
    var serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    // The debug options for the server
    var debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    var serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    // Options to control the language client
    var clientOptions = {
        // Register the server for plain text documents
        documentSelector: ['lua'],
        synchronize: {
            // Synchronize the setting section 'languageServerExample' to the server
            configurationSection: 'languageServerExample',
            // Notify the server about file changes to '.clientrc files contain in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create the language client and start the client.
    var disposable = new vscode_languageclient_1.LanguageClient('Language Server Example', serverOptions, clientOptions).start();
    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
    var outChannel = vscode.window.createOutputChannel('Lua');
    outChannel.clear();
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(LUA, new formatProvider_1.LuaFormattingEditProvider(context, outChannel)));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map