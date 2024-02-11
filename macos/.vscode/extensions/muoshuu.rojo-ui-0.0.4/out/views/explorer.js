"use strict";
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
exports.handler = exports.Item = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const req = require("request-promise");
const cheerio = require("cheerio");
const request_1 = require("../utils/request");
const window_1 = require("../utils/window");
const icons_1 = require("../utils/icons");
const session_1 = require("../session");
class Item extends vscode.TreeItem {
    constructor(label, state, instance, session, iconPath, subText = '', contextValue) {
        super(label, state);
        this.label = label;
        this.state = state;
        this.instance = instance;
        this.session = session;
        this.iconPath = iconPath;
        this.subText = subText;
        this.contextValue = contextValue;
        if (this.instance.ClassName === 'DataModel') {
            this.contextValue = 'rojo-ui.sessionContainer';
        }
    }
    get tooltip() {
        return this.instance.ClassName;
    }
    get description() {
        return this.subText;
    }
}
exports.Item = Item;
class ExplorerProvider {
    constructor(context, sessions, meta) {
        this.context = context;
        this.sessions = sessions;
        this.meta = meta;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    getTreeItem(item) {
        var _a;
        item.command = { command: 'rojo-ui.action.open', title: 'Open file', arguments: [item] };
        switch (item.instance.ClassName) {
            case 'ModuleScript':
            case 'LocalScript':
            case 'Script':
                (_a = item.command.arguments) === null || _a === void 0 ? void 0 : _a.push(true);
            default: break;
        }
        return item;
    }
    getChildren(item) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let children = [];
            if (item) {
                for (let childId of item.instance.Children) {
                    let child = yield item.session.getInstance(childId);
                    children.push(new Item(child.Name, child.Children.length > 0 ? 1 : 0, child, item.session, this.getClassIconPath(child.ClassName)));
                }
                let sortOrder = this.meta.sortOrder;
                children.sort((a, b) => {
                    return sortOrder[a.instance.ClassName] - sortOrder[b.instance.ClassName];
                });
            }
            else {
                for (let session of this.sessions) {
                    children.push(new Item(session.name, 2, yield session.getInstance(session.info.rootInstanceId), session, '', session.port.toString()));
                }
            }
            resolve(children);
        }));
    }
    getClassIconPath(className) {
        return this.meta.iconPathIndex[className];
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
function applyCustomIcons(iconPathIndex, dir) {
    if (dir) {
        fs.readdir(dir, (err, files) => {
            if (!err) {
                for (let className in iconPathIndex) {
                    let filePath = path.join(dir, className + '.png');
                    if (fs.existsSync(filePath)) {
                        iconPathIndex[className] = filePath;
                    }
                }
            }
        });
    }
}
function handler(context, propertyProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        let iconPathIndex = yield icons_1.default(context);
        let sortOrder = {};
        let sessions = [];
        applyCustomIcons(iconPathIndex, vscode.workspace.getConfiguration('rojo-ui').get('iconFolder'));
        request_1.default('https://reflection.rbx-api.xyz/v1/all').then((dump) => {
            propertyProvider.api = dump;
            for (let rbxClass of Object.values(dump.api.Classes)) {
                sortOrder[rbxClass.Name] = rbxClass.SortOrder;
            }
            const provider = new ExplorerProvider(context, sessions, {
                rbxAPI: dump.api,
                iconPathIndex: iconPathIndex,
                sortOrder: sortOrder
            });
            vscode.window.createTreeView('rojo-ui.view.explorer', {
                treeDataProvider: provider,
                canSelectMany: true
            });
            let createSession = (name, port, info) => {
                let session = new session_1.default(name, 'localhost', Number(port), info);
                session.onUpdated(err => {
                    if (err) {
                        commands.disconnect({ session: session });
                        window_1.default.showWarning(`Disconnected from project ${session.name} on port ${session.port}`);
                    }
                    provider.refresh();
                });
                return session;
            };
            let validators = {
                name: (str) => {
                    if (!str) {
                        return 'A name must be specified.';
                    }
                    else {
                        let session = sessions.find((s) => { return s.name === str; });
                        if (session) {
                            return `Another project is already using that name.`;
                        }
                    }
                },
                port: (str) => __awaiter(this, void 0, void 0, function* () {
                    let port = Number(str);
                    if (!port || port < 1 || port > 65535) {
                        return 'Invalid port specified.';
                    }
                    else {
                        let session = sessions.find((s) => { return s.port === port; });
                        if (session) {
                            return `${session.name} is already using that port.`;
                        }
                        else {
                            try {
                                yield request_1.default({ uri: `http://localhost:${port}/api/rojo`, timeout: 100 });
                            }
                            catch (err) {
                                return 'Couldn\'t find Rojo on that port.';
                            }
                        }
                    }
                })
            };
            let getProjectName = (body) => {
                return new Promise((resolve, reject) => {
                    let $ = cheerio.load(body);
                    let projectName;
                    $('.stat-name').each((i, element) => {
                        if ($(element).text() === 'Project: ') {
                            projectName = $(element).next().text();
                        }
                    });
                    resolve(projectName);
                });
            };
            let genericMessage = 'Rojo\'s two-way sync API is incomplete.';
            let commands = {
                'connect': (name, port) => __awaiter(this, void 0, void 0, function* () {
                    port = port || (yield window_1.default.showInputBox({ validateInput: validators.port, value: '34872', prompt: 'What port is Rojo listening on?' }));
                    if (port) {
                        req(`http://localhost:${port}`).then((body) => __awaiter(this, void 0, void 0, function* () {
                            let projectName = yield getProjectName(body);
                            name = name || (yield window_1.default.showInputBox({ validateInput: validators.name, prompt: 'What would you like to name the project?', value: projectName }));
                            if (name) {
                                request_1.default(`http://localhost:${port}/api/rojo`).then(info => {
                                    sessions.push(createSession(name, port, info));
                                    provider.refresh();
                                }).catch(err => {
                                    console.error(err);
                                    window_1.default.showError('Couldn\'t connect to Rojo.');
                                });
                            }
                        })).catch(err => {
                            console.error(err);
                            window_1.default.showError('Couldn\'t connect to Rojo.');
                        });
                    }
                }),
                'disconnect': (item) => {
                    var _a;
                    if (((_a = propertyProvider.currentItem) === null || _a === void 0 ? void 0 : _a.session) === item.session) {
                        propertyProvider.refresh();
                    }
                    let index = sessions.indexOf(item.session);
                    if (index >= 0) {
                        sessions.splice(index, 1);
                    }
                    provider.refresh();
                },
                'open': (item, isSourceContainer) => {
                    if (isSourceContainer) {
                        item.session.open(item.instance.Id).catch(err => { });
                    }
                    propertyProvider.refresh(item);
                },
                'rename': (item) => __awaiter(this, void 0, void 0, function* () {
                    if (item.instance.ClassName === 'DataModel') {
                        let name = yield window_1.default.showInputBox({ validateInput: validators.name, value: item.label });
                        if (name) {
                            item.session.name = name;
                            provider.refresh();
                        }
                    }
                    else {
                        window_1.default.showWarning(genericMessage);
                    }
                }),
                'cut': (item) => window_1.default.showWarning(genericMessage),
                'copy': (item) => window_1.default.showWarning(genericMessage),
                'paste': (item) => window_1.default.showWarning(genericMessage),
                'duplicate': (item) => window_1.default.showWarning(genericMessage),
                'delete': (item) => window_1.default.showWarning(genericMessage),
                'group': (item) => window_1.default.showWarning(genericMessage),
                'ungroup': (item) => window_1.default.showWarning(genericMessage),
                'selectChildren': (item) => window_1.default.showWarning(genericMessage),
                'insertInstance': (item) => window_1.default.showWarning(genericMessage),
                'insertFile': (item) => window_1.default.showWarning(genericMessage)
            };
            for (let cmdName in commands) {
                vscode.commands.registerCommand('rojo-ui.action.' + cmdName, commands[cmdName]);
            }
        });
    });
}
exports.handler = handler;
//# sourceMappingURL=explorer.js.map