import React, { useState, useEffect } from "react";
import { Server, Rating } from "@/entities/all";
import { Star, Users, Activity, TrendingUp } from "lucide-react";
import ServerCard from "../components/ServerCard";
import StatsCard from "../components/StatsCard";

export default function Home() {
  const [servers, setServers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [serversData, ratingsData] = await Promise.all([
        Server.list("-rating_average", 6),
        Rating.list("-created_date", 10)
      ]);
      setServers(serversData);
      setRatings(ratingsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const totalPlayers = servers.reduce((sum, server) => sum + (server.current_players || 0), 0);
  const averageRating = servers.length > 0 
    ? servers.reduce((sum, server) => sum + (server.rating_average || 0), 0) / servers.length 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo ao FiveM Manager
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Descubra os melhores servidores do FiveM, avalie suas experiências e encontre 
          sua comunidade perfeita de roleplay.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Servidores"
          value={servers.length}
          icon={Activity}
          color="blue"
        />
        <StatsCard
          title="Jogadores Online"
          value={totalPlayers}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Avaliação Média"
          value={averageRating.toFixed(1)}
          icon={Star}
          color="yellow"
        />
        <StatsCard
          title="Avaliações Hoje"
          value={ratings.length}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Top Servers */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Servidores em Destaque</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="neumorphic rounded-2xl h-64 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Atividade Recente</h2>
        <div className="neumorphic-inset rounded-2xl p-6">
          {ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.slice(0, 5).map((rating) => (
                <div key={rating.id} className="flex items-center gap-4 p-4 neumorphic rounded-xl">
                  <div className="flex items-center gap-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rating.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">Nova avaliação</p>
                    {rating.comment && (
                      <p className="text-gray-600 text-sm">{rating.comment}</p>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(rating.created_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}