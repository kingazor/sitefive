
import React, { useState, useEffect } from "react";
import { Mission, UserMissionProgress, User } from "@/entities/all";
import { CheckCircle, Clock, Gift, Star, Trophy, Coins } from "lucide-react";
import { toast, Toaster } from "sonner";
import { grantXp, checkAndAwardBadge } from "../components/xp/xpSystem"; // Assuming xpSystem contains or is related to XP logic

// Helper function to calculate level based on XP
// This function would typically be more complex and potentially imported from a utility file
const calculateLevel = (xp) => {
  if (xp < 0) return 0;
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2500) return 6;
  if (xp < 4000) return 7;
  if (xp < 6000) return 8;
  if (xp < 9000) return 9;
  return Math.floor(Math.sqrt(xp / 100)) + 1; // A generic formula, adjust as needed
};

// Placeholder for navigation. In a real app, this would likely be from a router (e.g., useNavigate from react-router-dom).
const navigate = (path) => {
  window.location.assign(path);
};

// Placeholder for creating page URLs based on mission criteria
const createPageUrl = (navigateTo) => {
  // This is a simplified example. In a real app, this might map 'profile' to '/dashboard/profile' etc.
  switch (navigateTo) {
    case 'profile':
      return '/dashboard/profile';
    case 'friends':
      return '/dashboard/friends';
    case 'store':
      return '/dashboard/store';
    case 'inventory':
      return '/dashboard/inventory';
    case 'achievements':
      return '/dashboard/achievements';
    default:
      return `/dashboard/${navigateTo}`; // Generic case for other paths
  }
};


