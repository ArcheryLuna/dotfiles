'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var shared_1 = require("../defs/shared");
var client_1 = require("../defs/client");
var server_1 = require("../defs/server");
var deprecated_1 = require("../defs/deprecated");
var lualibs_1 = require("../defs/lualibs");
var signatureProvider = /** @class */ (function () {
    function signatureProvider(extensionPath) {
        this.functions = {};
        this.addLuaLibs();
        // Shared definitions
        for (var i in shared_1.SharedDefinitions) {
            var idef = shared_1.SharedDefinitions[i];
            this.functions[idef.label] = idef;
        }
        for (var i in shared_1.SharedModuleDefinitions) {
            var itype = shared_1.SharedModuleDefinitions[i];
            for (var j in itype.methods) {
                var jmethod = itype.methods[j];
                this.functions[itype.label + "." + jmethod.label] = jmethod;
            }
        }
        // Server-Side definitions
        for (var i in server_1.ServerDefinitions) {
            var idef = server_1.ServerDefinitions[i];
            this.functions[idef.label] = idef;
        }
        // Client-Side definitions
        for (var i in client_1.ClientDefinitions) {
            var idef = client_1.ClientDefinitions[i];
            this.functions[idef.label] = idef;
        }
        // Deprecated definitions
        for (var i in deprecated_1.DeprecatedDefinitions) {
            var idef = deprecated_1.DeprecatedDefinitions[i];
            this.functions[idef.label] = idef;
        }
    }
    signatureProvider.prototype.addLuaLibs = function () {
        for (var i in lualibs_1.luaClasses) {
            var itype = lualibs_1.luaClasses[i];
            for (var j in itype.methods) {
                var jmethod = itype.methods[j];
                this.functions[itype.label + "." + jmethod.label] = jmethod;
            }
        }
        for (var i in lualibs_1.luaFunctions) {
            var idef = lualibs_1.luaFunctions[i];
            this.functions[idef.label] = idef;
        }
    };
    signatureProvider.prototype.provideSignatureHelp = function (document, position, token) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!vscode.workspace.getConfiguration("starbound-sense").get("activate_signature_help", true))
                reject();
            // ! This is really freaky code.. But works. Would be easier if we would use a language server :(
            var lastCharacter = document.getText(new vscode.Range(new vscode.Position(position.line, position.character - 1), position));
            var offset = 0;
            var parameter = 0;
            // methodName( <-- cursor is here
            if (lastCharacter == "(")
                offset = 1;
            else {
                // Cursor is maybe somewhere inside the function.
                var line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
                for (var charIndex = line.length; charIndex > 0; charIndex--) {
                    var c = line.charAt(charIndex);
                    if (c == ",") // counts how many commas are before our cursor
                        parameter++;
                    if (c != "(") // go back until we hit our parentheses
                        offset++;
                    else // parentheses found, bail out.
                        break;
                }
            }
            var wordRange = document.getWordRangeAtPosition(new vscode.Position(position.line, position.character - offset), /[\w\.]+/);
            if (wordRange == undefined) {
                reject();
                return;
            }
            var word = document.getText(wordRange);
            if (word == undefined) {
                reject();
                return;
            }
            var funct = _this.functions[word];
            if (funct == undefined) {
                reject();
                return;
            }
            var ret = new vscode.SignatureHelp();
            ret.activeParameter = parameter;
            ret.activeSignature = 0;
            ret.signatures = new Array();
            // TODO: Handle having 2 functions with different parameters
            //def.documentation.appendCodeblock(def.label + " ( " + idef.args.join(", ") + " )", "starboundlua");
            var signature = new vscode.SignatureInformation(funct.label + " ( " + funct.args.join(", ") + " )", new vscode.MarkdownString(funct.description));
            for (var i in funct.args) {
                var iarg = funct.args[i];
                signature.parameters.push(new vscode.ParameterInformation(iarg, ""));
            }
            ret.signatures.push(signature);
            resolve(ret);
        });
    };
    return signatureProvider;
}());
exports.signatureProvider = signatureProvider;
//# sourceMappingURL=signatureHelpProvider.js.map