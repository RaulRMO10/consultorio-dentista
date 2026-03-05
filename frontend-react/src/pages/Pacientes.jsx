import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Search, Plus, Edit2, Trash2, FileWarning, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PacienteForm } from '../components/ui/PacienteForm';
import { formatDateBR } from '../utils/date';

const Pacientes = () => {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const navigate = useNavigate();

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPaciente, setSelectedPaciente] = useState(null);
    const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, pacienteId: null, pacienteNome: '' });

    const fetchPacientes = async () => {
        try {
            setLoading(true);
            const params = showInactive ? {} : { ativo: true };
            const response = await api.get('/api/pacientes', { params });
            setPacientes(response.data);
        } catch (err) {
            setError('Falha ao carregar a lista de pacientes.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPacientes();
    }, [showInactive]);

    // Handlers
    const handleOpenModal = (paciente = null) => {
        setSelectedPaciente(paciente);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPaciente(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchPacientes(); // Refetch after Create/Update
    };

    const handleDelete = (id, nome) => {
        setDeleteModalConfig({ isOpen: true, pacienteId: id, pacienteNome: nome });
    };

    const confirmDelete = async () => {
        const { pacienteId } = deleteModalConfig;
        if (!pacienteId) return;

        try {
            await api.delete(`/api/pacientes/${pacienteId}`);
            fetchPacientes(); // Refetch
            setDeleteModalConfig({ isOpen: false, pacienteId: null, pacienteNome: '' });
        } catch (err) {
            console.error(err);
            setDeleteModalConfig({ isOpen: false, pacienteId: null, pacienteNome: '' });
            if (err.response?.data?.detail) {
                alert(err.response.data.detail);
            } else {
                alert("Erro ao excluir paciente.");
            }
        }
    };

    const filteredPacientes = pacientes.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.cpf && p.cpf.includes(searchTerm))
    );

    return (
        <div className="w-full animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl">
                            <Users size={24} />
                        </div>
                        Pacientes
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Gerencie e visualize os cadastros dos pacientes do consultório.</p>
                </div>
                <div>
                    <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>Novo Paciente</Button>
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
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Input
                            icon={Search}
                            placeholder="Buscar por nome ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            containerClassName="w-full sm:w-96"
                        />
                        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="w-4 h-4 rounded text-teal-600 bg-slate-100 border-slate-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                Mostrar inativos
                            </span>
                        </label>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium px-4">
                        {filteredPacientes.length} registros encontrados
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-4 pl-6">Nome</th>
                                <th className="p-4">CPF / RG</th>
                                <th className="p-4">Contato</th>
                                <th className="p-4">Data Nasc.</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-4"></div>
                                        <p className="text-slate-500 dark:text-slate-400">Carregando pacientes...</p>
                                    </td>
                                </tr>
                            ) : filteredPacientes.length > 0 ? (
                                filteredPacientes.map((paciente) => (
                                    <tr
                                        key={paciente.id}
                                        onClick={() => navigate(`/pacientes/${paciente.id}`)}
                                        className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors flex items-center gap-2">
                                                {paciente.nome}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                ID: #{paciente.id.split('-')[0]}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {paciente.cpf || '—'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {paciente.telefone || '—'}
                                            {paciente.email && <div className="text-xs text-slate-400 mt-0.5">{paciente.email}</div>}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatDateBR(paciente.data_nascimento)}
                                        </td>
                                        <td className="p-4">
                                            {paciente.ativo ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Ativo</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Inativo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/pacientes/${paciente.id}`); }}
                                                    title="Ver Prontuário"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
                                                >
                                                    <ArrowRight size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(paciente); }}
                                                    title="Editar"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(paciente.id, paciente.nome); }}
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
                                        Nenhum paciente encontrado.
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
                title={selectedPaciente ? "Editar Cadastro do Paciente" : "Novo Paciente"}
            >
                <PacienteForm
                    initialData={selectedPaciente}
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                />
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmDialog
                isOpen={deleteModalConfig.isOpen}
                onClose={() => setDeleteModalConfig({ isOpen: false, pacienteId: null, pacienteNome: '' })}
                onConfirm={confirmDelete}
                title="Excluir Paciente"
                message={`Tem certeza que deseja excluir o paciente ${deleteModalConfig.pacienteNome}?`}
                confirmText="Excluir"
                cancelText="Cancelar"
                isDanger={true}
            />
        </div>
    );
};

export default Pacientes;
