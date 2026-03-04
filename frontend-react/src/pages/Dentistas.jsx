import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Stethoscope, Search, Plus, Edit2, Trash2, FileWarning } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { DentistaForm } from '../components/ui/DentistaForm';

const Dentistas = () => {
    const [dentistas, setDentistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDentista, setSelectedDentista] = useState(null);

    const fetchDentistas = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/dentistas', { params: { ativo: true } });
            setDentistas(response.data);
        } catch (err) {
            setError('Falha ao carregar a lista de dentistas.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDentistas();
    }, []);

    // Handlers
    const handleOpenModal = (dentista = null) => {
        setSelectedDentista(dentista);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDentista(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchDentistas(); // Refetch after Create/Update
    };

    const handleDelete = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja inativar o dr(a) ${nome}? Ele(a) deixará de aparecer em novos agendamentos.`)) {
            try {
                await api.delete(`/api/dentistas/${id}`);
                fetchDentistas(); // Refetch
            } catch (err) {
                console.error(err);
                alert("Erro ao inativar dentista.");
            }
        }
    };

    const filteredDentistas = dentistas.filter(d =>
        d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.especialidade && d.especialidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.cro && d.cro.includes(searchTerm))
    );

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl">
                            <Stethoscope size={24} />
                        </div>
                        Dentistas
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Gerencie e visualize o quadro clínico do consultório.</p>
                </div>
                <div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-sky-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Novo Dentista
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
                            placeholder="Buscar por nome, CRO ou especialidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all text-sm"
                        />
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium font-medium px-4">
                        {filteredDentistas.length} registros encontrados
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-4 pl-6">Nome</th>
                                <th className="p-4">Especialidade</th>
                                <th className="p-4">CRO</th>
                                <th className="p-4">Contato</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-4"></div>
                                        <p className="text-slate-500 dark:text-slate-400">Carregando dentistas...</p>
                                    </td>
                                </tr>
                            ) : filteredDentistas.length > 0 ? (
                                filteredDentistas.map((dentista) => (
                                    <tr key={dentista.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">
                                                    👨‍⚕️
                                                </div>
                                                {dentista.nome}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-sky-600 dark:text-sky-400">
                                            {dentista.especialidade || 'Clínico Geral'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{dentista.cro || '—'}</span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {dentista.telefone || '—'}
                                            {dentista.email && <div className="text-xs text-slate-400 mt-0.5">{dentista.email}</div>}
                                        </td>
                                        <td className="p-4">
                                            {dentista.ativo ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Ativo</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Inativo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(dentista)}
                                                    title="Editar"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/40 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dentista.id, dentista.nome)}
                                                    title="Excluir"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center text-slate-500 dark:text-slate-400">
                                        Nenhum dentista encontrado.
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
                title={selectedDentista ? "Editar Dentista" : "Novo Dentista"}
            >
                <DentistaForm
                    initialData={selectedDentista}
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default Dentistas;
