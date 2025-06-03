import React, { useState, useEffect } from "react";
import { User } from "@/entities/all";
import { Users as UsersIcon, Crown, Shield } from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await User.list("-created_date");
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
    setIsLoading(false);
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Crown className="w-4 h-4 text-yellow-500" />;
    return <Shield className="w-4 h-4 text-blue-500" />;
  };

  const getRoleName = (role) => {
    return role === 'admin' ? 'Administrador' : 'Usuário';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Usuários da Comunidade
        </h1>
        <p className="text-gray-600">
          {users.length} membro(s) registrado(s)
        </p>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="neumorphic rounded-2xl h-48 animate-pulse"></div>
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="neumorphic rounded-2xl p-6">
              {/* Avatar */}
              <div className="text-center mb-4">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-16 h-16 rounded-full mx-auto neumorphic"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full mx-auto neumorphic-inset flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-lg">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-gray-800">
                  {user.full_name || 'Usuário'}
                </h3>
                
                {user.nickname && (
                  <p className="text-gray-600 text-sm">
                    @{user.nickname}
                  </p>
                )}

                <div className="flex items-center justify-center gap-2">
                  {getRoleIcon(user.role)}
                  <span className="text-sm text-gray-600">
                    {getRoleName(user.role)}
                  </span>
                </div>

                {user.bio && (
                  <p className="text-gray-500 text-xs mt-3 line-clamp-2">
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="neumorphic-inset rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Membro desde</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(user.created_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="neumorphic-inset rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Favoritos</p>
                  <p className="text-sm font-medium text-gray-700">
                    {user.favorite_servers?.length || 0}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="mt-4 flex justify-center gap-2">
                {user.is_server_owner && (
                  <span className="neumorphic-inset rounded-full px-3 py-1 text-xs text-gray-600">
                    Proprietário
                  </span>
                )}
                {user.discord_id && (
                  <span className="neumorphic-inset rounded-full px-3 py-1 text-xs text-gray-600">
                    Discord
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="neumorphic-inset rounded-2xl p-12 text-center">
          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhum usuário encontrado
          </h3>
          <p className="text-gray-500">
            Seja o primeiro a se registrar na comunidade
          </p>
        </div>
      )}
    </div>
  );
}