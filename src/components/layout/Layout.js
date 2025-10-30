"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Sidebar_1 = require("./Sidebar");
var Header_1 = require("./Header");
var Dashboard_1 = require("../dashboard/Dashboard");
var ReportList_1 = require("../reports/ReportList");
var Assistant_1 = require("../assistant/Assistant");
var ReportForm_1 = require("../reports/ReportForm");
var VisitReportForm_1 = require("../reports/VisitReportForm");
var Icons_1 = require("../ui/Icons");
var ChatContext_1 = require("../../contexts/ChatContext");
// Management Components
var CompanyList_1 = require("../management/companies/CompanyList");
var PlantList_1 = require("../management/plants/PlantList");
var MachineList_1 = require("../management/machines/MachineList");
var SupervisorList_1 = require("../management/supervisors/SupervisorList");
// Settings Components
var CustomizationSettings_1 = require("../settings/CustomizationSettings");
var AiSettings_1 = require("../settings/AiSettings");
var DatabaseSettings_1 = require("../settings/DatabaseSettings");
var UserManagement_1 = require("../settings/UserManagement");
var RoleManagement_1 = require("../settings/RoleManagement");
var DataImporter_1 = require("../settings/DataImporter");
var AccessManagement_1 = require("../settings/AccessManagement");
var ProfileSettings_1 = require("../settings/ProfileSettings");
var AgenteSettings_1 = require("../settings/AgenteSettings"); // Import the renamed component
var Layout = function () {
    var _a = (0, react_1.useState)('dashboard'), activePage = _a[0], setActivePage = _a[1];
    var _b = (0, react_1.useState)(null), editingReportId = _b[0], setEditingReportId = _b[1];
    var _c = (0, react_1.useState)(false), isAssistantOpen = _c[0], setIsAssistantOpen = _c[1];
    var _d = (0, ChatContext_1.useChat)(), hasUnreadMessage = _d.hasUnreadMessage, clearUnread = _d.clearUnread;
    var handleOpenAssistant = function () {
        setIsAssistantOpen(true);
        clearUnread();
    };
    var handleCloseAssistant = function () {
        setIsAssistantOpen(false);
    };
    var navigateTo = function (page) {
        setActivePage(page);
        setEditingReportId(null);
    };
    var handleCreateReport = function (type) {
        setActivePage("create-report-".concat(type));
        setEditingReportId(null);
    };
    var handleEditReport = function (id, type) {
        setActivePage("edit-report-".concat(type));
        setEditingReportId(id);
    };
    var renderContent = function () {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard_1.default />;
            // Reports
            case 'reports-service':
                return <ReportList_1.default reportType="service" onCreateReport={function () { return handleCreateReport('service'); }} onEditReport={function (id) { return handleEditReport(id, 'service'); }}/>;
            case 'reports-visit':
                return <VisitReportForm_1.default onBack={function () { return navigateTo('dashboard'); }}/>;
            case 'create-report-service':
                return <ReportForm_1.default onBack={function () { return navigateTo('reports-service'); }}/>;
            case 'edit-report-service':
                // FIX: Converted 'editingReportId' from number to string to match the 'reportId' prop type in ReportForm.
                return <ReportForm_1.default reportId={editingReportId === null || editingReportId === void 0 ? void 0 : editingReportId.toString()} onBack={function () { return navigateTo('reports-service'); }}/>;
            case 'create-report-visit':
                return <VisitReportForm_1.default onBack={function () { return navigateTo('reports-visit'); }}/>;
            case 'edit-report-visit':
                return <VisitReportForm_1.default reportId={editingReportId === null || editingReportId === void 0 ? void 0 : editingReportId.toString()} onBack={function () { return navigateTo('reports-visit'); }}/>;
            // Management Pages
            case 'management-companies':
                return <CompanyList_1.default />;
            case 'management-plants':
                return <PlantList_1.default />;
            case 'management-machines':
                return <MachineList_1.default />;
            case 'management-supervisors':
                return <SupervisorList_1.default />;
            // Settings Pages
            case 'settings-customization':
                return <CustomizationSettings_1.default />;
            case 'settings-ai':
                return <AiSettings_1.default />;
            case 'settings-agente': // Route to AgenteSettings for Agente config
                return <AgenteSettings_1.default />;
            case 'settings-database':
                return <DatabaseSettings_1.default />;
            case 'settings-users':
                return <UserManagement_1.default />;
            case 'settings-roles':
                return <RoleManagement_1.default />;
            case 'settings-access':
                return <AccessManagement_1.default />;
            case 'settings-import':
                return <DataImporter_1.default />;
            case 'settings-profile':
                return <ProfileSettings_1.default />;
            default:
                return <Dashboard_1.default />;
        }
    };
    return (<div className="flex h-screen bg-base-100">
      <Sidebar_1.default activePage={activePage} setActivePage={navigateTo}/>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header_1.default onNavigateToProfile={function () { return navigateTo('settings-profile'); }}/>
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </main>
      
      <button onClick={handleOpenAssistant} className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-focus transition-transform hover:scale-110 z-40" title="Asistente IA">
        <Icons_1.AssistantIcon className="h-8 w-8"/>
         {hasUnreadMessage && (<span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"/>)}
      </button>

      <Assistant_1.default isOpen={isAssistantOpen} onClose={handleCloseAssistant}/>
    </div>);
};
// FIX: Added default export to the Layout component.
exports.default = Layout;
