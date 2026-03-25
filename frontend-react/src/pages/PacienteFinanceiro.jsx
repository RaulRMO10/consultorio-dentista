import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import FaturamentoDetailsModal from '../components/ui/FaturamentoDetailsModal';

const PacienteFinanceiro = ({ pacienteId, paciente, onRequestNovoOrcamento }) => {
    const [faturamentos, setFaturamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal de Detalhes do Pagamento
    const [selectedFaturamento, setSelectedFaturamento] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchFinanceiro = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/faturamentos/cliente/${pacienteId}`);
            setFaturamentos(response.data.faturamentos || []);
        } catch (error) {
            console.error("Erro ao carregar o financeiro do paciente:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pacienteId) {
            fetchFinanceiro();
        }
    }, [pacienteId]);

    const handleOpenDetails = (fat) => {
        setSelectedFaturamento(fat);
        setIsDetailsModalOpen(true);
    };

    const handleDetailsClose = (wasUpdated) => {
        setIsDetailsModalOpen(false);
        setSelectedFaturamento(null);
        if (wasUpdated) {
            fetchFinanceiro(); // Recarrega saldos se houve pagamento
        }
    };

    const filteredFaturamentos = faturamentos.filter(f => 
        f.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id.includes(searchTerm)
    );

    const totalDevedor = faturamentos.reduce((acc, fat) => acc + (fat.saldo_devedor || 0), 0);
    const totalPago = faturamentos.reduce((acc, fat) => acc + (fat.valor_pago || 0), 0);

    return (
        <div className="space-y-6">
            
            {/* Header / Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Já Pago</h3>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Saldo em Aberto (Devendo)</h3>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {totalDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                <div className="bg-indigo-600 dark:bg-indigo-700 rounded-2xl p-6 shadow-sm flex flex-col items-start justify-center text-white">
                    <h3 className="font-medium text-indigo-100 mb-3">Ações Financeiras</h3>
                    <button 
                        onClick={onRequestNovoOrcamento}
                        className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Novo Orçamento (Faturar)
                    </button>
                </div>
            </div>

            {/* Lista de Faturamentos */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-indigo-500" /> Histórico de Orçamentos
                    </h2>
                    
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none dark:text-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                        <p>Carregando histórico financeiro...</p>
                    </div>
                ) : filteredFaturamentos.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                        <FileText size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Nenhum orçamento encontrado.</p>
                        <p className="text-sm mt-1">Este paciente ainda não possui histórico financeiro no sistema.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Valor Total</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Devendo</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredFaturamentos.map((fat) => {
                                    const isPago = fat.status === 'PAGO';
                                    const isParcial = fat.status === 'PARCIAL';
                                    const isPendente = fat.status === 'PENDENTE';
                                    
                                    return (
                                        <tr 
                                            key={fat.id} 
                                            onClick={() => handleOpenDetails(fat)}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                        >
                                            <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {new Date(fat.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="py-4 px-6 text-sm font-medium text-slate-800 dark:text-slate-200">
                                                {fat.descricao || 'Orçamento S/N'}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-right text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                                                {Number(fat.valor_final).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-right whitespace-nowrap font-bold">
                                                {fat.saldo_devedor > 0 ? (
                                                    <span className="text-rose-600">
                                                        {Number(fat.saldo_devedor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                    ${isPago ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                                      isParcial ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}
                                                >
                                                    {isPago && <CheckCircle size={12} />}
                                                    {isParcial && <Clock size={12} />}
                                                    {isPendente && <AlertCircle size={12} />}
                                                    {fat.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Pagamento de Fatura (Dar Baixa Diferente / Ver Detalhes) */}
            {selectedFaturamento && (
                <FaturamentoDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={handleDetailsClose}
                    faturamento={selectedFaturamento}
                    hideTaxa={true}
                />
            )}
        </div>
    );
};

export default PacienteFinanceiro;
