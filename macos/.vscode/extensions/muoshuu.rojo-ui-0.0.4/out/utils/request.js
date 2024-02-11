"use strict";
// All this because request doesn't automatically parse json -_-
Object.defineProperty(exports, "__esModule", { value: true });
const requestPromise = require("request-promise");
const request = requestPromise.defaults({
    transform: (body, res) => {
        try {
            return JSON.parse(body);
        }
        catch (err) {
            return body;
        }
    }
});
exports.default = request;
//# sourceMappingURL=request.js.map