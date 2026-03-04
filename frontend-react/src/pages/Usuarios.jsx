import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Network, Search, Plus, MoreHorizontal, FileWarning, Shield, ShieldAlert, ShieldCheck, Edit } from 'lucide-react';
import UsuarioForm from '../components/ui/UsuarioForm';

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState(null);

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/usuarios');
            setUsuarios(response.data);
        } catch (err) {
            setError('Falha ao carregar a lista de usuários. Talvez o endpoint na API ainda precise de ajustes.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleSaveUsuario = async (formData) => {
        if (selectedUsuario) {
            await api.put(`/auth/usuarios/${selectedUsuario.id}`, {
                nome: formData.nome,
                email: formData.email,
                role: formData.role,
                ativo: formData.ativo
            });

            if (formData.nova_senha && formData.nova_senha.length >= 6) {
                await api.post(`/auth/usuarios/${selectedUsuario.id}/reset-password`, { nova_senha: formData.nova_senha });
            }
        } else {
            await api.post('/auth/usuarios', {
                nome: formData.nome,
                email: formData.email,
                senha: formData.senha,
                role: formData.role
            });
        }
        await fetchUsuarios();
    };

    const handleDesativarUsuario = async (id) => {
        if (window.confirm('Tem certeza que deseja desativar este usuário? Ele perderá acesso ao sistema.')) {
            await api.delete(`/auth/usuarios/${id}`);
            setIsModalOpen(false);
            await fetchUsuarios();
        }
    };

    const openAddModal = () => {
        setSelectedUsuario(null);
        setIsModalOpen(true);
    };

    const openEditModal = (usuario) => {
        setSelectedUsuario(usuario);
        setIsModalOpen(true);
    };

    const filteredUsuarios = usuarios.filter(u =>
        (u.nome || u.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRoleIcon = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return <ShieldAlert size={16} className="text-red-500" />;
            case 'dentista': return <ShieldCheck size={16} className="text-emerald-500" />;
            default: return <Shield size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                            <Network size={24} />
                        </div>
                        Usuários
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Controle de acesso e permissões do sistema OdontoSystem.</p>
                </div>
                <div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95"
                    >
                        <Plus size={18} /> Novo Usuário
                    </button>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400">
                    <FileWarning size={20} />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px]">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por login ou nível de acesso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all text-sm"
                        />
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium font-medium px-4">
                        {filteredUsuarios.length} contas de acesso
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-4 pl-6">Login / Username</th>
                                <th className="p-4">Nível de Acesso (Role)</th>
                                <th className="p-4">Dentista Vinculado?</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-4"></div>
                                        <p className="text-slate-500 dark:text-slate-400">Carregando usuários...</p>
                                    </td>
                                </tr>
                            ) : filteredUsuarios.length > 0 ? (
                                filteredUsuarios.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                                {u.nome} <span className="text-slate-500 font-normal text-xs ml-2">({u.email})</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg w-fit font-medium border border-slate-200 dark:border-slate-600">
                                                {getRoleIcon(u.role)}
                                                {u.role ? u.role.toUpperCase() : 'BÁSICO'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {u.dentista_id ? (
                                                <span className="text-sky-600 dark:text-sky-400 font-medium">Sim (ID: {u.dentista_id})</span>
                                            ) : (
                                                <span className="text-slate-400">Não</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {u.ativo ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Ativo</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Bloqueado</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                                                title="Editar Usuário"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-slate-500 dark:text-slate-400">
                                        Nenhum usuário logístico encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UsuarioForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUsuario}
                onDesativar={handleDesativarUsuario}
                initialData={selectedUsuario}
            />
        </div>
    );
};

export default Usuarios;
