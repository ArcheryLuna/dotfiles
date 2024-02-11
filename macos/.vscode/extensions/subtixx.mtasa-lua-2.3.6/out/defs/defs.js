'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var ScriptSide;
(function (ScriptSide) {
    ScriptSide[ScriptSide["Shared"] = 0] = "Shared";
    ScriptSide[ScriptSide["Client"] = 1] = "Client";
    ScriptSide[ScriptSide["Server"] = 2] = "Server";
})(ScriptSide = exports.ScriptSide || (exports.ScriptSide = {}));
var LuaFunction = /** @class */ (function () {
    function LuaFunction() {
        this.label = "";
        this.description = "";
        this.returnType = "";
        this.module = "";
        this.args = [];
        this.argDescs = {};
    }
    LuaFunction.prototype.toMarkdown = function () {
        var result = new vscode.MarkdownString();
        result.appendCodeblock(this.label + " ( " + this.args.join(", ") + " )", "mtaluatypes");
        result.appendMarkdown(this.description + "\n\n");
        //result.appendMarkdown("- Returns: " + this.returnType + "\n");
        if (this.returnType != "") {
            result.appendMarkdown("- Returns:");
            result.appendCodeblock(this.returnType, "mtaluatypes");
        }
        for (var key in this.argDescs) {
            if (this.argDescs.hasOwnProperty(key)) {
                var element = this.argDescs[key];
                result.appendMarkdown("- **" + key + "**: " + element + "\n");
            }
        }
        return result;
    };
    return LuaFunction;
}());
exports.LuaFunction = LuaFunction;
var MTAFunction = /** @class */ (function (_super) {
    __extends(MTAFunction, _super);
    function MTAFunction() {
        var _this = _super.call(this) || this;
        _this.scriptSide = ScriptSide.Shared;
        _this.deprecated = false;
        return _this;
    }
    return MTAFunction;
}(LuaFunction));
exports.MTAFunction = MTAFunction;
var LuaMethod = /** @class */ (function (_super) {
    __extends(LuaMethod, _super);
    function LuaMethod(label, description, args, argDescs, returnType) {
        if (description === void 0) { description = ""; }
        if (args === void 0) { args = []; }
        if (argDescs === void 0) { argDescs = {}; }
        if (returnType === void 0) { returnType = ""; }
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.description = description;
        _this.args = args;
        _this.argDescs = argDescs;
        _this.returnType = returnType;
        return _this;
    }
    return LuaMethod;
}(LuaFunction));
exports.LuaMethod = LuaMethod;
var LuaClass = /** @class */ (function () {
    function LuaClass(label, description) {
        if (description === void 0) { description = ""; }
        this.label = label;
        this.description = description;
        this.methods = new Array();
        this.fields = new Array();
    }
    LuaClass.prototype.toMarkdown = function () {
        var result = new vscode.MarkdownString();
        result.appendCodeblock(this.label, "mtaluatypes");
        result.appendMarkdown(this.description + "\n\n");
        return result;
    };
    return LuaClass;
}());
exports.LuaClass = LuaClass;
var LuaField = /** @class */ (function () {
    function LuaField(label, description) {
        if (description === void 0) { description = ""; }
        this.label = label;
        this.description = description;
    }
    LuaField.prototype.toMarkdown = function () {
        var result = new vscode.MarkdownString();
        result.appendCodeblock(this.label, "mtaluatypes");
        result.appendMarkdown(this.description + "\n\n");
        return result;
    };
    return LuaField;
}());
exports.LuaField = LuaField;
var LuaConst = /** @class */ (function (_super) {
    __extends(LuaConst, _super);
    function LuaConst(label, desc) {
        if (desc === void 0) { desc = ""; }
        return _super.call(this, label, desc) || this;
    }
    return LuaConst;
}(LuaField));
exports.LuaConst = LuaConst;
//# sourceMappingURL=defs.js.map