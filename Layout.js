
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Server,
  Users,
  Star,
  Plus,
  Home,
  Settings,
  UserCircle as ProfileIcon,
  ShieldCheck as AdminIcon,
  Trophy,
  Target,
  TrendingUp,
  Gamepad2,
  ShoppingCart,
  Archive,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import XpProgressBar from "./components/xp/XpProgressBar";
import { calculateLevel } from "./components/xp/xpSystem";
import { User, Notification as NotificationEntity } from "@/entities/all";
import NotificationBell from "./components/NotificationBell";
import { toast } from "sonner";

// Componente para itens de menu com sub-menus
function MenuItem({ item, isActive, currentUser, isAdmin, isServerOwner }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if the current item (or any of its children) is active
  const isItemOrChildActive = item.children
    ? item.children.some(child => isActive(child.url))
    : isActive(item.url);

  // Set initial expansion state based on active child
  useEffect(() => {
    if (item.children && isItemOrChildActive) {
      setIsExpanded(true);
    }
  }, [item.children, isItemOrChildActive]);

  if (!item.condition || item.condition(currentUser, isAdmin, isServerOwner)) {
    if (item.children) {
      return (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200
            ${isItemOrChildActive ? 'neumorphic-pressed text-blue-600' : 'text-gray-600 hover:text-gray-800 neumorphic neumorphic-hover neumorphic-active'}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="ml-6 mt-2 space-y-1">
              {item.children.filter(child => !child.condition || child.condition(currentUser, isAdmin, isServerOwner)).map((child, idx) => (
                <Link
                  key={idx}
                  to={child.url}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                    isActive(child.url)
                      ? 'neumorphic-pressed text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 neumorphic neumorphic-hover neumorphic-active'
                  }`}
                >
                  <child.icon className="w-4 h-4" />
                  <span>{child.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Link
          to={item.url}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
            isActive(item.url)
              ? 'neumorphic-pressed text-blue-600'
              : 'neumorphic neumorphic-hover neumorphic-active text-gray-600 hover:text-gray-800'
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.title}</span>
        </Link>
      );
    }
  }
  return null;
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isServerOwner, setIsServerOwner] = useState(false);

  useEffect(() => {
    const fetchUserAndCheckLoginStreak = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        setIsAdmin(user && user.role === 'admin');
        setIsServerOwner(user && user.is_server_owner === true);

        // --- Lógica de Login Streak ---
        const today = new Date().setHours(0, 0, 0, 0);
        const lastLoginDate = user.last_login ? new Date(user.last_login).setHours(0, 0, 0, 0) : null;
        let newLoginStreak = user.login_streak || 0;
        let updatedUserData = {};

        // Only process if user is logged in and last login wasn't today
        if (user && lastLoginDate !== today) {
            if (lastLoginDate === today - (24 * 60 * 60 * 1000)) { // Login was yesterday
                newLoginStreak++;
            } else { // Broke streak or first login today
                newLoginStreak = 1;
            }

            // Update last_login to now
            updatedUserData.last_login = new Date().toISOString();
            updatedUserData.login_streak = newLoginStreak;

            // Recompensas por Login Streak
            let streakRewardXP = 0;
            let streakRewardCoins = 0;
            let rewardMessage = "";

            if (newLoginStreak === 3) { streakRewardXP = 25; streakRewardCoins = 10; rewardMessage = "Sequência de 3 dias! +25 XP, +10 Moedas!";}
            else if (newLoginStreak === 7) { streakRewardXP = 75; streakRewardCoins = 30; rewardMessage = "Sequência de 7 dias! +75 XP, +30 Moedas!";}
            else if (newLoginStreak === 15) { streakRewardXP = 200; streakRewardCoins = 75; rewardMessage = "Sequência de 15 dias! +200 XP, +75 Moedas!";}
            else if (newLoginStreak > 0 && newLoginStreak % 5 === 0 && newLoginStreak > 15) { // Recompensa a cada 5 dias após 15
                 streakRewardXP = 50; streakRewardCoins = 20; rewardMessage = `Sequência de ${newLoginStreak} dias! +50 XP, +20 Moedas!`;
            }

            if (rewardMessage) {
                updatedUserData.xp = (user.xp || 0) + streakRewardXP;
                updatedUserData.coins = (user.coins || 0) + streakRewardCoins;
                toast.success(rewardMessage, { icon: <Star className="w-4 h-4 text-yellow-400"/>});
                await NotificationEntity.create({
                    user_id: user.id,
                    title: "Recompensa de Login Streak!",
                    message: rewardMessage,
                    type: "login_streak_reward"
                });
            }

            // Send updates to the server and local state
            if (Object.keys(updatedUserData).length > 0) {
                await User.updateMyUserData(updatedUserData);
                setCurrentUser(prev => ({ ...prev, ...updatedUserData })); // Update local state
            }
        }
        // --- Fim da Lógica de Login Streak ---

      } catch (e) {
        // console.error("Failed to fetch user:", e); // Usuário não logado, não é um erro crítico aqui
        setIsAdmin(false);
        setIsServerOwner(false);
        setCurrentUser(null);
      }
    };
    fetchUserAndCheckLoginStreak();
  }, [location.pathname]);

  // Estrutura do menu reorganizada com sub-menus
  const menuStructure = [
    {
      title: "Início",
      url: createPageUrl("Home"),
      icon: Home,
      condition: () => true
    },
    {
      title: "Servidores",
      icon: Server,
      children: [
        {
          title: "Explorar Servidores",
          url: createPageUrl("Servers"),
          icon: Server
        },
        {
          title: "Adicionar Servidor",
          url: createPageUrl("AddServer"),
          icon: Plus,
          condition: (user) => user
        },
        {
          title: "Painel Proprietário",
          url: createPageUrl("ServerOwnerPanel"),
          icon: Gamepad2,
          condition: (user, isAdmin, isServerOwner) => isServerOwner
        }
      ]
    },
    {
      title: "Comunidade",
      icon: Users,
      children: [
        {
          title: "Ranking",
          url: createPageUrl("Ranking"),
          icon: TrendingUp
        },
        {
          title: "Usuários",
          url: createPageUrl("Users"),
          icon: Users
        }
      ]
    },
    {
      title: "Gamificação",
      icon: Trophy,
      children: [
        {
          title: "Missões",
          url: createPageUrl("Missions"),
          icon: Target
        },
        {
          title: "Loja",
          url: createPageUrl("Store"),
          icon: ShoppingCart
        }
      ]
    },
    {
      title: "Minha Conta",
      icon: ProfileIcon,
      condition: (user) => user, // Only show this parent if user is logged in
      children: [
        {
          title: "Meu Perfil",
          url: createPageUrl(`UserProfile?id=${currentUser?.id || ''}`),
          icon: ProfileIcon,
          condition: (user) => user
        },
        {
          title: "Minhas Compras",
          url: createPageUrl("MyPurchases"),
          icon: Archive,
          condition: (user) => user
        },
        {
          title: "Editar Perfil",
          url: createPageUrl("ProfileEdit"),
          icon: Settings,
          condition: (user) => user
        }
      ]
    },
    {
      title: "Administração",
      url: createPageUrl("AdminPanel"),
      icon: AdminIcon,
      condition: (user, isAdmin) => isAdmin
    }
  ];

  const isActiveUrl = (url) => {
    // Check if the current location pathname exactly matches the URL
    if (location.pathname === url) {
        return true;
    }
    // Special handling for UserProfile where ID might be in the URL params
    if (url.includes("UserProfile") && location.pathname.startsWith("/UserProfile")) {
        return true;
    }
    // General check for base path if URL doesn't have an exact match but is a base path
    // For example, if url is /admin and current path is /admin/users
    // This is optional and depends on desired behavior for sub-paths
    // For now, sticking to exact match or specific startsWith for UserProfile
    return false;
};


  // Para a barra de XP no Layout
  const userLevel = currentUser?.level || 1;
  const userXp = currentUser?.xp || 0;

  const getTotalXpForLevelStart = (level) => {
    if (level <= 1) return 0;
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
      totalXp += i * 100; // Assuming each level requires (level_num * 100) XP
    }
    return totalXp;
  };

  const xpForNextLvlLayout = userLevel * 100; // XP required to complete the current level
  const xpSinceLastLevelLayout = userXp - getTotalXpForLevelStart(userLevel); // XP accumulated in the current level

  return (
    <div className="min-h-screen bg-gray-200">
      <style>{`
        :root {
          --neumorphic-bg: #e0e0e0;
          --neumorphic-shadow-dark: #bebebe;
          --neumorphic-shadow-light: #ffffff;
        }
        .neumorphic { background: var(--neumorphic-bg); box-shadow: 8px 8px 16px var(--neumorphic-shadow-dark), -8px -8px 16px var(--neumorphic-shadow-light); }
        .neumorphic-inset { background: var(--neumorphic-bg); box-shadow: inset 4px 4px 8px var(--neumorphic-shadow-dark), inset -4px -4px 8px var(--neumorphic-shadow-light); }
        .neumorphic-pressed { background: var(--neumorphic-bg); box-shadow: inset 6px 6px 12px var(--neumorphic-shadow-dark), inset -6px -6px 12px var(--neumorphic-shadow-light); }
        .neumorphic-hover:hover { box-shadow: 12px 12px 24px var(--neumorphic-shadow-dark), -12px -12px 24px var(--neumorphic-shadow-light); }
        .neumorphic-active:active { box-shadow: inset 4px 4px 8px var(--neumorphic-shadow-dark), inset -4px -4px 8px var(--neumorphic-shadow-light); }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 neumorphic m-4 rounded-3xl p-6 flex flex-col">
          {/* Logo */}
          <div className="mb-8">
            <div className="neumorphic-inset rounded-2xl p-4 text-center">
              <h1 className="text-2xl font-bold text-gray-700">FiveM Manager</h1>
              <p className="text-sm text-gray-500 mt-1">Gerenciador de Servidores</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <div className="space-y-3">
              {menuStructure.map((item, idx) => (
                <MenuItem
                  key={idx}
                  item={item}
                  isActive={isActiveUrl}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  isServerOwner={isServerOwner}
                />
              ))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="mt-6 neumorphic-inset rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 neumorphic rounded-full flex items-center justify-center overflow-hidden">
                {currentUser && currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-medium text-sm">
                    {currentUser ? (currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U') : 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">
                  {currentUser ? (currentUser.full_name || currentUser.nickname || 'Usuário') : 'Visitante'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser ? (isAdmin ? 'Administrador' : 'Membro') : (<button onClick={() => User.login()} className="hover:underline focus:outline-none">Faça login</button>)}
                </p>
              </div>
              {currentUser && <NotificationBell />}
            </div>

            {currentUser && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center text-xs my-3">
                  <div>
                    <p className="font-bold text-gray-800">{currentUser.level || 1}</p>
                    <p className="text-gray-500">Nível</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{currentUser.xp || 0}</p>
                    <p className="text-gray-500">XP</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{currentUser.coins || 0}</p>
                    <p className="text-gray-500">Moedas</p>
                  </div>
                </div>
                <XpProgressBar
                    currentXp={xpSinceLastLevelLayout}
                    currentLevel={userLevel}
                    xpForNextLevel={xpForNextLvlLayout}
                />
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="neumorphic rounded-3xl min-h-full p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
