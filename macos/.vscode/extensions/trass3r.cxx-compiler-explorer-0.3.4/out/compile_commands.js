"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompileCommands = void 0;
const vscode_1 = require("vscode");
const fs = require("fs");
const Path = require("path");
const utils_1 = require("./utils");
const child_process = require("child_process");
const json2typescript_1 = require("json2typescript");
let CompileCommand = class CompileCommand {
    constructor() {
        this.file = "";
        this._command = "";
        this._arguments = [];
        this.directory = "";
        this.uri = vscode_1.Uri.file("");
        this.command = "";
        this.args = [""];
    }
    process() {
        const commands = (this._command.length
            ? this._command.match(/[^"\s]*("(\\"|[^"])+")?/g)
            : this._arguments).filter(arg => arg.length > 0);
        this.uri = vscode_1.Uri.file(Path.resolve(this.directory, this.file));
        this.command = commands[0];
        this.args = this.sanitizeArgs(commands.slice(1));
    }
    getDisassembleCommand(outFile) {
        // remove -o part
        let fixedCmd = this._command.replace(/[\s]-o\s[^"\s]+/, '');
        // now add necessary options to generate clean assembly
        return fixedCmd + ' -g1 -S -masm=intel -fno-unwind-tables -fno-asynchronous-unwind-tables -fno-dwarf2-cfi-asm -Wno-error -o "' + outFile + '"';
    }
    getPreprocessCommand(outFile) {
        let args = [this.command, "-E", "-o", outFile].concat(this.args);
        return this.getCommand(args);
    }
    getCommand(args) {
        return args.join(' ');
    }
    sanitizeArgs(args) {
        let isOutfile = false;
        return args.filter(arg => {
            if (!isOutfile) {
                isOutfile = arg === "-o";
                return isOutfile ? false : arg !== "-c" && arg !== "-g";
            }
            else {
                isOutfile = false;
                return false;
            }
        });
    }
};
__decorate([
    json2typescript_1.JsonProperty("file", String),
    __metadata("design:type", String)
], CompileCommand.prototype, "file", void 0);
__decorate([
    json2typescript_1.JsonProperty("command", String, "isOptional"),
    __metadata("design:type", String)
], CompileCommand.prototype, "_command", void 0);
__decorate([
    json2typescript_1.JsonProperty("arguments", [String], "isOptional"),
    __metadata("design:type", Array)
], CompileCommand.prototype, "_arguments", void 0);
__decorate([
    json2typescript_1.JsonProperty("directory", String),
    __metadata("design:type", String)
], CompileCommand.prototype, "directory", void 0);
CompileCommand = __decorate([
    json2typescript_1.JsonObject("CompileCommand")
], CompileCommand);
class CompileInfo {
    constructor(uri, srcUri, command, compilationDirectory) {
        this.extraArgs = [];
        this.uri = uri;
        this.srcUri = srcUri;
        this.command = command;
        this.compilationDirectory = compilationDirectory;
    }
    extraArgsChanged(extraArgs) {
        return !utils_1.arrayEquals(extraArgs, this.extraArgs);
    }
}
class CompileCommands {
    static setExtraCompileArgs(extraArgs) {
        this.extraArgs = extraArgs;
    }
    static getExtraCompileArgs() {
        return this.extraArgs.join(" ");
    }
    static compile(uri) {
        const compileInfo = this.getCompileInfo(uri);
        if (compileInfo !== undefined) {
            if (this.needCompilation(compileInfo)) {
                return this.execCompileCommand(compileInfo);
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    }
    static getSrcUri(uri) {
        const compileInfo = this.compileCommands.get(uri.path);
        return compileInfo ? compileInfo.srcUri : undefined;
    }
    static getAsmUri(uri) {
        return this.asmUriMap.get(uri.path);
    }
    static getPreprocessUri(uri) {
        return this.preprocessUriMap.get(uri.path);
    }
    static init(errorChannel) {
        const compileCommandsFile = this.getCompileCommandsPath();
        if (fs.existsSync(compileCommandsFile)) {
            let compileCommands = this.parseCompileCommands(compileCommandsFile);
            compileCommands.forEach((compileCommand) => {
                CompileCommands.processCompileCommand(compileCommand);
            });
            this.errorChannel = errorChannel;
            this.createOutputDirectory();
            return true;
        }
        return false;
    }
    static processCompileCommand(compileCommand) {
        compileCommand.process();
        const srcUri = compileCommand.uri;
        const asmUri = this.encodeAsmUri(srcUri);
        const preprocessUri = this.encodePreprocessUri(srcUri);
        this.asmUriMap.set(srcUri.path, asmUri);
        this.compileCommands.set(asmUri.path, new CompileInfo(asmUri, srcUri, compileCommand.getDisassembleCommand(asmUri.path), compileCommand.directory));
        this.preprocessUriMap.set(srcUri.path, preprocessUri);
        this.compileCommands.set(preprocessUri.path, new CompileInfo(preprocessUri, srcUri, compileCommand.getPreprocessCommand(preprocessUri.path), compileCommand.directory));
    }
    static execCompileCommand(compileInfo) {
        const command = compileInfo.command + ' ' + this.getExtraCompileArgs();
        this.errorChannel.clear();
        this.errorChannel.appendLine(command);
        this.errorChannel.show();
        const result = child_process.spawnSync(command, {
            cwd: compileInfo.compilationDirectory,
            encoding: "utf8",
            shell: true
        });
        if (result.status || result.error) { // status can be null if compiler not found
            const error = result.error
                ? result.error.message
                : result.output
                    ? result.output.join("\n")
                    : "";
            vscode_1.window.showErrorMessage("Cannot compile " + compileInfo.srcUri.path);
            this.errorChannel.appendLine(error);
            this.errorChannel.appendLine("  failed with error code " +
                (result.status ? result.status.toString() : "null"));
            return false;
        }
        const filtcmd = 'echo "`c++filt -t < \'' + compileInfo.uri.fsPath + '\'`" > \'' + compileInfo.uri.fsPath + '\'';
        this.errorChannel.appendLine(filtcmd);
        const filtstdout = child_process.spawnSync(filtcmd, {
            cwd: compileInfo.compilationDirectory,
            encoding: "utf8",
            shell: true
        });
        if (filtstdout.status !== null) {
            this.errorChannel.appendLine(filtstdout.status.toString());
        }
        this.updateCompileInfo(compileInfo);
        return true;
    }
    static needCompilation(compileInfo) {
        const srcUri = compileInfo.srcUri;
        const compileTimestamp = this.compileTimestamps.get(srcUri.path);
        const stat = fs.statSync(srcUri.path);
        return (compileInfo.extraArgsChanged(this.extraArgs) ||
            !compileTimestamp ||
            stat.mtime > compileTimestamp);
    }
    static updateCompileInfo(compileInfo) {
        this.compileTimestamps.set(compileInfo.srcUri.path, new Date());
        compileInfo.extraArgs = this.extraArgs;
    }
    static getCompileInfo(uri) {
        return this.compileCommands.get(uri.path);
    }
    static parseCompileCommands(compileCommandsFile) {
        let filecontents = fs.readFileSync(compileCommandsFile);
        let jsonConvert = new json2typescript_1.JsonConvert(json2typescript_1.OperationMode.ENABLE, json2typescript_1.ValueCheckingMode.DISALLOW_NULL, true);
        let compileCommandsObj = JSON.parse(filecontents.toString());
        return jsonConvert.deserializeArray(compileCommandsObj, CompileCommand);
    }
    static getCompileCommandsPath() {
        const compileCommandsPath = vscode_1.workspace
            .getConfiguration("compilerexplorer", null)
            .get("compilationDirectory") + "/compile_commands.json";
        return compileCommandsPath
            ? utils_1.resolvePath(compileCommandsPath)
            : utils_1.resolvePath("${workspaceFolder}/compile_commands.json");
    }
    static createOutputDirectory() {
        if (!fs.existsSync(this.outDir)) {
            fs.mkdirSync(this.outDir);
        }
    }
    static getUriForScheme(srcUri, scheme) {
        const ext = (function () {
            switch (scheme) {
                case "disassembly":
                    return ".s";
                default:
                    return (".E" +
                        srcUri.path.slice(srcUri.path.lastIndexOf("."), srcUri.path.length));
            }
        })();
        const relativePath = Path.relative(vscode_1.workspace.rootPath, srcUri.path);
        const dstUri = srcUri.with({
            scheme: scheme,
            path: this.outDir + relativePath.replace(/\//g, '@') + ext
        });
        // Create Output directory if not present
        this.createOutputDirectory();
        return dstUri;
    }
    static encodeAsmUri(uri) {
        return this.getUriForScheme(uri, "disassembly");
    }
    static encodePreprocessUri(uri) {
        return this.getUriForScheme(uri, uri.scheme);
    }
}
exports.CompileCommands = CompileCommands;
CompileCommands.compileCommands = new Map();
CompileCommands.asmUriMap = new Map();
CompileCommands.preprocessUriMap = new Map();
CompileCommands.compileTimestamps = new Map();
CompileCommands.outDir = utils_1.resolvePath(vscode_1.workspace.getConfiguration("compilerexplorer").get("outDir") +
    "/");
CompileCommands.extraArgs = [];
//# sourceMappingURL=compile_commands.js.map