import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DollarSign, Clock, CheckCircle2, AlertCircle, FileWarning, Plus, Search, MoreHorizontal } from 'lucide-react';
import api from '../services/api';
import { KpiCard } from '../components/ui/KpiCard.jsx';
import ModalFinanceiroPaciente from '../components/ui/ModalFinanceiroPaciente.jsx';
import { StatusPill } from '../components/ui/StatusPill.jsx';

const Faturamentos = () => {
    const [pacientesFin, setPacientesFin] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedPaciente, setSelectedPaciente] = useState(null);
    const [isHubOpen, setIsHubOpen] = useState(false);

    const fetchResumo = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/faturamentos/resumo-clientes');
            setPacientesFin(res.data);
            setError(null);

            // Auto-open modal if requested via URL
            const queryPacienteId = searchParams.get('paciente_id');
            if (queryPacienteId) {
                const pac = res.data.find(p => p.paciente_id === queryPacienteId);
                if (pac) {
                    setSelectedPaciente(pac);
                    setIsHubOpen(true);
                }
            }
        } catch (err) {
            console.error("Erro ao buscar resumo de pacientes:", err);
            setError('Falha ao carregar lista de clientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumo();
    }, []);

    const handleRowClick = (pacienteReq) => {
        setSelectedPaciente(pacienteReq);
        setIsHubOpen(true);
    };

    const handleCloseHub = () => {
        setIsHubOpen(false);
        setSelectedPaciente(null);
        fetchResumo(); // Refresh table when closing
    };

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const filteredPacs = pacientesFin.filter(p =>
        (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.cpf || '').includes(searchTerm)
    );

    const kpiData = {
        total_faturado: pacientesFin.reduce((acc, curr) => acc + curr.total_faturado, 0),
        total_pendente: pacientesFin.reduce((acc, curr) => acc + curr.total_pendente, 0),
        total_recebido: pacientesFin.reduce((acc, curr) => acc + (curr.total_faturado - curr.total_pendente), 0),
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        Contas a Receber (Clientes)
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Clique sobre o cadastro de um paciente para acessar todos os recebimentos e procedimentos concluídos faturáveis dele.</p>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400">
                    <FileWarning size={20} />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <KpiCard title="Total em Orçamentos" value={formatCurrency(kpiData.total_faturado)} topIcon={DollarSign} color="slate" variant="plain" />
                <KpiCard title="Valor Recebido" value={formatCurrency(kpiData.total_recebido)} topIcon={CheckCircle2} color="emerald" variant="solid" />
                <KpiCard title="Falta Receber" value={formatCurrency(kpiData.total_pendente)} topIcon={Clock} color="amber" variant="plain" />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-700 dark:text-slate-300 transition-shadow"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Paciente</th>
                                <th className="px-6 py-4 font-medium">CPF</th>
                                <th className="px-6 py-4 font-medium">Qtd. Orçamentos</th>
                                <th className="px-6 py-4 font-medium">Total do Orçamento</th>
                                <th className="px-6 py-4 font-medium">Valor Recebido</th>
                                <th className="px-6 py-4 font-medium">Falta Pagar</th>
                                <th className="px-6 py-4 font-medium">A Faturar</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredPacs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                        Nenhum paciente cadastrado encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredPacs.map((pac) => (
                                    <tr
                                        key={pac.paciente_id}
                                        onClick={() => handleRowClick(pac)}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 border-b border-transparent group-hover:border-emerald-100 dark:group-hover:border-emerald-900/30">
                                            <div className="font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                                                    {(pac.nome || '  ').substring(0, 2)}
                                                </div>
                                                {pac.nome}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{pac.cpf || '—'}</td>
                                        <td className="px-6 py-4">
                                            {pac.qtd_faturamentos > 0 ? (
                                                <span className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{pac.qtd_faturamentos} Orçamento(s)</span>
                                            ) : (
                                                <span className="text-slate-400">Nenhum</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{formatCurrency(pac.total_faturado)}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(pac.total_faturado - pac.total_pendente)}</td>
                                        <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">{formatCurrency(pac.total_pendente)}</td>
                                        <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(pac.total_a_faturar)}</td>
                                        <td className="px-6 py-4">
                                            <StatusPill status={pac.status_financeiro === 'EM_DIA' ? 'QUITADO' : pac.status_financeiro} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isHubOpen && selectedPaciente && (
                <ModalFinanceiroPaciente
                    paciente={selectedPaciente}
                    onClose={() => {
                        // Clear query params when closing modal if they exist
                        if (searchParams.toString()) {
                            setSearchParams({});
                        }
                        handleCloseHub();
                    }}
                />
            )}
        </div>
    );
};

export default Faturamentos;
