import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const FaturamentoDetailsModal = ({ faturamento, onClose, hideTaxa = false }) => {
    const [parcelas, setParcelas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);

    // Form states for checking out an installment
    const [payingTxId, setPayingTxId] = useState(null);
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [paymentForm, setPaymentForm] = useState({
        data_pagamento: new Date().toISOString().split('T')[0],
        metodo_pagamento: '',
        valor_desconto: 0,
        taxa_porcentagem: 0,
        taxa_valor: 0,
        valor_pago: 0,
        acao_residual: 'somar_proxima'
    });

    const fetchParcelas = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/financeiro/consultorio/?faturamento_id=${faturamento.id}`);
            
            // Filtra para remover da tela do paciente transações lançadas como Despesa (Taxa de Máquina)
            const parcelasLimpas = res.data.filter(tx => !tx.descricao.includes('Taxa de Operadora'));
            
            // Force sort by due date
            const sorted = parcelasLimpas.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
            setParcelas(sorted);
        } catch (err) {
            console.error(err);
            setError("Erro ao carregar as parcelas.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMetodos = async () => {
        try {
            const res = await api.get('/api/financeiro/settings/formas-pagamento?ativo=true');
            setFormasPagamento(res.data);
        } catch (err) {
            console.error("Erro ao carregar metodos de pagamento:", err);
        }
    };

    useEffect(() => {
        if (faturamento?.id) {
            fetchParcelas();
            fetchMetodos();
        }
    }, [faturamento]);

    const handleOpenPayment = (tx) => {
        setPayingTxId(tx.id);
        const method = faturamento.metodo_pagamento;

        // Match the faturamento string name with the settings array
        const configuredMethod = formasPagamento.find(f => f.nome === method || f.tipo === method);
        const defaultPorcentagem = configuredMethod ? configuredMethod.taxa_padrao_porcentagem : 0;

        setPaymentForm({
            data_pagamento: new Date().toISOString().split('T')[0],
            metodo_pagamento: configuredMethod ? configuredMethod.nome : (method || ''),
            valor_desconto: 0,
            taxa_porcentagem: defaultPorcentagem,
            taxa_valor: Number(((tx.valor * defaultPorcentagem) / 100).toFixed(2)),
            valor_pago: tx.valor,
            acao_residual: 'somar_proxima'
        });
    };

    const handleCalcTaxaPorcentagem = (e, valorBase) => {
        const perc = parseFloat(e.target.value) || 0;
        setPaymentForm(prev => ({
            ...prev,
            taxa_porcentagem: perc,
            taxa_valor: Number(((valorBase * perc) / 100).toFixed(2))
        }));
    };

    const handleCalcTaxaValor = (e, valorBase) => {
        const val = parseFloat(e.target.value) || 0;
        setPaymentForm(prev => ({
            ...prev,
            taxa_valor: val,
            taxa_porcentagem: Number(((val / valorBase) * 100).toFixed(2))
        }));
    };

    const handleConfirmPayment = async (txId) => {
        // Validações rigorosas antes de ir para o backend
        if (!paymentForm.metodo_pagamento || paymentForm.metodo_pagamento.trim() === '') {
            setError("Por favor, selecione uma Forma de Pagamento para registrar a baixa.");
            return;
        }
        
        if ((parseFloat(paymentForm.valor_pago) || 0) <= 0 && (parseFloat(paymentForm.valor_desconto) || 0) <= 0) {
            setError("Informe um Valor Recebido ou um Desconto válido, maior que zero.");
            return;
        }

        setError(null); // Clear errors

        try {
            setProcessingId(txId);
            await api.post(`/api/financeiro/consultorio/${txId}/pagar`, {
                data_pagamento: paymentForm.data_pagamento,
                metodo_pagamento: paymentForm.metodo_pagamento,
                taxa_porcentagem: paymentForm.taxa_porcentagem,
                taxa_valor: paymentForm.taxa_valor,
                valor_pago: paymentForm.valor_pago,
                valor_desconto: paymentForm.valor_desconto,
                acao_residual: paymentForm.acao_residual
            });
            setPayingTxId(null);
            await fetchParcelas();
        } catch (err) {
            console.error(err);
            alert("Erro ao registrar pagamento.");
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const d = new Date(dateStr);
        // add timezone offset to avoid previous day bug
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        return d.toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                Carregando parcelas...
            </div>
        );
    }

    const valorPago = parcelas.filter(p => p.status === 'PAGO').reduce((acc, curr) => acc + curr.valor, 0);
    const valorPendente = parcelas.filter(p => p.status === 'PENDENTE').reduce((acc, curr) => acc + curr.valor, 0);

    const isMachineSelected = () => {
        const selectedObj = formasPagamento.find(f => f.nome === paymentForm.metodo_pagamento);
        return selectedObj ? ['CREDITO', 'DEBITO'].includes(selectedObj.tipo) : false;
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Cabeçalho de Resumo */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Paciente</p>
                        <p className="font-medium text-slate-900 dark:text-white">{faturamento.pacientes?.nome || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Procedimento</p>
                        <p className="font-medium text-slate-900 dark:text-white">{faturamento.procedimentos?.nome || 'Personalizado'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Valor Total (Cobrado)</p>
                        <p className="font-bold text-slate-900 dark:text-white">
                            {parcelas.length > 0 ? formatCurrency(valorPago + valorPendente) : formatCurrency(faturamento.valor_final)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Forma de Pagto</p>
                        <p className="font-medium text-slate-900 dark:text-white">{faturamento.metodo_pagamento}</p>
                    </div>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Já Recebido</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(valorPago)}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800">
                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">A Receber</p>
                        <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(valorPendente)}</p>
                    </div>
                </div>
            </div>

            {/* Tabela de Parcelas */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cronograma de Parcelas</h3>

                {parcelas.length === 0 ? (
                    <p className="text-slate-500 text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">Nenhuma parcela gerada para este faturamento.</p>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Parcela</th>
                                    <th className="px-4 py-3 font-medium">Vencimento</th>
                                    <th className="px-4 py-3 font-medium">Valor</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {parcelas.map((p, idx) => (
                                    <React.Fragment key={p.id}>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                {p.descricao.split(' - ')[0] || `Parcela ${idx + 1}`}
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatDate(p.data_vencimento)}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                {formatCurrency(p.valor)}
                                                {!hideTaxa && p.taxa_valor > 0 && (
                                                    <span className="block text-[10px] text-red-500 font-medium">-{formatCurrency(p.taxa_valor)} taxa</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.status === 'PAGO' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                        <CheckCircle2 size={14} /> Pago
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                        <Clock size={14} /> Pendente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {p.status === 'PAGO' ? (
                                                    <span className="text-slate-400 text-xs font-medium">Liquidado</span>
                                                ) : payingTxId === p.id ? (
                                                    <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">Em Aberto ▼</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenPayment(p)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        Registrar Baixa
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {payingTxId === p.id && (
                                            <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b-2 border-indigo-100 dark:border-indigo-800/50">
                                                <td colSpan="5" className="px-4 py-4">
                                                    <div className="flex flex-wrap items-end gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm animate-in slide-in-from-top-2 duration-200">
                                                        <div className="w-full sm:w-auto">
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Baixa</label>
                                                            <input
                                                                type="date"
                                                                value={paymentForm.data_pagamento}
                                                                onChange={(e) => setPaymentForm(prev => ({ ...prev, data_pagamento: e.target.value }))}
                                                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                                            />
                                                        </div>
                                                        <div className="w-full sm:w-auto min-w-[140px]">
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Forma de Pagto</label>
                                                            <select
                                                                value={paymentForm.metodo_pagamento}
                                                                onChange={(e) => {
                                                                    const novoMetodo = e.target.value;
                                                                    const configuredMethod = formasPagamento.find(f => f.nome === novoMetodo);
                                                                    const defaultPorc = configuredMethod ? configuredMethod.taxa_padrao_porcentagem : 0;
                                                                    setPaymentForm(prev => ({
                                                                        ...prev,
                                                                        metodo_pagamento: novoMetodo,
                                                                        taxa_porcentagem: defaultPorc,
                                                                        taxa_valor: Number(((prev.valor_pago * defaultPorc) / 100).toFixed(2))
                                                                    }));
                                                                }}
                                                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                                            >
                                                                <option value="">Selecione...</option>
                                                                {formasPagamento.map(f => (
                                                                    <option key={f.id} value={f.nome}>{f.nome}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {isMachineSelected() && (
                                                            <div className="w-full sm:w-24">
                                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Taxa Máq (%)</label>
                                                                <input
                                                                    type="number" step="0.01" min="0"
                                                                    value={paymentForm.taxa_porcentagem}
                                                                    onChange={(e) => {
                                                                        const perc = Math.max(0, parseFloat(e.target.value) || 0);
                                                                        setPaymentForm(prev => ({
                                                                            ...prev,
                                                                            taxa_porcentagem: perc,
                                                                            taxa_valor: Number(((prev.valor_pago * perc) / 100).toFixed(2))
                                                                        }));
                                                                    }}
                                                                    className="w-full px-3 py-2 text-sm border border-red-200 dark:border-red-900/50 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 font-medium"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="w-full sm:w-24">
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Desconto</label>
                                                            <input
                                                                type="number" step="0.01" min="0" max={p.valor}
                                                                value={paymentForm.valor_desconto}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                                                    const desc = Math.min(val, p.valor);
                                                                    setPaymentForm(prev => {
                                                                        const maxPago = p.valor - desc;
                                                                        const novoPago = Math.min(prev.valor_pago, maxPago);
                                                                        return {
                                                                            ...prev,
                                                                            valor_desconto: desc,
                                                                            valor_pago: novoPago,
                                                                            taxa_valor: Number(((novoPago * prev.taxa_porcentagem) / 100).toFixed(2))
                                                                        };
                                                                    });
                                                                }}
                                                                className="w-full px-3 py-2 text-sm border border-orange-300 dark:border-orange-700 rounded-lg focus:ring-2 focus:ring-orange-500/50 outline-none bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 font-bold"
                                                            />
                                                        </div>
                                                        <div className="w-full sm:w-28">
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                                Valor Recebido
                                                            </label>
                                                            <input
                                                                type="number" step="0.01" min="0" max={p.valor - paymentForm.valor_desconto}
                                                                value={paymentForm.valor_pago}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                                                    const maxVal = Math.max(0, p.valor - paymentForm.valor_desconto);
                                                                    const novoValor = Math.min(val, maxVal);
                                                                    setPaymentForm(prev => ({
                                                                        ...prev,
                                                                        valor_pago: novoValor,
                                                                        taxa_valor: Number(((novoValor * prev.taxa_porcentagem) / 100).toFixed(2))
                                                                    }));
                                                                }}
                                                                className="w-full px-3 py-2 text-sm border border-emerald-300 dark:border-emerald-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 outline-none bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-bold"
                                                            />
                                                        </div>
                                                        <div className="w-full mt-4 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                                            <button
                                                                onClick={() => setPayingTxId(null)}
                                                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                onClick={() => handleConfirmPayment(p.id)}
                                                                disabled={processingId === p.id}
                                                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
                                                            >
                                                                {processingId === p.id && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                                                Confirmar Baixa
                                                            </button>
                                                        </div>
                                                    </div>


                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                    Fechar Detalhes
                </button>
            </div>
        </div>
    );
};

export default FaturamentoDetailsModal;
