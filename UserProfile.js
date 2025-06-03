import React, { useState, useEffect } from "react";
import { User, Server, Rating, UserMissionProgress } from "@/entities/all";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  User as UserIcon,
  Star,
  Trophy,
  Calendar,
  MessageSquare,
  Settings, 
  Shield,
  Crown,
  Coins, 
  TrendingUp,
  Edit 
} from "lucide-react";
import { Toaster } from "react-hot-toast";

// Assuming these are available or will be created at the specified paths
import { calculateLevel } from "../components/xp/xpSystem"; 
import XpProgressBar from "../components/xp/XpProgressBar"; 

export default function UserProfile() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userServers, setUserServers] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("id");
    if (idFromQuery) {
      setUserId(idFromQuery);
    } else {
      loadCurrentUserProfile();
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadProfileData(userId);
    }
  }, [userId]);

  const loadCurrentUserProfile = async () => {
    try {
      const user = await User.me();
      if (user && user.id) {
        setUserId(user.id);
      } else {
        navigate(createPageUrl("Home")); // Or some other fallback
      }
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error);
      navigate(createPageUrl("Home"));
    }
  };

  const loadProfileData = async (id) => {
    setIsLoading(true);
    try {
      const [profileUserData, currentUserData] = await Promise.all([
        User.get(id),
        User.me().catch(() => null)
      ]);
      
      setUserData(profileUserData);
      setCurrentUser(currentUserData);
      setIsOwnProfile(currentUserData && currentUserData.id === id);

      const servers = await Server.filter({ owner_id: id });
      setUserServers(servers.filter(s => s.status === 'approved'));

      const ratings = await Rating.filter({ user_id: id }, "-created_date", 10);
      setUserRatings(ratings);

    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      // Consider navigating to a generic error page or showing an inline error
      // For now, let's keep the previous behavior of navigating to Users,
      // but ideally this should be more specific or show an error on the current page.
      navigate(createPageUrl("Users")); 
    }
    setIsLoading(false);
  };
  
  const getXpForLevel = (level) => {
    if (level <= 1) return 100;
    return level * 100;
  };
  
  const getTotalXpForLevelStart = (level) => {
    if (level <= 1) return 0;
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
      totalXp += i * 100; 
    }
    return totalXp;
  };

  if (isLoading || !userData) {
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neumorphic rounded-2xl h-32 animate-pulse"></div>
          <div className="neumorphic rounded-2xl h-32 animate-pulse"></div>
          <div className="neumorphic rounded-2xl h-32 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const userLevel = userData.level || 1;
  const userXp = userData.xp || 0;
  const xpForNextLvl = getXpForLevel(userLevel);
  const xpSinceLastLevel = userXp - getTotalXpForLevelStart(userLevel);

  return (
    <div className="space-y-8">
      <Toaster position="top-right" /> {/* Removed richColors if using react-hot-toast */}
      {/* User Header */}
      <div className="neumorphic rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 neumorphic-inset rounded-full flex items-center justify-center overflow-hidden">
            {userData.avatar_url ? (
              <img src={userData.avatar_url} alt={userData.full_name || userData.nickname} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-20 h-20 text-gray-400" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800">
              {userData.full_name || userData.nickname || "Usuário"}
            </h1>
            {userData.nickname && userData.full_name !== userData.nickname && (
              <p className="text-gray-600 mb-2">@{userData.nickname}</p>
            )}
            
            <div className="mt-2 flex items-center justify-center md:justify-start gap-2 text-gray-600">
              {userData.role === "admin" && <Crown className="w-5 h-5 text-yellow-500" />}
              <span>{userData.role === "admin" ? "Administrador" : "Membro"}</span>
            </div>

            {userData.bio && (
              <p className="text-sm text-gray-700 mt-3 max-w-xl">{userData.bio}</p>
            )}
          </div>

          {/* Edit Profile Button */}
          {isOwnProfile && (
            <Link 
              to={createPageUrl("ProfileEdit")} 
              className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Editar Perfil
            </Link>
          )}
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-8">
            <XpProgressBar 
                currentXp={xpSinceLastLevel} 
                currentLevel={userLevel} 
                xpForNextLevel={xpForNextLvl} 
            />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="neumorphic rounded-2xl p-6 text-center">
          <TrendingUp className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{userLevel}</p>
          <p className="text-sm text-gray-500">Nível</p>
        </div>
        <div className="neumorphic rounded-2xl p-6 text-center">
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{userXp}</p>
          <p className="text-sm text-gray-500">XP</p>
        </div>
        <div className="neumorphic rounded-2xl p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{userData.badges?.length || 0}</p>
          <p className="text-sm text-gray-500">Badges</p>
        </div>
        <div className="neumorphic rounded-2xl p-6 text-center">
          <MessageSquare className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{userRatings.length}</p>
          <p className="text-sm text-gray-500">Avaliações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Badges */}
        {userData.badges && userData.badges.length > 0 && (
          <div className="neumorphic rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Badges Conquistadas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {userData.badges.map(badge => (
                <div
                  key={badge.id}
                  className="neumorphic-inset rounded-xl p-4 text-center flex flex-col items-center justify-center"
                  title={badge.description}
                >
                  {/* Dynamically render icon if available, otherwise use a default */}
                  {/* For now, assuming badge.icon is a valid Lucide icon name string and badge.color is its color */}
                  {/* This part might need more robust icon handling if badge.icon isn't guaranteed to be a Lucide name */}
                  <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: badge.color || '#6b7280' }} /> 
                  <p className="text-sm font-medium text-gray-700 truncate w-full">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Servers */}
        {userServers.length > 0 && (
          <div className="neumorphic rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Servidores {isOwnProfile ? 'Meus' : 'do Usuário'}
            </h2>
            <div className="space-y-3">
              {userServers.slice(0, 3).map(server => (
                <div
                  key={server.id}
                  className="neumorphic-inset rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate(createPageUrl(`ServerDetails?id=${server.id}`))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{server.name}</h3>
                      <p className="text-gray-600 text-sm">{server.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{server.rating_average?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-xs text-gray-500">{server.rating_count || 0} avaliações</p>
                    </div>
                  </div>
                </div>
              ))}
              {userServers.length > 3 && (
                <Link 
                  to={createPageUrl(`Servers?owner_id=${userData.id}`)} // Example: Link to a filtered server list
                  className="block text-center text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Ver todos os servidores ({userServers.length})
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Recent Ratings */}
        {userRatings.length > 0 && (
          <div className="neumorphic rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Avaliações Recentes</h2>
            <div className="space-y-4">
              {userRatings.slice(0, 5).map(rating => (
                <div key={rating.id} className="neumorphic-inset rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {Array(5).fill(0).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {rating.comment && (
                        <p className="text-gray-600 text-sm">{rating.comment}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(rating.created_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                   {/* Optionally link to the server rated */}
                   {rating.server_id && (
                     <Link 
                        to={createPageUrl(`ServerDetails?id=${rating.server_id}`)} 
                        className="text-xs text-blue-500 hover:underline"
                     >
                        Ver servidor avaliado
                     </Link>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty States */}
      {(!userData.badges || userData.badges.length === 0) && userServers.length === 0 && userRatings.length === 0 && (
        <div className="neumorphic-inset rounded-2xl p-12 text-center">
          <UserIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {isOwnProfile ? 'Comece sua jornada!' : 'Perfil em construção'}
          </h3>
          <p className="text-gray-500">
            {isOwnProfile 
              ? 'Explore servidores, deixe avaliações e ganhe badges!'
              : 'Este usuário ainda não tem atividade registrada.'}
          </p>
        </div>
      )}
    </div>
  );
}