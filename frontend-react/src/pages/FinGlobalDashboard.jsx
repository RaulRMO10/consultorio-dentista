import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Stethoscope, Briefcase, ChevronRight, TrendingUp, TrendingDown, RefreshCcw, HandCoins, Building2, UserCircle, PiggyBank, Plus, Search, HelpCircle, ArrowRightLeft } from 'lucide-react';
import api from '../services/api';
import { KpiCard } from '../components/ui/KpiCard.jsx';
import LancamentoFinanceiroModal from '../components/ui/LancamentoFinanceiroModal.jsx';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

const COLORS = ['#14b8a6', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                        {entry.name}: {Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const FinGlobalDashboard = () => {
    const [viewMode, setViewMode] = useState('GLOBAL'); // CLINICA, PESSOAL, GLOBAL
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [transacoes, setTransacoes] = useState([]);

    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dashRes, txRes] = await Promise.all([
                api.get('/api/financeiro/consultorio/dashboard', { params: { mes, ano } }),
                api.get('/api/financeiro/consultorio/', { params: { escopo: viewMode === 'GLOBAL' ? '' : viewMode, mes, ano } })
            ]);

            setDashboardData(dashRes.data);
            setTransacoes(txRes.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Falha ao carregar motor financeiro. Verifique se o banco foi atualizado corretamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [viewMode, mes, ano]);

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // ======== Data Aggregation for Charts ========

    const receitasDespesasDiarias = useMemo(() => {
        if (!transacoes.length) return [];
        const map = {};
        transacoes.forEach(t => {
            if (t.fin_categorias?.tipo === 'TRANSFERENCIA') return;
            if (t.status !== 'PAGO') return; // ← Só conta o que já entrou/saiu de fato
            const data = new Date(t.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (!map[data]) map[data] = { date: data, Receitas: 0, Despesas: 0 };

            if (t.fin_categorias?.tipo === 'RECEITA' || (t.conta_destino === 'CLINICA' && t.conta_origem !== 'PESSOAL')) map[data].Receitas += t.valor;
            if (t.fin_categorias?.tipo === 'DESPESA') map[data].Despesas += t.valor;
        });
        return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    }, [transacoes]);


    const despesasClinicaPorCategoria = useMemo(() => {
        const agrp = {};
        transacoes.forEach(t => {
            if (t.fin_categorias?.tipo === 'DESPESA' && (t.conta_origem === 'CLINICA' || t.fin_categorias?.escopo === 'CLINICA')) {
                const cat = t.fin_categorias?.nome || 'Outros';
                agrp[cat] = (agrp[cat] || 0) + t.valor;
            }
        });
        return Object.entries(agrp).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [transacoes]);

    const despesasPessoaisPorCategoria = useMemo(() => {
        const agrp = {};
        transacoes.forEach(t => {
            if (t.fin_categorias?.tipo === 'DESPESA' && (t.conta_origem === 'PESSOAL' || t.fin_categorias?.escopo === 'PESSOAL')) {
                const cat = t.fin_categorias?.nome || 'Outros';
                agrp[cat] = (agrp[cat] || 0) + t.valor;
            }
        });
        return Object.entries(agrp).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [transacoes]);

    // Ocultar dados sensíveis se o usuário preferir
    const [hideValues, setHideValues] = useState(false);
    const displayValue = (val) => hideValues ? 'R$ •••••' : formatCurrency(val);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAGO': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'PENDENTE': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'CANCELADO': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getTransactionIcon = (tx) => {
        if (tx.conta_origem === 'PESSOAL' && tx.conta_destino === 'CLINICA') return <HandCoins size={18} className="text-blue-500" />;
        if (tx.conta_origem === 'CLINICA' && tx.conta_destino === 'PESSOAL') return <PiggyBank size={18} className="text-purple-500" />;
        if (tx.fin_categorias?.tipo === 'RECEITA') return <TrendingUp size={18} className="text-emerald-500" />;
        if (tx.fin_categorias?.tipo === 'DESPESA') return <TrendingDown size={18} className="text-red-500" />;
        return <RefreshCcw size={18} className="text-slate-500" />;
    };

    const nextMonth = () => {
        if (mes === 12) { setMes(1); setAno(ano + 1); }
        else setMes(mes + 1);
    };

    const prevMonth = () => {
        if (mes === 1) { setMes(12); setAno(ano - 1); }
        else setMes(mes - 1);
    };

    const kpis = dashboardData?.kpis || {};

    if (loading && !dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center p-20 animate-in fade-in zoom-in duration-500">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-slate-500 font-medium">Sincronizando Motor Financeiro...</p>
            </div>
        );
    }

    return (
        <div className="w-full animate-in fade-in duration-500 pb-20">
            {/* CABEÇALHO GLOBAL (As described in plano_financeiro_v2.md) */}
            <header className="mb-8 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 text-white rounded-xl shadow-lg shadow-teal-500/30">
                            <Wallet size={24} />
                        </div>
                        Hub Financeiro 3-em-1
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">O controle definitivo do seu patrimônio (CNPJ & PF).</p>
                </div>

                {/* TABS DE VISÃO */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 mx-auto lg:mx-0">
                    <button
                        onClick={() => setViewMode('CLINICA')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'CLINICA' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-md ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Building2 size={16} /> Consultório
                    </button>
                    <button
                        onClick={() => setViewMode('PESSOAL')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'PESSOAL' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserCircle size={16} /> Pessoal
                    </button>
                    <button
                        onClick={() => setViewMode('GLOBAL')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'GLOBAL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingUp size={16} /> Visão Global
                    </button>
                </div>

                {/* SELETOR DE MÊS */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><ChevronRight className="rotate-180" size={20} /></button>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-widest min-w-[80px] text-center">
                        {new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long' }).slice(0, 3)} {ano}
                    </span>
                    <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><ChevronRight size={20} /></button>
                </div>
            </header>

            {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
                    <HelpCircle className="text-red-500" /> {error}
                </div>
            )}

            {/* ABA 1: CONSULTÓRIO */}
            {viewMode === 'CLINICA' && (
                <div className="animate-in slide-in-from-right-8 duration-500">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Building2 className="text-teal-500" /> Operação da Clínica
                        </h3>
                        <div className="flex gap-3">
                            <button onClick={() => setIsLaunchModalOpen(true)} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                <TrendingDown size={16} /> Nova Despesa
                            </button>
                            <button onClick={() => setIsLaunchModalOpen(true)} className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                <ArrowRightLeft size={16} /> Pagar Pró-labore
                            </button>
                        </div>
                    </div>

                    <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="md:col-span-2 bg-gradient-to-br from-teal-500 to-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-teal-500/20 flex flex-col justify-between">
                            <div>
                                <h3 className="text-teal-100 font-bold text-xs tracking-widest uppercase mb-1">Lucro Líquido Operacional</h3>
                                <p className="text-5xl font-black tracking-tight">{displayValue(kpis.lucro_operacional)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                    <span className="block text-xs text-teal-100 font-medium mb-1">Receitas Brutas</span>
                                    <span className="font-bold text-lg">{displayValue(kpis.faturamento_bruto)}</span>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                    <span className="block text-xs text-teal-100 font-medium mb-1">Despesas Pagas</span>
                                    <span className="font-bold text-lg">{displayValue(dashboardData.kpis.faturamento_bruto - kpis.lucro_operacional)}</span>
                                </div>
                            </div>
                        </div>
                        <KpiCard title="A Receber (Inadimplência/Futuro)" value={displayValue(kpis.a_receber)} topIcon={HandCoins} color="amber" variant="solid" />
                        <KpiCard title="Caixa Drenado (Pró-labore Pago)" value={displayValue(kpis.retiradas_pro_labore)} topIcon={PiggyBank} color="slate" variant="plain" />
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-6">Fluxo de Caixa Diário (Receitas x Despesas)</h4>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={receitasDespesasDiarias} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val / 1000}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="Receitas" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Composição de Gastos</h4>
                            <p className="text-xs text-slate-500 mb-6">Para onde vai o dinheiro da Clínica?</p>
                            <div className="h-64 flex items-center justify-center">
                                {despesasClinicaPorCategoria.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={despesasClinicaPorCategoria} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {despesasClinicaPorCategoria.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-slate-400 font-medium">Nenhuma despesa registrada.</p>
                                )}
                            </div>
                            <div className="space-y-2 mt-2">
                                {despesasClinicaPorCategoria.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 2: PESSOAL */}
            {viewMode === 'PESSOAL' && (
                <div className="animate-in slide-in-from-left-8 duration-500">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <UserCircle className="text-indigo-500" /> Sua Vida Financeira
                        </h3>
                        <div className="flex gap-2 sm:gap-3 flex-wrap justify-end">
                            <button onClick={() => setIsLaunchModalOpen(true)} className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors">
                                <Plus size={16} /> Receita Externa
                            </button>
                            <button onClick={() => setIsLaunchModalOpen(true)} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors">
                                <TrendingDown size={16} /> Gasto de Casa
                            </button>
                            <button onClick={() => setIsLaunchModalOpen(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors">
                                <ArrowRightLeft size={16} /> Aporte Clínica
                            </button>
                        </div>
                    </div>

                    <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-800 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-between">
                            <div>
                                <h3 className="text-indigo-200 font-bold text-xs tracking-widest uppercase mb-1">Caixa Pessoal Disponível</h3>
                                <p className="text-5xl font-black tracking-tight">{displayValue(kpis.caixa_pessoal_livre)}</p>
                            </div>
                            <div className="mt-6 flex bg-white/10 rounded-xl p-3 backdrop-blur-sm gap-4 items-center">
                                <PiggyBank className="text-white opacity-80" size={32} />
                                <div>
                                    <span className="block text-xs text-indigo-100 font-medium">Salário/Pró-labore da Clínica</span>
                                    <span className="font-bold text-lg">{displayValue(kpis.retiradas_pro_labore)}</span>
                                </div>
                            </div>
                        </div>
                        <KpiCard title="Custo de Estilo de Vida" value={displayValue(kpis.despesas_pessoais)} topIcon={TrendingDown} color="red" variant="solid" />
                        <KpiCard title="Investido na Clínica (Saída)" value={displayValue(kpis.aportes_pessoais)} topIcon={Building2} color="amber" variant="plain" />
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Estrutura de Gastos PF</h4>
                            <p className="text-xs text-slate-500 mb-6">Onde seu dinheiro pessoal foi gasto?</p>
                            <div className="h-56 flex items-center justify-center">
                                {despesasPessoaisPorCategoria.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={despesasPessoaisPorCategoria} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {despesasPessoaisPorCategoria.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-slate-400 font-medium">Nenhuma despesa registrada.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 flex items-center justify-center border-dashed">
                            <div className="text-center text-slate-400 p-10">
                                <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">Evolução Patrimonial</p>
                                <p className="text-sm">Gráfico de longo prazo (Anual) será ativado assim que houver mais dados históricos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 3: GLOBAL (Correlations) */}
            {viewMode === 'GLOBAL' && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <RefreshCcw className="text-slate-500" /> Sinergia Global (O Raio-X)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                        {/* THE MEGA KPI */}
                        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute -right-10 -top-10 opacity-10">
                                <Wallet size={180} />
                            </div>
                            <h3 className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-2">Patrimônio Gerado Congrenado</h3>
                            <p className="text-6xl font-black tracking-tight text-white mb-4">
                                {displayValue(kpis.lucro_operacional + kpis.caixa_pessoal_livre)}
                            </p>
                            <p className="text-slate-400 text-sm">A soma real do lucro retido na clínica + dinheiro sobrando na pessoa física neste mês.</p>
                        </div>

                        {/* DEPENDENCY TEST */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                Termômetro de Dependência
                            </h4>
                            <p className="text-xs text-slate-500 mb-6">O seu estilo de vida custa mais do que a clínica lucra?</p>

                            <div className="flex-1 flex flex-col justify-center gap-6">
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-teal-600">Lucro Real da Clínica</span>
                                        <span className="text-slate-800">{displayValue(kpis.lucro_operacional)}</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500" style={{ width: '100%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-red-500">Custo de Vida Pessoal</span>
                                        <span className="text-slate-800">{displayValue(kpis.despesas_pessoais)}</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                                        <div
                                            className={`h-full ${kpis.despesas_pessoais > kpis.lucro_operacional ? 'bg-red-500' : 'bg-red-400'}`}
                                            style={{ width: `${Math.min((kpis.despesas_pessoais / Math.max(kpis.lucro_operacional, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {kpis.despesas_pessoais > kpis.lucro_operacional && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 mt-2">
                                        <TrendingDown className="text-red-500 flex-shrink-0" />
                                        <p className="text-xs text-red-700 font-medium">Alerta: Suas despesas pessoais estão maiores que o lucro da clínica este mês. O patrimônio global está sangrando.</p>
                                    </div>
                                )}
                                {kpis.despesas_pessoais <= kpis.lucro_operacional && kpis.lucro_operacional > 0 && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 mt-2">
                                        <TrendingUp className="text-emerald-500 flex-shrink-0" />
                                        <p className="text-xs text-emerald-700 font-medium">Excelente: Sua clínica sustenta seu estilo de vida e ainda gera acúmulo de capital.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABELA DE EXTRATO UNIVERSAL */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {viewMode === 'GLOBAL' ? 'Extrato Unificado (Clínica + Pessoal)' : viewMode === 'CLINICA' ? 'Extrato Bancário do Consultório' : 'Extrato Corrente Pessoal'}
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Lançamento</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Metadados</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                            {transacoes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <Search size={48} className="mb-4" />
                                            <p className="text-lg font-bold">Nenhuma movimentação</p>
                                            <p className="text-sm">Nenhuma transação financeira registrada neste contexto/mês.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : transacoes.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium">{new Date(t.data_vencimento).toLocaleDateString('pt-BR')}</div>
                                        {t.data_pagamento && t.status === 'PAGO' && (
                                            <div className="text-[10px] text-emerald-500 mt-1">Pago em: {new Date(t.data_pagamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl">
                                                {getTransactionIcon(t)}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-white group-hover:text-teal-600 transition-colors">{t.descricao}</span>
                                                <span className="block text-xs text-slate-400 mt-0.5">{t.fin_categorias?.nome || 'Movimentação Interna'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                {t.metodo_pagamento || "Transferência"}
                                            </span>
                                            {t.fin_categorias?.tipo === 'TRANSFERENCIA' && (
                                                <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                                                    Origem: {t.conta_origem}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black ${t.fin_categorias?.tipo === 'RECEITA' || (t.conta_origem === 'PESSOAL' && t.conta_destino === 'CLINICA' && viewMode !== 'PESSOAL') || (t.conta_origem === 'CLINICA' && t.conta_destino === 'PESSOAL' && viewMode === 'PESSOAL') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                        {t.fin_categorias?.tipo === 'DESPESA' ? '- ' : ''} {displayValue(t.valor)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <LancamentoFinanceiroModal
                isOpen={isLaunchModalOpen}
                onClose={() => setIsLaunchModalOpen(false)}
                onSuccess={() => {
                    fetchData(); // Recarrega KPIs e Extratos nativamente
                }}
                initialEscopo={viewMode === 'GLOBAL' ? 'CLINICA' : viewMode}
            />

        </div>
    );
};

export default FinGlobalDashboard;
