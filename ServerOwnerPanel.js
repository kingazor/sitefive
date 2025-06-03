import React, { useState, useEffect } from "react";
import { Server, User, StoreItem, Notification as NotificationEntity } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Settings, 
  Eye, 
  Edit, 
  BarChart3, 
  Star,
  Users,
  Activity,
  Crown,
  Coins,
  PlusCircle, // Para adicionar novo item
  Package, // Para itens da loja
  Send, // Para submeter
  Upload, // Para ícone do item
  AlertTriangle,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { UploadFile } from "@/integrations/Core";

export default function ServerOwnerPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [myServers, setMyServers] = useState([]);
  const [myStoreItems, setMyStoreItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingServer, setEditingServer] = useState(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemFormData, setNewItemFormData] = useState({
    name: "",
    description: "",
    cost_coins_suggested: 100,
    server_id: "", 
    benefit_details: "",
    redemption_instructions_user: "",
    icon_url: ""
  });
  const [iconFile, setIconFile] = useState(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const servers = await Server.filter({ owner_id: user.id });
      setMyServers(servers);

      const storeItems = await StoreItem.filter({ submitted_by_user_id: user.id }, "-created_date");
      setMyStoreItems(storeItems);

      if (servers.length > 0 && !newItemFormData.server_id) {
        setNewItemFormData(prev => ({ ...prev, server_id: servers[0].id }));
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // navigate(createPageUrl("Home")); // Comentado para não redirecionar em caso de erro parcial
      toast.error("Erro ao carregar dados do painel.");
    }
    setIsLoading(false);
  };

  const handleEditServer = (server) => {
    setEditingServer(server);
  };

  const handleSaveServer = async (serverData) => {
    if (!editingServer) return;
    try {
      await Server.update(editingServer.id, serverData);
      toast.success("Servidor atualizado com sucesso!");
      setEditingServer(null);
      loadData(); // Recarrega todos os dados, incluindo servidores
    } catch (error) {
      console.error("Erro ao atualizar servidor:", error);
      toast.error("Erro ao atualizar servidor");
    }
  };

  const handleNewItemInputChange = (field, value) => {
    setNewItemFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIconFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Opcional: preview da imagem
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNewItem = async (e) => {
    e.preventDefault();
    if (!currentUser || !newItemFormData.server_id) {
        toast.error("Selecione um servidor para o benefício.");
        return;
    }
    setIsSubmittingItem(true);
    let uploadedIconUrl = newItemFormData.icon_url;

    try {
        if (iconFile) {
            const { file_url } = await UploadFile({ file: iconFile });
            uploadedIconUrl = file_url;
        }

        const itemDataToCreate = {
            ...newItemFormData,
            icon_url: uploadedIconUrl,
            type: "server_benefit", // Único tipo que donos podem submeter por agora
            submitted_by_user_id: currentUser.id,
            server_name: myServers.find(s => s.id === newItemFormData.server_id)?.name || "Servidor Desconhecido",
            admin_approved: false,
            is_active: false,
            cost_coins: 0 // Admin definirá o custo final
        };
        
        await StoreItem.create(itemDataToCreate);
        toast.success("Item submetido para aprovação!");
        setShowAddItemForm(false);
        setNewItemFormData({ // Reset form
            name: "", description: "", cost_coins_suggested: 100, server_id: myServers[0]?.id || "",
            benefit_details: "", redemption_instructions_user: "", icon_url: ""
        });
        setIconFile(null);
        loadData(); // Recarrega itens da loja
    } catch (error) {
        console.error("Erro ao submeter item:", error);
        toast.error("Erro ao submeter item para a loja.");
    }
    setIsSubmittingItem(false);
  };


  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700"
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado"
    };
    return texts[status] || "Desconhecido";
  };
  
  const getItemStatusIcon = (item) => {
    if (item.admin_approved && item.is_active) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (!item.admin_approved && !item.is_active && item.admin_rejection_reason) return <XCircleIcon className="w-5 h-5 text-red-500" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const getItemStatusText = (item) => {
    if (item.admin_approved && item.is_active) return "Aprovado e Ativo";
    if (!item.admin_approved && !item.is_active && item.admin_rejection_reason) return "Rejeitado";
    return "Pendente de Aprovação";
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-12 w-64 animate-pulse mx-auto"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="neumorphic rounded-2xl h-64 animate-pulse"></div>
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
          <Settings className="w-12 h-12 text-blue-600 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Painel do Proprietário</h1>
        <p className="text-gray-600">Gerencie seus servidores, itens da loja e veja estatísticas</p>
      </div>

      {/* Stats Overview - pode ser mantido como antes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="neumorphic rounded-2xl p-6 text-center">
          <Activity className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{myServers.length}</p>
          <p className="text-sm text-gray-500">Servidores</p>
        </div>
        <div className="neumorphic rounded-2xl p-6 text-center">
          <Package className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{myStoreItems.length}</p>
          <p className="text-sm text-gray-500">Itens na Loja</p>
        </div>
        <div className="neumorphic rounded-2xl p-6 text-center">
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {(myServers.reduce((sum, s) => sum + (s.rating_average || 0), 0) / Math.max(myServers.length, 1)).toFixed(1)}
          </p>
          <p className="text-sm text-gray-500">Média Avaliações</p>
        </div>
        <div className="neumorphic rounded-2xl p-6 text-center">
          <Users className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {myServers.reduce((sum, s) => sum + (s.current_players || 0), 0)}
          </p>
          <p className="text-sm text-gray-500">Jogadores Online</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => navigate(createPageUrl("AddServer"))}
          className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Adicionar Novo Servidor
        </button>
        <button
          onClick={() => setShowAddItemForm(true)}
          className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Sugerir Item para Loja
        </button>
        {/* ... outros botões ... */}
      </div>

      {/* My Servers List - como antes */}
      <div className="neumorphic rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Meus Servidores</h2>
        {myServers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myServers.map(server => (
              <div key={server.id} className="neumorphic-inset rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{server.name}</h3>
                    <p className="text-gray-600 text-sm">{server.category}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
                    {getStatusText(server.status)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{server.current_players || 0}/{server.max_players}</p>
                    <p className="text-xs text-gray-500">Jogadores</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{server.rating_average?.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-gray-500">Avaliação</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{server.rating_count || 0}</p>
                    <p className="text-xs text-gray-500">Avaliações</p>
                  </div>
                </div>
                {server.status === 'rejected' && server.rejection_reason && (
                  <div className="neumorphic-inset rounded-xl p-3 bg-red-50">
                    <p className="text-red-700 text-sm"><strong>Motivo da rejeição:</strong></p>
                    <p className="text-red-600 text-sm">{server.rejection_reason}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => navigate(createPageUrl(`ServerDetails?id=${server.id}`))}
                    className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-2 text-center text-gray-700 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Ver
                  </button>
                  {server.status === 'approved' && ( // Permitir edição apenas se aprovado
                    <button
                      onClick={() => handleEditServer(server)}
                      className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-2 text-center text-gray-700 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Editar
                    </button>
                  )}
                   <button
                    className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-2 text-center text-gray-700 text-sm font-medium flex items-center justify-center gap-1"
                    disabled // Funcionalidade de Stats individual por servidor não implementada
                  >
                    <BarChart3 className="w-3 h-3" /> Stats
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="neumorphic-inset rounded-2xl p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum servidor cadastrado</h3>
            <button onClick={() => navigate(createPageUrl("AddServer"))} className="mt-4 neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium">Adicionar Servidor</button>
          </div>
        )}
      </div>
      
      {/* My Store Items List */}
      <div className="neumorphic rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Meus Itens Submetidos para Loja</h2>
        {myStoreItems.length > 0 ? (
          <div className="space-y-4">
            {myStoreItems.map(item => (
              <div key={item.id} className="neumorphic-inset rounded-xl p-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div className="flex items-center gap-3">
                        {item.icon_url ? <img src={item.icon_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover neumorphic-inset p-1"/> : <Package className="w-10 h-10 text-gray-400 neumorphic-inset p-2 rounded-lg"/>}
                        <div>
                            <h4 className="font-semibold text-gray-700">{item.name}</h4>
                            <p className="text-xs text-gray-500">Servidor: {item.server_name}</p>
                            <p className="text-xs text-gray-500">Custo Sugerido: {item.cost_coins_suggested} <Coins className="inline w-3 h-3 text-yellow-500"/></p>
                            {item.admin_approved && <p className="text-xs text-gray-500">Custo Final: {item.cost_coins} <Coins className="inline w-3 h-3 text-yellow-500"/></p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        {getItemStatusIcon(item)}
                        <span>{getItemStatusText(item)}</span>
                    </div>
                </div>
                {item.admin_rejection_reason && (
                    <div className="mt-2 neumorphic-inset rounded-md p-2 bg-red-50 text-xs text-red-700">
                        <strong>Motivo da Rejeição:</strong> {item.admin_rejection_reason}
                    </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Você ainda não submeteu nenhum item para a loja.</p>
        )}
      </div>


      {/* Edit Server Modal - como antes */}
      {editingServer && (
        <EditServerModal
          server={editingServer}
          onSave={handleSaveServer}
          onCancel={() => setEditingServer(null)}
        />
      )}

      {/* Add New Store Item Modal/Form */}
      {showAddItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="neumorphic rounded-2xl p-6 max-w-lg w-full space-y-4 my-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Sugerir Novo Item para Loja</h3>
                <button onClick={() => setShowAddItemForm(false)} className="text-gray-500 hover:text-gray-700">
                    <XCircleIcon className="w-6 h-6"/>
                </button>
            </div>
            <form onSubmit={handleSubmitNewItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item *</label>
                <input type="text" required value={newItemFormData.name} onChange={(e) => handleNewItemInputChange("name", e.target.value)} className="w-full neumorphic-inset rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Item *</label>
                <textarea required value={newItemFormData.description} onChange={(e) => handleNewItemInputChange("description", e.target.value)} rows={3} className="w-full neumorphic-inset rounded-xl px-4 py-3 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servidor do Benefício *</label>
                <select required value={newItemFormData.server_id} onChange={(e) => handleNewItemInputChange("server_id", e.target.value)} className="w-full neumorphic-inset rounded-xl px-4 py-3">
                  {myServers.filter(s => s.status === 'approved').map(server => ( // Apenas servidores aprovados podem ter itens
                    <option key={server.id} value={server.id}>{server.name}</option>
                  ))}
                </select>
                {myServers.filter(s => s.status === 'approved').length === 0 && <p className="text-xs text-red-500 mt-1">Você precisa ter um servidor aprovado para adicionar um item.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes do Benefício * <span className="text-xs text-gray-500">(Ex: VIP por 7 dias, 100k Dinheiro)</span></label>
                <input type="text" required value={newItemFormData.benefit_details} onChange={(e) => handleNewItemInputChange("benefit_details", e.target.value)} className="w-full neumorphic-inset rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instruções de Resgate para o Usuário *</label>
                <textarea required value={newItemFormData.redemption_instructions_user} onChange={(e) => handleNewItemInputChange("redemption_instructions_user", e.target.value)} rows={3} className="w-full neumorphic-inset rounded-xl px-4 py-3 resize-none" placeholder="Ex: Após a compra, abra um ticket no Discord do servidor com seu código de resgate."/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo Sugerido em Moedas *</label>
                <input type="number" required min="1" value={newItemFormData.cost_coins_suggested} onChange={(e) => handleNewItemInputChange("cost_coins_suggested", parseInt(e.target.value) || 0)} className="w-full neumorphic-inset rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Ícone (Opcional)</label>
                <input type="url" value={newItemFormData.icon_url} onChange={(e) => handleNewItemInputChange("icon_url", e.target.value)} className="w-full neumorphic-inset rounded-xl px-4 py-3 mb-2" placeholder="https://exemplo.com/icone.png"/>
                <label htmlFor="icon-file-upload" className="text-sm text-gray-600 cursor-pointer neumorphic neumorphic-hover px-3 py-2 rounded-lg inline-flex items-center gap-1"><Upload className="w-4 h-4"/> Ou envie um arquivo</label>
                <input type="file" id="icon-file-upload" accept="image/*" onChange={handleIconFileChange} className="hidden" />
                {iconFile && <span className="ml-2 text-xs text-gray-500">{iconFile.name}</span>}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddItemForm(false)} className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-gray-600 font-medium">Cancelar</button>
                <button type="submit" disabled={isSubmittingItem || myServers.filter(s => s.status === 'approved').length === 0} className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-blue-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingItem ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div> Submetendo...</>) : (<><Send className="w-4 h-4"/> Submeter Item</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// EditServerModal component (manter como antes)
function EditServerModal({ server, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: server.name,
    description: server.description,
    website: server.website || "",
    discord: server.discord || "",
    // Não permitir edição de current_players aqui, deve ser dinâmico ou por outro meio
    // current_players: server.current_players || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic rounded-2xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Editar Servidor</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discord</label>
            <input
              type="url"
              value={formData.discord}
              onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
            />
          </div>
          
          {/* 
          Removido current_players, pois não deve ser editável manualmente aqui
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jogadores Online</label>
            <input
              type="number"
              min="0"
              max={server.max_players}
              value={formData.current_players}
              onChange={(e) => setFormData(prev => ({ ...prev, current_players: parseInt(e.target.value) || 0 }))}
              className="w-full neumorphic-inset rounded-xl px-4 py-3 text-gray-800 border-0 focus:outline-none"
            />
          </div> 
          */}
          
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