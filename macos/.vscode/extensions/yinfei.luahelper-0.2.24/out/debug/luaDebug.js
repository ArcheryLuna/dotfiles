"use strict";
// Tencent is pleased to support the open source community by making LuaPanda available.
// Copyright (C) 2019 THL A29 Limited, a Tencent company. All rights reserved.
// Licensed under the BSD 3-Clause License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
// https://opensource.org/licenses/BSD-3-Clause
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaDebugSession = void 0;
const vscode = require("vscode");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const path_1 = require("path");
const luaDebugRuntime_1 = require("./luaDebugRuntime");
const Net = require("net");
const dataProcessor_1 = require("./dataProcessor");
const logManager_1 = require("../common/logManager");
//import { StatusBarManager } from '../common/statusBarManager';
const breakpoint_1 = require("./breakpoint");
const tools_1 = require("../common/tools");
//import { UpdateManager } from './updateManager';
const threadManager_1 = require("../common/threadManager");
const pathManager_1 = require("../common/pathManager");
const visualSetting_1 = require("./visualSetting");
const { Subject } = require('await-notify');
let fs = require('fs');
const luaPath_1 = require("../common/luaPath");
class LuaDebugSession extends vscode_debugadapter_1.LoggingDebugSession {
    static get debugSessionArray() { return LuaDebugSession._debugSessionArray; }
    constructor() {
        super("lua-debug.txt");
        this._configurationDone = new Subject();
        this._variableHandles = new vscode_debugadapter_1.Handles(50000); //Handle编号从50000开始
        this.UseLoadstring = false;
        this._dbCheckBreakpoint = true;
        this.connectionFlag = false; //连接成功的标志位 
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);
        this._threadManager = new threadManager_1.ThreadManager(); // 线程实例 调用this._threadManager.CUR_THREAD_ID可以获得当前线程号
        this._pathManager = new pathManager_1.PathManager(this, this.printLogInDebugConsole);
        this._runtime = new luaDebugRuntime_1.LuaDebugRuntime(); // _runtime and _dataProcessor 相互持有实例
        this._dataProcessor = new dataProcessor_1.DataProcessor();
        this._dataProcessor._runtime = this._runtime;
        this._runtime._dataProcessor = this._dataProcessor;
        this._runtime._pathManager = this._pathManager;
        LuaDebugSession._debugSessionArray.set(this._threadManager.CUR_THREAD_ID, this);
        this._runtime.TCPSplitChar = "|*|";
        this._runtime.on('stopOnEntry', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('entry', this._threadManager.CUR_THREAD_ID));
        });
        this._runtime.on('stopOnStep', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', this._threadManager.CUR_THREAD_ID));
        });
        this._runtime.on('stopOnStepIn', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', this._threadManager.CUR_THREAD_ID));
        });
        this._runtime.on('stopOnStepOut', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', this._threadManager.CUR_THREAD_ID));
        });
        this._runtime.on('stopOnCodeBreakpoint', () => {
            // stopOnCodeBreakpoint 指的是遇到 LuaPanda.BP()，因为是代码中的硬断点，VScode中不会保存这个断点信息，故不做校验
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', this._threadManager.CUR_THREAD_ID));
        });
        this._runtime.on('stopOnBreakpoint', () => {
            // 因为lua端所做的断点命中可能出现同名文件错误匹配，这里要再次校验lua端命中的行列号是否在 breakpointsArray 中
            if (this.checkIsRealHitBreakpoint()) {
                this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', this._threadManager.CUR_THREAD_ID));
            }
            else {
                // go on running
                this._runtime.continueWithFakeHitBk(() => {
                    logManager_1.DebugLogger.AdapterInfo("命中同名文件中的断点, 确认继续运行");
                });
            }
        });
        this._runtime.on('stopOnException', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('exception', this._threadManager.CUR_THREAD_ID));
        });
        this._runtime.on('stopOnPause', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('exception', this._threadManager.CUR_THREAD_ID));
        });
        this._runtime.on('breakpointValidated', (bp) => {
            this.sendEvent(new vscode_debugadapter_1.BreakpointEvent('changed', { verified: bp.verified, id: bp.id }));
        });
        this._runtime.on('logInDebugConsole', (message) => {
            this.printLogInDebugConsole(message);
        });
    }
    // 在有同名文件的情况下，需要再次进行命中判断。
    checkIsRealHitBreakpoint() {
        if (!this._dbCheckBreakpoint) {
            // 用户关闭了二次断点校验，直接返回成功
            return true;
        }
        let steak = this._runtime.breakStack;
        let steakPath = steak[0].file;
        let steakLine = steak[0].line;
        for (let bkMap of this.breakpointsArray) {
            if (bkMap.bkPath === steakPath) {
                for (const node of bkMap.bksArray) {
                    if (node.line == steakLine) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    // 在调试控制台打印日志. 从非luaDebug.ts文件调用这个函数时，要传instance实例
    printLogInDebugConsole(message, instance = this) {
        instance.sendEvent(new vscode_debugadapter_1.OutputEvent(message + '\n', 'console'));
    }
    /**
     * VScode前端的首个请求，询问debug adapter所能提供的特性
     * 这个方法是VSCode调过来的，adapter拿到其中的参数进行填充. 再回给VSCode,VSCode根据这些设置做不同的显示
     */
    initializeRequest(response, args) {
        logManager_1.DebugLogger.AdapterInfo("initializeRequest!");
        //设置Debug能力
        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = true;
        //后面可以支持Hovers显示值
        response.body.supportsEvaluateForHovers = true; //悬停请求变量的值
        response.body.supportsStepBack = false; //back按钮
        response.body.supportsSetVariable = true; //修改变量的值
        response.body.supportsFunctionBreakpoints = false;
        response.body.supportsConditionalBreakpoints = true;
        response.body.supportsHitConditionalBreakpoints = true;
        response.body.supportsLogPoints = true;
        // response.body.supportsRestartRequest = false;
        // response.body.supportsRestartFrame = false;     
        this.sendResponse(response);
    }
    /**
     * configurationDone后通知launchRequest
     */
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        this._configurationDone.notify();
    }
    /**
     * Attach 模式初始化代码
     */
    attachRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._configurationDone.wait(1000);
            this.initProcess(response, args);
            this.sendResponse(response);
        });
    }
    /**
     * Launch 模式初始化代码
     */
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._configurationDone.wait(1000);
            this.initProcess(response, args);
            this.sendResponse(response);
        });
    }
    copyAttachConfig(args) {
        if (args.tag === "attach") {
            if (args.rootFolder) {
                // 把launch中的配置拷贝到attach. 判断attach中是否有，如果有的话不再覆盖，没有的话覆盖。 
                let settings = visualSetting_1.VisualSetting.readLaunchjson(args.rootFolder);
                for (const launchValue of settings.configurations) {
                    if (launchValue["tag"] === "normal" || launchValue["name"] === "LuaPanda") {
                        for (const key in launchValue) {
                            if (key === "name" || key === "program" || args[key]) {
                                continue;
                            }
                            if (key === "cwd") {
                                args[key] = launchValue[key].replace(/\${workspaceFolder}/, args.rootFolder);
                                continue;
                            }
                            args[key] = launchValue[key];
                        }
                    }
                }
            }
        }
        return args;
    }
    initProcess(response, args) {
        //1. 配置初始化信息
        let os = require("os");
        let path = require("path");
        this.copyAttachConfig(args);
        this.VSCodeAsClient = args.VSCodeAsClient;
        this.connectionIP = args.connectionIP;
        this.TCPPort = args.connectionPort;
        this._pathManager.CWD = args.cwd;
        this._pathManager.rootFolder = args.rootFolder;
        this._pathManager.useAutoPathMode = !!args.autoPathMode;
        this._pathManager.pathCaseSensitivity = !!args.pathCaseSensitivity;
        this._dbCheckBreakpoint = !!args.dbCheckBreakpoint;
        this._VSCodeExtensionPath = args.VSCodeExtensionPath;
        if (this._pathManager.useAutoPathMode === true) {
            tools_1.Tools.rebuildAcceptExtMap(args.luaFileExtension);
            // 判断 args.cwd 是否存在， 如果不存在给出提示，并停止运行
            let isCWDExist = fs.existsSync(args.cwd);
            if (!isCWDExist) {
                vscode.window.showErrorMessage("[Error] launch.json 文件中 cwd 指向的路径 " + args.cwd + " 不存在，请修改后再次运行！", "好的");
                return;
            }
            this._pathManager.rebuildWorkspaceNamePathMap(args.cwd);
            this._pathManager.checkSameNameFile(!!args.distinguishSameNameFile);
        }
        let sendArgs = new Array();
        sendArgs["stopOnEntry"] = !!args.stopOnEntry;
        sendArgs["luaFileExtension"] = args.luaFileExtension;
        sendArgs["cwd"] = args.cwd;
        sendArgs["isNeedB64EncodeStr"] = !!args.isNeedB64EncodeStr;
        sendArgs["TempFilePath"] = args.TempFilePath;
        sendArgs["logLevel"] = args.logLevel;
        sendArgs["pathCaseSensitivity"] = args.pathCaseSensitivity;
        sendArgs["OSType"] = os.type();
        sendArgs["clibPath"] = tools_1.Tools.GetClibPathStr(this._VSCodeExtensionPath);
        sendArgs["useCHook"] = args.useCHook;
        sendArgs["adapterVersion"] = String(tools_1.Tools.adapterVersion);
        sendArgs["autoPathMode"] = this._pathManager.useAutoPathMode;
        sendArgs["distinguishSameNameFile"] = !!args.distinguishSameNameFile;
        sendArgs["truncatedOPath"] = String(args.truncatedOPath);
        sendArgs["DevelopmentMode"] = String(args.DevelopmentMode);
        tools_1.Tools.developmentMode = args.DevelopmentMode;
        console.log("ok");
        console.log(tools_1.Tools.VSCodeExtensionPath);
        if (args.docPathReplace instanceof Array && args.docPathReplace.length === 2) {
            this.replacePath = new Array(tools_1.Tools.genUnifiedPath(String(args.docPathReplace[0])), tools_1.Tools.genUnifiedPath(String(args.docPathReplace[1])));
        }
        else {
            this.replacePath = null;
        }
        this.autoReconnect = args.autoReconnect;
        //2. 初始化内存分析状态栏
        //StatusBarManager.reset();
        if (this.VSCodeAsClient) {
            // VSCode = Client ; Debugger = Server
            this.printLogInDebugConsole("[Connecting] 调试器 VSCode Client 已启动，正在尝试连接。  TargetName:" + args.name + " Port:" + args.connectionPort);
            this.startClient(sendArgs);
        }
        else {
            this.printLogInDebugConsole("[Listening] 调试器 VSCode Server 已启动，正在等待连接。  TargetName:" + args.name + " Port:" + args.connectionPort);
            this.startServer(sendArgs);
        }
        this.breakpointsArray = new Array();
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent()); //收到返回后，执行setbreakpoint
        //单文件调试模式。
        if (args.name === 'LuaHelper-DebugFile') {
            // 获取活跃窗口
            let retObject = tools_1.Tools.getVSCodeAvtiveFilePath();
            if (retObject["retCode"] !== 0) {
                logManager_1.DebugLogger.DebuggerInfo(retObject["retMsg"]);
                return;
            }
            let filePath = retObject["filePath"];
            if (this._debugFileTermianl) {
                this._debugFileTermianl.dispose();
            }
            this._debugFileTermianl = vscode.window.createTerminal({
                name: "Debug Lua File (LuaPanda)",
                env: {},
            });
            // 把路径加入package.path
            let pathCMD = "'";
            let pathArr = this._VSCodeExtensionPath.split(path.sep);
            let stdPath = pathArr.join('/');
            pathCMD = pathCMD + stdPath + "/debugger/?.lua;";
            pathCMD = pathCMD + args.packagePath.join(';');
            pathCMD = pathCMD + "'";
            let luaPathStr = "";
            if (args.luaPath && args.luaPath !== '') {
                luaPathStr = args.luaPath;
            }
            let luaPath = new luaPath_1.LuaPath();
            let strVect = luaPath.GetLuaExeCpathStr(luaPathStr, this._VSCodeExtensionPath);
            // 路径socket的路径加入到package.cpath中
            let cpathCMD = "'";
            //cpathCMD = cpathCMD + stdPath + GetLuasocketPath();
            cpathCMD = cpathCMD + args.packagePath.join(';');
            cpathCMD = cpathCMD + strVect[1] + ";";
            cpathCMD = cpathCMD + "'";
            cpathCMD = " package.cpath = " + cpathCMD + ".. package.cpath; ";
            //拼接命令
            pathCMD = " \"package.path = " + pathCMD + ".. package.path; ";
            let reqCMD = "require('LuaPanda').start('127.0.0.1'," + this.TCPPort + ");\" ";
            let doFileCMD = filePath;
            let runCMD = pathCMD + cpathCMD + reqCMD + doFileCMD;
            let LuaCMD = strVect[0] + " -e ";
            this._debugFileTermianl.sendText(LuaCMD + runCMD, true);
            this._debugFileTermianl.show();
        }
        else {
            // 非单文件调试模式下，拉起program
            if (args.program != undefined && args.program.trim() != '') {
                if (fs.existsSync(args.program) && fs.statSync(args.program).isFile()) {
                    //program 和 args 分开
                    if (this._programTermianl) {
                        this._programTermianl.dispose();
                    }
                    this._programTermianl = vscode.window.createTerminal({
                        name: "Run Program File (LuaPanda)",
                        env: {},
                    });
                    let progaamCmdwithArgs = '"' + args.program + '"';
                    if (os.type() === "Windows_NT") {
                        progaamCmdwithArgs = '& ' + progaamCmdwithArgs;
                    }
                    for (const arg of args.args) {
                        progaamCmdwithArgs = progaamCmdwithArgs + " " + arg;
                    }
                    this._programTermianl.sendText(progaamCmdwithArgs, true);
                    this._programTermianl.show();
                }
                else {
                    let progError = "[Warning] 配置文件 launch.json 中的 program 路径有误: \n";
                    progError += " + program 配置项的作用是，在调试器开始运行时拉起一个可执行文件（注意不是lua文件）。";
                    progError += "如无需此功能，建议 program 设置为 \"\" 或从 launch.json 中删除 program 项。\n";
                    progError += " + 当前设置的 " + args.program + " 不存在或不是一个可执行文件。";
                    this.printLogInDebugConsole(progError);
                }
            }
        }
    }
    startServer(sendArgs) {
        this.connectionFlag = false;
        //3. 启动Adapter的socket   |   VSCode = Server ; Debugger = Client
        this._server = Net.createServer(socket => {
            //--connect--
            this._dataProcessor._socket = socket;
            //向debugger发送含配置项的初始化协议
            this._runtime.start((_, info) => {
                //之所以使用 connectionFlag 连接成功标志位， 是因为代码进入 Net.createServer 的回调后，仍然可能被client超时断开连接。所以标志位被放入了
                //_runtime.start 初始化消息发送成功之后。
                this.connectionFlag = true;
                this._server.close(); //_server 已建立连接，不再接受新的连接
                let connectMessage = "[Connected] VSCode Server 已建立连接! Remote device info  " + socket.remoteAddress + ":" + socket.remotePort;
                logManager_1.DebugLogger.AdapterInfo(connectMessage);
                this.printLogInDebugConsole(connectMessage);
                this.printLogInDebugConsole("[Tips] 当停止在断点处时，可在调试控制台输入要观察变量或执行表达式. ");
                if (info.UseLoadstring === "1") {
                    this.UseLoadstring = true;
                }
                else {
                    this.UseLoadstring = false;
                }
                if (info.isNeedB64EncodeStr === "true") {
                    this._dataProcessor.isNeedB64EncodeStr = true;
                }
                else {
                    this._dataProcessor.isNeedB64EncodeStr = false;
                }
                if (info.UseHookLib === "1") { }
                //已建立连接，并完成初始化
                //发送断点信息
                for (let bkMap of this.breakpointsArray) {
                    this._runtime.setBreakPoint(bkMap.bkPath, bkMap.bksArray, null, null);
                }
            }, sendArgs);
            //--connect end--
            socket.on('end', () => {
                logManager_1.DebugLogger.AdapterInfo('socket end');
            });
            socket.on('close', () => {
                if (this.connectionFlag) {
                    this.connectionFlag = false;
                    logManager_1.DebugLogger.AdapterInfo('Socket close!');
                    vscode.window.showInformationMessage('[LuaPanda] 调试器已断开连接');
                    // this._dataProcessor._socket 是在建立连接后赋值，所以在断开连接时删除
                    delete this._dataProcessor._socket;
                    this.sendEvent(new vscode_debugadapter_1.TerminatedEvent(this.autoReconnect));
                }
            });
            socket.on('data', (data) => {
                logManager_1.DebugLogger.AdapterInfo('[Get Msg]:' + data);
                this._dataProcessor.processMsg(data.toString());
            });
        }).listen(this.TCPPort, 0, function () {
            logManager_1.DebugLogger.AdapterInfo("listening...");
            logManager_1.DebugLogger.DebuggerInfo("listening...");
        });
    }
    startClient(sendArgs) {
        // 循环发送connect请求，每次请求持续1s。 
        // 停止循环的时机 :  1建立连接后 2未建立连接，但是用户点击VScode stop按钮
        this.connectInterval = setInterval(begingConnect, 1000, this);
        function begingConnect(instance) {
            instance._client = Net.createConnection(instance.TCPPort, instance.connectionIP);
            //设置超时时间
            instance._client.setTimeout(800);
            instance._client.on('connect', () => {
                clearInterval(instance.connectInterval); //连接后清除循环请求
                instance._dataProcessor._socket = instance._client;
                instance._runtime.start((_, info) => {
                    let connectMessage = "[Connected] VSCode Client 已建立连接!";
                    logManager_1.DebugLogger.AdapterInfo(connectMessage);
                    instance.printLogInDebugConsole(connectMessage);
                    instance.printLogInDebugConsole("[Tips] 当停止在断点处时，可在调试控制台输入要观察变量或执行表达式.");
                    //已建立连接，并完成初始化
                    if (info.UseLoadstring === "1") {
                        instance.UseLoadstring = true;
                    }
                    else {
                        instance.UseLoadstring = false;
                    }
                    if (info.isNeedB64EncodeStr === "true") {
                        instance._dataProcessor.isNeedB64EncodeStr = true;
                    }
                    else {
                        instance._dataProcessor.isNeedB64EncodeStr = false;
                    }
                    if (info.UseHookLib === "1") { }
                    //已建立连接，并完成初始化
                    //发送断点信息
                    for (let bkMap of instance.breakpointsArray) {
                        instance._runtime.setBreakPoint(bkMap.bkPath, bkMap.bksArray, null, null);
                    }
                }, sendArgs);
            });
            instance._client.on('end', () => {
                // VScode client 主动发起断开连接
                logManager_1.DebugLogger.AdapterInfo("client end");
                vscode.window.showInformationMessage('[LuaPanda] 调试器已断开连接');
                // this._dataProcessor._socket 是在建立连接后赋值，所以在断开连接时删除
                delete instance._dataProcessor._socket;
                instance.sendEvent(new vscode_debugadapter_1.TerminatedEvent(instance.autoReconnect));
            });
            instance._client.on('close', () => {
                // 可能是连接后断开，也可能是超时关闭socket
                // DebugLogger.AdapterInfo('client close!');
            });
            //接收消息
            instance._client.on('data', (data) => {
                logManager_1.DebugLogger.AdapterInfo('[Get Msg]:' + data);
                instance._dataProcessor.processMsg(data.toString());
            });
        }
    }
    /**
     * VSCode -> Adapter 设置(删除)断点
     */
    setBreakPointsRequest(response, args) {
        logManager_1.DebugLogger.AdapterInfo('setBreakPointsRequest');
        let path = args.source.path;
        path = tools_1.Tools.genUnifiedPath(path);
        if (this.replacePath && this.replacePath.length === 2) {
            path = path.replace(this.replacePath[1], this.replacePath[0]);
        }
        let vscodeBreakpoints = new Array(); //VScode UI识别的断点（起始行号1）
        args.breakpoints.map(bp => {
            const id = this._runtime.getBreakPointId();
            let breakpoint; // 取出args中的断点并判断类型。
            if (bp.condition) {
                breakpoint = new breakpoint_1.ConditionBreakpoint(true, bp.line, bp.condition, id);
            }
            else if (bp.logMessage) {
                breakpoint = new breakpoint_1.LogPoint(true, bp.line, bp.logMessage, id);
            }
            else {
                breakpoint = new breakpoint_1.LineBreakpoint(true, bp.line, id);
            }
            vscodeBreakpoints.push(breakpoint);
        });
        response.body = {
            breakpoints: vscodeBreakpoints
        };
        // 更新记录数据中的断点
        if (this.breakpointsArray == undefined) {
            this.breakpointsArray = new Array();
        }
        let isbkPathExist = false; //断点路径已经存在于断点列表中
        for (let bkMap of this.breakpointsArray) {
            if (bkMap.bkPath === path) {
                bkMap["bksArray"] = vscodeBreakpoints;
                isbkPathExist = true;
            }
        }
        if (!isbkPathExist) {
            let bk = new Object();
            bk["bkPath"] = path;
            bk["bksArray"] = vscodeBreakpoints;
            this.breakpointsArray.push(bk);
        }
        if (this._dataProcessor._socket) {
            //已建立连接
            let callbackArgs = new Array();
            callbackArgs.push(this);
            callbackArgs.push(response);
            this._runtime.setBreakPoint(path, vscodeBreakpoints, function (arr) {
                logManager_1.DebugLogger.AdapterInfo("确认断点");
                let ins = arr[0];
                ins.sendResponse(arr[1]); //在收到debugger的返回后，通知VSCode, VSCode界面的断点会变成已验证
            }, callbackArgs);
        }
        else {
            //未连接，直接返回
            this.sendResponse(response);
        }
    }
    /**
     * 断点的堆栈追踪
     */
    stackTraceRequest(response, args) {
        const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
        const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
        const endFrame = startFrame + maxLevels;
        const stk = this._runtime.stack(startFrame, endFrame);
        response.body = {
            stackFrames: stk.frames.map(f => {
                let source = f.file;
                if (this.replacePath && this.replacePath.length === 2) {
                    source = source.replace(this.replacePath[0], this.replacePath[1]);
                }
                return new vscode_debugadapter_1.StackFrame(f.index, f.name, this.createSource(source), f.line);
            }),
            totalFrames: stk.count
        };
        this.sendResponse(response);
    }
    /**
     * 监控的变量
     */
    evaluateRequest(response, args) {
        //watch -- 监视窗口
        if (args.context == "watch" || args.context == "hover") {
            let callbackArgs = new Array();
            callbackArgs.push(this);
            callbackArgs.push(response);
            //把B["A"] ['A'] => B.A形式
            if (this.UseLoadstring == false) {
                let watchString = args.expression;
                watchString = watchString.replace(/\[/g, ".");
                watchString = watchString.replace(/\"/g, "");
                watchString = watchString.replace(/\'/g, "");
                watchString = watchString.replace(/]/g, "");
                args.expression = watchString;
            }
            this._runtime.getWatchedVariable((arr, info) => {
                if (info.length === 0) {
                    //没有查到
                    arr[1].body = {
                        result: '未能查到变量的值',
                        type: 'string',
                        variablesReference: 0
                    };
                }
                else {
                    arr[1].body = {
                        result: info[0].value,
                        type: info[0].type,
                        variablesReference: parseInt(info[0].variablesReference)
                    };
                }
                let ins = arr[0]; //第一个参数是实例
                ins.sendResponse(arr[1]); //第二个参数是response
            }, callbackArgs, args.expression, args.frameId);
        }
        else if (args.context == "repl") {
            //repl -- 调试控制台
            let callbackArgs = new Array();
            callbackArgs.push(this);
            callbackArgs.push(response);
            this._runtime.getREPLExpression((arr, info) => {
                if (info.length === 0) {
                    //没有查到
                    arr[1].body = {
                        result: 'nil',
                        variablesReference: 0
                    };
                }
                else {
                    arr[1].body = {
                        result: info[0].value,
                        type: info[0].type,
                        variablesReference: parseInt(info[0].variablesReference)
                    };
                }
                let ins = arr[0];
                ins.sendResponse(arr[1]);
            }, callbackArgs, args.expression, args.frameId);
        }
        else {
            this.sendResponse(response);
        }
    }
    /**
     * 在变量大栏目中列举出的种类
     */
    scopesRequest(response, args) {
        const frameReference = args.frameId;
        const scopes = new Array();
        //local 10000,  global 20000, upvalue 30000
        scopes.push(new vscode_debugadapter_1.Scope("Local", this._variableHandles.create("10000_" + frameReference), false));
        scopes.push(new vscode_debugadapter_1.Scope("Global", this._variableHandles.create("20000_" + frameReference), true));
        scopes.push(new vscode_debugadapter_1.Scope("UpValue", this._variableHandles.create("30000_" + frameReference), false));
        response.body = {
            scopes: scopes
        };
        this.sendResponse(response);
    }
    /**
     * 设置变量的值
     */
    setVariableRequest(response, args) {
        let callbackArgs = new Array();
        callbackArgs.push(this);
        callbackArgs.push(response);
        let referenceString = this._variableHandles.get(args.variablesReference);
        let referenceArray = [];
        if (referenceString != null) {
            referenceArray = referenceString.split('_');
            if (referenceArray.length < 2) {
                logManager_1.DebugLogger.AdapterInfo("[variablesRequest Error] #referenceArray < 2 , #referenceArray = " + referenceArray.length);
                this.sendResponse(response);
                return;
            }
        }
        else {
            //_variableHandles 取不到的情况下 referenceString 即为真正的变量 ref
            referenceArray[0] = String(args.variablesReference);
        }
        this._runtime.setVariable((arr, info) => {
            if (info.success === "true") {
                arr[1].body = {
                    value: String(info.value),
                    type: String(info.type),
                    variablesReference: parseInt(info.variablesReference)
                };
                logManager_1.DebugLogger.showTips(info.tip);
            }
            else {
                logManager_1.DebugLogger.showTips("变量赋值失败 [" + info.tip + "]");
            }
            let ins = arr[0];
            ins.sendResponse(arr[1]);
        }, callbackArgs, args.name, args.value, parseInt(referenceArray[0]), parseInt(referenceArray[1]));
    }
    /**
     * 变量信息   断点的信息应该完全用一条协议单独发，因为点开Object，切换堆栈都需要单独请求断点信息
     */
    variablesRequest(response, args) {
        let callbackArgs = new Array();
        callbackArgs.push(this);
        callbackArgs.push(response);
        let referenceString = this._variableHandles.get(args.variablesReference);
        let referenceArray = [];
        if (referenceString != null) {
            referenceArray = referenceString.split('_');
            if (referenceArray.length < 2) {
                logManager_1.DebugLogger.AdapterInfo("[variablesRequest Error] #referenceArray < 2 , #referenceArray = " + referenceArray.length);
                this.sendResponse(response);
                return;
            }
        }
        else {
            //_variableHandles 取不到的情况下 referenceString 即为真正的变量ref
            referenceArray[0] = String(args.variablesReference);
        }
        this._runtime.getVariable((arr, info) => {
            if (info == undefined) {
                info = new Array();
            }
            const variables = new Array();
            info.forEach(element => {
                variables.push({
                    name: element.name,
                    type: element.type,
                    value: element.value,
                    variablesReference: parseInt(element.variablesReference)
                });
            });
            arr[1].body = {
                variables: variables
            };
            let ins = arr[0];
            ins.sendResponse(arr[1]);
        }, callbackArgs, parseInt(referenceArray[0]), parseInt(referenceArray[1]));
    }
    /**
     * continue 执行
     */
    continueRequest(response, args) {
        let callbackArgs = new Array();
        callbackArgs.push(this);
        callbackArgs.push(response);
        this._runtime.continue(arr => {
            logManager_1.DebugLogger.AdapterInfo("确认继续运行");
            let ins = arr[0];
            ins.sendResponse(arr[1]);
        }, callbackArgs);
    }
    /**
     * step 单步执行
     */
    nextRequest(response, args) {
        let callbackArgs = new Array();
        callbackArgs.push(this);
        callbackArgs.push(response);
        this._runtime.step(arr => {
            logManager_1.DebugLogger.AdapterInfo("确认单步");
            let ins = arr[0];
            ins.sendResponse(arr[1]);
        }, callbackArgs);
    }
    /**
     * step in
     */
    stepInRequest(response, args) {
        let callbackArgs = new Array();
        callbackArgs.push(this);
        callbackArgs.push(response);
        this._runtime.step(arr => {
            logManager_1.DebugLogger.AdapterInfo("确认StepIn");
            let ins = arr[0];
            ins.sendResponse(arr[1]);
        }, callbackArgs, 'stopOnStepIn');
    }
    /**
     * step out
     */
    stepOutRequest(response, args) {
        let callbackArgs = new Array();
        callbackArgs.push(this);
        callbackArgs.push(response);
        this._runtime.step(arr => {
            logManager_1.DebugLogger.AdapterInfo("确认StepOut");
            let ins = arr[0];
            ins.sendResponse(arr[1]);
        }, callbackArgs, 'stopOnStepOut');
    }
    /**
     * pause 暂不支持
     */
    pauseRequest(response, args) {
        vscode.window.showInformationMessage('pauseRequest!');
    }
    /**
     * 断开和lua的连接
     * 关闭连接的调用顺序 停止连接时的公共方法要放入 disconnectRequest.
     * 未建立连接 : disconnectRequest
     * 当VScode主动停止连接 : disconnectRequest - > socket end -> socket close
     * 当lua进程主动停止连接 : socket end -> socket close -> disconnectRequest
     */
    disconnectRequest(response, args) {
        let disconnectMessage = "[Disconnect Request] 调试器已断开连接.";
        logManager_1.DebugLogger.AdapterInfo(disconnectMessage);
        this.printLogInDebugConsole(disconnectMessage);
        let restart = args.restart;
        if (this.VSCodeAsClient) {
            clearInterval(this.connectInterval); // 在未建立连接的情况下清除循环
            this._client.end(); // 结束连接
        }
        else {
            // 给lua发消息，让lua client停止运行
            let callbackArgs = new Array();
            callbackArgs.push(restart);
            this._runtime.stopRun(arr => {
                //客户端主动断开连接，这里仅做确认
                logManager_1.DebugLogger.AdapterInfo("确认stop");
            }, callbackArgs, 'stopRun');
            this._server.close(); // 关闭 server, 停止 listen. 放在这里的原因是即使未建立连接，也可以停止listen.
        }
        // 删除自身的线程id, 并从LuaDebugSession实例列表中删除自身
        this._threadManager.destructor();
        LuaDebugSession._debugSessionArray.delete(this._threadManager.CUR_THREAD_ID);
        this.sendResponse(response);
    }
    restartRequest(response, args) {
        logManager_1.DebugLogger.AdapterInfo("restartRequest");
    }
    restartFrameRequest(response, args) {
        logManager_1.DebugLogger.AdapterInfo("restartFrameRequest");
    }
    createSource(filePath) {
        return new vscode_debugadapter_1.Source((0, path_1.basename)(filePath), this.convertDebuggerPathToClient(filePath), undefined, undefined, undefined);
    }
    threadsRequest(response) {
        response.body = {
            threads: [
                new vscode_debugadapter_1.Thread(this._threadManager.CUR_THREAD_ID, "thread " + this._threadManager.CUR_THREAD_ID)
            ]
        };
        this.sendResponse(response);
    }
    LuaGarbageCollect() {
        this._runtime.luaGarbageCollect();
    }
}
exports.LuaDebugSession = LuaDebugSession;
//保存所有活动的LuaDebugSession实例
LuaDebugSession._debugSessionArray = new Map();
//# sourceMappingURL=luaDebug.js.map