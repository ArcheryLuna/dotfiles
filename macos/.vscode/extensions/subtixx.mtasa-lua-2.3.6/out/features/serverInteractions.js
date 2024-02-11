"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var path = require("path");
var request = require("request");
var util_1 = require("util");
var fs = require("fs");
var CallType;
(function (CallType) {
    CallType[CallType["Start"] = 0] = "Start";
    CallType[CallType["Stop"] = 1] = "Stop";
    CallType[CallType["Restart"] = 2] = "Restart";
    CallType[CallType["Search"] = 3] = "Search";
})(CallType = exports.CallType || (exports.CallType = {}));
function restartResourceSave(doc) {
    if (doc.languageId == "mtalua")
        restartResource(doc.uri);
}
exports.restartResourceSave = restartResourceSave;
function startResource(uri) {
    if (!vscode.workspace.getConfiguration("mtalua-http").get("enabled", true))
        return;
    if (uri == null) {
        var options = {
            ignoreFocusOut: true,
            prompt: "Type the name of the resource to start, or press ESC to cancel",
            placeHolder: 'MyAwesomeResource'
        };
        if (vscode.workspace.getConfiguration("mtalua-http").get("enable_search_hinting", false))
            options.validateInput = resourcesNameHinting;
        var resName = vscode.window.showInputBox(options);
        resName.then(function (resourceName) {
            if (resourceName === undefined)
                return;
            searchResource(resourceName, function (result, response, index, resourceName) {
                if (!result) {
                    vscode.window.showErrorMessage("Resource '" + resourceName + "' not found.");
                    return;
                }
                if (response[1][index] != "loaded") {
                    vscode.window.showErrorMessage("Resource '" + resourceName + "' already running.");
                    return;
                }
                httpRequest(CallType.Start, '["^R^' + resourceName + '"]', startResourceCallback);
            });
        });
        return;
    }
    // fakePath because fsPath contains a path without ending \, adding just \ will not work for some odd reason.
    var folderPath = path.dirname(uri.fsPath + "\\fakePath");
    var resourceName = folderPath.substr(folderPath.lastIndexOf("\\") + 1, folderPath.length - folderPath.lastIndexOf("\\"));
    searchResource(resourceName, function (result, response, index, resourceName) {
        if (!result) {
            vscode.window.showErrorMessage("Resource '" + resourceName + "' not found.");
            return;
        }
        if (response[1][index] != "loaded") {
            vscode.window.showErrorMessage("Resource '" + resourceName + "' already running.");
            return;
        }
        httpRequest(CallType.Start, '["^R^' + resourceName + '"]', startResourceCallback);
    });
}
exports.startResource = startResource;
function stopResource(uri) {
    if (!vscode.workspace.getConfiguration("mtalua-http").get("enabled", true))
        return;
    if (uri == null) {
        var options = {
            ignoreFocusOut: true,
            prompt: "Type the name of the resource to stop, or press ESC to cancel",
            placeHolder: 'MyAwesomeResource'
        };
        if (vscode.workspace.getConfiguration("mtalua-http").get("enable_search_hinting", false))
            options.validateInput = resourcesNameHinting;
        var resName = vscode.window.showInputBox(options);
        resName.then(function (resourceName) {
            if (resourceName === undefined)
                return;
            searchResource(resourceName, function (result, response, index, resourceName) {
                if (!result) {
                    vscode.window.showErrorMessage("Resource '" + resourceName + "' not found.");
                    return;
                }
                if (response[1][index] != "running") {
                    vscode.window.showErrorMessage("Resource '" + resourceName + "' not started.");
                    return;
                }
                httpRequest(CallType.Stop, '["^R^' + resourceName + '"]', stopResourceCallback);
            });
        });
        return;
    }
    // fakePath because fsPath contains a path without ending \, adding just \ will not work for some odd reason.
    var folderPath = path.dirname(uri.fsPath + "\\fakePath");
    var resourceName = folderPath.substr(folderPath.lastIndexOf("\\") + 1, folderPath.length - folderPath.lastIndexOf("\\"));
    searchResource(resourceName, function (result, response, index, resourceName) {
        if (!result) {
            vscode.window.showErrorMessage("Resource '" + resourceName + "' not found.");
            return;
        }
        if (response[1][index] != "running") {
            vscode.window.showErrorMessage("Resource '" + resourceName + "' not started.");
            return;
        }
        httpRequest(CallType.Stop, '["^R^' + resourceName + '"]', stopResourceCallback);
    });
}
exports.stopResource = stopResource;
function restartResource(uri) {
    if (!vscode.workspace.getConfiguration("mtalua-http").get("enabled", true))
        return;
    if (uri == null) {
        var options = {
            ignoreFocusOut: true,
            prompt: "Type the name of the resource to restart, or press ESC to cancel",
            placeHolder: 'MyAwesomeResource'
        };
        if (vscode.workspace.getConfiguration("mtalua-http").get("enable_search_hinting", false))
            options.validateInput = resourcesNameHinting;
        var resName = vscode.window.showInputBox(options);
        resName.then(function (resourceName) {
            if (resourceName === undefined)
                return;
            searchResource(resourceName, function (result, response, index, resourceName) {
                if (!result) {
                    vscode.window.showErrorMessage("Resource '" + resourceName + "' not found.");
                    return;
                }
                if (response[1][index] != "running") {
                    vscode.window.showErrorMessage("Resource '" + resourceName + "' not running.");
                    return;
                }
                httpRequest(CallType.Restart, '["^R^' + resourceName + '"]', restartResourceCallback);
            });
        });
        return;
    }
    // fakePath because fsPath contains a path without ending \, adding just \ will not work for some odd reason.
    var folderPath = "";
    if (fs.statSync(uri.fsPath).isDirectory())
        folderPath = path.dirname(uri.fsPath + "\\fakePath");
    else
        folderPath = path.dirname(uri.fsPath);
    var resourceName = folderPath.substr(folderPath.lastIndexOf("\\") + 1, folderPath.length - folderPath.lastIndexOf("\\"));
    searchResource(resourceName, function (result, response, index, resourceName) {
        if (!result) {
            vscode.window.showErrorMessage("Resource '" + resourceName + "' not found.");
            return;
        }
        if (response[1][index] != "running") {
            vscode.window.showErrorMessage("Resource '" + resourceName + "' not running.");
            return;
        }
        httpRequest(CallType.Restart, '["^R^' + resourceName + '"]', restartResourceCallback);
    });
}
exports.restartResource = restartResource;
function startResourceCallback(response, resourceName) {
    if (util_1.isArray(response)) {
        if (response[0] === true)
            vscode.window.showInformationMessage("Resource '" + resourceName + "' started.");
        else
            vscode.window.showErrorMessage("Failed to start resource");
    }
}
function stopResourceCallback(response, resourceName) {
    if (util_1.isArray(response)) {
        if (response[0] === true)
            vscode.window.showInformationMessage("Resource '" + resourceName + "' stopped.");
        else
            vscode.window.showErrorMessage("Failed to stop resource");
    }
}
function restartResourceCallback(response, resourceName) {
    if (util_1.isArray(response)) {
        if (response[0] === true)
            vscode.window.showInformationMessage("Resource '" + resourceName + "' restarted.");
        else
            vscode.window.showErrorMessage("Failed to restart resource");
    }
}
function searchResource(resourceName, callback) {
    httpRequest(CallType.Search, '["' + resourceName + '", ""]', function (response, formData) {
        console.log(response);
        if (util_1.isArray(response) && util_1.isArray(response[0]) && response[0].length > 0) {
            var idx = response[0].indexOf("^R^" + resourceName);
            callback(true, response, idx, resourceName);
        }
        else {
            callback(false, response, -1, resourceName);
        }
    });
}
function resourcesNameHinting(value) {
    return new Promise(function (resolve) {
        httpRequest(CallType.Search, '["' + value + '", ""]', function (response, formData) {
            if (util_1.isArray(response) && response.length > 0 && response[0].length > 0) {
                var resName = response[0][0].substr(3, response[0][0].length - 3);
                if (resName === value)
                    resolve(null); // Valid
                else
                    resolve(resName);
            }
            else
                resolve("Not found");
        });
    });
}
function httpRequest(callType, formData, callback) {
    var callTypeStr = "";
    switch (callType) {
        case CallType.Start:
            callTypeStr = "startResource";
            break;
        case CallType.Stop:
            callTypeStr = "stopResource";
            break;
        case CallType.Restart:
            callTypeStr = "restartResource";
            break;
        case CallType.Search:
            callTypeStr = "getResourcesSearch";
            break;
        default:
            return;
    }
    var opt = getHttpOptions();
    opt.form = formData;
    request.post("/resourcemanager/call/" + callTypeStr, opt, function (error, response, body) {
        if (response == null || response.statusCode == null || response.statusCode != 200) {
            vscode.window.showErrorMessage(body == "" ? "Unknown error" : body);
            return;
        }
        var bodyJson = JSON.parse(body);
        callback(bodyJson, formData);
    });
}
function getHttpOptions() {
    return {
        'auth': {
            'user': vscode.workspace.getConfiguration("mtalua-http").get("username"),
            'pass': vscode.workspace.getConfiguration("mtalua-http").get("password"),
            'sendImmediately': true
        },
        'baseUrl': vscode.workspace.getConfiguration("mtalua-http").get("uri"),
        'form': '["^R^"]'
    };
}
//# sourceMappingURL=serverInteractions.js.map