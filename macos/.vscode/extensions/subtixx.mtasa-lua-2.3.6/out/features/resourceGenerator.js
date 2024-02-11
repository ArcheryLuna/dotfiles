'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var vscode = require("vscode");
var fs = require("fs");
var xml2js = require("xml2js");
var defs_1 = require("../defs/defs");
var utils_1 = require("../utils");
function generateResource(uri) {
    var fullFilePath = uri.fsPath;
    if (fullFilePath === undefined)
        fullFilePath = vscode.workspace.rootPath;
    var options = {
        ignoreFocusOut: true,
        prompt: "Type the name of the new resource, or press ESC to cancel",
        placeHolder: 'newResource'
    };
    var resourceName = vscode.window.showInputBox(options);
    if (resourceName === undefined)
        return;
    resourceName.then(function (name) {
        var folderPath = path.join(fullFilePath, name);
        var metaFilePath = path.join(folderPath, "meta.xml");
        var clientScriptFilePath = path.join(folderPath, getFileName(name, defs_1.ScriptSide.Client));
        var serverScriptFilePath = path.join(folderPath, getFileName(name, defs_1.ScriptSide.Server));
        var sharedScriptFilePath = path.join(folderPath, getFileName(name, defs_1.ScriptSide.Shared));
        if (fs.existsSync(folderPath)) {
            vscode.window.showErrorMessage("Resource folder already exists.");
            return;
        }
        fs.mkdirSync(folderPath);
        generateMetaFile(name, metaFilePath);
        generateClientFile(name, clientScriptFilePath);
        generateServerFile(name, serverScriptFilePath);
        generateSharedFile(name, sharedScriptFilePath);
        vscode.window.showInformationMessage("Resource '" + name + "' successfully created.");
        vscode.workspace.openTextDocument(metaFilePath).then(function (doc) {
            vscode.window.showTextDocument(doc);
        });
    });
}
exports.generateResource = generateResource;
function generateClient(uri) {
    var fullFilePath = uri.fsPath;
    if (fullFilePath === undefined)
        fullFilePath = vscode.workspace.rootPath;
    var options = {
        ignoreFocusOut: true,
        prompt: "Type the name of the client file to create (without extension or c_ prefix), or press ESC to cancel",
        placeHolder: 'newClientFile'
    };
    var clientFileName = vscode.window.showInputBox(options);
    if (clientFileName === undefined)
        return;
    clientFileName.then(function (name) {
        var fileName = getFileName(name, defs_1.ScriptSide.Client);
        var clientScriptFilePath = path.join(fullFilePath, fileName);
        if (!fs.existsSync(fullFilePath)) {
            vscode.window.showErrorMessage("Resource folder does not exist.");
            return;
        }
        if (fs.existsSync(clientScriptFilePath)) {
            vscode.window.showErrorMessage(fileName + " already exists.");
            return;
        }
        generateClientFile(name, clientScriptFilePath);
        addToMeta(fullFilePath, clientScriptFilePath, defs_1.ScriptSide.Client);
        vscode.window.showInformationMessage("Client file '" + name + "' successfully created.");
        vscode.workspace.openTextDocument(clientScriptFilePath).then(function (doc) {
            vscode.window.showTextDocument(doc);
        });
    });
}
exports.generateClient = generateClient;
function generateServer(uri) {
    var fullFilePath = uri.fsPath;
    if (fullFilePath === undefined)
        fullFilePath = vscode.workspace.rootPath;
    var options = {
        ignoreFocusOut: true,
        prompt: "Type the name of the server file to create (without extension or s_ prefix), or press ESC to cancel",
        placeHolder: 'newServerFile'
    };
    var serverFileName = vscode.window.showInputBox(options);
    if (serverFileName === undefined)
        return;
    serverFileName.then(function (name) {
        var fileName = getFileName(name, defs_1.ScriptSide.Server);
        var serverScriptFilePath = path.join(fullFilePath, fileName);
        if (!fs.existsSync(fullFilePath)) {
            vscode.window.showErrorMessage("Resource folder does not exist.");
            return;
        }
        if (fs.existsSync(serverScriptFilePath)) {
            vscode.window.showErrorMessage(fileName + " already exists.");
            return;
        }
        generateServerFile(name, serverScriptFilePath);
        addToMeta(fullFilePath, serverScriptFilePath, defs_1.ScriptSide.Server);
        vscode.window.showInformationMessage("Server file '" + name + "' successfully created.");
        vscode.workspace.openTextDocument(serverScriptFilePath).then(function (doc) {
            vscode.window.showTextDocument(doc);
        });
    });
}
exports.generateServer = generateServer;
function generateShared(uri) {
    var fullFilePath = uri.fsPath;
    if (fullFilePath === undefined)
        fullFilePath = vscode.workspace.rootPath;
    var options = {
        ignoreFocusOut: true,
        prompt: "Type the name of the shared file to create (without extension or g_ prefix), or press ESC to cancel",
        placeHolder: 'newServerFile'
    };
    var sharedFileName = vscode.window.showInputBox(options);
    if (sharedFileName === undefined)
        return;
    sharedFileName.then(function (name) {
        var fileName = getFileName(name, defs_1.ScriptSide.Shared);
        var sharedScriptFilePath = path.join(fullFilePath, fileName);
        if (!fs.existsSync(fullFilePath)) {
            vscode.window.showErrorMessage("Resource folder does not exist.");
            return;
        }
        if (fs.existsSync(sharedScriptFilePath)) {
            vscode.window.showErrorMessage(fileName + " already exists.");
            return;
        }
        generateSharedFile(name, sharedScriptFilePath);
        addToMeta(fullFilePath, sharedScriptFilePath, defs_1.ScriptSide.Server);
        vscode.window.showInformationMessage("Shared file '" + name + "' successfully created.");
        vscode.workspace.openTextDocument(sharedScriptFilePath).then(function (doc) {
            vscode.window.showTextDocument(doc);
        });
    });
}
exports.generateShared = generateShared;
function generateMeta(uri) {
    var fullFilePath = uri.fsPath;
    if (fullFilePath === undefined)
        fullFilePath = vscode.window.activeTextEditor.document.fileName;
    var folderPath = path.dirname(fullFilePath);
    var resourceName = folderPath.substr(folderPath.lastIndexOf("\\") + 1, folderPath.length - folderPath.lastIndexOf("\\"));
    var filePath = path.join(folderPath, "meta.xml");
    if (folderPath === undefined || !fs.existsSync(folderPath)) {
        vscode.window.showErrorMessage("Resource folder does not exist.");
        return;
    }
    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage("Meta.xml already exists.");
        return;
    }
    var fileExts = vscode.workspace.getConfiguration("mtalua-generate").get("filesrc_extensions", [".png", ".jpg", ".mp3", ".wav", ".ttf", ".tif"]);
    // TODO: This is horrible and should be changed :S, something like a file in the extension which holds our template
    var defaultAuthor = vscode.workspace.getConfiguration("mtalua-generate").get("author", "VSCode MTA:SA Lua");
    var defaultType = vscode.workspace.getConfiguration("mtalua-generate").get("meta_default_type", "script");
    var defaultVersion = vscode.workspace.getConfiguration("mtalua-generate").get("meta_default_version", "0.1.0");
    var content = "<meta>\n";
    if (vscode.workspace.getConfiguration("mtalua-generate").get("watermarking", true))
        content += "\t<!-- Auto generated using VSCode MTA:SA Lua by Subtixx -->\n";
    content += "\t<info author=\"" + defaultAuthor + "\" type=\"" + defaultType + "\" name=\"" + resourceName + "\" version=\"" + defaultVersion + "\" />\n";
    utils_1.walkSync(folderPath, function (file, stat) {
        if (path.extname(file) == ".git")
            return;
        var fileName = file.substr(file.lastIndexOf("\\") + 1, file.length - file.lastIndexOf("\\"));
        var relFilePath = path.relative(folderPath, file).replace(/\\/g, "/");
        if (fileExts.indexOf(path.extname(file)) > -1) {
            content += "\t<file src=\"" + relFilePath + "\" />\n";
            return;
        }
        if (path.extname(file) != "." + vscode.workspace.getConfiguration("mtalua-generate").get("client_extension", "lua") &&
            path.extname(file) != "." + vscode.workspace.getConfiguration("mtalua-generate").get("shared_extension", "lua") &&
            path.extname(file) != "." + vscode.workspace.getConfiguration("mtalua-generate").get("server_extension", "lua") &&
            path.extname(file) != ".luac" && path.extname(file) != ".clua" && path.extname(file) != ".lua" && path.extname(file) != ".slua" &&
            path.extname(file) != ".glua") {
            return;
        }
        var side = utils_1.getScriptSide(fileName);
        switch (side) {
            case defs_1.ScriptSide.Client:
                // Clientside
                content += "\t<script src=\"" + fileName + "\" type=\"client\" />\n";
                break;
            case defs_1.ScriptSide.Server:
                // Serverside
                content += "\t<script src=\"" + relFilePath + "\" type=\"server\" />\n";
                break;
            default:
                // Clientside & Serverside / Shared
                content += "\t<script src=\"" + relFilePath + "\" type=\"both\" />\n";
                break;
        }
    });
    content += "</meta>";
    fs.writeFileSync(filePath, content);
    vscode.window.showInformationMessage("Meta file for '" + resourceName + "' successfully created.");
    vscode.workspace.openTextDocument(filePath).then(function (doc) {
        vscode.window.showTextDocument(doc);
    });
}
exports.generateMeta = generateMeta;
function generateMetaFile(resourceName, filePath) {
    // TODO: This is horrible and should be changed :S, something like a file in the extension which holds our template
    var defaultAuthor = vscode.workspace.getConfiguration("mtalua-generate").get("author", "VSCode MTA:SA Lua");
    var content = "<meta>\n";
    content += "\t<info author=\"" + defaultAuthor + "\" type=\"script\" name=\"" + resourceName + "\" />\n";
    if (vscode.workspace.getConfiguration("mtalua-generate").get("activate_client_file_generation", true))
        content += "\t<script src=\"c_" + resourceName + ".lua\" type=\"client\" cache=\"false\" />\n";
    if (vscode.workspace.getConfiguration("mtalua-generate").get("activate_client_file_generation", true))
        content += "\t<script src=\"s_" + resourceName + ".lua\" type=\"server\" />\n";
    content += "</meta>";
    fs.writeFileSync(filePath, content);
}
// TODO: These three can be combined into one.
function generateClientFile(resourceName, filePath) {
    if (!vscode.workspace.getConfiguration("mtalua-generate").get("activate_client_file_generation", true))
        return;
    var content = vscode.workspace.getConfiguration("mtalua-generate").get("default_client_content", "");
    fs.writeFileSync(filePath, content);
}
function generateServerFile(resourceName, filePath) {
    if (!vscode.workspace.getConfiguration("mtalua-generate").get("activate_client_file_generation", true))
        return;
    var content = vscode.workspace.getConfiguration("mtalua-generate").get("default_server_content", "");
    fs.writeFileSync(filePath, content);
}
function generateSharedFile(resourceName, filePath) {
    if (!vscode.workspace.getConfiguration("mtalua-generate").get("activate_shared_file_generation", true))
        return;
    var content = vscode.workspace.getConfiguration("mtalua-generate").get("default_shared_content", "");
    fs.writeFileSync(filePath, content);
}
function addToMeta(folderPath, filePath, side) {
    if (!vscode.workspace.getConfiguration("mtalua-generate").get("modify_meta", true))
        return;
    var relFilePath = path.relative(folderPath, filePath).replace(/\\/g, "/");
    var metaFilePath = path.join(folderPath, "meta.xml");
    var data = fs.readFileSync(metaFilePath);
    xml2js.parseString(data, function (err, result) {
        var type = "server";
        if (side == defs_1.ScriptSide.Client)
            type = "client";
        else if (side == defs_1.ScriptSide.Shared)
            type = "both";
        var builder = new xml2js.Builder({ headless: true });
        result.meta.script.push({ $: { src: relFilePath, type: "client" } });
        fs.writeFileSync(metaFilePath, builder.buildObject(result));
    });
}
// TODO: Custom extension for weird people who use .clua for client side lua, .slua for server side lua and .glua for global lua
function getFileName(name, side) {
    var sideStr = "";
    switch (side) {
        case defs_1.ScriptSide.Client:
            sideStr = "client";
            break;
        case defs_1.ScriptSide.Server:
            sideStr = "server";
            break;
        case defs_1.ScriptSide.Shared:
            sideStr = "shared";
            break;
    }
    var fileName;
    if (vscode.workspace.getConfiguration("mtalua-generate").get(sideStr + "_prefix_type"))
        fileName = vscode.workspace.getConfiguration("mtalua-generate").get(sideStr + "_prefix") + name +
            "." + vscode.workspace.getConfiguration("mtalua-generate").get(sideStr + "_extension", "lua");
    else
        fileName = name + vscode.workspace.getConfiguration("mtalua-generate").get(sideStr + "_prefix") +
            "." + vscode.workspace.getConfiguration("mtalua-generate").get(sideStr + "_extension", "lua");
    return fileName;
}
//# sourceMappingURL=resourceGenerator.js.map