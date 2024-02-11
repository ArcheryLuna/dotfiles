# Lua lint for visual studio code

[![Build Status](https://travis-ci.org/satoren/lualint_for_vscode.svg?branch=master)](https://travis-ci.org/satoren/lualint_for_vscode)
[![Build status](https://ci.appveyor.com/api/projects/status/her345kmbtg0htp7/branch/master?svg=true)](https://ci.appveyor.com/project/satoren/lualint-for-vscode/branch/master)



## Features
* Syntax error check
* Support all platforms for Visual Studio Code with no dependency
* Static analyze by [luacheck](https://github.com/mpeterv/luacheck) (default on)

![animation](https://raw.githubusercontent.com/satoren/lualint_for_vscode/master/images/lualint.gif)

## Extension Settings

This extension contributes the following settings:

* `lualint.useLuacheck`: If true use [luacheck](https://github.com/mpeterv/luacheck) more detail analyze. Otherwise syntax error only check.
* `lualint.maxNumberOfReports`: Maximum number of code check reports.

## Known Issues

## Release Notes

### 0.0.5
- add watch .luacheckrc files
- add source name for report
- Exclude first line comment with #
- Fix wrong column with multibyte characters

### 0.0.4
- [luacheck](https://github.com/mpeterv/luacheck) is enabled by default.
- Fixed bug, even if closed the file, the problem messages remained displayed.

### 0.0.2
- Add repositry URL
