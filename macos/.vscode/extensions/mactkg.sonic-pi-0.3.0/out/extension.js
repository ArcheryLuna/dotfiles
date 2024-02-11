'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const config_1 = require("./config");
const OSC = require("osc-js");
const ICONV = require("iconv-lite");
const HOME_DIR = require("user-home");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let sonicPi = new SonicPi();
        yield sonicPi.initOSC();
        let runCodeCmd = vscode_1.commands.registerCommand('extension.runCode', () => {
            sonicPi.runCode();
        });
        let stopAllCmd = vscode_1.commands.registerCommand('extension.stopAll', () => {
            sonicPi.stopAllCode();
        });
        let restartCmd = vscode_1.commands.registerCommand('extension.restart', () => {
            sonicPi.stopAllCode();
            setTimeout(() => {
                sonicPi.runCode();
            }, 500);
        });
        context.subscriptions.push(runCodeCmd);
        context.subscriptions.push(stopAllCmd);
        context.subscriptions.push(restartCmd);
        context.subscriptions.push(sonicPi);
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
class SonicPi {
    constructor() {
        this.GUI_ID = 10;
        this.config = new config_1.Config();
    }
    runCode() {
        let editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let code = this.getCurrentCode(editor);
        if (!code) {
            return;
        }
        this.flashCode(editor);
        const msg = new OSC.Message('/run-code', this.GUI_ID, code);
        this.osc.send(msg);
    }
    stopAllCode() {
        const msg = new OSC.Message('/stop-all-jobs', this.GUI_ID);
        this.osc.send(msg);
    }
    getCurrentCode(editor) {
        return ICONV.encode(editor.document.getText(), "utf-8");
    }
    initOSC() {
        return __awaiter(this, void 0, void 0, function* () {
            const ports = yield this.getDynamicPort();
            this.osc = new OSC({
                plugin: new OSC.DatagramPlugin({ send: { port: ports.server_listen_port } })
            });
            this.osc.open({ port: ports.gui_listen_port });
        });
    }
    flashCode(editor) {
        let startPos = editor.document.positionAt(0);
        let endPos = editor.document.positionAt(editor.document.getText().length - 1);
        let range = new vscode_1.Range(startPos, endPos);
        const flashDecorationType = vscode_1.window.createTextEditorDecorationType({
            backgroundColor: this.config.flashBackgroundColor(),
            color: this.config.flashTextColor()
        });
        editor.setDecorations(flashDecorationType, [range]);
        setTimeout(function () {
            flashDecorationType.dispose();
        }, 250);
    }
    getDynamicPort() {
        return __awaiter(this, void 0, void 0, function* () {
            let ports = { server_listen_port: 4557, gui_listen_port: 4558 };
            const doc = yield vscode_1.workspace.openTextDocument(HOME_DIR + '/.sonic-pi/log/gui.log');
            if (!doc) {
                return ports;
            }
            const text = doc.getText();
            const server_regex = /Server listen to gui port\s+(\d+)/;
            const server_listen_port = this.extractPortNumber(text, server_regex);
            const gui_regex = /GUI listen to server port\s+(\d+)/;
            const gui_listen_port = this.extractPortNumber(text, gui_regex);
            // both port numbers are always output in boot log.
            if (server_listen_port && gui_listen_port) {
                ports.server_listen_port = server_listen_port;
                ports.gui_listen_port = gui_listen_port;
            }
            return ports;
        });
    }
    extractPortNumber(text, regex) {
        const arr = regex.exec(text);
        const port = arr ? arr[1] : '';
        return Number(port);
    }
    dispose() {
        this.osc.close();
    }
}
//# sourceMappingURL=extension.js.map