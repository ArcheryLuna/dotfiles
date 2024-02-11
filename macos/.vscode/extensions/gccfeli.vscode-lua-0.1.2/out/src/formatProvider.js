'use strict';
var path = require('path');
var luaFormatter_1 = require('./luaFormatter');
var LuaFormattingEditProvider = (function () {
    function LuaFormattingEditProvider(context, outputChannel) {
        this.rootDir = context.asAbsolutePath(".");
        this.formatter = new luaFormatter_1.LuaFormatter(outputChannel);
    }
    LuaFormattingEditProvider.prototype.provideDocumentFormattingEdits = function (document, options, token) {
        var fileDir = path.dirname(document.uri.fsPath);
        return this.formatter.formatDocument(this.rootDir, document, options, token);
    };
    return LuaFormattingEditProvider;
}());
exports.LuaFormattingEditProvider = LuaFormattingEditProvider;
//# sourceMappingURL=formatProvider.js.map