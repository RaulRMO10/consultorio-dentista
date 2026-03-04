import React, { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import api from '../../services/api';
import { Calendar, Tag, FileText, DollarSign, Building2, UserCircle, ArrowRightLeft, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

const LancamentoFinanceiroModal = ({ isOpen, onClose, onSuccess, initialEscopo = 'CLINICA' }) => {
    const [escopo, setEscopo] = useState(initialEscopo); // 'CLINICA', 'PESSOAL'
    const [tipo, setTipo] = useState('DESPESA'); // 'DESPESA', 'RECEITA', 'TRANSFERENCIA'

    const [formData, setFormData] = useState({
        valor: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        descricao: '',
        categoria_id: '',
        metodo_pagamento: 'PIX',
    });

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setEscopo(initialEscopo);
            setTipo('DESPESA');
            setFormData({
                valor: '',
                data_vencimento: new Date().toISOString().split('T')[0],
                descricao: '',
                categoria_id: '',
                metodo_pagamento: 'PIX',
            });
            setError(null);
            carregarCategorias();
        }
    }, [isOpen, initialEscopo]);

    useEffect(() => {
        // Regra de Negócio: Clínica não pode ter Receita Manual
        if (escopo === 'CLINICA' && tipo === 'RECEITA') {
            setTipo('DESPESA');
        }
        // Reseta categoria ao mudar abas
        setFormData(prev => ({ ...prev, categoria_id: '' }));
    }, [escopo, tipo]);

    const carregarCategorias = async () => {
        try {
            const response = await api.get('/api/financeiro/consultorio/categorias');
            setCategorias(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleValorChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val) {
            val = (parseInt(val) / 100).toFixed(2);
        }
        setFormData(prev => ({ ...prev, valor: val }));
    };

    const getCategoriasFiltradas = () => {
        return categorias.filter(c => c.escopo === escopo && c.tipo === tipo);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                escopo,
                tipo,
                valor: parseFloat(formData.valor) || 0,
                data_vencimento: formData.data_vencimento,
                descricao: formData.descricao,
                metodo_pagamento: formData.metodo_pagamento,
                status: 'PAGO' // Lançamentos avulsos são criados liquidados por padrão neste POC
            };

            if (tipo !== 'TRANSFERENCIA') {
                if (!formData.categoria_id) {
                    throw new Error("Por favor, selecione uma categoria.");
                }
                payload.categoria_id = parseInt(formData.categoria_id);
            } else {
                // Na transferência a descrição padrão fica obvia
                if (!payload.descricao) {
                    payload.descricao = escopo === 'CLINICA' ? "Pró-labore (Retirada)" : "Aporte de Capital (Investimento)";
                }
            }

            if (payload.valor <= 0) {
                throw new Error("O valor deve ser maior que zero.");
            }
            if (!payload.descricao) {
                throw new Error("A descrição é obrigatória.");
            }

            await api.post('/api/financeiro/consultorio/transacao-avulsa', payload);

            setLoading(false);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Erro ao processar lançamento.');
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lançamento Financeiro Avulso">
            <div className="p-4 sm:p-6 -mt-4">
                {/* Seletor de Escopo */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                    <button
                        type="button"
                        onClick={() => setEscopo('CLINICA')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${escopo === 'CLINICA' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Building2 size={18} /> Consultório
                    </button>
                    <button
                        type="button"
                        onClick={() => setEscopo('PESSOAL')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${escopo === 'PESSOAL' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <UserCircle size={18} /> Pessoal
                    </button>
                </div>

                {/* Seletor de Tipo */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => setTipo('DESPESA')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${tipo === 'DESPESA' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <TrendingDown size={24} className="mb-1" />
                        <span className="text-xs font-bold uppercase tracking-wider">Despesa</span>
                    </button>

                    {escopo === 'PESSOAL' && (
                        <button
                            type="button"
                            onClick={() => setTipo('RECEITA')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${tipo === 'RECEITA' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <TrendingUp size={24} className="mb-1" />
                            <span className="text-xs font-bold uppercase tracking-wider">Receita</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setTipo('TRANSFERENCIA')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${tipo === 'TRANSFERENCIA' ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <ArrowRightLeft size={24} className="mb-1" />
                        <span className="text-xs font-bold uppercase tracking-wider">Transferir</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {/* Dica Visual de Transferência */}
                {tipo === 'TRANSFERENCIA' && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-center gap-4">
                        <div className="text-center">
                            <span className="block text-xs text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">Origem</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                {escopo === 'CLINICA' ? 'Caixa Clínica' : 'Conta Pessoal'}
                            </span>
                        </div>
                        <ArrowRightLeft className="text-amber-500" />
                        <div className="text-center">
                            <span className="block text-xs text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">Destino</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                {escopo === 'CLINICA' ? 'Conta Pessoal' : 'Caixa Clínica'}
                            </span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Valor Agigantado */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign size={24} className={tipo === 'DESPESA' ? 'text-red-500' : tipo === 'RECEITA' ? 'text-emerald-500' : 'text-amber-500'} />
                            </div>
                            <input
                                type="text"
                                name="valor"
                                value={formData.valor}
                                onChange={handleValorChange}
                                placeholder="0.00"
                                className="pl-12 w-full text-3xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 focus:ring-2 focus:ring-teal-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <Calendar size={16} /> Data
                            </label>
                            <input
                                type="date"
                                name="data_vencimento"
                                value={formData.data_vencimento}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <CreditCard size={16} /> Forma de Pagamento
                            </label>
                            <select
                                name="metodo_pagamento"
                                value={formData.metodo_pagamento}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                            >
                                <option value="PIX">Pix</option>
                                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                                <option value="DINHEIRO">Dinheiro Vivo</option>
                                {tipo === 'DESPESA' && <option value="BOLETO">Boleto Bancário</option>}
                            </select>
                        </div>
                    </div>

                    {tipo !== 'TRANSFERENCIA' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <Tag size={16} /> Categoria
                            </label>
                            <select
                                name="categoria_id"
                                value={formData.categoria_id}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                                required={tipo !== 'TRANSFERENCIA'}
                            >
                                <option value="">Selecione uma categoria...</option>
                                {getCategoriasFiltradas().map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                            <FileText size={16} /> Descrição
                        </label>
                        <input
                            type="text"
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleChange}
                            placeholder={tipo === 'TRANSFERENCIA' ? (escopo === 'CLINICA' ? 'Ex: Retirada de Lucro/Pró-labore' : 'Ex: Aporte para comprar Cadeira') : 'Ex: Conta de Luz Maio'}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.valor || parseFloat(formData.valor) <= 0}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processando...' : 'Salvar Lançamento'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default LancamentoFinanceiroModal;
