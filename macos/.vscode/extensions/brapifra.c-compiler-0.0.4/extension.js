var vscode = require('vscode');
const execFile = require('child_process').execFile;

function activate(context) {
    var compiler = "gcc";
    console.log('Congratulations, your extension "C compiler" is now active!');
    var terminal = vscode.window.createTerminal("C Compiler Terminal");
    var output = vscode.window.createOutputChannel("C Compiler Log");
    terminal.sendText("mkdir .dist");
    var disposable = vscode.commands.registerCommand('extension.compileFile', function() {
        var file = vscode.window.activeTextEditor.document.uri;
        file = decodeURIComponent(file).replace("file://", "");
        if (file.indexOf(".c") == -1) {
            vscode.window.showErrorMessage("File not valid");
            console.error("File not valid");
            return;
        }
        vscode.window.showInputBox({ prompt: "Output filename", value: file.substring(file.lastIndexOf("/") + 1, file.indexOf(".c")) }).then(function(x) {
            compileFile(x, [file]);
        });
    });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.executeFile', function() {
        var file = vscode.window.activeTextEditor.document.uri;
        file = decodeURIComponent(file).replace("file://", "");
        compileFile(".dist/a.out", [file], function() {
            executeFile(".dist/a.out");
        });
    });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.compileProject', function() {
        vscode.window.showInputBox({ prompt: "Output filename", value: "a.out" }).then(function(x) {
            vscode.workspace.findFiles('**/*.c').then(function(files) {
                if (files.length == 0) {
                    return undefined;
                }
                for (var i = 0; i < files.length; i++) {
                    files[i] = decodeURIComponent(files[i]).replace("file://", "");
                }
                compileFile(x, files);
            });
        });
    });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.executeProject', function() {
        vscode.window.showInputBox({ prompt: "Output filename", value: "a.out" }).then(function(x) {
            vscode.workspace.findFiles('**/*.c').then(function(files) {
                if (files.length == 0) {
                    return undefined;
                }
                for (var i = 0; i < files.length; i++) {
                    files[i] = decodeURIComponent(files[i]).replace("file://", "");
                }
                compileFile(x, files, function() {
                    executeFile(".dist/a.out");
                });
            });
        });
    });
    context.subscriptions.push(disposable);

    function compileFile(out, files, callback) {
        if (out == undefined) {
            out = "a.out";
        }
        if (files == undefined) {
            files = [];
        }
        execFile(compiler, ["-Wall", "-o", out].concat(files), { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage("Error Compiling");
                console.error("Error Compiling");
                output.clear();
                output.show();
                output.appendLine("Error compiling: \n" + stderr);
                return;
            }
            if (stderr != undefined && stderr != "") {
                vscode.window.showWarningMessage("Compiled with Warnings");
                output.clear();
                output.show();
                output.appendLine(stderr);
            }
            if (callback != undefined) {
                callback();
            }
        });
    }

    function executeFile(file) {
        terminal.show();
        terminal.sendText(file);
    }
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;