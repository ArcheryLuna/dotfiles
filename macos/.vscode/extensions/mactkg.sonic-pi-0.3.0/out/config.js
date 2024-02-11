"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const BACKGROUND_COLOR_FLASHED = 'rgba(255,20,147,1.0)';
const TEXT_COLOR_FLASHED = 'rgba(255,255,255,1.0)';
class Config {
    constructor() {
        this.getConfiguration = vscode.workspace.getConfiguration;
        this.section = 'sonicpi';
    }
    flashBackgroundColor() {
        return this.getConfiguration(this.section).get('flashBackgroundColor', BACKGROUND_COLOR_FLASHED);
    }
    flashTextColor() {
        return this.getConfiguration(this.section).get('flashTextColor', TEXT_COLOR_FLASHED);
    }
}
exports.Config = Config;
//# sourceMappingURL=config.js.map