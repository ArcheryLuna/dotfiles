'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var defs_1 = require("./defs/defs");
// Helper function.
function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        }
        else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}
exports.walkSync = walkSync;
function getScriptSide(fileName) {
    if (path.extname(fileName) != "." + vscode.workspace.getConfiguration("mtalua-generate").get("client_extension", "lua") ||
        fileName.startsWith("c_") || fileName.endsWith("_c") ||
        fileName.startsWith("client") || fileName.endsWith("client") ||
        fileName.startsWith(vscode.workspace.getConfiguration("mtalua-generate").get("client_prefix")) ||
        fileName.endsWith(vscode.workspace.getConfiguration("mtalua-generate").get("client_prefix")))
        return defs_1.ScriptSide.Client;
    /*if (fileName.startsWith("g_") || fileName.endsWith("_g") ||
        fileName.startsWith("global") || fileName.endsWith("global") ||
        fileName.startsWith(vscode.workspace.getConfiguration("mtalua-generate").get("shared_prefix")) ||
        fileName.endsWith(vscode.workspace.getConfiguration("mtalua-generate").get("shared_prefix")))
        return ScriptSide.Shared;*/
    if (path.extname(fileName) != "." + vscode.workspace.getConfiguration("mtalua-generate").get("server_extension", "lua") ||
        fileName.startsWith("s_") || fileName.endsWith("_s") ||
        fileName.startsWith("server") || fileName.endsWith("server") ||
        fileName.startsWith(vscode.workspace.getConfiguration("mtalua-generate").get("server_prefix")) ||
        fileName.endsWith(vscode.workspace.getConfiguration("mtalua-generate").get("server_prefix")))
        return defs_1.ScriptSide.Server;
    return defs_1.ScriptSide.Shared;
}
exports.getScriptSide = getScriptSide;
//# sourceMappingURL=utils.js.map