import React, { useState, useEffect } from "react";
import { User, UserPurchase, StoreItem } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Archive, Coins, ShoppingCart, Tag, Info, ShieldCheck, Gift } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function MyPurchases() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [storeItemsDetails, setStoreItemsDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const userPurchases = await UserPurchase.filter({ user_id: user.id }, "-purchase_date");
      setPurchases(userPurchases);

      // Carregar detalhes dos StoreItems para exibir mais informações como instruções de resgate
      const itemIds = [...new Set(userPurchases.map(p => p.item_id))];
      const itemsData = {};
      for (const itemId of itemIds) {
        try {
            itemsData[itemId] = await StoreItem.get(itemId);
        } catch (e) {
            console.warn(`Não foi possível carregar detalhes para o item ${itemId}`, e);
            itemsData[itemId] = null; // Marcar como não encontrado ou erro
        }
      }
      setStoreItemsDetails(itemsData);

    } catch (error) {
      console.error("Erro ao carregar compras:", error);
      toast.error("Falha ao carregar suas compras.");
      // navigate(createPageUrl("Home")); // Redirecionar se não estiver logado ou erro crítico
    }
    setIsLoading(false);
  };
  
  const getItemTypeIcon = (itemType) => {
    switch (itemType) {
      case 'server_benefit': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'app_cosmetic': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'xp_booster': return <Coins className="w-5 h-5 text-yellow-500" />; // Reutilizando
      default: return <ShoppingCart className="w-5 h-5 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neumorphic rounded-2xl h-12 w-64 animate-pulse mx-auto mb-8"></div>
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="neumorphic rounded-2xl h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12 neumorphic-inset rounded-2xl">
        <Archive className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">Você precisa estar logado para ver suas compras.</p>
        <button onClick={() => User.login()} className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium">Fazer Login</button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <Toaster richColors position="top-right" />
      <div className="text-center">
        <div className="neumorphic-inset rounded-2xl p-6 inline-block mb-4">
          <Archive className="w-12 h-12 text-indigo-600 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Minhas Compras</h1>
        <p className="text-gray-600">Histórico de itens resgatados na loja.</p>
      </div>

      {purchases.length === 0 ? (
        <div className="neumorphic-inset rounded-2xl p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma compra encontrada</h3>
          <p className="text-gray-500 mb-6">Visite a loja para adquirir itens e benefícios!</p>
          <button onClick={() => navigate(createPageUrl("Store"))} className="neumorphic neumorphic-hover neumorphic-active rounded-xl px-6 py-3 text-gray-700 font-medium">Ir para Loja</button>
        </div>
      ) : (
        <div className="space-y-6">
          {purchases.map(purchase => {
            const itemDetail = storeItemsDetails[purchase.item_id];
            return (
              <div key={purchase.id} className="neumorphic rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="neumorphic-inset rounded-xl p-3">
                      {itemDetail && itemDetail.icon_url ? (
                        <img src={itemDetail.icon_url} alt={purchase.item_name} className="w-10 h-10 object-contain"/>
                      ) : itemDetail ? (
                        getItemTypeIcon(itemDetail.type)
                      ) : (
                        <ShoppingCart className="w-10 h-10 text-gray-400"/>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{purchase.item_name}</h3>
                      <p className="text-sm text-gray-500">Comprado em: {new Date(purchase.purchase_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">Custo: {purchase.coins_spent} <Coins className="w-4 h-4 text-yellow-500"/></p>
                    </div>
                  </div>
                  <div className="text-left md:text-right mt-3 md:mt-0">
                    <p className="text-sm font-medium text-gray-700">Status: 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        purchase.status === 'redeemed' ? 'bg-green-100 text-green-700' : 
                        purchase.status === 'pending_redemption' ? 'bg-yellow-100 text-yellow-700' :
                        purchase.status === 'app_item_active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {purchase.status === 'pending_redemption' ? 'Pendente Resgate' :
                         purchase.status === 'redeemed' ? 'Resgatado' :
                         purchase.status === 'app_item_active' ? 'Ativo no App' :
                         purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                      </span>
                    </p>
                    {purchase.redemption_code && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-600">Código de Resgate:</p>
                        <div 
                          className="font-mono text-sm text-indigo-600 p-2 neumorphic-inset rounded-lg inline-block cursor-pointer hover:bg-indigo-50"
                          title="Clique para copiar"
                          onClick={() => {
                            navigator.clipboard.writeText(purchase.redemption_code);
                            toast.success("Código copiado!");
                          }}
                        >
                          {purchase.redemption_code}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {itemDetail && itemDetail.type === 'server_benefit' && itemDetail.redemption_instructions_user && (
                  <div className="mt-4 neumorphic-inset rounded-xl p-3 bg-blue-50">
                    <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                        <Info className="w-4 h-4" /> Instruções de Resgate:
                    </div>
                    <p className="text-blue-600 text-xs">{itemDetail.redemption_instructions_user}</p>
                  </div>
                )}
                 {itemDetail && itemDetail.benefit_details && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500"><strong>Detalhes do Benefício:</strong> {itemDetail.benefit_details}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}