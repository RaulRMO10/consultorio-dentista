import React, { useState, useEffect } from 'react';
import { X, Receipt, ActivitySquare, AlertCircle, Plus, FileWarning } from 'lucide-react';
import api from '../../services/api';
import { StatusPill } from './StatusPill.jsx';
import FaturamentoForm from './FaturamentoForm.jsx';
import FaturamentoDetailsModal from './FaturamentoDetailsModal.jsx';

const ModalFinanceiroPaciente = ({ paciente, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [finData, setFinData] = useState({ a_faturar: [], faturamentos: [] });
    const [error, setError] = useState(null);

    // Form/Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [selectedFaturamento, setSelectedFaturamento] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/faturamentos/cliente/${paciente.paciente_id}`);
            setFinData(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Erro ao carregar hub financeiro do paciente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (paciente) {
            loadData();
        }
    }, [paciente]);


    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleOpenForm = (procedimento_orfao) => {
        // Prepare prefill object for the FaturamentoForm based on the selected procedure/appointment
        setSelectedDraft({
            paciente_id: paciente.paciente_id,
            agendamento_id: procedimento_orfao.id,
            descricao: procedimento_orfao.agendamento_procedimentos?.map(ap => ap.procedimentos?.nome).join(' + ') || 'Procedimento Clínico',
            valor_original: procedimento_orfao.agendamento_procedimentos?.reduce((acc, ap) => acc + (ap.procedimentos?.valor_padrao || 0), 0) || 0
        });
        setIsFormOpen(true);
    };

    const handleOpenDetails = (faturamento) => {
        setSelectedFaturamento(faturamento);
        setIsDetailsOpen(true);
    };

    const handleSuccessForm = () => {
        setIsFormOpen(false);
        setSelectedDraft(null);
        loadData(); // refresh lists
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Box */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl relative z-10 flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Receipt className="text-emerald-500" />
                            Hub Financeiro: {paciente.nome}
                        </h3>
                        {paciente.cpf && <p className="text-xs text-slate-500 mt-1">CPF: {paciente.cpf}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 dark:bg-slate-900/10">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3"><FileWarning /> {error}</div>
                    ) : (
                        <>
                            {/* Area A: Procedimentos a Faturar */}
                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <ActivitySquare className="text-amber-500" size={20} />
                                    Área A: Procedimentos Aguardando Faturamento
                                </h4>
                                {finData.a_faturar.length === 0 ? (
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-500 text-sm">
                                        Nenhum procedimento concluído aguardando faturamento no momento.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {finData.a_faturar.map((ag) => (
                                            <div key={ag.id} className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/30 shadow-sm rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                                                        {ag.agendamento_procedimentos?.map(ap => ap.procedimentos?.nome).join(' + ') || 'Consulta Base'}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                        <span>Realizado em: {new Date(ag.data_hora).toLocaleDateString('pt-BR')}</span>
                                                        <span>Dentista: {ag.dentistas?.nome}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenForm(ag)}
                                                    className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
                                                >
                                                    <Plus size={16} /> Gerar Faturamento
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <hr className="border-slate-200 dark:border-slate-800" />

                            {/* Area B: Contas a Receber Ativas */}
                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <Receipt className="text-emerald-500" size={20} />
                                    Área B: Faturamentos e Contas a Receber
                                </h4>
                                {finData.faturamentos.length === 0 ? (
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-500 text-sm">
                                        Este paciente ainda não possui histórico financeiro (Faturamentos).
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {finData.faturamentos.map((fat) => (
                                            <div
                                                key={fat.id}
                                                onClick={() => handleOpenDetails(fat)}
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm rounded-xl p-4 cursor-pointer transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                            >
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                                                        {fat.descricao || 'Faturamento'}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                                                        <span className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                                                            {fat.metodo_pagamento.replace('_', ' ')}
                                                        </span>
                                                        <span>{fat.numero_parcelas} Parcela(s)</span>
                                                        <span>Registrado em: {new Date(fat.created_at).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(fat.valor_final)}</span>
                                                    <StatusPill status={fat.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>

            {/* Sub-Modals overlaying the Hub Hub */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gerar Faturamento</h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <FaturamentoForm
                                initialContext={selectedDraft}
                                updateMode={false}
                                onSave={handleSuccessForm}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {isDetailsOpen && selectedFaturamento && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsDetailsOpen(false); loadData(); }}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Detalhes do Faturamento</h3>
                            <button onClick={() => { setIsDetailsOpen(false); loadData(); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <FaturamentoDetailsModal
                                faturamento={selectedFaturamento}
                                hideTaxa={true}
                                onClose={() => {
                                    setIsDetailsOpen(false);
                                    loadData(); // refresh incase an installment was paid
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ModalFinanceiroPaciente;
