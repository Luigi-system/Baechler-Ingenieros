"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var ProgressCircle = function (_a) {
    var percentage = _a.percentage, _b = _a.size, size = _b === void 0 ? 32 : _b, _c = _a.strokeWidth, strokeWidth = _c === void 0 ? 4 : _c;
    var radius = (size - strokeWidth) / 2;
    var circumference = radius * 2 * Math.PI;
    var offset = circumference - (percentage / 100) * circumference;
    var getProgressColor = function () {
        if (percentage < 40)
            return 'text-red-500';
        if (percentage < 80)
            return 'text-yellow-500';
        return 'text-green-500';
    };
    var colorClass = getProgressColor();
    return (<div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size}>
        <circle className="text-gray-200 dark:text-gray-600" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2}/>
        <circle className={"transform -rotate-90 origin-center transition-all duration-500 ".concat(colorClass)} stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2}/>
      </svg>
      <span className="absolute text-xs font-medium text-gray-700 dark:text-gray-200">
        {"".concat(Math.round(percentage), "%")}
      </span>
    </div>);
};
exports.default = ProgressCircle;
