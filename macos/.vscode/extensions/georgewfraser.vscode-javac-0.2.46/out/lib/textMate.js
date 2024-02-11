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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStyles = exports.decoration = void 0;
const vscode_1 = require("vscode");
const scopes = require("./scopes");
// Create decoration types from scopes lazily
const decorationCache = new Map();
function decoration(scope) {
    // If we've already created a decoration for `scope`, use it
    if (decorationCache.has(scope)) {
        return decorationCache.get(scope);
    }
    // If `scope` is defined in the current theme, create a decoration for it
    const textmate = scopes.find(scope);
    if (textmate) {
        const decoration = createDecorationFromTextmate(textmate);
        decorationCache.set(scope, decoration);
        return decoration;
    }
    // Otherwise, give up, there is no color available for this scope
    return undefined;
}
exports.decoration = decoration;
function createDecorationFromTextmate(themeStyle) {
    let options = {};
    options.rangeBehavior = vscode_1.DecorationRangeBehavior.OpenOpen;
    if (themeStyle.foreground) {
        options.color = themeStyle.foreground;
    }
    if (themeStyle.background) {
        options.backgroundColor = themeStyle.background;
    }
    if (themeStyle.fontStyle) {
        let parts = themeStyle.fontStyle.split(" ");
        parts.forEach((part) => {
            switch (part) {
                case "italic":
                    options.fontStyle = "italic";
                    break;
                case "bold":
                    options.fontWeight = "bold";
                    break;
                case "underline":
                    options.textDecoration = "underline";
                    break;
                default:
                    break;
            }
        });
    }
    return vscode_1.window.createTextEditorDecorationType(options);
}
// Load styles from the current active theme
function loadStyles() {
    return __awaiter(this, void 0, void 0, function* () {
        yield scopes.load();
        // Clear old styles
        for (const style of decorationCache.values()) {
            style.dispose();
        }
        decorationCache.clear();
    });
}
exports.loadStyles = loadStyles;
//# sourceMappingURL=textMate.js.map