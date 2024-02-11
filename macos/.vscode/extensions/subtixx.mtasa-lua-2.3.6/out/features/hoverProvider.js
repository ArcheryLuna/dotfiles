'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var shared_1 = require("../defs/shared");
var client_1 = require("../defs/client");
var server_1 = require("../defs/server");
var deprecated_1 = require("../defs/deprecated");
var lualibs_1 = require("../defs/lualibs");
var hoverProvider = /** @class */ (function () {
    function hoverProvider(extensionPath) {
        this.functions = {};
        this.addLuaLibs();
        // Shared definitions
        for (var i in shared_1.SharedDefinitions) {
            var idef = shared_1.SharedDefinitions[i];
            this.functions[idef.label] = idef.toMarkdown();
        }
        for (var i in shared_1.SharedModuleDefinitions) {
            var itype = shared_1.SharedModuleDefinitions[i];
            this.functions[itype.label] = itype.toMarkdown();
            for (var j in itype.methods) {
                var jmethod = itype.methods[j];
                this.functions[itype.label + "." + jmethod.label] = jmethod.toMarkdown();
            }
            for (var j in itype.fields) {
                var jfield = itype.fields[j];
                this.functions[itype.label + "." + jfield.label] = jfield.toMarkdown();
            }
        }
        // Server-Side definitions
        for (var i in server_1.ServerDefinitions) {
            var idef = server_1.ServerDefinitions[i];
            this.functions[idef.label] = idef.toMarkdown();
        }
        // Client-Side definitions
        for (var i in client_1.ClientDefinitions) {
            var idef = client_1.ClientDefinitions[i];
            this.functions[idef.label] = idef.toMarkdown();
        }
        // Deprecated definitions
        for (var i in deprecated_1.DeprecatedDefinitions) {
            var idef = deprecated_1.DeprecatedDefinitions[i];
            this.functions[idef.label] = idef.toMarkdown();
        }
    }
    hoverProvider.prototype.addLuaLibs = function () {
        for (var i in lualibs_1.luaConsts) {
            var iconst = lualibs_1.luaConsts[i];
            this.functions[iconst.label] = iconst.toMarkdown();
        }
        // Built-in lua functions (print etc.)
        for (var i in lualibs_1.luaFunctions) {
            var itype = lualibs_1.luaFunctions[i];
            this.functions[itype.label] = itype.toMarkdown();
        }
        // Built-in lua "modules" (table.concat)
        for (var i in lualibs_1.luaClasses) {
            var itype = lualibs_1.luaClasses[i];
            this.functions[itype.label] = itype.toMarkdown();
            for (var j in itype.methods) {
                var jmethod = itype.methods[j];
                this.functions[itype.label + "." + jmethod.label] = jmethod.toMarkdown();
            }
            for (var j in itype.fields) {
                var jfield = itype.fields[j];
                this.functions[itype.label + "." + jfield.label] = jfield.toMarkdown();
            }
        }
    };
    hoverProvider.prototype.provideHover = function (document, position, token) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var hoveredTypePosition = document.getWordRangeAtPosition(position);
            var hoveredWordPosition = document.getWordRangeAtPosition(position, /[\w\.]+/);
            if (hoveredWordPosition == undefined)
                hoveredWordPosition = document.getWordRangeAtPosition(position);
            var hoveredFunction = _this.functions[document.getText(hoveredTypePosition)];
            if (hoveredFunction != undefined) {
                var hover = new vscode.Hover(hoveredFunction);
                resolve(hover);
                return;
            }
            var hoveredWord = document.getText(hoveredWordPosition);
            hoveredFunction = _this.functions[hoveredWord];
            if (hoveredFunction == undefined) {
                reject();
                return;
            }
            var hover = new vscode.Hover(hoveredFunction);
            resolve(hover);
        });
    };
    return hoverProvider;
}());
exports.hoverProvider = hoverProvider;
;
//# sourceMappingURL=hoverProvider.js.map