'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var path = require("path");
var defs_1 = require("../defs/defs");
var shared_1 = require("../defs/shared");
var client_1 = require("../defs/client");
var server_1 = require("../defs/server");
var deprecated_1 = require("../defs/deprecated");
var lualibs_1 = require("../defs/lualibs");
var utils_1 = require("../utils");
var functionProvider = /** @class */ (function () {
    function functionProvider(extensionPath) {
        this.functions = {};
        this.globalTypes = new Array();
        this.clientGlobalTypes = new Array();
        this.serverGlobalTypes = new Array();
        this.addLuaLibs();
        // Shared definitions
        for (var i in shared_1.SharedDefinitions) {
            var idef = shared_1.SharedDefinitions[i];
            var def = new vscode.CompletionItem(idef.label, vscode.CompletionItemKind.Function);
            def.detail = "Scriptside: Shared";
            if (idef.deprecated)
                def.detail += " (DEPRECATED)";
            def.documentation = idef.toMarkdown();
            this.globalTypes.push(def);
        }
        // Server-Side definitions
        for (var i in server_1.ServerDefinitions) {
            var idef = server_1.ServerDefinitions[i];
            var def = new vscode.CompletionItem(idef.label, vscode.CompletionItemKind.Function);
            def.detail = "Scriptside: Server";
            if (idef.deprecated)
                def.detail += " (DEPRECATED)";
            def.documentation = idef.toMarkdown();
            this.serverGlobalTypes.push(def);
        }
        // Client-Side definitions
        for (var i in client_1.ClientDefinitions) {
            var idef = client_1.ClientDefinitions[i];
            var def = new vscode.CompletionItem(idef.label, vscode.CompletionItemKind.Function);
            def.detail = "Scriptside: Client";
            if (idef.deprecated)
                def.detail += " (DEPRECATED)";
            def.documentation = idef.toMarkdown();
            this.clientGlobalTypes.push(def);
        }
        // Deprecated definitions
        for (var i in deprecated_1.DeprecatedDefinitions) {
            var idef = deprecated_1.DeprecatedDefinitions[i];
            var def = new vscode.CompletionItem(idef.label, vscode.CompletionItemKind.Function);
            def.detail = "Scriptside: " + defs_1.ScriptSide[idef.scriptSide] + " (DEPRECATED)";
            def.documentation = idef.toMarkdown();
            this.globalTypes.push(def);
        }
        /*this.globalTypes.sort(function (a, b) {
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
        });
        this.checkDefinitions();*/
    }
    functionProvider.prototype.addLuaLibs = function () {
        // Built-in lua functions (print etc.)
        for (var i in lualibs_1.luaFunctions) {
            var itype = lualibs_1.luaFunctions[i];
            var def = new vscode.CompletionItem(itype.label, vscode.CompletionItemKind.Function);
            def.documentation = itype.toMarkdown();
            this.globalTypes.push(def);
        }
        // Built-in lua "modules" (table.concat)
        for (var i in lualibs_1.luaClasses) {
            var itype = lualibs_1.luaClasses[i];
            var def = new vscode.CompletionItem(itype.label, vscode.CompletionItemKind.Class);
            def.documentation = new vscode.MarkdownString();
            def.documentation.appendMarkdown(itype.description);
            this.globalTypes.push(def);
            this.functions[itype.label] = new Array();
            for (var j in itype.methods) {
                var jmethod = itype.methods[j];
                var def_1 = new vscode.CompletionItem(jmethod.label, vscode.CompletionItemKind.Method);
                def_1.documentation = jmethod.toMarkdown();
                this.functions[itype.label].push(def_1);
            }
            for (var j in itype.fields) {
                var jfield = itype.fields[j];
                var jkind = vscode.CompletionItemKind.Field;
                if (jfield instanceof defs_1.LuaConst)
                    jkind = vscode.CompletionItemKind.Constant;
                var def_2 = new vscode.CompletionItem(jfield.label, jkind);
                def_2.documentation = jfield.toMarkdown();
                this.functions[itype.label].push(def_2);
            }
        }
        for (var i in lualibs_1.luaConsts) {
            var iconst = lualibs_1.luaConsts[i];
            var def = new vscode.CompletionItem(iconst.label, vscode.CompletionItemKind.Constant);
            def.documentation = iconst.toMarkdown();
            this.globalTypes.push(def);
        }
    };
    functionProvider.prototype.provideCompletionItems = function (document, position, token, context) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (context.triggerKind != vscode.CompletionTriggerKind.TriggerCharacter) {
                var funcs = _this.globalTypes;
                if (vscode.workspace.getConfiguration("mtalua-sense").get("show_relevant_only", false)) {
                    var activeFilePath = vscode.window.activeTextEditor.document.fileName;
                    var activeFileName = path.basename(activeFilePath);
                    var side = utils_1.getScriptSide(activeFileName);
                    if (side == defs_1.ScriptSide.Client)
                        funcs = funcs.concat(_this.clientGlobalTypes);
                    else if (side == defs_1.ScriptSide.Server)
                        funcs = funcs.concat(_this.serverGlobalTypes);
                }
                else {
                    funcs = funcs.concat(_this.serverGlobalTypes, _this.clientGlobalTypes);
                }
                resolve(funcs);
                return;
            }
            var wordRange = document.getWordRangeAtPosition(new vscode.Position(position.line, position.character - 1));
            if (wordRange != undefined) {
                var word = document.getText(wordRange);
                resolve(_this.functions[word]);
                return;
            }
            resolve([]);
        });
    };
    functionProvider.prototype.checkDefinitions = function () {
        console.log("Checking definition files..");
        var check = new Array();
        shared_1.SharedDefinitions.forEach(function (element) {
            if (check[element.label] !== undefined && element.scriptSide == check[element.label].scriptSide) {
                console.log("ERROR! ALREADY ADDED: " + element.label + ", Side: " + defs_1.ScriptSide[element.scriptSide] + " vs " + defs_1.ScriptSide[check[element.label].scriptSide]);
            }
            else
                check[element.label] = element;
        });
        server_1.ServerDefinitions.forEach(function (element) {
            if (check[element.label] !== undefined && element.scriptSide == check[element.label].scriptSide) {
                console.log("ERROR! ALREADY ADDED: " + element.label + ", Side: " + defs_1.ScriptSide[element.scriptSide] + " vs " + defs_1.ScriptSide[check[element.label].scriptSide]);
            }
            else
                check[element.label] = element;
        });
        client_1.ClientDefinitions.forEach(function (element) {
            if (check[element.label] !== undefined && element.scriptSide == check[element.label].scriptSide) {
                console.log("ERROR! ALREADY ADDED: " + element.label + ", Side: " + defs_1.ScriptSide[element.scriptSide] + " vs " + defs_1.ScriptSide[check[element.label].scriptSide]);
            }
            else
                check[element.label] = element;
        });
    };
    return functionProvider;
}());
exports.functionProvider = functionProvider;
//# sourceMappingURL=completionItemProvider.js.map