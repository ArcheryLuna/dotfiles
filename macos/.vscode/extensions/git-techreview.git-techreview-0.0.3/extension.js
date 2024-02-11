// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const cp = require('child_process');
const fs = require('fs');
const path = require("path");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    verifyPandocInstalled();

    // Implements the exportToWord command
    let disposable = vscode.commands.registerCommand('extension.exportToWord', function () {

        // Open folder dialog 
        vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false
            }).then(folders => {
                if(folders !=null & folders.length > 0){
                    convertMDtoDOCX(folders[0].fsPath);
            }
        })     
    });

    // Implements the importToWord command
    let disposable2 = vscode.commands.registerCommand('extension.importToMd', function () {

        // Open folder dialog 
        vscode.window.showOpenDialog({
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: false,
            filters: {'docx': ['docx']}
        }).then(file => {
            if(file !=null & file.length > 0){
                convertDOCXtoMD(file[0].fsPath);
            }
        })
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
}
exports.activate = activate;

// Verify that Pandoc.exe is installed in the required location; warn if not
function verifyPandocInstalled() {
    const env = this.global.process.env;
    fs.stat(env.LOCALAPPDATA + "\\pandoc\\pandoc.exe", (err, stats)=> {
        if(err != null) {
            if(err.code === 'ENOENT'){
            const showInstallPage = "Open GTR Readme";
            vscode.window.showErrorMessage(
                `Pandoc.exe is missing --OR-- not installed in the required location.\n\nThe GTR extension will not work properly in this state.\nSee the "Requirements" section of the GTR Readme for more information.`,
                {modal: true},
                showInstallPage)
                .then((choice) => {
                    if (choice === showInstallPage) {
                        vscode.commands.executeCommand(
                            "markdown.showPreview",
                            vscode.Uri.file(path.resolve(__dirname, "./README.md")));
                    }
                });
            }
            else {
                vscode.window.showErrorMessage(err.message);
            }
        }
        if(stats)
            vscode.window.showInformationMessage(`The Git-TechReview extension is ready for you to use.`);
    });
}

// this method converts MD file to DOCX file
function convertMDtoDOCX(outputLocation) {
    const env = this.global.process.env;
    const bareFilename = vscode.window.activeTextEditor.document.fileName.match(/.*\\(.+?)\./)[1];
    const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    const parameters = "-f markdown -s -o \"" + outputLocation + "\\" + bareFilename + ".docx\" \"" + filePath + "\"";
    const command = env.LOCALAPPDATA + "\\pandoc\\pandoc.exe " + parameters; 

    try{
        cp.exec(command);
    }
    catch (error){
        console.log(error);
    }

    // Display a message box to the user
    vscode.window.showInformationMessage(bareFilename + ' is converted to .docx format and exported to ' + outputLocation + ' folder.');
}
exports.convertMDtoDOCX = convertMDtoDOCX;

// this method converts DOCX file to MD file
function convertDOCXtoMD(importFilePath) {
    const env = this.global.process.env;
    const bareFilename = String(importFilePath).substring(String(importFilePath).lastIndexOf('\\') + 1, String(importFilePath).lastIndexOf('.')) + '.md';
    const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    const parameters = "-s -t gfm -o \"" + filePath.substring(0, filePath.lastIndexOf('\\')) + "\\" + bareFilename + "\" --extract-media=\"" + filePath.substring(0, filePath.lastIndexOf('\\')) + "\" --wrap=preserve --track-changes=accept \"" + importFilePath + "\"";
    const command = env.LOCALAPPDATA + "\\pandoc\\pandoc.exe " + parameters; 

    try{
        cp.exec(command);
    }
    catch (error){
        console.log(error);
    }

    // Display a message box to the user
    vscode.window.showInformationMessage(importFilePath + ' is converted to .md format and added to ' + filePath.substring(0, filePath.lastIndexOf('\\')) + ' folder.');
}
exports.convertDOCXtoMD = convertDOCXtoMD;

// Method called when GTE extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;