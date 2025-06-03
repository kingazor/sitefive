
import React, { useState } from "react";
import { Users, Star, Globe, MessageCircle, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RatingStars from "./RatingStars";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function ServerCard({ server }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const getStatusColor = () => {
    if (!server.is_active) return "text-red-500";
    if (server.current_players >= server.max_players * 0.8) return "text-red-500";
    if (server.current_players >= server.max_players * 0.5) return "text-yellow-500";
    return "text-green-500";
  };

  const getCategoryColor = (category) => {
    const colors = {
      roleplay: "bg-blue-100 text-blue-700",
      freeroam: "bg-green-100 text-green-700",
      racing: "bg-red-100 text-red-700",
      deathmatch: "bg-purple-100 text-purple-700",
      cops_robbers: "bg-orange-100 text-orange-700",
      outros: "bg-gray-100 text-gray-700"
    };
    return colors[category] || colors.outros;
  };

  return (
    <TooltipProvider>
      <div className="neumorphic neumorphic-hover rounded-2xl overflow-hidden transition-all duration-300">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-gray-300 to-gray-400">
          {server.banner_url && (
            <img
              src={server.banner_url}
              alt={server.name}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Status Indicator */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-2 neumorphic rounded-full px-3 py-1 text-xs font-medium ${getStatusColor()}`}>
              <Activity className="w-3 h-3" />
              {server.is_active ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 neumorphic neumorphic-active rounded-full p-2"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {server.logo_url && (
              <img
                src={server.logo_url}
                alt={server.name}
                className="w-12 h-12 rounded-xl object-cover neumorphic"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-lg truncate">
                {server.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(server.category)}`}>
                  {server.category}
                </span>
                <RatingStars rating={server.rating_average} size="sm" />
                <span className="text-xs text-gray-500">
                  ({server.rating_count})
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-3">
            {server.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="neumorphic-inset rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="font-semibold">
                  {server.current_players}/{server.max_players}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Jogadores</p>
            </div>
            
            <div className="neumorphic-inset rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Activity className="w-4 h-4" />
                <span className="font-semibold">{server.uptime}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Uptime</p>
            </div>
          </div>

          {/* Tags */}
          {server.tags && server.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {server.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 neumorphic-inset rounded-full text-gray-600"
                >
                  {tag}
                </span>
              ))}
              {server.tags.length > 3 && (
                <span className="text-xs px-2 py-1 neumorphic-inset rounded-full text-gray-500">
                  +{server.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              to={createPageUrl(`ServerDetails?id=${server.id}`)}
              className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-center text-gray-700 font-medium transition-all duration-200"
            >
              Ver Detalhes
            </Link>
            
            <div className="flex gap-2">
              {server.website && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={server.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neumorphic neumorphic-hover neumorphic-active rounded-xl p-3 text-gray-600"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent className="neumorphic rounded-md shadow-lg text-xs">
                    <p>Visitar Website</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {server.discord && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={server.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neumorphic neumorphic-hover neumorphic-active rounded-xl p-3 text-gray-600"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent className="neumorphic rounded-md shadow-lg text-xs">
                    <p>Entrar no Discord</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
