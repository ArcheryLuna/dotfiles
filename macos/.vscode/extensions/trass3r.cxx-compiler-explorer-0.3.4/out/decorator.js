"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsmDecorator = void 0;
const vscode_1 = require("vscode");
class AsmDecorator {
    constructor(srcEditor, asmEditor, provider) {
        // mappings from source lines to assembly lines
        this.mappings = new Map();
        this.srcEditor = srcEditor;
        this.asmEditor = asmEditor;
        this.provider = provider;
        this.selectedLineDecorationType = vscode_1.window.createTextEditorDecorationType({
            isWholeLine: true,
            backgroundColor: new vscode_1.ThemeColor("editor.findMatchHighlightBackground"),
            overviewRulerColor: new vscode_1.ThemeColor("editorOverviewRuler.findMatchForeground")
        });
        this.unusedLineDecorationType = vscode_1.window.createTextEditorDecorationType({
            opacity: "0.5"
        });
        const uri = asmEditor.document.uri;
        // rebuild decorations on asm document change
        const providerEventRegistration = provider.onDidChange(changedUri => {
            if (changedUri.toString() === uri.toString()) {
                this.load(uri);
            }
        });
        this.load(uri);
        this.registrations = vscode_1.Disposable.from(this.selectedLineDecorationType, this.unusedLineDecorationType, providerEventRegistration, vscode_1.window.onDidChangeTextEditorSelection(e => {
            this.updateSelection(e.textEditor);
        }), vscode_1.window.onDidChangeVisibleTextEditors(editors => {
            // decorations are useless if one of editors become invisible
            if (editors.indexOf(srcEditor) === -1 ||
                editors.indexOf(asmEditor) === -1) {
                this.dispose();
            }
        }));
    }
    dispose() {
        this.registrations.dispose();
    }
    load(uri) {
        this.document = this.provider.provideAsmDocument(uri);
        this.loadMappings();
        const dimUnused = vscode_1.workspace
            .getConfiguration("", this.srcEditor.document.uri)
            .get("compilerexplorer.dimUnusedSourceLines", true);
        if (dimUnused) {
            this.dimUnusedSourceLines();
        }
    }
    asmLineHasSource(asmLine) {
        if (asmLine.source === undefined) {
            return false;
        }
        return asmLine.source.file !== undefined;
    }
    loadMappings() {
        this.mappings.clear();
        this.document.lines.forEach((line, index) => {
            if (!this.asmLineHasSource(line)) {
                return;
            }
            let sourceLine = line.source.line - 1;
            if (this.mappings.get(sourceLine) === undefined) {
                this.mappings.set(sourceLine, []);
            }
            this.mappings.get(sourceLine).push(index);
        });
    }
    updateSelection(editor) {
        if (editor === this.srcEditor) {
            this.srcLineSelected(this.srcEditor.selection.start.line);
        }
        else if (editor === this.asmEditor) {
            this.asmLineSelected(this.asmEditor.selection.start.line);
        }
    }
    dimUnusedSourceLines() {
        const unusedSourceLines = [];
        for (let line = 0; line < this.srcEditor.document.lineCount; line++) {
            if (this.mappings.get(line) === undefined) {
                unusedSourceLines.push(this.srcEditor.document.lineAt(line).range);
            }
        }
        this.srcEditor.setDecorations(this.unusedLineDecorationType, unusedSourceLines);
    }
    srcLineSelected(line) {
        const srcLineRange = this.srcEditor.document.lineAt(line).range;
        this.srcEditor.setDecorations(this.selectedLineDecorationType, [
            srcLineRange
        ]);
        const asmLinesRanges = [];
        let mapped = this.mappings.get(line);
        if (mapped !== undefined) {
            mapped.forEach(line => {
                if (line >= this.asmEditor.document.lineCount) {
                    return;
                }
                asmLinesRanges.push(this.asmEditor.document.lineAt(line).range);
            });
        }
        this.asmEditor.setDecorations(this.selectedLineDecorationType, asmLinesRanges);
        if (asmLinesRanges.length > 0) {
            this.asmEditor.revealRange(asmLinesRanges[0], vscode_1.TextEditorRevealType.InCenterIfOutsideViewport);
        }
    }
    asmLineSelected(line) {
        let asmLine = this.document.lines[line];
        const asmLineRange = this.asmEditor.document.lineAt(line).range;
        this.asmEditor.setDecorations(this.selectedLineDecorationType, [
            asmLineRange
        ]);
        if (this.asmLineHasSource(asmLine)) {
            const srcLineRange = this.srcEditor.document.lineAt(asmLine.source.line - 1).range;
            this.srcEditor.setDecorations(this.selectedLineDecorationType, [
                srcLineRange
            ]);
            this.srcEditor.revealRange(srcLineRange, vscode_1.TextEditorRevealType.InCenterIfOutsideViewport);
        }
        else {
            this.srcEditor.setDecorations(this.selectedLineDecorationType, []);
        }
    }
}
exports.AsmDecorator = AsmDecorator;
//# sourceMappingURL=decorator.js.map