"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var DatabaseSettings_1 = require("./DatabaseSettings");
var CustomizationSettings_1 = require("./CustomizationSettings");
var UserManagement_1 = require("./UserManagement");
var RoleManagement_1 = require("./RoleManagement");
var DataImporter_1 = require("./DataImporter");
var Icons_1 = require("../ui/Icons");
var Settings = function () {
    var _a = (0, react_1.useState)('customization'), activeTab = _a[0], setActiveTab = _a[1];
    var tabs = [
        { id: 'customization', label: 'Personalización', icon: Icons_1.PaletteIcon },
        { id: 'database', label: 'Base de Datos', icon: Icons_1.DatabaseIcon },
        { id: 'users', label: 'Gestión de Usuarios', icon: Icons_1.UsersIcon },
        { id: 'roles', label: 'Gestión de Roles', icon: Icons_1.ShieldCheckIcon },
        { id: 'import', label: 'Importador', icon: Icons_1.UploadCloudIcon },
    ];
    var renderContent = function () {
        switch (activeTab) {
            case 'database':
                return <DatabaseSettings_1.default />;
            case 'customization':
                return <CustomizationSettings_1.default />;
            case 'users':
                return <UserManagement_1.default />;
            case 'roles':
                return <RoleManagement_1.default />;
            case 'import':
                return <DataImporter_1.default />;
            default:
                return null;
        }
    };
    return (<div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Configuración</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4">
            <ul className="space-y-1">
              {tabs.map(function (tab) { return (<li key={tab.id}>
                    <button onClick={function () { return setActiveTab(tab.id); }} className={"w-full flex items-center p-3 rounded-lg text-left transition-colors ".concat(activeTab === tab.id
                ? 'bg-primary/20 text-primary dark:bg-primary/30 font-semibold'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700')}>
                        <tab.icon className="h-5 w-5 mr-3"/>
                        {tab.label}
                    </button>
                 </li>); })}
            </ul>
        </div>
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>);
};
exports.default = Settings;
