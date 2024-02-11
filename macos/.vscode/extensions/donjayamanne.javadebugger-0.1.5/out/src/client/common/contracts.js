"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isAttachRequestArguments(arg) {
    return arg.remotePort !== undefined;
}
exports.isAttachRequestArguments = isAttachRequestArguments;
var JavaEvaluationResultFlags;
(function (JavaEvaluationResultFlags) {
    JavaEvaluationResultFlags[JavaEvaluationResultFlags["None"] = 0] = "None";
    JavaEvaluationResultFlags[JavaEvaluationResultFlags["Expandable"] = 1] = "Expandable";
    JavaEvaluationResultFlags[JavaEvaluationResultFlags["MethodCall"] = 2] = "MethodCall";
    JavaEvaluationResultFlags[JavaEvaluationResultFlags["SideEffects"] = 4] = "SideEffects";
    JavaEvaluationResultFlags[JavaEvaluationResultFlags["Raw"] = 8] = "Raw";
    JavaEvaluationResultFlags[JavaEvaluationResultFlags["HasRawRepr"] = 16] = "HasRawRepr";
})(JavaEvaluationResultFlags = exports.JavaEvaluationResultFlags || (exports.JavaEvaluationResultFlags = {}));
//# sourceMappingURL=contracts.js.map