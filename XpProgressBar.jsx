import React from "react";

export default function XpProgressBar({ currentXp, currentLevel, xpForNextLevel }) {
  const progressPercentage = Math.min((currentXp / xpForNextLevel) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Nível {currentLevel}</span>
        <span>{currentXp} / {xpForNextLevel} XP</span>
      </div>
      <div className="w-full neumorphic-inset rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}