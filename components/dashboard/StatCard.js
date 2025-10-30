"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var StatCard = function (_a) {
    var title = _a.title, value = _a.value, icon = _a.icon, color = _a.color;
    return (<div className="bg-base-200 p-6 rounded-xl shadow-lg flex items-center space-x-4 transform hover:-translate-y-1 transition-transform duration-300">
      <div className={"p-4 rounded-full ".concat(color)}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-neutral">{title}</p>
        <p className="text-2xl font-bold text-base-content">{value}</p>
      </div>
    </div>);
};
exports.default = StatCard;
