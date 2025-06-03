
import React, { useState, useEffect } from "react";
import { StoreItem, User, UserPurchase, UserMissionProgress, Mission } from "@/entities/all"; // Adicionar UserMissionProgress e Mission
import { ShoppingCart, Coins, Gift, CheckCircle, Info, ShieldCheck } from "lucide-react";
import { toast, Toaster } from "sonner";
import { createPageUrl } from "@/utils"; // Para navegação se necessário
import { useNavigate } from "react-router-dom";

// Função para gerar um código de resgate simples
const generateRedemptionCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export default function Store() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Para modal de confirmação
  const [activeTab, setActiveTab] = useState("all"); // Ex: 'all', 'server_benefit', 'app_cosmetic'

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me().catch(() => null);
      setCurrentUser(user);
      
      // Apenas itens ativos e aprovados pelo admin
      const storeItemsData = await StoreItem.filter({ is_active: true, admin_approved: true });
      setItems(storeItemsData);
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
      toast.error("Não foi possível carregar os itens da loja.");
    }
    setIsLoading(false);
  };

  const handlePurchase = async (item) => {
    if (!currentUser) {
      toast.error("Você precisa estar logado para comprar.");
      navigate(createPageUrl("Home")); // Ou abrir modal de login
      return;
    }
    if (currentUser.coins < item.cost_coins) {
      toast.error("Moedas insuficientes.");
      return;
    }
    if (item.stock === 0) {
      toast.error("Este item está fora de estoque.");
      return;
    }

    setSelectedItem(item); // Abre modal de confirmação
  };

  const confirmPurchase = async () => {
    if (!selectedItem || isLoadingPurchase) return;

    setIsLoadingPurchase(true);
    try {
      const newCoins = currentUser.coins - selectedItem.cost_coins;
      const redemptionCode = selectedItem.type === 'server_benefit' ? generateRedemptionCode() : null;

      // Atualiza moedas do usuário
      await User.updateMyUserData({ coins: newCoins });
      
      // Cria registro da compra
      const purchaseData = {
        user_id: currentUser.id,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        purchase_date: new Date().toISOString(),
        coins_spent: selectedItem.cost_coins,
        redemption_code: redemptionCode,
        status: selectedItem.type === 'server_benefit' ? 'pending_redemption' : 'app_item_active'
      };
      const newPurchase = await UserPurchase.create(purchaseData);

      // Atualiza estoque do item se não for ilimitado
      if (selectedItem.stock > 0) {
        await StoreItem.update(selectedItem.id, { stock: selectedItem.stock - 1 });
      }

      setCurrentUser(prev => ({ ...prev, coins: newCoins }));
      toast.success(<>
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500 w-5 h-5"/> Compra realizada com sucesso!
        </div>
        {redemptionCode && <p className="text-xs mt-1">Seu código: <strong className="font-mono">{redemptionCode}</strong>. Verifique 'Minhas Compras' para detalhes.</p>}
      </>);
      
      // Recarrega itens da loja para atualizar estoque visualmente
      const storeItemsData = await StoreItem.filter({ is_active: true, admin_approved: true });
      setItems(storeItemsData);

      // --- Lógica para Missão "Primeira Compra" ---
      const existingPurchases = await UserPurchase.filter({user_id: currentUser.id});
      // The current purchase has just been created. If existingPurchases.length is 1, it implies this IS the first one for the user.
      if (existingPurchases.length === 1) { 
        const firstPurchaseMission = await Mission.filter({ "criteria.type": "first_purchase", is_active: true });
        if (firstPurchaseMission.length > 0) {
          const mission = firstPurchaseMission[0];
          const existingProgress = await UserMissionProgress.filter({ user_id: currentUser.id, mission_id: mission.id });
          if (existingProgress.length === 0) { // If no existing progress, create a completed one
            await UserMissionProgress.create({
              user_id: currentUser.id,
              mission_id: mission.id,
              status: "completed",
              progress: { purchased: true }, // Progresso simples para este tipo
              completed_at: new Date().toISOString()
            });
            toast.info(`Missão "${mission.title}" completada! Vá em Missões para coletar sua recompensa.`, {
                icon: <Gift className="w-4 h-4 text-purple-500"/>
            });
          }
        }
      }
      // --- Fim da Lógica para Missão "Primeira Compra" ---

    } catch (error) {
      console.error("Erro ao processar compra:", error);
      toast.error("Ocorreu um erro ao processar sua compra.");
    }
    setIsLoadingPurchase(false);
    setSelectedItem(null); // Fecha modal
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'server_benefit':
        return <ShieldCheck className="w-6 h-6 text-green-500" />;
      case 'app_cosmetic':
        return <Gift className="w-6 h-6 text-purple-500" />;
      case 'xp_booster':
        return <Coins className="w-6 h-6 text-yellow-500" />; // Reutilizando Coins
      default:
        return <ShoppingCart className="w-6 h-6 text-blue-500" />;
    }
  };

  const filteredItems = items.filter(item => activeTab === "all" || item.type === activeTab);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-12 w-64 animate-pulse mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="neumorphic rounded-2xl h-72 animate-pulse"></div>
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
          <ShoppingCart className="w-12 h-12 text-blue-600 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Loja de Recompensas</h1>
        <p className="text-gray-600">Use suas FiveMCoins para resgatar itens exclusivos!</p>
        {currentUser && (
          <div className="mt-4 neumorphic rounded-full px-4 py-2 inline-flex items-center gap-2 text-lg font-semibold text-yellow-600">
            <Coins className="w-6 h-6" /> {currentUser.coins}
          </div>
        )}
      </div>

      {/* Tabs de Filtro */}
      <div className="neumorphic rounded-2xl p-2 flex justify-center gap-2 max-w-lg mx-auto">
        {[
            { key: "all", label: "Todos" },
            { key: "server_benefit", label: "Benefícios em Servidores" },
            { key: "app_cosmetic", label: "Cosméticos do App" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "neumorphic-pressed text-blue-600"
                : "neumorphic neumorphic-hover neumorphic-active text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="neumorphic neumorphic-hover rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="neumorphic-inset rounded-xl p-4 mb-4 flex items-center justify-center h-24">
                {item.icon_url ? (
                    <img src={item.icon_url} alt={item.name} className="max-h-full max-w-full object-contain"/>
                ) : (
                    getItemIcon(item.type)
                )}
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{item.name}</h3>
              {item.type === 'server_benefit' && item.server_name && (
                  <p className="text-xs text-blue-600 mb-2">Para: {item.server_name}</p>
              )}
              <p className="text-gray-600 text-sm mb-3 h-20 overflow-y-auto line-clamp-4">{item.description}</p>
              {item.benefit_details && (
                  <p className="text-gray-500 text-xs mb-3">Detalhes: {item.benefit_details}</p>
              )}
            </div>
            
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                  <Coins className="w-5 h-5" /> {item.cost_coins}
                </div>
                <span className="text-xs text-gray-500">
                  {item.stock === -1 ? "Ilimitado" : `${item.stock} em estoque`}
                </span>
              </div>
              <button
                onClick={() => handlePurchase(item)}
                disabled={isLoadingPurchase || (item.stock === 0) || (currentUser && currentUser.coins < item.cost_coins)}
                className="w-full neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-gray-700 font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                Comprar
              </button>
            </div>
          </div>
        ))}
      </div>
      {filteredItems.length === 0 && !isLoading && (
         <div className="neumorphic-inset rounded-2xl p-12 text-center col-span-full">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum item disponível nesta categoria.
            </h3>
            <p className="text-gray-500">Volte mais tarde ou confira outras seções!</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic rounded-2xl p-6 max-w-md w-full space-y-6">
            <div className="flex items-start gap-3">
                <div className="neumorphic-inset rounded-lg p-2 mt-1">
                    {selectedItem.icon_url ? <img src={selectedItem.icon_url} alt={selectedItem.name} className="w-8 h-8 object-contain"/> : getItemIcon(selectedItem.type)}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Confirmar Compra</h3>
                    <p className="text-gray-700 mt-1">Você está prestes a comprar "{selectedItem.name}".</p>
                </div>
            </div>

            <div className="neumorphic-inset rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Item:</span>
                    <span className="font-medium text-gray-800">{selectedItem.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Custo:</span>
                    <span className="font-medium text-yellow-600 flex items-center gap-1"><Coins className="w-4 h-4"/>{selectedItem.cost_coins}</span>
                </div>
                <hr className="my-2 border-gray-300"/>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seu saldo atual:</span>
                    <span className="font-medium text-gray-800 flex items-center gap-1"><Coins className="w-4 h-4"/>{currentUser?.coins || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-600">Saldo após compra:</span>
                    <span className="text-blue-600 flex items-center gap-1"><Coins className="w-4 h-4"/>{(currentUser?.coins || 0) - selectedItem.cost_coins}</span>
                </div>
            </div>
            
            {selectedItem.type === 'server_benefit' && selectedItem.redemption_instructions_user && (
                 <div className="neumorphic-inset rounded-xl p-3 bg-blue-50">
                    <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                        <Info className="w-4 h-4" /> Instruções de Resgate:
                    </div>
                    <p className="text-blue-600 text-xs">{selectedItem.redemption_instructions_user}</p>
                </div>
            )}


            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                disabled={isLoadingPurchase}
                className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-gray-600 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPurchase}
                disabled={isLoadingPurchase || (currentUser && currentUser.coins < selectedItem.cost_coins)}
                className="flex-1 neumorphic neumorphic-hover neumorphic-active rounded-xl py-3 text-blue-600 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoadingPurchase ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        Processando...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4" /> Confirmar
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
