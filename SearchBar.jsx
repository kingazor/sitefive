import React from "react";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="neumorphic rounded-2xl p-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full neumorphic-inset rounded-xl pl-12 pr-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
        />
      </div>
    </div>
  );
}