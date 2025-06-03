
import React, { useState, useEffect } from "react";
import { User } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";
import { Save, UserCircle, Upload, ArrowLeft, Image as ImageIcon, Star, TrendingUp, Award, Shield } from "lucide-react"; 
import { BADGES_CONFIG, checkAndAwardBadge } from "../components/xp/xpSystem"; // Caminho atualizado
import { toast, Toaster } from 'sonner'; // Importar toast para notificações

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    nickname: "",
    discord_id: "",
    steam_id: "",
    avatar_url: "",
    bio: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      setFormData({
        nickname: user.nickname || "",
        discord_id: user.discord_id || "",
        steam_id: user.steam_id || "",
        avatar_url: user.avatar_url || "",
        bio: user.bio || ""
      });
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      // Idealmente, redirecionar para login se não estiver autenticado
      navigate(createPageUrl("Home"));
    }
    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Limpar o campo avatar_url se um novo arquivo for selecionado
      setFormData(prev => ({ ...prev, avatar_url: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let finalAvatarUrl = formData.avatar_url;
    let awardedProfileBadgeDetails = null;

    try {
      if (avatarFile) {
        const { file_url } = await UploadFile({ file: avatarFile });
        finalAvatarUrl = file_url;
      }
      
      const dataToUpdate = {
        ...formData,
        avatar_url: finalAvatarUrl
      };

      await User.updateMyUserData(dataToUpdate);
      
      let userAfterUpdate = { ...currentUser, ...dataToUpdate };


      if (dataToUpdate.nickname && dataToUpdate.bio && finalAvatarUrl && 
          !userAfterUpdate.badges?.some(b => b.id === BADGES_CONFIG.PROFILE_COMPLETE_BADGE.id)) {
        
        const badge = await checkAndAwardBadge(userAfterUpdate, 'PROFILE_COMPLETE_BADGE');
        if(badge) {
            awardedProfileBadgeDetails = badge;
            // Atualizar currentUser localmente com a nova badge
             userAfterUpdate = {...userAfterUpdate, badges: [...(userAfterUpdate.badges || []), badge].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)};
        }
      }
      
      if (awardedProfileBadgeDetails) {
        toast.success("Perfil atualizado e Badge 'Perfil Completo' desbloqueada!", {
            icon: <Award className="w-5 h-5 text-yellow-500" />
        });
      } else {
        toast.success("Perfil atualizado com sucesso!");
      }
      
      setCurrentUser(userAfterUpdate); // Atualiza o estado local com todas as mudanças, incluindo a nova badge se houver
      // loadUserProfile(); // Não é estritamente necessário se atualizarmos o currentUser localmente
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar perfil. Tente novamente.");
    }
    setIsSaving(false);
  };

  if (isLoading || !currentUser) { // Adicionado !currentUser para cobrir o caso de não ter carregado ainda
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-12 w-32 animate-pulse"></div>
        <div className="neumorphic rounded-2xl h-64 animate-pulse"></div>
        <div className="neumorphic rounded-2xl h-48 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Toaster richColors position="top-right" />
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(createPageUrl("Home"))} // Ou para uma página de perfil, se existir
          className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-4 py-2 flex items-center gap-2 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-800 text-center flex-1">
          Editar Perfil
        </h1>
      </div>
      
      {/* Profile Stats Section */}
      <div className="neumorphic rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <TrendingUp className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{currentUser.level || 1}</p>
          <p className="text-sm text-gray-500">Nível</p>
        </div>
        <div>
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{currentUser.xp || 0}</p>
          <p className="text-sm text-gray-500">XP</p>
        </div>
        <div>
          <Award className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{currentUser.badges?.length || 0}</p>
          <p className="text-sm text-gray-500">Badges</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Section */}
        <div className="neumorphic rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Foto de Perfil</h2>
          <div className="w-32 h-32 mx-auto neumorphic-inset rounded-full flex items-center justify-center overflow-hidden mb-4">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-20 h-20 text-gray-400" />
            )}
          </div>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleAvatarFileChange}
            className="hidden"
          />
          <label
            htmlFor="avatar-upload"
            className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 cursor-pointer inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Trocar Avatar
          </label>
          <div className="mt-4">
            <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">Ou cole a URL da imagem:</label>
            <input
              type="url"
              id="avatar_url"
              value={formData.avatar_url}
              onChange={(e) => {
                  handleInputChange("avatar_url", e.target.value);
                  if (e.target.value) setAvatarPreview(e.target.value); // Preview URL
                  setAvatarFile(null); // Clear file if URL is pasted
              }}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>
        </div>

        {/* User Information */}
        <div className="neumorphic rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Informações Pessoais</h2>
          
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
            <input
              type="text"
              id="nickname"
              value={formData.nickname}
              onChange={(e) => handleInputChange("nickname", e.target.value)}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
              placeholder="Seu nickname no FiveM"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              rows={3}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none resize-none"
              placeholder="Fale um pouco sobre você..."
            />
          </div>
        </div>

        {/* Social IDs */}
        <div className="neumorphic rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Conexões Sociais</h2>
          
          <div>
            <label htmlFor="discord_id" className="block text-sm font-medium text-gray-700 mb-1">Discord ID</label>
            <input
              type="text"
              id="discord_id"
              value={formData.discord_id}
              onChange={(e) => handleInputChange("discord_id", e.target.value)}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
              placeholder="SeuNome#1234"
            />
          </div>

          <div>
            <label htmlFor="steam_id" className="block text-sm font-medium text-gray-700 mb-1">Steam ID</label>
            <input
              type="text"
              id="steam_id"
              value={formData.steam_id}
              onChange={(e) => handleInputChange("steam_id", e.target.value)}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 focus:outline-none"
              placeholder="Seu ID numérico da Steam"
            />
          </div>
        </div>

        {/* Badges Section */}
        {currentUser.badges && currentUser.badges.length > 0 && (
            <div className="neumorphic rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Minhas Badges</h2>
                <div className="flex flex-wrap gap-4">
                    {currentUser.badges.map(badge => {
                        // Tentar importar dinamicamente ou mapear o nome do ícone para o componente Lucide.
                        // Por simplicidade, usaremos Shield como fallback se o ícone não for encontrado.
                        // Em uma implementação real, você teria um mapeamento de badge.icon para componentes Icon.
                        // Ex: const IconComponent = LucideIcons[badge.icon] || Shield;
                        const IconComponent = Shield; // Placeholder - idealmente, mapear para ícones reais
                        
                        return (
                            <div key={badge.id} title={badge.description} className="neumorphic-inset rounded-xl p-3 flex flex-col items-center w-28 text-center cursor-default">
                                <IconComponent className={`w-8 h-8 mb-1`} style={{color: badge.color || '#6b7280'}} />
                                <span className="text-xs font-medium text-gray-700 truncate w-full">{badge.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={isSaving}
            className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-8 py-4 text-gray-700 font-semibold flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
