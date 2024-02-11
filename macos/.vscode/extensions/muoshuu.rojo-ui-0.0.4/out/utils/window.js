"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const window = {
    showError: vscode.window.showErrorMessage,
    showWarning: vscode.window.showWarningMessage,
    showInfo: vscode.window.showInformationMessage,
    showInputBox: vscode.window.showInputBox,
    showQuickPick: vscode.window.showQuickPick,
};
exports.default = window;
//# sourceMappingURL=window.js.map