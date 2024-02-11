'use strict';
var child_process = require('child_process');
function sendCommand(commandLine, cwd, includeErrorAsResponse) {
    if (includeErrorAsResponse === void 0) { includeErrorAsResponse = false; }
    return new Promise(function (resolve, reject) {
        child_process.exec(commandLine, { cwd: cwd }, function (error, stdout, stderr) {
            if (includeErrorAsResponse) {
                return resolve(stdout + '\n' + stderr);
            }
            var hasErrors = (error && error.message.length > 0) || (stderr && stderr.length > 0);
            if (hasErrors && (typeof stdout !== "string" || stdout.length === 0)) {
                var errorMsg = stderr ? stderr + '' : error.message;
                if (stderr && stderr.length > 0) {
                    var err = void 0;
                    try {
                        err = JSON.parse(stderr);
                    }
                    catch (e) {
                        return reject("Unknown error: \n" + stderr);
                    }
                    return reject(err.Error);
                }
                else {
                    return reject(error.message);
                }
            }
            resolve(stdout + '');
        });
    });
}
exports.sendCommand = sendCommand;
//# sourceMappingURL=childProc.js.map