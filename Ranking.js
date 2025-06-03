import React, { useState, useEffect } from "react";
import { User } from "@/entities/all";
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react";

export default function Ranking() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rankingType, setRankingType] = useState("xp");

  useEffect(() => {
    loadRanking();
  }, [rankingType]);

  const loadRanking = async () => {
    setIsLoading(true);
    try {
      let orderBy = "-xp";
      if (rankingType === "level") orderBy = "-level";
      if (rankingType === "coins") orderBy = "-coins";
      
      const usersData = await User.list(orderBy, 50);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
    setIsLoading(false);
  };

  const getRankIcon = (position) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{position}</span>;
  };

  const getRankingValue = (user) => {
    if (rankingType === "xp") return user.xp || 0;
    if (rankingType === "level") return user.level || 1;
    if (rankingType === "coins") return user.coins || 0;
    return 0;
  };

  const getRankingLabel = () => {
    if (rankingType === "xp") return "XP";
    if (rankingType === "level") return "Nível";
    if (rankingType === "coins") return "Moedas";
    return "";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-12 w-64 animate-pulse mx-auto"></div>
        <div className="space-y-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="neumorphic rounded-2xl h-16 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="neumorphic-inset rounded-2xl p-6 inline-block mb-4">
          <TrendingUp className="w-12 h-12 text-blue-600 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Ranking da Comunidade</h1>
        <p className="text-gray-600">Os membros mais ativos da nossa comunidade</p>
      </div>

      {/* Ranking Type Selector */}
      <div className="neumorphic rounded-2xl p-2 flex justify-center gap-2 max-w-md mx-auto">
        {[
          { key: "xp", label: "XP", icon: Star },
          { key: "level", label: "Nível", icon: TrendingUp },
          { key: "coins", label: "Moedas", icon: Trophy }
        ].map(type => (
          <button
            key={type.key}
            onClick={() => setRankingType(type.key)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              rankingType === type.key
                ? "neumorphic-pressed text-blue-600"
                : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="neumorphic rounded-2xl p-8">
          <div className="flex items-end justify-center gap-8">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="neumorphic rounded-2xl p-4 mb-4">
                <div className="w-16 h-16 mx-auto neumorphic-inset rounded-full flex items-center justify-center overflow-hidden mb-3">
                  {users[1].avatar_url ? (
                    <img src={users[1].avatar_url} alt={users[1].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 font-bold text-xl">
                      {users[1].full_name?.charAt(0) || users[1].email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-bold text-gray-800">{users[1].full_name || users[1].nickname || 'Usuário'}</h3>
                <p className="text-gray-600 text-sm">{getRankingValue(users[1])} {getRankingLabel()}</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="neumorphic rounded-2xl p-6 mb-4 transform scale-110">
                <div className="w-20 h-20 mx-auto neumorphic-inset rounded-full flex items-center justify-center overflow-hidden mb-3">
                  {users[0].avatar_url ? (
                    <img src={users[0].avatar_url} alt={users[0].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 font-bold text-2xl">
                      {users[0].full_name?.charAt(0) || users[0].email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-bold text-gray-800 text-lg">{users[0].full_name || users[0].nickname || 'Usuário'}</h3>
                <p className="text-gray-600">{getRankingValue(users[0])} {getRankingLabel()}</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="neumorphic rounded-2xl p-4 mb-4">
                <div className="w-16 h-16 mx-auto neumorphic-inset rounded-full flex items-center justify-center overflow-hidden mb-3">
                  {users[2].avatar_url ? (
                    <img src={users[2].avatar_url} alt={users[2].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 font-bold text-xl">
                      {users[2].full_name?.charAt(0) || users[2].email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-800">{users[2].full_name || users[2].nickname || 'Usuário'}</h3>
                <p className="text-gray-600 text-sm">{getRankingValue(users[2])} {getRankingLabel()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Ranking List */}
      <div className="neumorphic rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Ranking Completo</h2>
        <div className="space-y-3">
          {users.map((user, index) => (
            <div key={user.id} className={`neumorphic-inset rounded-xl p-4 flex items-center gap-4 ${
              index < 3 ? 'border-2 border-yellow-200' : ''
            }`}>
              <div className="flex-shrink-0">
                {getRankIcon(index + 1)}
              </div>
              
              <div className="w-12 h-12 neumorphic-inset rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-bold">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  {user.full_name || user.nickname || 'Usuário'}
                </h3>
                <p className="text-gray-500 text-sm">
                  Nível {user.level || 1} • {user.badges?.length || 0} badges
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-gray-800 text-lg">
                  {getRankingValue(user)}
                </p>
                <p className="text-gray-500 text-sm">{getRankingLabel()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}