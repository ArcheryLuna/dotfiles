"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exceptions = void 0;
var vscode_1 = require("vscode");
var vscode = require("vscode");
var ExceptionItem = /** @class */ (function () {
    function ExceptionItem() {
    }
    return ExceptionItem;
}());
var ExceptionMode;
(function (ExceptionMode) {
    ExceptionMode[ExceptionMode["Always"] = 0] = "Always";
    ExceptionMode[ExceptionMode["Never"] = 1] = "Never";
    ExceptionMode[ExceptionMode["Unhandled"] = 2] = "Unhandled";
})(ExceptionMode || (ExceptionMode = {}));
var Exceptions = /** @class */ (function () {
    function Exceptions(exceptions) {
        this.exceptions = exceptions;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    Exceptions.prototype.always = function (element) {
        this.exceptions[element.name] = "always";
        element.setMode(ExceptionMode.Always);
        this._onDidChangeTreeData.fire(element);
        this.setExceptionBreakpoints(this.exceptions);
    };
    Exceptions.prototype.never = function (element) {
        this.exceptions[element.name] = "never";
        element.setMode(ExceptionMode.Never);
        this._onDidChangeTreeData.fire(element);
        this.setExceptionBreakpoints(this.exceptions);
    };
    Exceptions.prototype.unhandled = function (element) {
        this.exceptions[element.name] = "unhandled";
        element.setMode(ExceptionMode.Unhandled);
        this._onDidChangeTreeData.fire(element);
        this.setExceptionBreakpoints(this.exceptions);
    };
    Exceptions.prototype.addEntry = function (t) {
        var _this = this;
        var options = {
            placeHolder: "(Namespace.ExceptionName)"
        };
        vscode_1.window.showInputBox(options).then(function (value) {
            if (!value) {
                return;
            }
            _this.exceptions[value] = "never";
            _this._onDidChangeTreeData.fire(null);
        });
    };
    Exceptions.prototype.setExceptionBreakpoints = function (exceptionConfigs) {
        var args = {
            filters: [],
            exceptionOptions: this.exceptionConfigurationToExceptionOptions(exceptionConfigs)
        };
        vscode.debug.activeDebugSession.customRequest('setExceptionBreakpoints', args).then();
    };
    Exceptions.prototype.convertToExceptionOptionsDefault = function () {
        return this.exceptionConfigurationToExceptionOptions(this.exceptions);
    };
    Exceptions.prototype.exceptionConfigurationToExceptionOptions = function (exceptionConfigs) {
        var exceptionItems = [];
        for (var exception in exceptionConfigs) {
            exceptionItems.push({
                path: [{ names: [exception] }],
                breakMode: exceptionConfigs[exception]
            });
        }
        return exceptionItems;
    };
    Exceptions.prototype.exceptionConfigurationToExceptionMode = function (exceptionConfig) {
        switch (exceptionConfig) {
            case "always": return ExceptionMode.Always;
            case "never": return ExceptionMode.Never;
            case "unhandled": return ExceptionMode.Unhandled;
            default: throw new Error(exceptionConfig + ": is not a known exceptionConfig");
        }
    };
    Exceptions.prototype.getTreeItem = function (element) {
        return element;
    };
    Exceptions.prototype.getChildren = function (element) {
        var _this = this;
        if (!this.exceptions) {
            vscode_1.window.showInformationMessage('No exception found');
            return Promise.resolve([]);
        }
        return new Promise(function (resolve) {
            if (element) {
                var exceptionItems = [];
                for (var exception in _this.exceptions) {
                    exceptionItems.push(new ExceptionBreakpoints(exception, _this.exceptionConfigurationToExceptionMode(_this.exceptions[exception])));
                }
                resolve(exceptionItems);
            }
            else {
                var exceptionItems = [];
                for (var exception in _this.exceptions) {
                    exceptionItems.push(new ExceptionBreakpoints(exception, _this.exceptionConfigurationToExceptionMode(_this.exceptions[exception])));
                }
                resolve(exceptionItems);
            }
        });
    };
    Exceptions.prototype.getParent = function (element) {
        return null;
    };
    return Exceptions;
}());
exports.Exceptions = Exceptions;
var ExceptionBreakpoints = /** @class */ (function (_super) {
    __extends(ExceptionBreakpoints, _super);
    function ExceptionBreakpoints(name, mode) {
        var _this = _super.call(this, mode + " : " + name) || this;
        _this.name = name;
        _this.mode = mode;
        _this.contextValue = 'exception';
        _this.setMode(mode);
        return _this;
    }
    ExceptionBreakpoints.prototype.setMode = function (mode) {
        this.mode = mode;
        this.label = this.tooltip = "[" + (this.mode == ExceptionMode.Always ? "✔" : "✖") + "] " + this.name;
    };
    return ExceptionBreakpoints;
}(vscode_1.TreeItem));
//# sourceMappingURL=exceptions.js.map