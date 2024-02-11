'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var shared_1 = require("../defs/shared");
var server_1 = require("../defs/server");
var client_1 = require("../defs/client");
var deprecated_1 = require("../defs/deprecated");
var documentLinkProvider = /** @class */ (function () {
    function documentLinkProvider(extensionPath) {
        this.globalTypes = new Array();
        // Shared definitions
        for (var i in shared_1.SharedDefinitions) {
            var idef = shared_1.SharedDefinitions[i];
            this.globalTypes.push(idef.label);
        }
        // Server-Side definitions
        for (var i in server_1.ServerDefinitions) {
            var idef = server_1.ServerDefinitions[i];
            this.globalTypes.push(idef.label);
        }
        // Client-Side definitions
        for (var i in client_1.ClientDefinitions) {
            var idef = client_1.ClientDefinitions[i];
            this.globalTypes.push(idef.label);
        }
        // Deprecated definitions
        for (var i in deprecated_1.DeprecatedDefinitions) {
            var idef = deprecated_1.DeprecatedDefinitions[i];
            this.globalTypes.push(idef.label);
        }
    }
    documentLinkProvider.prototype.provideDocumentLinks = function (document, token) {
        var _this = this;
        if (!vscode.workspace.getConfiguration("mtalua-sense").get("show_reference_links", false))
            return new vscode.DocumentLink[0];
        var result = new Array();
        var documentText = document.getText();
        var currentOffset = 0;
        for (var i = 0; i < document.lineCount; i++) {
            var lineText = document.lineAt(i);
            var lineSplitted = lineText.text.split(/[(, \t]/);
            lineSplitted.forEach(function (v) {
                if (v == "")
                    return;
                if (_this.globalTypes.indexOf(v) > -1)
                    result.push(new vscode.DocumentLink(document.getWordRangeAtPosition(document.positionAt(documentText.indexOf(v, currentOffset - 1))), vscode.Uri.parse("https://wiki.multitheftauto.com/wiki/" + v)));
            });
            currentOffset += lineText.text.length;
        }
        /*this.globalTypes.forEach((v) => {
            let tokenPos = document.getText().indexOf(v);
            if (tokenPos > -1) {
                result.push(new vscode.DocumentLink(document.getWordRangeAtPosition(document.positionAt(tokenPos)), vscode.Uri.parse("https://wiki.multitheftauto.com/wiki/" + v)))
            }
        });*/
        return result;
    };
    return documentLinkProvider;
}());
exports.documentLinkProvider = documentLinkProvider;
;
//# sourceMappingURL=documentLinkProvider.js.map