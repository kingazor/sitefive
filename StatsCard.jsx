import React from "react";

export default function StatsCard({ title, value, icon: Icon, color }) {
  const getColorClasses = (color) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      yellow: "text-yellow-600",
      purple: "text-purple-600",
      red: "text-red-600"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="neumorphic rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="neumorphic-inset rounded-xl p-3">
          <Icon className={`w-6 h-6 ${getColorClasses(color)}`} />
        </div>
      </div>
    </div>
  );
}