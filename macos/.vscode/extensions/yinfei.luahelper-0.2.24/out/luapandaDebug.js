"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaConfigurationProvider = void 0;
const vscode = require("vscode");
const Net = require("net");
const tools_1 = require("./common/tools");
const logManager_1 = require("./common/logManager");
const luaDebug_1 = require("./debug/luaDebug");
const luaPath_1 = require("./common/luaPath");
// debug启动时的配置项处理
class LuaConfigurationProvider {
    resolveDebugConfiguration(folder, config, token) {
        // if launch.json is missing or empty
        if (!config.type && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'lua') {
                vscode.window.showInformationMessage('请先正确配置launch文件!');
                config.type = 'LuaHelper-Debug';
                config.name = 'LuaHelper';
                config.request = 'launch';
            }
        }
        // 不调试而直接运行当前文件
        if (config.noDebug) {
            // 获取活跃窗口
            let retObject = tools_1.Tools.getVSCodeAvtiveFilePath();
            if (retObject["retCode"] !== 0) {
                logManager_1.DebugLogger.DebuggerInfo(retObject["retMsg"]);
                return;
            }
            let filePath = retObject["filePath"];
            if (LuaConfigurationProvider.RunFileTerminal) {
                LuaConfigurationProvider.RunFileTerminal.dispose();
            }
            LuaConfigurationProvider.RunFileTerminal = vscode.window.createTerminal({
                name: "Run Lua File (LuaHelper)",
                env: {},
            });
            // 把路径加入package.path
            let path = require("path");
            let pathCMD = "'";
            let pathArr = tools_1.Tools.VSCodeExtensionPath.split(path.sep);
            let stdPath = pathArr.join('/');
            pathCMD = pathCMD + stdPath + "/debugger/?.lua;";
            pathCMD = pathCMD + config.packagePath.join(';');
            pathCMD = pathCMD + "'";
            let luaPath = new luaPath_1.LuaPath();
            let luaPathStr = "";
            if (config.luaPath && config.luaPath !== '') {
                luaPathStr = config.luaPath;
            }
            let strVect = luaPath.GetLuaExeCpathStr(luaPathStr, tools_1.Tools.VSCodeExtensionPath);
            // 路径socket的路径加入到package.cpath中
            let cpathCMD = "'";
            //cpathCMD = cpathCMD + stdPath + GetLuasocketPath();
            cpathCMD = cpathCMD + config.packagePath.join(';');
            cpathCMD = cpathCMD + strVect[1] + ";";
            cpathCMD = cpathCMD + "'";
            cpathCMD = " package.cpath = " + cpathCMD + ".. package.cpath; ";
            //拼接命令
            pathCMD = " \"package.path = " + pathCMD + ".. package.path; ";
            let doFileCMD = filePath;
            let runCMD = pathCMD + cpathCMD + "\" " + doFileCMD;
            let LuaCMD = strVect[0] + " -e ";
            LuaConfigurationProvider.RunFileTerminal.sendText(LuaCMD + runCMD, true);
            LuaConfigurationProvider.RunFileTerminal.show();
            return;
        }
        // 关于打开调试控制台的自动设置
        if (config.name === "LuaHelper-DebugFile") {
            if (!config.internalConsoleOptions) {
                config.internalConsoleOptions = "neverOpen";
            }
        }
        else {
            if (!config.internalConsoleOptions) {
                config.internalConsoleOptions = "openOnSessionStart";
            }
        }
        // rootFolder 固定为 ${workspaceFolder}, 用来查找本项目的launch.json.
        config.rootFolder = '${workspaceFolder}';
        if (!config.TempFilePath) {
            config.TempFilePath = '${workspaceFolder}';
        }
        // 开发模式设置
        if (config.DevelopmentMode !== true) {
            config.DevelopmentMode = false;
        }
        if (!config.program) {
            config.program = '';
        }
        if (config.packagePath == undefined) {
            config.packagePath = [];
        }
        if (config.truncatedOPath == undefined) {
            config.truncatedOPath = "";
        }
        if (config.distinguishSameNameFile == undefined) {
            config.distinguishSameNameFile = false;
        }
        if (config.dbCheckBreakpoint == undefined) {
            config.dbCheckBreakpoint = false;
        }
        if (!config.args) {
            config.args = new Array();
        }
        if (config.autoPathMode == undefined) {
            // 默认使用自动路径模式
            config.autoPathMode = true;
        }
        if (!config.cwd) {
            config.cwd = '${workspaceFolder}';
        }
        if (!config.luaFileExtension) {
            config.luaFileExtension = '';
        }
        else {
            // luaFileExtension 兼容 ".lua" or "lua"
            let firseLetter = config.luaFileExtension.substr(0, 1);
            if (firseLetter === '.') {
                config.luaFileExtension = config.luaFileExtension.substr(1);
            }
        }
        config.VSCodeExtensionPath = tools_1.Tools.VSCodeExtensionPath;
        if (config.stopOnEntry == undefined) {
            config.stopOnEntry = true;
        }
        if (config.pathCaseSensitivity == undefined) {
            config.pathCaseSensitivity = false;
        }
        if (config.connectionPort == undefined) {
            config.connectionPort = 8818;
        }
        if (config.logLevel == undefined) {
            config.logLevel = 1;
        }
        if (config.autoReconnect != true) {
            config.autoReconnect = false;
        }
        if (config.updateTips == undefined) {
            config.updateTips = true;
        }
        if (config.useCHook == undefined) {
            config.useCHook = true;
        }
        if (config.isNeedB64EncodeStr == undefined) {
            config.isNeedB64EncodeStr = true;
        }
        if (config.VSCodeAsClient == undefined) {
            config.VSCodeAsClient = false;
        }
        if (config.connectionIP == undefined) {
            config.connectionIP = "127.0.0.1";
        }
        if (!this._server) {
            this._server = Net.createServer(socket => {
                const session = new luaDebug_1.LuaDebugSession();
                session.setRunAsServer(true);
                session.start(socket, socket);
            }).listen(0);
        }
        // make VS Code connect to debug server instead of launching debug adapter
        let addressInfo = this._server.address();
        config.debugServer = addressInfo.port;
        return config;
    }
    dispose() {
        if (this._server) {
            this._server.close();
        }
    }
}
exports.LuaConfigurationProvider = LuaConfigurationProvider;
//# sourceMappingURL=luapandaDebug.js.map