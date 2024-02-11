'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
var vscode_1 = require("vscode");
var nls = require("vscode-nls");
var child_process_1 = require("child_process");
var exceptions_1 = require("./exceptions");
var localize = nls.config({ locale: process.env.VSCODE_NLS_CONFIG })();
var exceptions;
var DEFAULT_EXCEPTIONS = {
    "System.Exception": "never",
    "System.SystemException": "never",
    "System.ArithmeticException": "never",
    "System.ArrayTypeMismatchException": "never",
    "System.DivideByZeroException": "never",
    "System.IndexOutOfRangeException": "never",
    "System.InvalidCastException": "never",
    "System.NullReferenceException": "never",
    "System.OutOfMemoryException": "never",
    "System.OverflowException": "never",
    "System.StackOverflowException": "never",
    "System.TypeInitializationException": "never"
};
function activate(context) {
    context.subscriptions.push(vscode_1.debug.registerDebugConfigurationProvider("unity", new UnityDebugConfigurationProvider()));
    exceptions = new exceptions_1.Exceptions(DEFAULT_EXCEPTIONS);
    vscode_1.window.registerTreeDataProvider("exceptions", exceptions);
    context.subscriptions.push(vscode_1.commands.registerCommand('exceptions.always', function (exception) { return exceptions.always(exception); }));
    context.subscriptions.push(vscode_1.commands.registerCommand('exceptions.never', function (exception) { return exceptions.never(exception); }));
    context.subscriptions.push(vscode_1.commands.registerCommand('exceptions.addEntry', function (t) { return exceptions.addEntry(t); }));
    context.subscriptions.push(vscode_1.commands.registerCommand('attach.attachToDebugger', function (config) { return startSession(context, config); }));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
var UnityDebugConfigurationProvider = /** @class */ (function () {
    function UnityDebugConfigurationProvider() {
    }
    UnityDebugConfigurationProvider.prototype.provideDebugConfigurations = function (folder, token) {
        var config = [
            {
                name: "Unity Editor",
                type: "unity",
                path: folder.uri.path + "/Library/EditorInstance.json",
                request: "launch"
            },
            {
                name: "Windows Player",
                type: "unity",
                request: "launch"
            },
            {
                name: "OSX Player",
                type: "unity",
                request: "launch"
            },
            {
                name: "Linux Player",
                type: "unity",
                request: "launch"
            },
            {
                name: "iOS Player",
                type: "unity",
                request: "launch"
            },
            {
                name: "Android Player",
                type: "unity",
                request: "launch"
            },
            {
                name: "Xbox One Player",
                type: "unity",
                request: "launch"
            },
            {
                name: "PS4 Player",
                type: "unity",
                request: "launch"
            },
            {
                name: "SwitchPlayer",
                type: "unity",
                request: "launch"
            }
        ];
        return config;
    };
    UnityDebugConfigurationProvider.prototype.resolveDebugConfiguration = function (folder, debugConfiguration, token) {
        if (debugConfiguration && !debugConfiguration.__exceptionOptions) {
            debugConfiguration.__exceptionOptions = exceptions.convertToExceptionOptionsDefault();
        }
        return debugConfiguration;
    };
    return UnityDebugConfigurationProvider;
}());
function startSession(context, config) {
    var execCommand = "";
    if (process.platform !== 'win32')
        execCommand = "mono ";
    child_process_1.exec(execCommand + context.extensionPath + "/bin/UnityDebug.exe list", function (error, stdout, stderr) {
        return __awaiter(this, void 0, void 0, function () {
            var processes, lines, i, chosen, config_1, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        processes = [];
                        lines = stdout.split("\n");
                        for (i = 0; i < lines.length; i++) {
                            if (lines[i]) {
                                processes.push(lines[i]);
                            }
                        }
                        if (!(processes.length == 0)) return [3 /*break*/, 1];
                        vscode_1.window.showErrorMessage("No Unity Process Found.");
                        return [3 /*break*/, 4];
                    case 1: return [4 /*yield*/, vscode_1.window.showQuickPick(processes)];
                    case 2:
                        chosen = _a.sent();
                        if (!chosen) {
                            return [2 /*return*/];
                        }
                        config_1 = {
                            "name": chosen,
                            "request": "launch",
                            "type": "unity",
                            "__exceptionOptions": exceptions.convertToExceptionOptionsDefault()
                        };
                        return [4 /*yield*/, vscode_1.debug.startDebugging(undefined, config_1)];
                    case 3:
                        response = _a.sent();
                        console.log("8");
                        console.log("debug ended: " + response);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    });
}
//# sourceMappingURL=attach.js.map