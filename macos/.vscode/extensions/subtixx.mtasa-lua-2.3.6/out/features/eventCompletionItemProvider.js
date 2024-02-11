'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var eventProvider = /** @class */ (function () {
    function eventProvider(extensionPath) {
    }
    eventProvider.prototype.provideCompletionItems = function (document, position, token, context) {
        return new Promise(function (resolve, reject) {
            if (context.triggerKind != vscode.CompletionTriggerKind.TriggerCharacter)
                return;
            // ! This is really freaky code.. But works. Would be easier if we would use a language server :(
            var lastCharacter = document.getText(new vscode.Range(new vscode.Position(position.line, position.character - 1), position));
            var offset = 0;
            var parameter = 0;
            // methodName( <-- cursor is here
            if (lastCharacter == "\"")
                offset = 2;
            else {
                // Cursor is maybe somewhere inside the function.
                var line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
                for (var charIndex = line.length; charIndex > 0; charIndex--) {
                    var c = line.charAt(charIndex);
                    if (c != "(") // go back until we hit our parentheses
                        offset++;
                    else // parentheses found, bail out.
                        break;
                }
            }
            var wordRange = document.getWordRangeAtPosition(new vscode.Position(position.line, position.character - offset), /[\w\.]+/);
            if (wordRange == undefined) {
                console.log(":(");
                reject();
                return;
            }
            var word = document.getText(wordRange);
            if (word == undefined) {
                console.log(":(");
                reject();
                return;
            }
            console.log("Gotcha: " + word);
            resolve([]);
        });
    };
    return eventProvider;
}());
exports.eventProvider = eventProvider;
//# sourceMappingURL=eventCompletionItemProvider.js.map