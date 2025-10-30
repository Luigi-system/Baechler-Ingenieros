"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Icons_1 = require("../ui/Icons");
var CompanyList_1 = require("./companies/CompanyList");
var PlantList_1 = require("./plants/PlantList");
var MachineList_1 = require("./machines/MachineList");
var SupervisorList_1 = require("./supervisors/SupervisorList");
var Management = function () {
    var _a = (0, react_1.useState)('companies'), activeTab = _a[0], setActiveTab = _a[1];
    var tabs = [
        { id: 'companies', label: 'Empresas', icon: Icons_1.BuildingIcon },
        { id: 'plants', label: 'Plantas / Sedes', icon: Icons_1.IndustryIcon },
        { id: 'machines', label: 'Máquinas', icon: Icons_1.CogIcon },
        { id: 'supervisors', label: 'Encargados', icon: Icons_1.UserCircleIcon },
    ];
    var renderContent = function () {
        switch (activeTab) {
            case 'companies':
                return <CompanyList_1.default />;
            case 'plants':
                return <PlantList_1.default />;
            case 'machines':
                return <MachineList_1.default />;
            case 'supervisors':
                return <SupervisorList_1.default />;
            default:
                return null;
        }
    };
    return (<div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión</h2>
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
exports.default = Management;
