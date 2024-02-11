"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsmProvider = void 0;
const vscode_1 = require("vscode");
const document_1 = require("./document");
const compile_commands_1 = require("./compile_commands");
const typedevent_1 = require("./typedevent");
class AsmProvider {
    constructor() {
        this._documents = new Map();
        this._watchers = new Map();
        this._onDidChange = new vscode_1.EventEmitter();
        this._onDidArgChange = new typedevent_1.TypedEvent();
    }
    provideTextDocumentContent(uri) {
        let document = this.provideAsmDocument(uri);
        return document.value;
    }
    provideAsmDocument(uri) {
        // already loaded?
        let document = this._documents.get(uri.toString());
        if (document) {
            return document;
        }
        document = new document_1.AsmDocument(uri);
        this._documents.set(uri.toString(), document);
        // Watch for src file and reload it on change
        this.addWatcherForSrcURI(uri);
        return document;
    }
    addWatcherForSrcURI(uri) {
        const watcher = vscode_1.workspace.createFileSystemWatcher(compile_commands_1.CompileCommands.getSrcUri(uri).path);
        watcher.onDidChange(fileUri => this.reloadAsmDocument(compile_commands_1.CompileCommands.getAsmUri(fileUri)));
        watcher.onDidCreate(fileUri => this.reloadAsmDocument(compile_commands_1.CompileCommands.getAsmUri(fileUri)));
        watcher.onDidDelete(fileUri => {
            const uri = fileUri.with({ scheme: AsmProvider.scheme });
            this._documents.delete(uri.toString());
        });
        this._watchers.set(uri.toString(), watcher);
        this._onDidArgChange.on(asmUri => this.reloadAsmDocument(asmUri));
    }
    reloadAsmDocument(fileUri) {
        const uri = fileUri.with({ scheme: AsmProvider.scheme });
        const document = new document_1.AsmDocument(uri);
        this._documents.set(uri.toString(), document);
        this._onDidChange.fire(uri);
    }
    notifyCompileArgsChange(asmUri) {
        this._onDidArgChange.emit(asmUri);
    }
    // Expose an event to signal changes of _virtual_ documents
    // to the editor
    get onDidChange() {
        return this._onDidChange.event;
    }
    dispose() {
        this._watchers.forEach(watcher => watcher.dispose());
        this._documents.clear();
        this._onDidChange.dispose();
    }
}
exports.AsmProvider = AsmProvider;
AsmProvider.scheme = "disassembly";
//# sourceMappingURL=provider.js.map