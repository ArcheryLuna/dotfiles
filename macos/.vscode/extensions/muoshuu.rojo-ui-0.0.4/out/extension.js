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
exports.activate = void 0;
const fs = require("fs");
const explorer = require("./views/explorer");
const properties = require("./views/properties");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync(context.globalStoragePath)) {
            fs.mkdirSync(context.globalStoragePath);
        }
        explorer.handler(context, properties.handler(context));
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map