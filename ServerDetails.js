
import React, { useState, useEffect } from "react";
import { Server, Rating, User, Mission, UserMissionProgress } from "@/entities/all"; // Adicionar Mission e UserMissionProgress
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Globe,
  MessageCircle,
  Users,
  Activity,
  Star,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  ShieldCheck,
  Award,
  Trophy // Adicionar Trophy para o ícone de missão
} from "lucide-react";
import RatingStars from "../components/RatingStars";
import { grantXp, XP_ACTIONS, BADGES_CONFIG, checkAndAwardBadge } from "../components/xp/xpSystem";
import { Toaster, toast } from 'sonner';

export default function ServerDetails() {
  const navigate = useNavigate();
  const [serverId, setServerId] = useState(null);
  const [server, setServer] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [owner, setOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRating, setUserRating] = useState({ rating: 0, comment: "" });
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to get server ID from query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("id");
    if (idFromQuery) {
      setServerId(idFromQuery);
    } else {
      // Apenas logar aqui, a decisão de navegar será no próximo useEffect
      console.error("ID do servidor não encontrado na URL no momento da montagem inicial.");
    }
  }, []); // Executa apenas uma vez na montagem

  // Effect to load data when serverId is available or handle missing ID
  useEffect(() => {
    if (serverId) {
      loadServerDetails(serverId);
      loadCurrentUser();
    } else {
      // Se serverId ainda for null após a primeira verificação, então navegue
      // Isso previne navegação imediata se a URL ainda estiver sendo processada pelo router
      const params = new URLSearchParams(window.location.search);
      if (!params.get("id")) { // Checa novamente se realmente não há ID
          toast.error("ID do servidor não especificado. Redirecionando...");
          navigate(createPageUrl("Servers"));
      }
    }
  }, [serverId, navigate]); // Depende de serverId e navigate

  // Effect to check user's rating status when currentUser or ratings change
  useEffect(() => {
    if (serverId && ratings.length > 0 && currentUser) {
        const existingRating = ratings.find(r => r.user_id === currentUser.id);
        if (existingRating) {
          setHasRated(true);
          setUserRating({ rating: existingRating.rating, comment: existingRating.comment });
        } else {
          setHasRated(false);
          setUserRating({ rating: 0, comment: "" });
        }
    } else if (!currentUser) {
        setHasRated(false);
        setUserRating({ rating: 0, comment: "" });
    }
  }, [currentUser, ratings, serverId]);


  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.log("Usuário não logado");
      // toast.info("Faça login para avaliar e interagir com os servidores."); // Opcional
    }
  };

  const loadServerDetails = async (idToLoad) => {
    setIsLoading(true);
    setOwner(null);
    try {
      const serverData = await Server.get(idToLoad);
      setServer(serverData);

      if (serverData && serverData.owner_id) {
        if (serverData.owner_id && serverData.owner_id.length > 5) {
          try {
            const ownerData = await User.get(serverData.owner_id);
            setOwner(ownerData);
          } catch (ownerError) {
            console.error("Erro ao carregar proprietário do servidor:", ownerError);
            toast.warning("Não foi possível carregar os dados do proprietário do servidor.");
          }
        } else {
          console.warn(`ID do proprietário inválido ou placeholder: ${serverData.owner_id}`);
        }
      }

      const ratingsData = await Rating.filter({ server_id: idToLoad }, "-created_date");
      setRatings(ratingsData);

    } catch (error) {
      console.error("Erro ao carregar detalhes do servidor:", error);
      if (error.message && error.message.includes("not found")) { // Exemplo de checagem de erro específico
        toast.error("Servidor não encontrado. Redirecionando...");
      } else {
        toast.error("Erro ao carregar dados do servidor. Redirecionando...");
      }
      navigate(createPageUrl("Servers"));
    }
    setIsLoading(false);
  };

  const handleRatingChange = (newRating) => {
    setUserRating(prev => ({ ...prev, rating: newRating }));
  };

  const handleCommentChange = (e) => {
    setUserRating(prev => ({ ...prev, comment: e.target.value }));
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Você precisa estar logado para avaliar.");
      return;
    }
    if (userRating.rating === 0) {
      toast.error("Por favor, selecione uma nota.");
      return;
    }
    if (!serverId) {
        toast.error("ID do servidor não encontrado. Não é possível avaliar.");
        return;
    }

    setIsSubmitting(true);
    try {
      const ratingData = {
        server_id: serverId,
        user_id: currentUser.id,
        rating: userRating.rating,
        comment: userRating.comment,
      };

      await Rating.create(ratingData);
      toast.success("Avaliação enviada com sucesso!");

      // Recarregar ratings e detalhes do servidor para atualizar a média
      loadServerDetails(serverId);
      setHasRated(true); // Marcar que o usuário avaliou nesta sessão

      // Lógica de XP e Badges
      const { newXp, newLevel, awardedBadge } = await grantXp(
        currentUser.id,
        XP_ACTIONS.RATE_SERVER, // Use XP_ACTIONS constant
        currentUser.xp || 0,
        currentUser.level || 1,
        currentUser.badges || []
      );

      let updatedUserData = { xp: newXp, level: newLevel };
      let finalBadges = currentUser.badges || [];

      if (awardedBadge && !finalBadges.some(b => b.id === awardedBadge.id)) {
        finalBadges = [...finalBadges, awardedBadge];
        toast("Nova Badge Desbloqueada!", {
          description: `Você ganhou a badge: ${awardedBadge.name}!`,
          icon: <Award className="w-5 h-5 text-yellow-500" />,
        });
      }
      updatedUserData.badges = finalBadges;
      await User.updateMyUserData(updatedUserData);
      setCurrentUser(prev => ({ ...prev, ...updatedUserData }));

      // --- Verificação de Missão "Avalie X Servidores" ---
      const userRatingsCount = (await Rating.filter({ user_id: currentUser.id })).length;
      const rateServersMissions = await Mission.filter({ "criteria.type": "rate_servers", is_active: true });

      for (const mission of rateServersMissions) {
        if (userRatingsCount >= mission.criteria.count) {
          const existingProgress = await UserMissionProgress.filter({ user_id: currentUser.id, mission_id: mission.id });
          if (existingProgress.length === 0) {
            await UserMissionProgress.create({
              user_id: currentUser.id,
              mission_id: mission.id,
              status: "completed",
              progress: { rated_count: userRatingsCount },
              completed_at: new Date().toISOString()
            });
            toast.info(`Missão "${mission.title}" completada! Vá em Missões para coletar sua recompensa.`, {
                icon: <Trophy className="w-4 h-4 text-green-500"/>
            });
          } else if (existingProgress[0].status === "pending") {
             await UserMissionProgress.update(existingProgress[0].id, {
                status: "completed",
                progress: { rated_count: userRatingsCount },
                completed_at: new Date().toISOString()
             });
             toast.info(`Missão "${mission.title}" completada! Vá em Missões para coletar sua recompensa.`, {
                icon: <Trophy className="w-4 h-4 text-green-500"/>
            });
          }
        }
      }
      // --- Fim da Verificação de Missão ---

    } catch (error) {
      console.error("Erro ao submeter avaliação:", error);
      toast.error("Erro ao enviar sua avaliação.");
    }
    setIsSubmitting(false);
  };


  const getStatusColor = (isActive, currentPlayers, maxPlayers) => {
    if (!isActive) return "text-red-500";
    if (currentPlayers >= maxPlayers * 0.8) return "text-red-500";
    if (currentPlayers >= maxPlayers * 0.5) return "text-yellow-500";
    return "text-green-500";
  };

  if (isLoading || !serverId) {
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-12 w-32 animate-pulse"></div>
        <div className="neumorphic rounded-2xl h-64 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neumorphic rounded-2xl h-32 animate-pulse"></div>
          <div className="neumorphic rounded-2xl h-32 animate-pulse"></div>
          <div className="neumorphic rounded-2xl h-32 animate-pulse"></div>
        </div>
        <div className="neumorphic rounded-2xl h-48 animate-pulse"></div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">Servidor não encontrado</h2>
        <button
          onClick={() => navigate(createPageUrl("Servers"))}
          className="mt-6 neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium"
        >
          Voltar para Servidores
        </button>
      </div>
    );
  }

  const statusColor = getStatusColor(server.is_active, server.current_players, server.max_players);

  return (
    <div className="space-y-8">
      <Toaster richColors position="top-right" />
      {/* Back Button */}
      <button
        onClick={() => navigate(createPageUrl("Servers"))}
        className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-4 py-2 flex items-center gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Server Header */}
      <div className="neumorphic rounded-2xl overflow-hidden">
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-gray-300 to-gray-400">
          {server.banner_url ? (
            <img src={server.banner_url} alt={`${server.name} banner`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-500 opacity-50" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-end gap-4">
              {server.logo_url && (
                <img
                  src={server.logo_url}
                  alt={`${server.name} logo`}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-xl object-cover neumorphic border-4 border-gray-200"
                />
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{server.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <RatingStars rating={server.rating_average} size="lg" />
                  <span className="text-gray-200 text-sm">
                    {server.rating_average ? server.rating_average.toFixed(1) : '0.0'} ({server.rating_count || 0} avaliações)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Server Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="neumorphic rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Descrição</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{server.description}</p>
          </div>

          {/* Tags */}
          {server.tags && server.tags.length > 0 && (
            <div className="neumorphic rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {server.tags.map((tag, index) => (
                  <span key={index} className="neumorphic-inset rounded-full px-3 py-1 text-sm text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Info & Actions */}
        <div className="space-y-6">
          <div className="neumorphic rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${statusColor}`}>
                {server.is_active ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Jogadores:</span>
              <span className="font-semibold text-gray-800">
                {server.current_players} / {server.max_players}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">IP:Porta:</span>
              <span className="font-semibold text-gray-800">
                {server.ip}:{server.port}
              </span>
            </div>
             {owner ? (
              <div className="flex items-center justify-between pt-2 border-t border-gray-300/50">
                <span className="text-gray-600">Proprietário:</span>
                <div className="flex items-center gap-2">
                   {owner.avatar_url ? (
                      <img src={owner.avatar_url} alt={owner.full_name} className="w-5 h-5 rounded-full"/>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                        {owner.full_name?.charAt(0) || owner.email?.charAt(0) || 'P'}
                      </div>
                    )}
                  <span className="font-semibold text-gray-800 text-sm">{owner.full_name || owner.nickname || 'Proprietário Desconhecido'}</span>
                </div>
              </div>
            ) : server.owner_id ? (
                 <div className="flex items-center justify-between pt-2 border-t border-gray-300/50">
                    <span className="text-gray-600">Proprietário:</span>
                    <span className="font-semibold text-gray-800 text-sm italic">Carregando...</span>
                 </div>
            ) : null}

            <button
              onClick={() => {
                navigator.clipboard.writeText(`connect ${server.ip}:${server.port}`);
                toast.info("IP:Porta copiado para a área de transferência!", {
                  description: "Cole no console do FiveM (F8): connect SEU_IP:PORTA"
                });
              }}
              className="w-full mt-4 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-center text-gray-700 font-medium"
            >
              Conectar ao Servidor
            </button>
          </div>

          {(server.website || server.discord) && (
            <div className="neumorphic rounded-2xl p-6 space-y-3">
              <h3 className="text-md font-semibold text-gray-700 mb-2">Links Úteis</h3>
              {server.website && (
                <a
                  href={server.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 neumorphic neumorphic-hover neumorphic-active rounded-lg p-3 text-sm text-gray-600"
                >
                  <Globe className="w-4 h-4" /> Website Oficial
                </a>
              )}
              {server.discord && (
                <a
                  href={server.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 neumorphic neumorphic-hover neumorphic-active rounded-lg p-3 text-sm text-gray-600"
                >
                  <MessageCircle className="w-4 h-4" /> Servidor Discord
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ratings Section */}
      <div className="neumorphic rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Avaliações ({ratings.length})</h2>

        {currentUser && !hasRated && (
          <form onSubmit={handleSubmitRating} className="neumorphic-inset rounded-2xl p-6 mb-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Deixe sua avaliação</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sua Nota:</label>
              <RatingStars rating={userRating.rating} size="lg" interactive onChange={handleRatingChange} />
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">Seu Comentário (opcional):</label>
              <textarea
                id="comment"
                value={userRating.comment}
                onChange={handleCommentChange}
                rows={3}
                placeholder="Descreva sua experiência no servidor..."
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || userRating.rating === 0}
              className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Enviar Avaliação
                </>
              )}
            </button>
          </form>
        )}
        {currentUser && hasRated && (
           <div className="neumorphic-inset rounded-2xl p-6 mb-8 text-center">
             <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
             <p className="text-gray-700 font-medium">Você já avaliou este servidor.</p>
             <p className="text-sm text-gray-500">Sua nota: <RatingStars rating={userRating.rating} size="sm" /></p>
           </div>
        )}
        {!currentUser && (
          <div className="neumorphic-inset rounded-2xl p-6 mb-8 text-center">
            <p className="text-gray-700">Você precisa estar <a href="#" onClick={(e) => { e.preventDefault(); User.login();}} className="font-medium text-blue-600 hover:underline">logado</a> para avaliar.</p>
          </div>
        )}

        {ratings.length > 0 ? (
          <div className="space-y-6">
            {ratings.map(rating => (
              <RatingItem key={rating.id} ratingData={rating} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Este servidor ainda não possui avaliações. Seja o primeiro!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingItem({ ratingData }) {
  const [ratingUser, setRatingUser] = useState(null);

  useEffect(() => {
    const loadRatingUser = async () => {
      try {
        // Basic check for user_id validity
        if (ratingData.user_id && ratingData.user_id.length > 5) {
            const userData = await User.get(ratingData.user_id);
            setRatingUser(userData);
        } else {
            console.warn(`ID de usuário inválido na avaliação: ${ratingData.user_id}`);
            setRatingUser({ full_name: 'Usuário Desconhecido', avatar_url: null, nickname: 'Desconhecido' });
        }
      } catch (error) {
        console.error("Erro ao carregar usuário da avaliação:", error);
        setRatingUser({ full_name: 'Usuário Desconhecido', avatar_url: null, nickname: 'Desconhecido' });
      }
    };
    loadRatingUser();
  }, [ratingData.user_id]);

  return (
    <div className="neumorphic-inset rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="neumorphic rounded-full p-1">
          {ratingUser && ratingUser.avatar_url ? (
            <img src={ratingUser.avatar_url} alt={ratingUser.full_name || ratingUser.nickname} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">
                {ratingUser ? (ratingUser.full_name?.charAt(0) || ratingUser.nickname?.charAt(0) || 'U') : 'U'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-800">
              {ratingUser ? (ratingUser.full_name || ratingUser.nickname || 'Usuário Anônimo') : 'Carregando...'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(ratingData.created_date).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <RatingStars rating={ratingData.rating} size="md" />
          {ratingData.comment && (
            <p className="text-gray-600 mt-2 text-sm whitespace-pre-wrap">{ratingData.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
