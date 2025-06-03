import React, { useState, useEffect } from "react";
import { User, Server, StoreItem, Notification as NotificationEntity, Mission } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ShieldCheck,
  ListChecks,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  PackagePlus,
  Coins,
  Edit2,
  Award,
  PlusCircle,
  Trash2,
  Users as UsersIcon, // Renomeado para evitar conflito com entidade User
  MapPin,
  Ban,
  UserPlus,
  Crown,
  Search
} from "lucide-react";
import { toast, Toaster } from "sonner";

// Componente para o formulário de Missão
function MissionForm({ mission, onSave, onCancel }) {
    const [formData, setFormData] = useState(
        mission ? {
            ...mission,
            criteria: typeof mission.criteria === 'string' ? mission.criteria : JSON.stringify(mission.criteria || { type: "", count: 0 }, null, 2),
            expires_at: mission.expires_at ? mission.expires_at.split('T')[0] : "" // Ensure YYYY-MM-DD for date input
        } : {
            title: "",
            description: "",
            type: "achievement",
            xp_reward: 0,
            coins_reward: 0,
            badge_reward: "",
            criteria: JSON.stringify({ type: "", count: 0 }, null, 2), // Default com pretty print
            is_active: true,
            expires_at: ""
        }
    );
    const [criteriaError, setCriteriaError] = useState("");

    useEffect(() => {
        if (mission) {
            setFormData({
                ...mission,
                criteria: typeof mission.criteria === 'string' ? mission.criteria : JSON.stringify(mission.criteria || { type: "", count: 0 }, null, 2),
                expires_at: mission.expires_at ? mission.expires_at.split('T')[0] : ""
            });
        }
    }, [mission]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "criteria") {
            setCriteriaError(""); // Limpa erro ao digitar
        }
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setCriteriaError("");
        let criteriaObject;
        try {
            criteriaObject = JSON.parse(formData.criteria);
            if (typeof criteriaObject !== 'object' || criteriaObject === null) {
                throw new Error("Critérios devem ser um objeto JSON válido.");
            }
        } catch (err) {
            setCriteriaError("Formato JSON inválido para os Critérios. Ex: {\"type\":\"exemplo\"}");
            toast.error("JSON inválido nos Critérios.");
            return;
        }

        // Prepara os dados para salvar, tratando expires_at
        const dataToSave = { ...formData, criteria: criteriaObject };
        if (!dataToSave.expires_at) { // Se expires_at for string vazia ou null
            delete dataToSave.expires_at; // Remove para não enviar como null string
        }
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="neumorphic rounded-2xl p-6 max-w-2xl w-full space-y-4 my-8">
                <h3 className="text-xl font-bold text-gray-800">{mission ? "Editar Missão" : "Nova Missão"}</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                        <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full neumorphic-inset rounded-xl px-4 py-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                        <textarea name="description" required value={formData.description} onChange={handleChange} rows={3} className="w-full neumorphic-inset rounded-xl px-4 py-3 resize-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                            <select name="type" required value={formData.type} onChange={handleChange} className="w-full neumorphic-inset rounded-xl px-4 py-3">
                                <option value="achievement">Achievement</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="special">Special</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ativa</label>
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="mt-2 h-5 w-5 neumorphic-inset rounded"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">XP Recompensa</label>
                            <input type="number" name="xp_reward" value={formData.xp_reward} onChange={handleChange} className="w-full neumorphic-inset rounded-xl px-4 py-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Moedas Recompensa</label>
                            <input type="number" name="coins_reward" value={formData.coins_reward} onChange={handleChange} className="w-full neumorphic-inset rounded-xl px-4 py-3" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Badge Recompensa (ID da Badge - Opcional)</label>
                        <input type="text" name="badge_reward" value={formData.badge_reward} onChange={handleChange} className="w-full neumorphic-inset rounded-xl px-4 py-3" placeholder="Ex: newbie, level_5"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Critérios (JSON) *</label>
                        <textarea
                            name="criteria"
                            required
                            value={formData.criteria}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full neumorphic-inset rounded-xl px-4 py-3 font-mono text-xs resize-none ${criteriaError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                            placeholder='{ "type": "rate_servers", "count": 5 }'
                        />
                        {criteriaError && <p className="text-xs text-red-500 mt-1">{criteriaError}</p>}
                        <p className="text-xs text-gray-500 mt-1">Ex: {`{"type":"complete_profile"}`}, {`{"type":"reach_level", "level":5}`}, {`{"type":"daily_login"}`}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expira em (Opcional)</label>
                        <input type="date" name="expires_at" value={formData.expires_at} onChange={handleChange} className="w-full neumorphic-inset rounded-xl px-4 py-3"/>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-gray-600 font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-blue-600 font-medium">Salvar Missão</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("serverRequests");

  // Estados existentes
  const [pendingServers, setPendingServers] = useState([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedServerForReason, setSelectedServerForReason] = useState(null);

  const [pendingStoreItems, setPendingStoreItems] = useState([]);
  const [isLoadingStoreItems, setIsLoadingStoreItems] = useState(false);
  const [itemApprovalData, setItemApprovalData] = useState({ id: null, cost_coins: 0, rejection_reason: "" });

  const [missions, setMissions] = useState([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);

  // Novos estados para gerenciamento de usuários
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      if (activeTab === 'serverRequests') {
        loadPendingServers();
      } else if (activeTab === 'storeRequests') {
        loadPendingStoreItems();
      } else if (activeTab === 'manageMissions') {
        loadAllMissions();
      } else if (activeTab === 'manageUsers') {
        loadAllUsers();
      }
    }
  }, [currentUser, activeTab]);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      if (user.role !== 'admin') {
        navigate(createPageUrl("Home"));
      }
    } catch (error) {
      console.error("Erro ao verificar status de admin:", error);
      navigate(createPageUrl("Home"));
    }
    setIsLoading(false);
  };

  const loadPendingServers = async () => {
    setIsLoadingServers(true);
    try {
      const servers = await Server.filter({ status: "pending" });
      setPendingServers(servers);
    } catch (error) {
      console.error("Erro ao carregar servidores pendentes:", error);
      toast.error("Falha ao carregar servidores pendentes.");
    }
    setIsLoadingServers(false);
  };

  const loadPendingStoreItems = async () => {
    setIsLoadingStoreItems(true);
    try {
      const items = await StoreItem.filter({ admin_approved: false, admin_rejection_reason: null }); // Carrega itens não aprovados E não rejeitados ainda
      setPendingStoreItems(items);
    } catch (error) {
      console.error("Erro ao carregar itens pendentes da loja:", error);
      toast.error("Falha ao carregar itens da loja pendentes.");
    }
    setIsLoadingStoreItems(false);
  };

  const loadAllMissions = async () => {
    setIsLoadingMissions(true);
    try {
        const allMissionsData = await Mission.list("-created_date"); 
        setMissions(allMissionsData);
    } catch (error) {
        console.error("Erro ao carregar missões:", error);
        toast.error("Falha ao carregar missões.");
    }
    setIsLoadingMissions(false);
  };

  const handleServerAction = async (serverId, action, reason = "") => {
    let newStatus = "";
    let newIsActive = false;
    let notificationTitle = "";
    let notificationMessage = "";

    if (action === "approve") {
      newStatus = "approved";
      newIsActive = true;
      notificationTitle = "Seu servidor foi aprovado!";
      notificationMessage = `O servidor que você submeteu foi aprovado e está listado!`;
    } else if (action === "reject") {
      newStatus = "rejected";
      notificationTitle = "Atualização sobre seu servidor";
      notificationMessage = `O servidor que você submeteu foi rejeitado. Motivo: ${reason || 'Não especificado.'}`;
    } else {
      return;
    }

    try {
      const serverToUpdate = await Server.get(serverId);
      if (!serverToUpdate) {
          toast.error("Servidor não encontrado.");
          return;
      }

      await Server.update(serverId, { status: newStatus, is_active: newIsActive, rejection_reason: reason });

      await NotificationEntity.create({
          user_id: serverToUpdate.owner_id,
          title: notificationTitle,
          message: notificationMessage,
          type: action === "approve" ? "server_approved" : "server_rejected",
          data: { server_id: serverId, server_name: serverToUpdate.name }
      });

      toast.success(`Servidor ${action === "approve" ? 'aprovado' : 'rejeitado'} com sucesso!`);
      loadPendingServers();
      if (selectedServerForReason === serverId) {
          setSelectedServerForReason(null);
          setRejectionReason("");
      }
    } catch (error) {
      console.error(`Erro ao ${action} servidor:`, error);
      toast.error(`Falha ao ${action} o servidor.`);
    }
  };

  const handleStoreItemAction = async (itemId, action) => {
    let updatePayload = {};
    let notificationTitle = "";
    let notificationMessage = "";

    const itemToUpdate = pendingStoreItems.find(item => item.id === itemId);
    if(!itemToUpdate) {
        toast.error("Item não encontrado.");
        return;
    }

    if (action === "approve") {
        if (!itemApprovalData.cost_coins || itemApprovalData.cost_coins <= 0) {
            toast.error("Por favor, defina um custo em moedas válido para aprovar.");
            return;
        }
        updatePayload = {
            admin_approved: true,
            is_active: true,
            cost_coins: itemApprovalData.cost_coins,
            admin_rejection_reason: null // Limpar motivo de rejeição anterior
        };
        notificationTitle = "Seu item da loja foi aprovado!";
        notificationMessage = `O item "${itemToUpdate.name}" foi aprovado e está disponível na loja por ${itemApprovalData.cost_coins} moedas.`;
    } else if (action === "reject") {
        if (!itemApprovalData.rejection_reason) {
            toast.error("Por favor, forneça um motivo para a rejeição.");
            return;
        }
        updatePayload = {
            admin_approved: false,
            is_active: false,
            admin_rejection_reason: itemApprovalData.rejection_reason
        };
        notificationTitle = `Atualização sobre seu item "${itemToUpdate.name}"`;
        notificationMessage = `O item "${itemToUpdate.name}" foi rejeitado. Motivo: ${itemApprovalData.rejection_reason}`;
    } else {
      return;
    }

    try {
      await StoreItem.update(itemId, updatePayload);

      await NotificationEntity.create({
          user_id: itemToUpdate.submitted_by_user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: "general", // Poderia ser um tipo específico como "store_item_update"
          data: { item_id: itemId, item_name: itemToUpdate.name }
      });

      toast.success(`Item ${action === "approve" ? 'aprovado' : 'rejeitado'} com sucesso!`);
      loadPendingStoreItems();
      setItemApprovalData({ id: null, cost_coins: 0, rejection_reason: "" }); // Reset form
    } catch (error) {
      console.error(`Erro ao ${action} item da loja:`, error);
      toast.error(`Falha ao ${action} o item da loja.`);
    }
  };

  const startItemApproval = (item) => {
    setItemApprovalData({ id: item.id, cost_coins: item.cost_coins_suggested || 50, rejection_reason: "" });
  };

  const handleSaveMission = async (missionData) => {
    try {
      let savedMission;
      // A validação do JSON e a conversão para objeto já foram feitas no handleSubmit do MissionForm
      // A variável missionData já deve vir com criteria como objeto.

      const dataToSave = { ...missionData };
      // Se expires_at for string vazia ou não definido, garantir que não seja enviado ou seja null.
      // O SDK deve lidar com a conversão para ISOString se for uma data válida.
      // Por segurança, é melhor enviar um formato que o backend espera (ISOString).
      if (dataToSave.expires_at === "" || !dataToSave.expires_at) {
          delete dataToSave.expires_at;
      } else {
          const d = new Date(dataToSave.expires_at);
          if (!isNaN(d.valueOf())) { // Check if date is valid
            dataToSave.expires_at = d.toISOString();
          } else {
            // Se a data for inválida após a tentativa de conversão, não envie ou envie null.
            delete dataToSave.expires_at;
            toast.warn("Data de expiração inválida, não será salva.");
          }
      }

      if (editingMission && editingMission.id) {
        savedMission = await Mission.update(editingMission.id, dataToSave);
        toast.success("Missão atualizada com sucesso!");
      } else {
        savedMission = await Mission.create(dataToSave);
        toast.success("Missão criada com sucesso!");
      }
      setEditingMission(null);
      setShowMissionForm(false);
      loadAllMissions();
    } catch (error) {
      console.error("Erro ao salvar missão:", error);
      let errorMessage = "Falha ao salvar missão.";
      if (error.message && typeof error.message === 'string' && error.message.toLowerCase().includes("json")) {
          errorMessage = "Erro nos dados da missão (possivelmente JSON de critérios). Verifique e tente novamente.";
      }
      toast.error(errorMessage);
    }
  };

  const handleDeleteMission = async (missionId) => {
    if (window.confirm("Tem certeza que deseja excluir esta missão?")) {
        try {
            await Mission.delete(missionId); // Corrigido para Mission.delete
            toast.success("Missão excluída com sucesso!");
            loadAllMissions();
        } catch (error) {
            console.error("Erro ao excluir missão:", error);
            toast.error("Falha ao excluir missão.");
        }
    }
  };

  // Novas funções para gerenciamento de usuários
  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await User.list("-created_date");
      setAllUsers(users);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Falha ao carregar usuários.");
    }
    setIsLoadingUsers(false);
  };

  const handleUserEdit = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleUserSave = async (userData) => {
    try {
      if (editingUser && editingUser.id) {
        await User.update(editingUser.id, userData);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        // Para criar usuário seria necessário um endpoint específico de admin
        toast.info("Criação de usuários deve ser feita via convite.");
      }
      setEditingUser(null);
      setShowUserForm(false);
      loadAllUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Falha ao salvar usuário.");
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      try {
        await User.delete(userId); // Corrigido para User.delete
        toast.success("Usuário excluído com sucesso!");
        loadAllUsers();
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        toast.error("Falha ao excluir usuário.");
      }
    }
  };

  const handleUserRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await User.update(user.id, { role: newRole });
      toast.success(`Usuário ${newRole === 'admin' ? 'promovido a' : 'removido de'} administrador!`);
      loadAllUsers();
    } catch (error) {
      console.error("Erro ao alterar role do usuário:", error);
      toast.error("Falha ao alterar permissões do usuário.");
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.nickname?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  if (isLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return <p className="text-center text-red-500">Acesso negado.</p>;
  }

  return (
    <div className="space-y-8">
      <Toaster richColors position="top-right" />
      <div className="text-center">
        <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4 neumorphic-inset rounded-full p-3" />
        <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
        <p className="text-gray-600">Gerenciamento completo do FiveM Manager</p>
      </div>

      {/* Tabs de navegação expandidas */}
      <div className="neumorphic rounded-2xl p-2 grid grid-cols-2 md:grid-cols-5 gap-2 max-w-6xl mx-auto">
        <button
          onClick={() => setActiveTab("serverRequests")}
          className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "serverRequests"
              ? "neumorphic-pressed text-blue-600"
              : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
          }`}
        >
          <ListChecks className="w-5 h-5" />
          <span className="hidden sm:inline">Servidores ({pendingServers.length})</span>
          <span className="sm:hidden">{pendingServers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("storeRequests")}
          className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "storeRequests"
              ? "neumorphic-pressed text-blue-600"
              : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
          }`}
        >
          <PackagePlus className="w-5 h-5" />
          <span className="hidden sm:inline">Loja ({pendingStoreItems.length})</span>
          <span className="sm:hidden">{pendingStoreItems.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("manageMissions")}
          className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "manageMissions"
              ? "neumorphic-pressed text-blue-600"
              : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="hidden sm:inline">Missões ({missions.length})</span>
          <span className="sm:hidden">{missions.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("manageUsers")}
          className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "manageUsers"
              ? "neumorphic-pressed text-blue-600"
              : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
          }`}
        >
          <UsersIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Usuários ({allUsers.length})</span>
          <span className="sm:hidden">{allUsers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("appSettings")}
          className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "appSettings"
              ? "neumorphic-pressed text-blue-600"
              : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="hidden sm:inline">Config</span>
          <span className="sm:hidden">⚙️</span>
        </button>
      </div>

      {activeTab === "serverRequests" && (
        <div className="neumorphic rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Servidores Pendentes de Aprovação ({pendingServers.length})
          </h2>
          {isLoadingServers ? (
            <p className="text-center py-4">Carregando servidores...</p>
          ) : pendingServers.length > 0 ? (
            <div className="space-y-4">
              {pendingServers.map(server => (
                <div key={server.id} className="neumorphic-inset rounded-xl p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-semibold text-gray-700">{server.name}</h3>
                            <p className="text-sm text-gray-500">IP: {server.ip}:{server.port} | Cat: {server.category}</p>
                            <p className="text-xs text-gray-500">Enviado em: {new Date(server.created_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0 flex-wrap">
                            <button onClick={() => navigate(createPageUrl(`ServerDetails?id=${server.id}`))} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-blue-600 flex items-center gap-1" title="Ver Detalhes"><Eye className="w-3 h-3" /> Detalhes</button>
                            <button onClick={() => handleServerAction(server.id, "approve")} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aprovar</button>
                            <button onClick={() => setSelectedServerForReason(server.id)} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejeitar</button>
                        </div>
                    </div>
                    {selectedServerForReason === server.id && (
                        <div className="w-full mt-3 md:flex md:items-end md:gap-2">
                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Motivo da rejeição (obrigatório)..." rows={2} className="w-full md:flex-1 neumorphic-inset rounded-xl px-3 py-2 text-sm"/>
                            <button onClick={() => rejectionReason.trim() ? handleServerAction(server.id, "reject", rejectionReason) : toast.error("Motivo da rejeição é obrigatório.")} className="mt-2 md:mt-0 neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-red-700 bg-red-100">Confirmar Rejeição</button>
                        </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">Nenhum servidor pendente.</p>
          )}
        </div>
      )}

      {activeTab === "storeRequests" && (
        <div className="neumorphic rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Itens da Loja Pendentes de Aprovação ({pendingStoreItems.length})
          </h2>
          {isLoadingStoreItems ? (
            <p className="text-center py-4">Carregando itens...</p>
          ) : pendingStoreItems.length > 0 ? (
            <div className="space-y-4">
              {pendingStoreItems.map(item => (
                <div key={item.id} className="neumorphic-inset rounded-xl p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            {item.icon_url ? <img src={item.icon_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover neumorphic-inset p-1"/> : <PackagePlus className="w-12 h-12 text-gray-400 neumorphic-inset p-2 rounded-lg"/>}
                            <div>
                                <h3 className="font-semibold text-gray-700">{item.name}</h3>
                                <p className="text-sm text-gray-500">Servidor: {item.server_name || "N/A"}</p>
                                <p className="text-xs text-gray-500">Sugerido: {item.cost_coins_suggested || 0} <Coins className="inline w-3 h-3 text-yellow-500"/></p>
                                <p className="text-xs text-gray-500">Submetido em: {new Date(item.created_date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                         <div className="flex gap-2 mt-3 md:mt-0 flex-wrap">
                            <button onClick={() => startItemApproval(item)} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-blue-600 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Analisar</button>
                        </div>
                    </div>

                    {itemApprovalData.id === item.id && (
                        <div className="mt-4 neumorphic-inset rounded-lg p-4 bg-gray-50 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Definir Custo em Moedas *</label>
                                <input type="number" min="1" value={itemApprovalData.cost_coins} onChange={(e) => setItemApprovalData(prev => ({...prev, cost_coins: parseInt(e.target.value) || 0}))} className="w-full md:w-1/2 neumorphic-inset rounded-xl px-3 py-2 text-sm"/>
                            </div>
                            <button onClick={() => handleStoreItemAction(item.id, "approve")} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aprovar Item</button>
                            <hr className="my-3 border-gray-300/50"/>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Rejeição (se aplicável) *</label>
                                <textarea value={itemApprovalData.rejection_reason} onChange={(e) => setItemApprovalData(prev => ({...prev, rejection_reason: e.target.value}))} placeholder="Motivo da rejeição..." rows={2} className="w-full neumorphic-inset rounded-xl px-3 py-2 text-sm"/>
                            </div>
                            <button onClick={() => handleStoreItemAction(item.id, "reject")} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejeitar Item</button>
                        </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">Nenhum item pendente.</p>
          )}
        </div>
      )}

      {activeTab === "manageMissions" && (
        <div className="neumorphic rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    Missões ({missions.length})
                </h2>
                <button onClick={() => { setShowMissionForm(true); setEditingMission(null); }} className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-4 py-2 text-blue-600 font-medium flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" /> Nova Missão
                </button>
            </div>
            {isLoadingMissions ? (
                <p className="text-center py-4">Carregando missões...</p>
            ) : missions.length > 0 ? (
                <div className="space-y-4">
                    {missions.map(mission => (
                        <div key={mission.id} className="neumorphic-inset rounded-xl p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700">{mission.title} ({mission.type})</h3>
                                    <p className="text-sm text-gray-500">{mission.description}</p>
                                    <p className="text-xs text-gray-500">Recompensa: {mission.xp_reward} XP, {mission.coins_reward} Moedas {mission.badge_reward && `(Badge: ${mission.badge_reward})`}</p>
                                    <p className="text-xs text-gray-500">Ativa: {mission.is_active ? 'Sim' : 'Não'}</p>
                                    {mission.expires_at && <p className="text-xs text-gray-500">Expira em: {new Date(mission.expires_at).toLocaleDateString('pt-BR')}</p>}
                                    <p className="text-xs text-gray-500">Critérios: {JSON.stringify(mission.criteria)}</p>
                                </div>
                                <div className="flex gap-2 mt-3 md:mt-0 flex-wrap">
                                    <button onClick={() => { setShowMissionForm(true); setEditingMission(mission); }} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-blue-600 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Editar</button>
                                    <button onClick={() => handleDeleteMission(mission.id)} className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Excluir</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-6">Nenhuma missão cadastrada.</p>
            )}
        </div>
      )}

      {/* Nova aba de gerenciamento de usuários */}
      {activeTab === "manageUsers" && (
        <div className="neumorphic rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Gerenciar Usuários ({filteredUsers.length})
            </h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="neumorphic-inset rounded-xl pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {isLoadingUsers ? (
            <p className="text-center py-4">Carregando usuários...</p>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="neumorphic-inset rounded-xl p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 neumorphic rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">
                          {user.full_name || user.nickname || 'Usuário sem nome'}
                          {user.role === 'admin' && <Crown className="inline w-4 h-4 text-yellow-500 ml-2" />}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>Nível: {user.level || 1}</span>
                          <span>XP: {user.xp || 0}</span>
                          <span>Moedas: {user.coins || 0}</span>
                          <span>Membro desde: {new Date(user.created_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 md:mt-0 flex-wrap">
                      <button
                        onClick={() => handleUserEdit(user)}
                        className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-blue-600 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => handleUserRoleToggle(user)}
                        className={`neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs flex items-center gap-1 ${
                          user.role === 'admin' ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        <Crown className="w-3 h-3" />
                        {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                      </button>
                      <button
                        onClick={() => handleUserDelete(user.id)}
                        className="neumorphic neumorphic-hover neumorphic-active rounded-lg px-3 py-2 text-xs text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">Nenhum usuário encontrado.</p>
          )}
        </div>
      )}

      {activeTab === "appSettings" && (
        <div className="neumorphic rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Configurações Gerais</h2>
          <div className="neumorphic-inset rounded-xl p-8 text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Configurações do app serão adicionadas aqui.</p>
          </div>
        </div>
      )}

      {showMissionForm && (
        <MissionForm
          mission={editingMission}
          onSave={handleSaveMission}
          onCancel={() => { setShowMissionForm(false); setEditingMission(null); }}
        />
      )}

      {/* Modal de edição de usuário */}
      {showUserForm && editingUser && (
        <UserEditModal
          user={editingUser}
          onSave={handleUserSave}
          onCancel={() => { setShowUserForm(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}

// Componente para modal de edição de usuário
function UserEditModal({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    nickname: user.nickname || "",
    bio: user.bio || "",
    role: user.role || "user",
    xp: user.xp || 0,
    level: user.level || 1,
    coins: user.coins || 0,
    is_server_owner: user.is_server_owner || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic rounded-2xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Editar Usuário</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full neumorphic-inset rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              className="w-full neumorphic-inset rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full neumorphic-inset rounded-xl px-4 py-3"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
              <input
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                className="w-full neumorphic-inset rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">XP</label>
              <input
                type="number"
                min="0"
                value={formData.xp}
                onChange={(e) => setFormData(prev => ({ ...prev, xp: parseInt(e.target.value) || 0 }))}
                className="w-full neumorphic-inset rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moedas</label>
              <input
                type="number"
                min="0"
                value={formData.coins}
                onChange={(e) => setFormData(prev => ({ ...prev, coins: parseInt(e.target.value) || 0 }))}
                className="w-full neumorphic-inset rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_server_owner"
              checked={formData.is_server_owner}
              onChange={(e) => setFormData(prev => ({ ...prev, is_server_owner: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="is_server_owner" className="text-sm text-gray-700">
              É proprietário de servidor
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-gray-600 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-blue-600 font-medium"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}