"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.PropertiesProvider = exports.Property = void 0;
const vscode = require("vscode");
const hiddenMembers = [
    'Source', 'className', 'RobloxLocked', 'Parent', 'ClassName', 'Name',
    'ResizeIncrement', 'ResizeableFaces', 'Terrain',
    'Archivable', 'TemporaryLegacyPhysicsSolverOverride', 'PrimaryPart',
    'CurrentCamera', 'Mass', 'CenterOfMass', 'MaxExtents', 'CurrentEditor',
    'IsDifferentFromFileSystem', 'RotVelocity', 'LinkedSource'
];
const terrainShownMembers = [
    'MaterialColors', 'Decoration', 'WaterColor', 'WaterReflectance',
    'WaterTransparency', 'WaterWaveSize', 'WaterWaveSpeed',
    'CollisionGroupId', 'CustomPhysicalProperties'
];
function getClass(api, className) {
    for (let rbxClass of Object.values(api.Classes)) {
        if (rbxClass.Name === className) {
            return rbxClass;
        }
    }
}
function getMember(api, className, memberName) {
    let rbxClass = getClass(api, className);
    if (rbxClass) {
        for (let member of rbxClass.Members) {
            if (member.Name === memberName) {
                return member;
            }
        }
    }
}
function getMembers(api, className) {
    let rbxClass = getClass(api, className);
    if (rbxClass) {
        let members = [];
        for (let member of rbxClass.Members) {
            members.push(member);
        }
        let superClass = getClass(api, rbxClass.Superclass);
        if (superClass) {
            let inherited = getMembers(api, superClass.Name);
            for (let member of inherited) {
                let found = false;
                for (let member2 of members) {
                    if (member2.Name === member.Name) {
                        found = true;
                    }
                }
                if (!found) {
                    members.push(member);
                }
            }
        }
        return members;
    }
    else {
        return [];
    }
}
function getEnum(api, enumName) {
    if (api.Enums) {
        for (let rbxEnum of api.Enums) {
            if (rbxEnum.Name === enumName) {
                return rbxEnum;
            }
        }
    }
}
function getEnumItem(api, enumName, enumValue) {
    let rbxEnum = getEnum(api, enumName);
    if (rbxEnum) {
        for (let rbxEnumItem of rbxEnum.Items) {
            if (rbxEnumItem.Name === enumValue || rbxEnumItem.Value === enumValue) {
                return rbxEnumItem;
            }
        }
    }
}
function getDefaultValue(api, className, memberName) {
    let rbxClass = getClass(api, className);
    let rbxMember = getMember(api, className, memberName);
    if (rbxClass) {
        let defaultValue = rbxMember ? rbxMember.DefaultValue : undefined;
        if (!defaultValue) {
            defaultValue = getDefaultValue(api, rbxClass.Superclass, memberName);
        }
        return defaultValue;
    }
}
class Property extends vscode.TreeItem {
    constructor(label, state, type, value, children, enumString, iconPath) {
        super(label, state);
        this.label = label;
        this.state = state;
        this.type = type;
        this.value = value;
        this.children = children;
        this.enumString = enumString;
        this.iconPath = iconPath;
    }
    get tooltip() {
        return this.description;
    }
    get description() {
        let val = this.value;
        if (val === 'unknown') {
            return `Unknown ${this.type} value`;
        }
        switch (this.type) {
            case 'Color3':
                return `${Math.floor(val[0] * 255)}, ${Math.floor(val[1] * 255)}, ${Math.floor(val[2] * 255)}`;
            case 'Vector2':
                return `${val[0]}, ${val[1]}`;
            case 'Vector3':
                return `${val[0]}, ${val[1]}, ${val[2]}`;
            case 'CFrame':
                return `${val.Position[0]}, ${val.Position[1]}, ${val.Position[2]}, ` +
                    `${val.Orientation[0][0]}, ${val.Orientation[0][1]}, ${val.Orientation[0][2]}, ` +
                    `${val.Orientation[1][0]}, ${val.Orientation[1][1]}, ${val.Orientation[1][2]}, ` +
                    `${val.Orientation[2][0]}, ${val.Orientation[2][1]}, ${val.Orientation[2][2]}`;
            case 'Float32':
            case 'Float64':
            case 'float':
                if (val % 1 === 0) {
                    return `${val}.0`;
                }
                else {
                    return `${Math.floor(val * 1000) / 1000}`;
                }
            case 'Enum':
            case 'EnumValue':
                if (this.enumString) {
                    return 'Enum.' + this.enumString;
                }
            default:
                return val.toString();
        }
    }
}
exports.Property = Property;
class PropertiesProvider {
    constructor(context) {
        this.context = context;
        this.rbxAPI = { Classes: [], Version: 0 };
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    set api(dump) {
        for (let rbxClass of Object.values(dump.api.Classes)) {
            let classDefaults = getClass(dump.defaults, rbxClass.Name);
            if (classDefaults) {
                rbxClass.DefaultProperties = classDefaults.DefaultProperties;
                rbxClass.Members = getMembers(dump.api, rbxClass.Name);
                if (classDefaults.DefaultProperties) {
                    for (let member of rbxClass.Members) {
                        let defaultValue = classDefaults.DefaultProperties[member.Name];
                        if (defaultValue) {
                            member.DefaultValue = defaultValue;
                        }
                    }
                }
            }
        }
        this.rbxAPI = dump.api;
    }
    getTreeItem(item) {
        return item;
    }
    getChildren(item) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            if (((_a = this.currentItem) === null || _a === void 0 ? void 0 : _a.instance.ClassName) === 'DataModel' || !this.currentItem) {
                return resolve([
                //this.noProperties
                ]);
            }
            else if (this.currentItem) {
                let instance = this.currentItem.instance;
                if (item) { // Properties
                    (_b = item.children) === null || _b === void 0 ? void 0 : _b.sort((a, b) => {
                        if (a.label > b.label) {
                            return 1;
                        }
                        else if (a.label < b.label) {
                            return -1;
                        }
                        return 0;
                    });
                    resolve(item.children);
                }
                else { // Categories
                    let categories = {};
                    let inherited = getMembers(this.rbxAPI, instance.ClassName);
                    for (let member of inherited) {
                        let isHidden = false, isDeprecated = false;
                        if (member.Tags) {
                            isHidden = member.Tags.indexOf('Hidden') >= 0;
                            isDeprecated = member.Tags.indexOf('Deprecated') >= 0;
                        }
                        if (!(isHidden || isDeprecated || member.MemberType === 'Function' || member.MemberType === 'Event' || hiddenMembers.indexOf(member.Name) >= 0)) {
                            if (!((instance.ClassName === 'Terrain' && terrainShownMembers.indexOf(member.Name) >= 0) || instance.ClassName !== 'Terrain')) {
                                continue;
                            }
                            let category = categories[member.Category];
                            if (!category) {
                                category = new Property(member.Category, 2, 'Category', '', []);
                                categories[member.Category] = category;
                            }
                            let value = getDefaultValue(this.rbxAPI, instance.ClassName, member.Name);
                            for (let name in instance.Properties) {
                                if (name === member.Name) {
                                    value = instance.Properties[name];
                                }
                            }
                            let enumItemName;
                            {
                                if (((_c = member.ValueType) === null || _c === void 0 ? void 0 : _c.Category) === 'Enum') {
                                    let enumName = (_d = member.ValueType) === null || _d === void 0 ? void 0 : _d.Name;
                                    if (enumName) {
                                        let enumItem = getEnumItem(this.rbxAPI, enumName, (value === null || value === void 0 ? void 0 : value.Value) || 0);
                                        if (enumItem) {
                                            enumItemName = enumName + '.' + enumItem.Name;
                                        }
                                    }
                                }
                            }
                            if (category.children) {
                                if (!value) {
                                    if (member.Name === 'ClassName') {
                                        value = { Type: 'String', Value: instance.ClassName };
                                    }
                                    else if (member.Name === 'Name') {
                                        value = { Type: 'String', Value: instance.Name };
                                    }
                                    else {
                                        let type = (_e = member.ValueType) === null || _e === void 0 ? void 0 : _e.Name;
                                        if (((_f = member.ValueType) === null || _f === void 0 ? void 0 : _f.Category) === 'Enum') {
                                            type = 'Enum.' + type;
                                        }
                                        value = { Type: type || 'unknown', Value: 'unknown' };
                                    }
                                }
                                category.children.push(new Property(member.Name, 0, value.Type, value.Value, undefined, enumItemName));
                            }
                        }
                    }
                    for (let name in categories) {
                        if (((_g = categories[name].children) === null || _g === void 0 ? void 0 : _g.length) === 0) {
                            delete categories[name];
                        }
                    }
                    let children = Object.values(categories);
                    children.sort((a, b) => {
                        if (a.label > b.label) {
                            return 1;
                        }
                        else if (a.label < b.label) {
                            return -1;
                        }
                        return 0;
                    });
                    if (!children.length) {
                        //children.push(this.noProperties);
                    }
                    resolve(children);
                }
            }
        }));
    }
    refresh(item) {
        this.currentItem = item;
        this._onDidChangeTreeData.fire();
    }
}
exports.PropertiesProvider = PropertiesProvider;
function handler(context) {
    const provider = new PropertiesProvider(context);
    vscode.window.createTreeView('rojo-ui.view.properties', {
        treeDataProvider: provider
    });
    return provider;
}
exports.handler = handler;
//# sourceMappingURL=properties.js.map