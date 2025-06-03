
import React, { useState } from "react";
import { Server, User, Mission, UserMissionProgress } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Upload, Save, Award, Trophy } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
import { grantXp, BADGES_CONFIG, checkAndAwardBadge } from "../components/xp/xpSystem";
import { toast, Toaster } from "@/components/ui/sonner";

export default function AddServer() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ip: "",
    port: 30120,
    max_players: 32,
    category: "roleplay",
    website: "",
    discord: "",
    banner_url: "",
    logo_url: "",
    tags: []
  });
  const [newTag, setNewTag] = useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file, field) => {
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        [field]: file_url
      }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da imagem.");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await User.me();
      
      const serverData = {
        ...formData,
        owner_id: user.id,
        current_players: 0,
        is_active: false, // Começa como inativo até ser aprovado
        status: "pending", // Status inicial como pendente
        uptime: 100,
        rating_average: 0,
        rating_count: 0
      };

      const newServer = await Server.create(serverData); 
      toast.success("Servidor enviado para aprovação! Você será notificado quando for analisado.");
      
      let updatedUserData = {};
      // Se o usuário não for dono de servidor, atualize a flag
      if (!user.is_server_owner) {
        updatedUserData.is_server_owner = true;
      }

      const { newXp, newLevel, awardedBadge: levelOrNewbieBadge } = await grantXp(
        user.id,
        "ADD_SERVER", 
        user.xp || 0,
        user.level || 1,
        user.badges || []
      );

      updatedUserData.xp = newXp;
      updatedUserData.level = newLevel;

      let finalBadges = user.badges || [];
      if (levelOrNewbieBadge && !finalBadges.some(b => b.id === levelOrNewbieBadge.id)) {
          finalBadges = [...finalBadges, levelOrNewbieBadge];
      }
      
      let serverOwnerBadgeAwardedDetails = null;
      // Construct a user object with potentially updated XP, level, and badges for badge check
      const userForBadgeCheck = {...user, ...updatedUserData, badges: finalBadges};

      if (!userForBadgeCheck.badges.some(b => b.id === BADGES_CONFIG.SERVER_OWNER_BADGE.id)) {
        const badge = await checkAndAwardBadge(userForBadgeCheck, 'SERVER_OWNER_BADGE');
        if (badge) {
            serverOwnerBadgeAwardedDetails = badge;
            if (!finalBadges.some(b => b.id === badge.id)) {
                 finalBadges = [...finalBadges, badge];
            }
        }
      }
      
      updatedUserData.badges = finalBadges;
      await User.updateMyUserData(updatedUserData); 

      if (levelOrNewbieBadge) {
         toast("Nova Badge Desbloqueada!", {
            description: `Você ganhou a badge: ${levelOrNewbieBadge.name}!`,
            icon: <Award className="w-5 h-5 text-yellow-500" />,
         });
      }
      // Evitar notificação duplicada se a badge de dono de servidor for a mesma que a de nível/novato (improvável, mas seguro)
      if (serverOwnerBadgeAwardedDetails && serverOwnerBadgeAwardedDetails.id !== levelOrNewbieBadge?.id) { 
         toast("Nova Badge Desbloqueada!", {
            description: `Você ganhou a badge: ${serverOwnerBadgeAwardedDetails.name}!`,
            icon: <Award className="w-5 h-5 text-yellow-500" />,
         });
      }

      // --- Verificação de Missão "Adicione um Servidor" ---
      const addServerMissions = await Mission.filter({ "criteria.type": "add_server", is_active: true });
      for (const mission of addServerMissions) {
          const existingProgress = await UserMissionProgress.filter({ user_id: user.id, mission_id: mission.id });
          if (existingProgress.length === 0) {
            await UserMissionProgress.create({
              user_id: user.id,
              mission_id: mission.id,
              status: "completed",
              progress: { server_added_id: newServer.id }, // Guardar ID do servidor adicionado
              completed_at: new Date().toISOString()
            });
            toast.info(`Missão "${mission.title}" completada! Vá em Missões para coletar sua recompensa.`, {
                icon: <Trophy className="w-4 h-4 text-green-500"/>
            });
          } else if (existingProgress[0].status === "pending") { // Se por algum motivo já existia pendente
             await UserMissionProgress.update(existingProgress[0].id, {
                status: "completed",
                progress: { server_added_id: newServer.id },
                completed_at: new Date().toISOString()
             });
             toast.info(`Missão "${mission.title}" completada! Vá em Missões para coletar sua recompensa.`, {
                icon: <Trophy className="w-4 h-4 text-green-500"/>
            });
          }
      }
      // --- Fim da Verificação de Missão ---

      navigate(createPageUrl("Servers"));
    } catch (error) {
      console.error("Erro ao criar servidor:", error);
      toast.error("Ocorreu um erro ao enviar seu servidor para aprovação.");
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Toaster richColors position="top-right" />
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Adicionar Novo Servidor
        </h1>
        <p className="text-gray-600">
          Cadastre seu servidor FiveM e alcance mais jogadores
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="neumorphic rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Servidor *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
                placeholder="Nome do seu servidor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
              >
                <option value="roleplay">Roleplay</option>
                <option value="freeroam">Freeroam</option>
                <option value="racing">Racing</option>
                <option value="deathmatch">Deathmatch</option>
                <option value="cops_robbers">Cops & Robbers</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none resize-none"
              placeholder="Descreva seu servidor, suas características e regras..."
            />
          </div>
        </div>

        {/* Server Details */}
        <div className="neumorphic rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Detalhes do Servidor</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP do Servidor *
              </label>
              <input
                type="text"
                required
                value={formData.ip}
                onChange={(e) => handleInputChange("ip", e.target.value)}
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
                placeholder="192.168.1.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porta *
              </label>
              <input
                type="number"
                required
                value={formData.port}
                onChange={(e) => handleInputChange("port", parseInt(e.target.value))}
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
                placeholder="30120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máx. Jogadores *
              </label>
              <input
                type="number"
                required
                value={formData.max_players}
                onChange={(e) => handleInputChange("max_players", parseInt(e.target.value))}
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
                placeholder="32"
              />
            </div>
          </div>
        </div>

        {/* Links and Media */}
        <div className="neumorphic rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Links e Mídia</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
                placeholder="https://seuservidor.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discord
              </label>
              <input
                type="url"
                value={formData.discord}
                onChange={(e) => handleInputChange("discord", e.target.value)}
                className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
                placeholder="https://discord.gg/seuservidor"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner do Servidor
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0], "banner_url");
                  }
                }}
                className="hidden"
                id="banner-upload"
              />
              <label
                htmlFor="banner-upload"
                className="w-full neumorphic neumorphic-hover neumorphic-active rounded-xl px-4 py-3 text-gray-600 border-0 cursor-pointer flex items-center gap-2 justify-center"
              >
                <Upload className="w-4 h-4" />
                Enviar Banner
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo do Servidor
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0], "logo_url");
                  }
                }}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="w-full neumorphic neumorphic-hover neumorphic-active rounded-xl px-4 py-3 text-gray-600 border-0 cursor-pointer flex items-center gap-2 justify-center"
              >
                <Upload className="w-4 h-4" />
                Enviar Logo
              </label>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="neumorphic rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Tags</h2>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
              className="flex-1 neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
              placeholder="Adicionar tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="neumorphic-inset rounded-full px-3 py-1 text-sm text-gray-600 flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-8 py-4 text-gray-700 font-semibold flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Criar Servidor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
