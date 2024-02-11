'use strict';
var vscode = require('vscode');
var path = require('path');
var fs = require('fs');
var childProc_1 = require('./childProc');
var LuaFormatter = (function () {
    function LuaFormatter(outputChannel) {
        this.outputChannel = outputChannel;
    }
    LuaFormatter.prototype.formatDocument = function (extensionDir, document, options, token) {
        var exeDir = path.join(extensionDir, "bin");
        var luaFormatExePath = path.join(exeDir, "LuaFormat.exe");
        return this.provideDocumentFormattingEdits(document, options, token, exeDir, "\"" + luaFormatExePath + "\" -i \"" + document.uri.fsPath + "\"");
    };
    LuaFormatter.prototype.provideDocumentFormattingEdits = function (document, options, token, cwd, cmdLine) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            //Todo: Save the contents of the file to a temporary file and format that instead saving the actual file
            //This could unnecessarily trigger other behaviours
            document.save().then(function (saved) {
                var filePath = document.uri.fsPath;
                if (!fs.existsSync(filePath)) {
                    vscode.window.showErrorMessage("File " + filePath + " does not exist");
                    return resolve([]);
                }
                _this.outputChannel.clear();
                childProc_1.sendCommand(cmdLine, cwd).then(function (data) {
                    var formattedText = data;
                    if (document.getText() === formattedText) {
                        return resolve([]);
                    }
                    var result;
                    try {
                        result = JSON.parse(data);
                    }
                    catch (e) {
                        // not json
                        return resolve([]);
                    }
                    var range = new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);
                    var textEdit = new vscode.TextEdit(range, result.Text);
                    resolve([textEdit]);
                }, function (errorMsg) {
                    vscode.window.showErrorMessage(errorMsg);
                    _this.outputChannel.appendLine(errorMsg);
                    return resolve([]);
                });
            });
        });
    };
    return LuaFormatter;
}());
exports.LuaFormatter = LuaFormatter;
//# sourceMappingURL=luaFormatter.js.map