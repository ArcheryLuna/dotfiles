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
const url_1 = require("url");
const request_1 = require("./utils/request");
const vscode = require("vscode");
class RojoSession {
    constructor(name, host, port, info) {
        this.name = name;
        this.host = host;
        this.port = port;
        this.info = info;
        this.connected = true;
        this._onUpdated = new vscode.EventEmitter();
        this.onUpdated = this._onUpdated.event;
        this.listen();
    }
    get url() {
        return new url_1.URL(`http://${this.host}:${this.port}/api`);
    }
    read(instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return request_1.default(`${this.url}/read/${instanceId}`);
        });
    }
    write(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return request_1.default({ method: 'POST', uri: `${this.url}/write`, body: body, json: true });
        });
    }
    open(instanceId, body = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return request_1.default({ method: 'POST', uri: `${this.url}/open/${instanceId}`, body: body, json: true });
        });
    }
    listen(cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected) {
                request_1.default({ method: 'GET', uri: `${this.url}/subscribe/${cursor || 0}` }).then(data => {
                    let messageCursor = Number(data.messageCursor);
                    if (messageCursor) {
                        this.listen(messageCursor);
                    }
                    this._onUpdated.fire();
                }).catch(err => {
                    this._onUpdated.fire(err);
                });
            }
        });
    }
    getInstance(instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.read(instanceId).then(data => {
                    if (data.instances) {
                        resolve(data.instances[instanceId]);
                    }
                    else {
                        reject('No instance list received from /api/read/{instanceId}');
                    }
                }).catch(reject);
            });
        });
    }
}
exports.default = RojoSession;
//# sourceMappingURL=session.js.map