export default function Missions() {
  const [missions, setMissions] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("daily");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Carregar todas as missões ativas
      const missionsData = await Mission.filter({ is_active: true });
      
      // Carregar todo o progresso do usuário para todas as missões
      const progressData = user ? await UserMissionProgress.filter({ user_id: user.id }) : [];
      
      setMissions(missionsData);
      setUserProgress(progressData);
    } catch (error) {
      console.error("Erro ao carregar dados da página de missões:", error);
      toast.error("Falha ao carregar dados das missões.");
    }
    setIsLoading(false);
  };

  const claimReward = async (mission, progressItem) => {
    if (!currentUser || !progressItem || progressItem.status !== "completed") {
        toast.error("Esta recompensa não pode ser coletada ou já foi coletada.");
        return;
    }

    try {
      let newCoins = currentUser.coins || 0;
      let newXp = currentUser.xp || 0;
      
      if (mission.coins_reward) {
        newCoins += mission.coins_reward;
      }
      
      if (mission.xp_reward) {
        newXp += mission.xp_reward;
      }

      // Atualizar UserMissionProgress para "claimed"
      await UserMissionProgress.update(progressItem.id, { status: "claimed" });
      
      // Atualizar moedas e XP do usuário
      let userDataToUpdate = { coins: newCoins, xp: newXp };
      
      const oldLevel = currentUser.level || calculateLevel(currentUser.xp || 0);
      const finalNewLevel = calculateLevel(newXp);
      
      if (finalNewLevel > oldLevel) {
        userDataToUpdate.level = finalNewLevel;
        toast.success(`Parabéns! Você alcançou o Nível ${finalNewLevel}!`, {
             icon: <Trophy className="w-5 h-5 text-yellow-400" />
        });
        // Se tivermos missões de "alcance nível X", poderiam ser verificadas aqui
      }

      await User.updateMyUserData(userDataToUpdate);
      
      setCurrentUser(prev => ({ ...prev, ...userDataToUpdate }));
      
      toast.success(`Recompensa coletada! +${mission.xp_reward} XP, +${mission.coins_reward} moedas`);
      
      // Atualizar localmente o progresso da missão para "claimed"
      setUserProgress(prevProgress => 
        prevProgress.map(p => p.id === progressItem.id ? { ...p, status: "claimed" } : p)
      );
      // Não é necessário chamar loadData() completo aqui para evitar recarregar tudo,
      // a menos que outras lógicas dependam disso. A atualização local do progresso deve ser suficiente.

    } catch (error) {
      console.error("Erro ao coletar recompensa:", error);
      toast.error("Erro ao coletar recompensa. Tente novamente.");
    }
  };

  const getMissionProgress = (missionId) => {
    return userProgress.find(p => p.mission_id === missionId) || { status: "pending", progress: {} };
  };

  const getMissionIcon = (type) => {
    const icons = {
      daily: Clock,
      weekly: Star,
      achievement: Trophy,
      special: Gift
    };
    return icons[type] || Clock;
  };

  const filteredMissions = missions.filter(mission => mission.type === activeTab);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-12 w-64 animate-pulse mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="neumorphic rounded-2xl h-48 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toaster richColors position="top-right" />
      
      {/* Header */}
      <div className="text-center">
        <div className="neumorphic-inset rounded-2xl p-6 inline-block mb-4">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Missões</h1>
        <p className="text-gray-600">Complete missões para ganhar XP, moedas e badges especiais</p>
      </div>

      {/* User Stats */}
      <div className="neumorphic rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <Star className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{currentUser?.xp || 0}</p>
          <p className="text-sm text-gray-500">XP Total</p>
        </div>
        <div>
          <Coins className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{currentUser?.coins || 0}</p>
          <p className="text-sm text-gray-500">FiveMCoins</p>
        </div>
        <div>
          <Trophy className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {userProgress.filter(p => p.status === "claimed").length}
          </p>
          <p className="text-sm text-gray-500">Missões Completadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="neumorphic rounded-2xl p-2 flex justify-center gap-2 max-w-2xl mx-auto">
        {["daily", "weekly", "achievement", "special"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === tab
                ? "neumorphic-pressed text-blue-600"
                : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
            }`}
          >
            {React.createElement(getMissionIcon(tab), { className: "w-4 h-4" })}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMissions.map(mission => {
          const progress = getMissionProgress(mission.id);
          const IconComponent = getMissionIcon(mission.type);
          
          return (
            <div key={mission.id} className="neumorphic rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="neumorphic-inset rounded-xl p-3">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  progress.status === "claimed" ? "bg-green-100 text-green-700" :
                  progress.status === "completed" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {progress.status === "claimed" ? "Coletada" :
                   progress.status === "completed" ? "Completar" : "Em Progresso"} 
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{mission.title}</h3>
                <p className="text-gray-600 text-sm">{mission.description}</p>
              </div>

              {/* Progress Bar (opcional, para missões com contador) */}
              {mission.criteria && typeof mission.criteria.count === 'number' && progress.status === 'pending' && (
                <div className="w-full mt-2">
                    <div className="h-2 neumorphic-inset rounded-full">
                        <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(((progress.progress?.current_count || 0) / mission.criteria.count) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">
                        {progress.progress?.current_count || 0} / {mission.criteria.count}
                    </p>
                </div>
              )}

              <div className="neumorphic-inset rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Recompensas:</span>
                </div>
                <div className="flex items-center gap-4">
                  {mission.xp_reward > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">{mission.xp_reward} XP</span>
                    </div>
                  )}
                  {mission.coins_reward > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Coins className="w-4 h-4" />
                      <span className="text-sm font-medium">{mission.coins_reward}</span>
                    </div>
                  )}
                </div>
              </div>

              {progress.status === "completed" && (
                <button
                  onClick={() => claimReward(mission, progress)}
                  className="w-full neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-green-600 font-medium flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Coletar Recompensa
                </button>
              )}
               {/* Botão "Ir para" para missões de achievement pendentes que requerem ação */}
               {progress.status === "pending" && mission.type === "achievement" && mission.criteria?.navigateTo && (
                 <button
                   onClick={() => navigate(createPageUrl(mission.criteria.navigateTo))}
                   className="w-full mt-2 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-blue-600 font-medium flex items-center justify-center gap-2"
                 >
                   Ir para {mission.criteria.navigationText || "Missão"}
                 </button>
               )}
            </div>
          );
        })}
      </div>

      {filteredMissions.length === 0 && (
        <div className="neumorphic-inset rounded-2xl p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhuma missão {activeTab} disponível
          </h3>
          <p className="text-gray-500">Novas missões serão adicionadas em breve!</p>
        </div>
      )}
    </div>
  );
}
