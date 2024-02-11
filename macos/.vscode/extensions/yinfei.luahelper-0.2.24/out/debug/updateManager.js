"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateManager = void 0;
const tools_1 = require("../common/tools");
const logManager_1 = require("../common/logManager");
const visualSetting_1 = require("./visualSetting");
const vscode = require("vscode");
const fs = require("fs");
class UpdateManager {
    setCheckUpdate(state) {
        UpdateManager.checkUpdate = state;
    }
    // 获取调试器lua文件的版本号，并提示用户升级
    checkIfLuaPandaNeedUpdate(LuaPandaPath, rootFolder) {
        if (!UpdateManager.checkUpdate || !LuaPandaPath) {
            return;
        }
        let luapandaTxt = tools_1.Tools.readFileContent(LuaPandaPath);
        let dver = luapandaTxt.match(/(?<=local debuggerVer = )("(.*?)")/);
        if (dver && dver.length === 3) {
            let DVerArr = dver[2].split('.');
            let AVerArr = String(tools_1.Tools.adapterVersion).split(".");
            if (DVerArr.length === AVerArr.length && DVerArr.length === 3) {
                let intDVer = parseInt(DVerArr[0]) * 10000 + parseInt(DVerArr[1]) * 100 + parseInt(DVerArr[2]);
                let intAVer = parseInt(AVerArr[0]) * 10000 + parseInt(AVerArr[1]) * 100 + parseInt(AVerArr[2]);
                let updateTipSetting = visualSetting_1.VisualSetting.getLaunchjson(rootFolder, "updateTips");
                if (intDVer < intAVer && updateTipSetting !== false) {
                    // if ( intDVer < intAVer){
                    vscode.window.showInformationMessage('LuaPanda VSCode 插件已升级 3.2.0 版本, 建议同时升级 LuaPanda.lua 文件。首次开始调试前请重建一下 launch.json 文件, 避免产生兼容问题。launch.json 配置项目参考 https://github.com/Tencent/LuaPanda/blob/master/Docs/Manual/launch-json-introduction.md', "好的");
                    vscode.window.showInformationMessage('当前工程中的 LuaPanda.lua 文件版本较低，是否自动替换为最新版本?', 'Yes', 'No', 'Never').then(value => {
                        if (value === "Yes") {
                            let confirmButton = "立刻升级";
                            vscode.window.showInformationMessage('已准备好更新 ' + LuaPandaPath + '。如用户对此文件有修改, 建议备份后再升级, 避免修改内容被覆盖', confirmButton, '稍后再试').then(value => {
                                if (value === confirmButton) {
                                    this.updateLuaPandaFile(LuaPandaPath);
                                }
                            });
                        }
                        else if (value === "No") {
                            // 本次插件运行期间不再提示
                            vscode.window.showInformationMessage('本次运行期间 LuaPanda 将不再弹出升级提示', "好的");
                            this.setCheckUpdate(false);
                        }
                        else if (value === "Never") {
                            // 永久不再提示升级
                            vscode.window.showInformationMessage('本项目调试时将不会再弹出调试器升级提示，需要升级请参考 https://github.com/Tencent/LuaPanda/blob/master/Docs/Manual/update.md', "好的");
                            this.setCheckUpdate(false);
                            // 把信息标记在 launch.json上
                            visualSetting_1.VisualSetting.setLaunchjson(rootFolder, "updateTips", false);
                        }
                        ;
                    });
                }
            }
            else {
                //版本号异常，不做处理
            }
        }
    }
    // 更新调试器lua文件(读取预置文件，写入工程的目标文件中)
    updateLuaPandaFile(LuaPandaPath) {
        //文件替换
        let luapandaContent = fs.readFileSync(tools_1.Tools.getLuaPathInExtension());
        try {
            fs.writeFileSync(LuaPandaPath, luapandaContent);
            logManager_1.DebugLogger.showTips("升级成功, " + LuaPandaPath + " 已升级到 " + tools_1.Tools.adapterVersion, 0);
        }
        catch (error) {
            logManager_1.DebugLogger.showTips("升级失败, " + LuaPandaPath + "写入失败! 可以手动替换此文件到github最新版", 1);
        }
        finally {
            this.setCheckUpdate(false);
        }
    }
}
exports.UpdateManager = UpdateManager;
UpdateManager.checkUpdate = true;
//# sourceMappingURL=updateManager.js.map