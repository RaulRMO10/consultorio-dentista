import React, { useState, useEffect } from 'react';
import { PiggyBank, ArrowDownToLine, ArrowUpFromLine, Percent, Filter, FileWarning } from 'lucide-react';
import api from '../services/api';
import { KpiCard } from '../components/ui/KpiCard';

const FinPessoal = () => {
    const [periodo, setPeriodo] = useState('mes');
    const [metrics, setMetrics] = useState({
        comissoes: 0,
        saques: 0,
        saldo_disponivel: 0,
        pendencias: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    useEffect(() => {
        const fetchPessoalData = async () => {
            try {
                setLoading(true);
                // Based on backend routes structure:
                const res = await api.get('/api/financeiro/pessoal/resumo', { params: { periodo } }).catch(() => ({
                    data: {
                        comissoes: 12500.00,
                        saques: 4500.00,
                        saldo_disponivel: 8000.00,
                        pendencias: 1200.00
                    }
                })); // Fallback mockup if backend isn't ready

                setMetrics(res.data);
            } catch (err) {
                console.error(err);
                setError('Falha ao carregar dados financeiros pessoais.');
            } finally {
                setLoading(false);
            }
        };

        fetchPessoalData();
    }, [periodo]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <PiggyBank size={24} />
                        </div>
                        Financeiro Pessoal
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Acompanhe suas comissões detalhadas e solicitações de repasse.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        <option value="mes">Neste Mês</option>
                        <option value="trimestre">Trimestre</option>
                        <option value="ano">Neste Ano</option>
                    </select>
                    <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400">
                    <FileWarning size={20} />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* KPI Cards Row */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-3xl border border-transparent shadow-lg shadow-purple-500/20 relative overflow-hidden text-white lg:col-span-2">
                    <div className="absolute right-0 top-0 opacity-10 transform scale-150 -translate-y-4"><PiggyBank size={150} /></div>
                    <div className="relative z-10">
                        <h3 className="text-purple-100 font-medium text-sm tracking-wide uppercase mb-2">Saldo Repasse Disponível</h3>
                        <p className="text-4xl font-bold">{formatCurrency(metrics.saldo_disponivel)}</p>
                        <div className="mt-4 flex gap-3">
                            <button className="text-sm bg-white text-purple-700 font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                                Solicitar Saque
                            </button>
                        </div>
                    </div>
                </div>

                <KpiCard
                    title="Comissões (Total)"
                    value={formatCurrency(metrics.comissoes)}
                    topIcon={ArrowDownToLine}
                    color="white"
                    variant="plain"
                    extra={
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <Percent size={12} /> Taxa média aplicada: ~35%
                        </p>
                    }
                />

                <KpiCard
                    title="Saques Realizados"
                    value={formatCurrency(metrics.saques)}
                    topIcon={ArrowUpFromLine}
                    color="white"
                    variant="plain"
                />
            </section>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-dashed rounded-3xl p-12 text-center">
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    A listagem detalhada de serviços prestados e cálculos de comissão por paciente será exibida aqui após integração total com a API.
                </p>
            </div>

        </div>
    );
};

export default FinPessoal;
