/**
 * Java 编译器
 *
 * @author Never、C
 * @version 1.1.1
 *
 * 1. 增加包名 编译
 * 2. 增加包名 运行
 */
// tslint:disable:typedef
// tslint:disable:quotemark
"use strict";
const FileInfo_1 = require("./FileInfo");
class Compiler {
    constructor(_vscode) {
        this.vscode = _vscode;
        this.init();
    }
    // 初始化
    init() {
        this.outputChannel = this.vscode.window.createOutputChannel("Java Run");
        this.outputChannel.appendLine("\"Java.Run\" 已启动!\n 快捷键 alt+b 编译并运行");
        this.outputChannel.show();
        let StatusBarAlignment = this.vscode.StatusBarAlignment;
        ;
        this.statusBar = this.vscode.window.createStatusBarItem(StatusBarAlignment.Left);
        this.statusBar.show();
    }
    // 启动
    start() {
        this.fileInfo = new FileInfo_1.default(this.vscode.window.activeTextEditor.document);
        this.prebuild(this.vscode.window.activeTextEditor);
    }
    // 提示
    info(info, isOutput = false) {
        if (isOutput) {
            this.outputChannel.appendLine(info);
        }
        else {
            this.statusBar.text = info;
        }
    }
    // 预编译
    prebuild(editor) {
        this.outputChannel.clear();
        let fullFileName = this.fileInfo.fullFileName;
        if (!editor || !fullFileName) {
            return;
        }
        if (!fullFileName.endsWith(".java")) {
            return;
        }
        if (editor.document.isDirty) {
            this.info('文件未保存,自动保存...');
            editor.document.save();
        }
        this.build(fullFileName);
    }
    // 编译
    build(fullFileName) {
        let exec = require("child_process").exec;
        let cmd = "javac -d " + this.fileInfo.folderPath + " " + fullFileName;
        this.info('已启动生成...');
        let iconv = require('iconv-lite'); // 中文转码处理
        let encoding = 'cp936'; // 类似gb2312
        let binaryEncoding = 'binary';
        exec(cmd, { encoding: binaryEncoding }, (err, stdout, stderr) => {
            if (stderr) {
                this.info('生成失败');
                this.info(iconv.decode(new Buffer(stderr, binaryEncoding), encoding), true);
                return;
            }
            else {
                this.info('生成成功');
                this.run(exec, fullFileName);
            }
        });
    }
    // 运行
    run(exec, fullFileName) {
        let cmd = "java -cp " + this.fileInfo.folderPath + " " +
            (this.fileInfo.packageName ? this.fileInfo.packageName + "." + this.fileInfo.className : this.fileInfo.className);
        exec(cmd, (error, stdout, stderr) => {
            if (stderr) {
                this.info(stderr, true);
            }
            else {
                this.info(stdout, true);
            }
        });
    }
    dispose() {
        this.statusBar.dispose();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Compiler;
//# sourceMappingURL=Compiler.js.map