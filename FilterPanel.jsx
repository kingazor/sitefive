import React from "react";
import { Star } from "lucide-react";

export default function FilterPanel({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="neumorphic rounded-2xl p-6 space-y-6">
      <h3 className="font-semibold text-gray-800">Filtros</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
          >
            <option value="all">Todas</option>
            <option value="roleplay">Roleplay</option>
            <option value="freeroam">Freeroam</option>
            <option value="racing">Racing</option>
            <option value="deathmatch">Deathmatch</option>
            <option value="cops_robbers">Cops & Robbers</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        {/* Min Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avaliação Mínima
          </label>
          <select
            value={filters.minRating}
            onChange={(e) => handleFilterChange("minRating", parseFloat(e.target.value))}
            className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
          >
            <option value={0}>Qualquer</option>
            <option value={1}>1+ estrelas</option>
            <option value={2}>2+ estrelas</option>
            <option value={3}>3+ estrelas</option>
            <option value={4}>4+ estrelas</option>
            <option value={5}>5 estrelas</option>
          </select>
        </div>

        {/* Max Players */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máx. Jogadores
          </label>
          <select
            value={filters.maxPlayers}
            onChange={(e) => handleFilterChange("maxPlayers", parseInt(e.target.value))}
            className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
          >
            <option value={0}>Qualquer</option>
            <option value={32}>Até 32</option>
            <option value={64}>Até 64</option>
            <option value={128}>Até 128</option>
            <option value={256}>Até 256</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.isActive}
            onChange={(e) => handleFilterChange("isActive", e.target.value === "true")}
            className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
          >
            <option value={true}>Apenas Online</option>
            <option value={false}>Todos</option>
          </select>
        </div>
      </div>
    </div>
  );
}