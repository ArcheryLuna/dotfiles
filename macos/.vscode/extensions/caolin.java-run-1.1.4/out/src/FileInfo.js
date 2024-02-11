/**
 * FileInfo
 */
"use strict";
// tslint:disable:typedef
class FileInfo {
    constructor(document) {
        this.init(document.fileName, document.getText());
    }
    // 初始化文件
    init(fullFileName, text) {
        let isUnixLike = fullFileName.startsWith("/"); // 是否unix系统
        let fileNameIndex = isUnixLike ? fullFileName.lastIndexOf("/") : fullFileName.lastIndexOf("\\");
        let fileName = fullFileName.substring(fileNameIndex + 1);
        let folderPath = fullFileName.substring(0, fileNameIndex); // c://tmp
        let className = fileName.substring(0, fileName.indexOf(".java"));
        let rst = /package (.+)?;/.exec(text);
        if (rst && rst.length === 2) {
            this.packageName = rst[1];
        }
        this.fullFileName = fullFileName;
        this.folderPath = folderPath;
        this.fileName = fileName;
        this.className = className;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FileInfo;
//# sourceMappingURL=FileInfo.js.map