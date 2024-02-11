"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptions = void 0;
const model_1 = require("./model");
function parseOptions(conf) {
    return {
        autoComplete: parseAutoCompletes(conf),
        replaces: parseReplaces(conf)
    };
}
exports.parseOptions = parseOptions;
function parseAutoCompletes(conf) {
    const c = conf.get('autoComplete');
    const autoCompletes = {};
    model_1.TEMPLATES.forEach(template => autoCompletes[template] = c[template] || false);
    return autoCompletes;
}
function parseReplaces(conf) {
    const style = conf.get('style');
    const usePrivateKeyword = conf.get('usePrivateKeyword');
    const replaces = {};
    // private keyword
    replaces.PRIVATE = usePrivateKeyword ? 'private ' : '';
    // indentation style
    if (style === 'allman') {
        replaces.LINE_BREAK = '",\n\t\t\t"';
        replaces.TAB = '\\t';
    }
    else if (style === 'kr') {
        replaces.LINE_BREAK = ' ';
        replaces.TAB = '';
    }
    else {
        throw new Error(`Invalid style: ${style}`);
    }
    return replaces;
}
//# sourceMappingURL=options.js.map