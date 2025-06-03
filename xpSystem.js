
import { User } from "@/entities/User"; // Importar User para checkAndAwardBadge e grantXp
import { Notification as NotificationEntity } from "@/entities/Notification"; // Adicionar import
import toast from "react-hot-toast"; // Importar toast para notificações
import { Trophy } from "lucide-react"; // Importar ícone para notificações de nível

export const XP_ACTIONS = {
  RATE_SERVER: 15,
  ADD_SERVER: 50,
  DAILY_LOGIN: 5, 
  COMPLETE_PROFILE: 25,
  FAVORITE_SERVER: 5,
};

export const calculateLevel = (xp) => {
  if (xp < 0) return 1;
  let currentLevel = 1;
  let xpForNextLevel = 100;
  let totalXpForLevel = 0;

  while (xp >= totalXpForLevel + xpForNextLevel) {
    totalXpForLevel += xpForNextLevel;
    currentLevel++;
    xpForNextLevel = currentLevel * 100; 
  }
  return currentLevel;
};

export const BADGES_CONFIG = {
  NEWBIE: { id: "newbie", name: "Novato Curioso", description: "Bem-vindo! Você começou sua jornada.", icon: "MousePointerSquare", color: "#9ca3af" }, // gray-400
  EXPLORER: { id: "explorer", name: "Explorador de Servidores", description: "Avaliou 5 servidores.", icon: "Compass", color: "#3b82f6" }, // blue-500
  CONTRIBUTOR: { id: "contributor", name: "Contribuidor Ativo", description: "Avaliou 15 servidores.", icon: "Award", color: "#22c55e" }, // green-500
  SERVER_OWNER_BADGE: { id: "server_owner", name: "Dono de Servidor", description: "Você adicionou um servidor à plataforma!", icon: "ServerCog", color: "#a855f7" }, // purple-500
  PROFILE_COMPLETE_BADGE: { id: "profile_complete", name: "Perfil Completo", description: "Seu perfil está 100% preenchido.", icon: "UserCheck", color: "#14b8a6" }, // teal-500
  LEVEL_5_BADGE: { id: "level_5", name: "Nível 5 Atingido", description: "Parabéns por alcançar o nível 5!", icon: "ChevronsUp", color: "#6366f1"}, // indigo-500
  LEVEL_10_BADGE: { id: "level_10", name: "Nível 10 Mestre", description: "Você é um mestre da plataforma!", icon: "Gem", color: "#ec4899"}, // pink-500
};

// Helper para atualizar dados do usuário e retornar a badge
async function awardBadgeToUser(user, badgeKey) {
    const badgeConfig = BADGES_CONFIG[badgeKey];
    if (!badgeConfig) return null;

    const userBadges = user.badges || [];
    if (userBadges.some(b => b.id === badgeConfig.id)) return null; // Já tem

    const newBadge = { ...badgeConfig };
    const updatedBadges = [...userBadges, newBadge];
    
    try {
        await User.update(user.id, { badges: updatedBadges }); // Usar User.update com ID
        // Atualiza o objeto user passado para que as verificações subsequentes dentro da mesma chamada de grantXp sejam precisas.
        user.badges = updatedBadges; 
        return newBadge;
    } catch (error) {
        console.error(`Erro ao conceder badge ${badgeKey} para usuário ${user.id}:`, error);
        return null;
    }
}


export const checkAndAwardBadge = async (user, badgeKey) => {
  // Esta função agora é um wrapper mais simples, a lógica de atualização está em awardBadgeToUser
  // user aqui deve ser o objeto do usuário completo incluindo seu ID
  if (!user || !user.id) {
      console.error("Usuário inválido ou ID do usuário não fornecido para checkAndAwardBadge");
      return null;
  }
  return awardBadgeToUser(user, badgeKey);
};

export const grantXp = async (userId, actionType, currentXp, currentLevel, userBadgesArray = []) => {
  const xpGained = XP_ACTIONS[actionType];
  if (!xpGained) return { newXp: currentXp, newLevel: currentLevel, awardedBadge: null };

  const oldLevel = currentLevel; // Salvar nível antigo para checar se subiu
  const newXp = currentXp + xpGained;
  const newLevel = calculateLevel(newXp);
  let awardedBadgeDetails = null;
  
  // Criar um objeto de usuário simulado para passar para as funções de badge
  // É importante que este objeto 'user' contenha o 'id' e 'badges' atuais
  const userObjectForBadges = { id: userId, badges: [...userBadgesArray] };

  try {
    const updateData = { xp: newXp, level: newLevel };
    await User.update(userId, updateData);

    if (newLevel > oldLevel) {
        toast.success(`Parabéns! Você alcançou o Nível ${newLevel}!`, {
            icon: <Trophy className="w-5 h-5 text-yellow-400" />
        });
        await NotificationEntity.create({
            user_id: userId,
            title: "Você Subiu de Nível!",
            message: `Parabéns! Você alcançou o Nível ${newLevel}. Continue assim!`,
            type: "level_up",
        });
    }

    // Lógica de Badges baseada em nível
    if (newLevel >= 5 && !userObjectForBadges.badges.some(b => b.id === BADGES_CONFIG.LEVEL_5_BADGE.id)) {
      const badge = await awardBadgeToUser(userObjectForBadges, 'LEVEL_5_BADGE');
      if(badge) {
        awardedBadgeDetails = badge;
        // userObjectForBadges.badges.push(badge); // Já adicionado em awardBadgeToUser se bem sucedido
      }
    }
    if (newLevel >= 10 && !userObjectForBadges.badges.some(b => b.id === BADGES_CONFIG.LEVEL_10_BADGE.id)) {
       const badge = await awardBadgeToUser(userObjectForBadges, 'LEVEL_10_BADGE');
       // Se ganhou uma badge de nível 5 e depois a de nível 10 na mesma ação, a de nível 10 tem "prioridade" na notificação
       if(badge) {
            awardedBadgeDetails = badge; 
            // userObjectForBadges.badges.push(badge); // Já adicionado em awardBadgeToUser se bem sucedido
       }
    }
    
    // Badge de Novato (se for o primeiro XP ganho)
    // Condição modificada para verificar se currentXp era 0 antes de ganhar XP.
    if (currentXp === 0 && xpGained > 0 && !userObjectForBadges.badges.some(b => b.id === BADGES_CONFIG.NEWBIE.id)) {
      const badge = await awardBadgeToUser(userObjectForBadges, 'NEWBIE');
      // Só define como awardedBadgeDetails se não ganhou uma badge de nível mais importante
      if(badge && !awardedBadgeDetails) { 
          awardedBadgeDetails = badge;
          // userObjectForBadges.badges.push(badge); // Já adicionado em awardBadgeToUser se bem sucedido
      }
    }
  } catch (error) {
      console.error(`Erro ao conceder XP ou badges para usuário ${userId}:`, error);
      // Não parar a execução, apenas logar o erro. O XP e nível podem ter sido atualizados.
  }

  return { newXp, newLevel, awardedBadge: awardedBadgeDetails };
};
