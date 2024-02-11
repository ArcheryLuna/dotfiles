"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = exports.find = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const jsonc = require("jsonc-parser");
// Current theme colors
const colors = new Map();
function find(scope) {
    return colors.get(scope);
}
exports.find = find;
// Load all textmate scopes in the currently active theme
function load() {
    return __awaiter(this, void 0, void 0, function* () {
        // Remove any previous theme
        colors.clear();
        // Find out current color theme
        const themeName = vscode.workspace.getConfiguration("workbench").get("colorTheme");
        if (typeof themeName != 'string') {
            console.warn('workbench.colorTheme is', themeName);
            return;
        }
        // Try to load colors from that theme
        try {
            yield loadThemeNamed(themeName);
        }
        catch (e) {
            console.warn('failed to load theme', themeName, e);
        }
    });
}
exports.load = load;
// Find current theme on disk
function loadThemeNamed(themeName) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const extension of vscode.extensions.all) {
            const extensionPath = extension.extensionPath;
            const extensionPackageJsonPath = path.join(extensionPath, "package.json");
            if (!(yield checkFileExists(extensionPackageJsonPath))) {
                continue;
            }
            const packageJsonText = yield readFileText(extensionPackageJsonPath);
            const packageJson = jsonc.parse(packageJsonText);
            if (packageJson.contributes && packageJson.contributes.themes) {
                for (const theme of packageJson.contributes.themes) {
                    const id = theme.id || theme.label;
                    if (id == themeName) {
                        const themeRelativePath = theme.path;
                        const themeFullPath = path.join(extensionPath, themeRelativePath);
                        yield loadThemeFile(themeFullPath);
                    }
                }
            }
        }
    });
}
function loadThemeFile(themePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkFileExists(themePath)) {
            const themeContentText = yield readFileText(themePath);
            const themeContent = jsonc.parse(themeContentText);
            if (themeContent && themeContent.tokenColors) {
                loadColors(themeContent.tokenColors);
                if (themeContent.include) {
                    // parse included theme file
                    const includedThemePath = path.join(path.dirname(themePath), themeContent.include);
                    yield loadThemeFile(includedThemePath);
                }
            }
        }
    });
}
function loadColors(textMateRules) {
    for (const rule of textMateRules) {
        if (typeof rule.scope == 'string') {
            if (!colors.has(rule.scope)) {
                colors.set(rule.scope, rule.settings);
            }
        }
        else if (rule.scope instanceof Array) {
            for (const scope of rule.scope) {
                if (!colors.has(scope)) {
                    colors.set(scope, rule.settings);
                }
            }
        }
    }
}
function checkFileExists(filePath) {
    return new Promise((resolve, _) => {
        fs.stat(filePath, (_, stats) => {
            if (stats && stats.isFile()) {
                resolve(true);
            }
            else {
                console.warn('no such file', filePath);
                resolve(false);
            }
        });
    });
}
function readFileText(filePath, encoding = "utf8") {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, encoding, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
//# sourceMappingURL=scopes.js.map