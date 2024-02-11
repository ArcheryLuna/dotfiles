"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsmDocument = void 0;
const asm_1 = require("./asm");
const compile_commands_1 = require("./compile_commands");
const fs = require("fs");
class AsmDocument {
    constructor(uri) {
        this.lines = [];
        this.sourceToAsmMapping = new Map();
        compile_commands_1.CompileCommands.compile(uri);
        this.lines = this.processAssemblyFile(uri);
    }
    processAssemblyFile(uri) {
        const asmContents = fs.readFileSync(uri.path).toString();
        const filter = this.getAsmFilter(uri);
        return new asm_1.AsmParser().process(asmContents, filter);
    }
    getAsmFilter(uri) {
        // Currently binary parsing is not needed, because assembly is always generated.
        const useBinaryParsing = false;
        const filter = new asm_1.AsmFilter();
        filter.binary = useBinaryParsing;
        return filter;
    }
    get value() {
        let result = "";
        this.lines.forEach(line => {
            if (line instanceof asm_1.BinaryAsmLine) {
                let address = ("0000000" + line.address.toString(16)).substr(-8);
                result += `<${address}> ${line.text}\n`;
            }
            else {
                result += line.text + "\n";
            }
        });
        return result;
    }
}
exports.AsmDocument = AsmDocument;
//# sourceMappingURL=document.js.map