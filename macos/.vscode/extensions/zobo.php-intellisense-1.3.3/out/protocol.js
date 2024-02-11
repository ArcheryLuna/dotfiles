"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluatableExpressionRequest = void 0;
const node_1 = require("vscode-languageclient/node");
var EvaluatableExpressionRequest;
(function (EvaluatableExpressionRequest) {
    EvaluatableExpressionRequest.method = 'textDocument/xevaluatableExpression';
    EvaluatableExpressionRequest.type = new node_1.ProtocolRequestType(EvaluatableExpressionRequest.method);
})(EvaluatableExpressionRequest = exports.EvaluatableExpressionRequest || (exports.EvaluatableExpressionRequest = {}));
//# sourceMappingURL=protocol.js.map