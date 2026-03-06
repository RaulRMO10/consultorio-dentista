import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ActivitySquare, Search, Plus, Edit2, Trash2, FileWarning } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ProcedimentoForm } from '../components/ui/ProcedimentoForm';

const Procedimentos = () => {
    const [procedimentos, setProcedimentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarInativos, setMostrarInativos] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProcedimento, setSelectedProcedimento] = useState(null);

    const fetchProcedimentos = async () => {
        try {
            setLoading(true);
            const params = {};
            if (!mostrarInativos) params.ativo = true;

            const response = await api.get('/api/procedimentos', { params });
            setProcedimentos(response.data);
        } catch (err) {
            setError('Falha ao carregar a lista de procedimentos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcedimentos();
    }, [mostrarInativos]);

    // Handlers
    const handleOpenModal = (procedimento = null) => {
        setSelectedProcedimento(procedimento);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProcedimento(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchProcedimentos(); // Refetch after Create/Update
    };

    const handleDelete = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja inativar o procedimento "${nome}"? Ele não estará mais disponível para novos agendamentos.`)) {
            try {
                await api.delete(`/api/procedimentos/${id}`);
                fetchProcedimentos(); // Refetch
            } catch (err) {
                console.error(err);
                alert("Erro ao inativar procedimento.");
            }
        }
    };

    const filteredProcedimentos = procedimentos.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                            <ActivitySquare size={24} />
                        </div>
                        Procedimentos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Catálogo de serviços odontológicos e valores base.</p>
                </div>
                <div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Novo Procedimento
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
                            placeholder="Buscar por nome do procedimento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mostrarInativos}
                                onChange={(e) => setMostrarInativos(e.target.checked)}
                                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Mostrar inativos</span>
                        </label>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium px-4 border-l border-slate-200 dark:border-slate-700">
                            {filteredProcedimentos.length} procedimentos
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-4 pl-6">Descrição / Nome</th>
                                <th className="p-4">Valor Base</th>
                                <th className="p-4">Tempo Est.</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
                                        <p className="text-slate-500 dark:text-slate-400">Carregando catálogo...</p>
                                    </td>
                                </tr>
                            ) : filteredProcedimentos.length > 0 ? (
                                filteredProcedimentos.map((proc) => {
                                    const preco = isNaN(proc.valor_padrao) ? null : Number(proc.valor_padrao);
                                    const formattedPreco = preco !== null ? preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Consulte';

                                    return (
                                        <tr key={proc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-3">
                                                    💉 {proc.nome}
                                                </div>
                                                {proc.descricao && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm truncate">
                                                        {proc.descricao}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {formattedPreco}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                {proc.duracao_minutos ? `${proc.duracao_minutos} min` : '—'}
                                            </td>
                                            <td className="p-4">
                                                {proc.ativo ? (
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Disponível</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Indisponível</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(proc)}
                                                        title="Editar"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(proc.id, proc.nome)}
                                                        title="Excluir"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-slate-500 dark:text-slate-400">
                                        Nenhum procedimento encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Criação / Edição */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedProcedimento ? "Editar Procedimento" : "Novo Procedimento Base"}
            >
                <ProcedimentoForm
                    initialData={selectedProcedimento}
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default Procedimentos;
