import React, { useState, useEffect } from 'react';
import { Save, Ban, Percent, FileWarning, CheckSquare, Square } from 'lucide-react';
import api from '../../services/api.js';

const FaturamentoForm = ({ onSave, onCancel, initialContext = null, updateMode = false }) => {
    const isPrefilled = !!initialContext;
    const [formData, setFormData] = useState({
        agendamento_id: '',
        paciente_id: '',
        procedimento_id: '',
        descricao: '',
        valor_original: '',
        valor_desconto: 0,
        valor_final: 0,
        valor_entrada: 0,
        taxa_porcentagem_entrada: 0,
        taxa_valor_entrada: 0,
        data_vencimento_primeira: '',
        metodo_pagamento: '',
        numero_parcelas: 1
    });

    const [pacientes, setPacientes] = useState([]);
    const [procedimentos, setProcedimentos] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [selectedProcs, setSelectedProcs] = useState([]);
    const [loadingDeps, setLoadingDeps] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper para extrair o objeto do método selecionado
    const getSelectedMethodObj = () => {
        if (!formData.metodo_pagamento) return null;
        return formasPagamento.find(f => f.nome === formData.metodo_pagamento);
    };

    const selectedMethodObj = getSelectedMethodObj();
    const isParcelavel = selectedMethodObj ? (selectedMethodObj.tipo === 'CREDITO' || selectedMethodObj.tipo === 'BOLETO') : false;
    const isMachineSelected = selectedMethodObj ? ['CREDITO', 'DEBITO'].includes(selectedMethodObj.tipo) : false;

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                const [pacRes, procRes, formasRes] = await Promise.all([
                    api.get('/api/pacientes/'),
                    api.get('/api/procedimentos/'),
                    api.get('/api/financeiro/settings/formas-pagamento?ativo=true')
                ]);
                setPacientes(pacRes.data);
                setProcedimentos(procRes.data);
                setFormasPagamento(formasRes.data);

                // If there's an incoming context, wire it!
                if (initialContext) {
                    setFormData(prev => ({
                        ...prev,
                        agendamento_id: initialContext.agendamento_id || initialContext.id,
                        paciente_id: initialContext.paciente_id,
                        procedimento_id: initialContext.procedimento_id,
                        descricao: initialContext.descricao || initialContext.procedimentos?.nome || 'Procedimento Clínico',
                        valor_original: initialContext.valor_original || initialContext.procedimentos?.valor_padrao || 0,
                        valor_desconto: initialContext.valor_desconto || 0,
                        valor_final: initialContext.valor_final || 0,
                        valor_entrada: initialContext.valor_entrada || 0,
                        taxa_porcentagem_entrada: 0,
                        taxa_valor_entrada: 0,
                        metodo_pagamento: initialContext.metodo_pagamento || '',
                        numero_parcelas: initialContext.numero_parcelas || 1,
                    }));
                }
            } catch (err) {
                console.error("Falha ao carregar dependências do faturamento", err);
            } finally {
                setLoadingDeps(false);
            }
        };
        loadDependencies();
    }, [initialContext]);

    // Calcula valor final inicial se vier pre-preenchido
    useEffect(() => {
        if (isPrefilled && initialContext?.id) {
            setFormData(prev => {
                const original = parseFloat(prev.valor_original) || 0;
                const desc = parseFloat(prev.valor_desconto) || 0;
                const final = original - desc;
                return { ...prev, valor_final: final > 0 ? final : 0 };
            });
        }
    }, [isPrefilled, initialContext]);

    // Resetar parcelas se mudar para um método não parcelável
    useEffect(() => {
        if (!isParcelavel && formData.numero_parcelas > 1) {
            setFormData(prev => ({ ...prev, numero_parcelas: 1, data_vencimento_primeira: '' }));
        }
    }, [isParcelavel, formData.numero_parcelas]);

    // Handle Procedure Selection toggling
    const toggleProcedure = (proc) => {
        if (isPrefilled && initialContext?.id) return; // Don't allow changing if it's editing an existing draft

        setSelectedProcs(prev => {
            const isSelected = prev.find(p => p.id === proc.id);
            let newList;
            if (isSelected) {
                newList = prev.filter(p => p.id !== proc.id);
            } else {
                newList = [...prev, proc];
            }

            // Auto Update form data based on current selection
            const totalVal = newList.reduce((sum, item) => sum + (item.valor_padrao || 0), 0);
            const desc = newList.map(item => item.nome).join(' + ');

            setFormData(fd => ({
                ...fd,
                valor_original: totalVal > 0 ? totalVal : fd.valor_original,
                descricao: desc ? desc : fd.descricao
            }));

            return newList;
        });
    };

    // Engine to automatically calculate final price reactively
    useEffect(() => {
        const original = parseFloat(formData.valor_original) || 0;

        setFormData(prev => {
            // Só atualiza se for diferente, para evitar loops
            const calculated = original > 0 ? original : 0;
            if (prev.valor_final !== calculated) {
                return { ...prev, valor_final: calculated };
            }
            return prev;
        });
    }, [formData.valor_original]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const fd = { ...prev, [name]: value };
            
            // Auto recálculo da taxa se mexer no valor de entrada
            if (name === 'valor_entrada') {
                const val = parseFloat(value) || 0;
                fd.taxa_valor_entrada = Number(((val * fd.taxa_porcentagem_entrada) / 100).toFixed(2));
            }
            // Auto recálculo se mudar o método de pagamento
            if (name === 'metodo_pagamento') {
                const novoMetodo = formasPagamento.find(f => f.nome === value);
                const perc = novoMetodo ? (novoMetodo.taxa_padrao_porcentagem || 0) : 0;
                fd.taxa_porcentagem_entrada = perc;
                fd.taxa_valor_entrada = Number(((parseFloat(fd.valor_entrada) || 0) * perc / 100).toFixed(2));
            }
            return fd;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Required Validations
        if (!formData.paciente_id) {
            setError("Selecione um paciente.");
            setLoading(false);
            return;
        }
        if (parseFloat(formData.valor_final) <= 0) {
            setError("O Valor Final da Conta a Receber deve ser maior que zero.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                agendamento_id: formData.agendamento_id || null,
                paciente_id: formData.paciente_id,
                procedimento_id: formData.procedimento_id || null,
                procedimentos_ids: selectedProcs.map(p => p.id),
                descricao: formData.descricao,
                valor_original: parseFloat(formData.valor_original),
                valor_final: parseFloat(formData.valor_final),
                valor_entrada: parseFloat(formData.valor_entrada) || 0,
                taxa_porcentagem_entrada: parseFloat(formData.taxa_porcentagem_entrada) || 0,
                taxa_valor_entrada: parseFloat(formData.taxa_valor_entrada) || 0,
                data_vencimento_primeira: formData.data_vencimento_primeira || null,
                metodo_pagamento: formData.metodo_pagamento || "Não informado",
                numero_parcelas: parseInt(formData.numero_parcelas, 10)
            };

            if (updateMode && initialContext?.id) {
                await api.put(`/api/faturamentos/${initialContext.id}`, payload);
            } else {
                await api.post('/api/faturamentos/', payload);
            }

            onSave();
        } catch (err) {
            console.error("Erro ao salvar faturamento:", err);
            setError(err.response?.data?.detail || 'Ocorreu um erro ao gerar a Conta a Receber/Transações Globais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                    <FileWarning size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paciente *</label>
                    <select
                        name="paciente_id"
                        value={formData.paciente_id}
                        onChange={handleChange}
                        required
                        className={`w-full border-slate-200 dark:border-slate-700 text-slate-900 rounded-xl focus:ring-emerald-500 ${isPrefilled ? 'bg-slate-200 cursor-not-allowed opacity-70' : 'bg-slate-50 dark:bg-slate-800 dark:text-white'}`}
                        disabled={loadingDeps || isPrefilled}
                    >
                        <option value="">{loadingDeps ? "Carregando..." : "Selecione o paciente"}</option>
                        {pacientes.map(p => (
                            <option key={p.id} value={p.id}>{p.nome} - {p.cpf}</option>
                        ))}
                    </select>
                </div>

                {(!isPrefilled) && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
                            Procedimentos do Plano de Tratamento
                        </label>
                        {loadingDeps ? (
                            <div className="text-sm text-slate-500 hover:animate-pulse">Carregando procedimentos...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                {procedimentos.map(proc => {
                                    const isSelected = selectedProcs.some(p => p.id === proc.id);
                                    return (
                                        <div
                                            key={proc.id}
                                            onClick={() => toggleProcedure(proc)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                                        >
                                            {isSelected ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} className="text-slate-400" />}
                                            <div className="flex-1 text-sm font-medium">{proc.nome}</div>
                                            <div className="text-xs font-semibold opacity-70">R$ {proc.valor_padrao}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição Comercial</label>
                    <input
                        type="text"
                        name="descricao"
                        required
                        placeholder="Ex: Refinanciamento / Tratamento Completo"
                        value={formData.descricao}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor do Orçamento Negociado (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        name="valor_original"
                        required
                        value={formData.valor_original}
                        onChange={handleChange}
                        className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-emerald-500 font-bold"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 bg-slate-100/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mt-2">
                    <div className="flex flex-wrap items-end gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="w-full sm:w-auto min-w-[140px]">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Forma de Pagto (Entrada)</label>
                            <select
                                name="metodo_pagamento"
                                value={formData.metodo_pagamento}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            >
                                <option value="">Pendente a Definir...</option>
                                {formasPagamento.map(f => (
                                    <option key={f.id} value={f.nome}>{f.nome} ({f.tipo})</option>
                                ))}
                            </select>
                        </div>

                        {formData.metodo_pagamento && (
                            <>
                                {isMachineSelected && (
                                    <div className="w-full sm:w-24">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Taxa Máq (%)</label>
                                        <input
                                            type="number" step="0.01" min="0" name="taxa_porcentagem_entrada"
                                            value={formData.taxa_porcentagem_entrada}
                                            onChange={(e) => {
                                                const perc = Math.max(0, parseFloat(e.target.value) || 0);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    taxa_porcentagem_entrada: perc,
                                                    taxa_valor_entrada: Number(((parseFloat(prev.valor_entrada || 0) * perc) / 100).toFixed(2))
                                                }));
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-red-200 dark:border-red-900/50 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 font-medium"
                                        />
                                    </div>
                                )}

                                <div className="w-full sm:w-32">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Recebido</label>
                                    <input
                                        type="number" step="0.01" min="0" name="valor_entrada" max={parseFloat(formData.valor_original) || 0}
                                        value={formData.valor_entrada}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm border border-emerald-300 dark:border-emerald-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 outline-none bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-bold"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Resumo Total da Operação</label>
                    <div className="w-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold p-3 rounded-xl text-lg flex items-center justify-between">
                         <span>Valor Final Contratado: R$ {(parseFloat(formData.valor_final) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {formData.metodo_pagamento && (
                    <>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
                                Saldo Devedor Restante
                            </label>
                            <div className="w-full bg-amber-50 text-amber-800 border border-amber-200 font-bold p-3 rounded-xl text-lg flex items-center justify-between">
                                R$ {Math.max(0, (parseFloat(formData.valor_final) || 0) - (parseFloat(formData.valor_entrada) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>

                        {isParcelavel && (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mt-2 bg-amber-50/20 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Saldo Parcelado Em</label>
                                    <select
                                        name="numero_parcelas"
                                        value={formData.numero_parcelas}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-amber-500"
                                    >
                                        <option value={1}>À Vista (1x)</option>
                                        {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map(x => (
                                            <option key={x} value={x}>Parcelado em {x}x parcelas</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do 1º Vencimento Pendente</label>
                                    <input
                                        type="date"
                                        name="data_vencimento_primeira"
                                        value={formData.data_vencimento_primeira}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-amber-500"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Deixe em branco para considerar data de hoje + 30 dias.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                    <Ban size={16} className="inline mr-2" />
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                        <Save size={16} className="inline mr-2" />
                    )}
                    Gerar Contrato (Salvar)
                </button>
            </div>
        </form>
    );
};

export default FaturamentoForm;
