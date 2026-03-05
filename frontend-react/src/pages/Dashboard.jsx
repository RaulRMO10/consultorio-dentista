import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Stethoscope, CalendarDays, ActivitySquare, CheckCircle, Clock, XCircle, FileWarning } from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard.jsx';

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        pacientes: [],
        dentistas: [],
        agendamentos: [],
        procedimentos: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [resPacientes, resDentistas, resAgendamentos, resProcedimentos] = await Promise.all([
                    api.get('/api/pacientes', { params: { ativo: true } }),
                    api.get('/api/dentistas', { params: { ativo: true } }),
                    api.get('/api/agendamentos'),
                    api.get('/api/procedimentos', { params: { ativo: true } })
                ]);

                setMetrics({
                    pacientes: resPacientes.data,
                    dentistas: resDentistas.data,
                    agendamentos: resAgendamentos.data,
                    procedimentos: resProcedimentos.data
                });
            } catch (err) {
                setError('Falha ao carregar dados do dashboard. Verifique a conexão com o servidor.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-lg mx-auto mt-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
                <h3 className="text-red-800 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                    <FileWarning className="w-5 h-5" /> Erro
                </h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
        );
    }

    // --- Logic mirroring Streamlit app.py ---
    const today = new Date().toISOString().split('T')[0];

    const ag_ativos = metrics.agendamentos.filter(a =>
        ['agendado', 'confirmado', 'em_atendimento'].includes(a.status)
    );

    const ag_hoje = ag_ativos.filter(a =>
        a.data_hora && a.data_hora.startsWith(today)
    );

    const ag_concluidos = metrics.agendamentos.filter(a => a.status === 'concluido');
    const ag_aguardando = ag_hoje.filter(a => a.status === 'agendado' || a.status === 'confirmado');

    // Sorting appointments by date/time
    const ag_pendentes = [...ag_ativos].sort((a, b) =>
        new Date(a.data_hora) - new Date(b.data_hora)
    ).slice(0, 8);

    const totalAge = metrics.agendamentos.length;
    const taxaConclusao = totalAge > 0 ? Math.round((ag_concluidos.length / totalAge) * 100) : 0;

    // Status badge styling helper
    const getStatusBadge = (status) => {
        switch (status) {
            case 'agendado': return { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', label: 'Agendado' };
            case 'confirmado': return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'Confirmado' };
            case 'em_atendimento': return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'Em atendimento' };
            case 'concluido': return { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', label: 'Concluído' };
            case 'cancelado': return { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', label: 'Cancelado' };
            case 'falta': return { bg: 'bg-slate-200 dark:bg-slate-700/60', text: 'text-slate-700 dark:text-slate-300', label: 'Falta' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
        }
    };

    return (
        <div className="w-full animate-in fade-in duration-500 pb-12">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 uppercase text-xs font-semibold tracking-wider">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-semibold border border-blue-200 dark:border-blue-800/50">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    Sistema Ao Vivo
                </div>
            </header>

            {/* KPI Cards Row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <KpiCard
                    title="Pacientes Ativos"
                    value={metrics.pacientes.length}
                    icon={Users}
                    color="emerald"
                />
                <KpiCard
                    title="Dentistas Ativos"
                    value={metrics.dentistas.length}
                    icon={Stethoscope}
                    color="sky"
                />
                <KpiCard
                    title="Consultas Hoje"
                    value={ag_hoje.length}
                    icon={CalendarDays}
                    color="white"
                    extra={
                        ag_aguardando.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2 bg-amber-50 dark:bg-amber-900/30 inline-block px-2 py-1 rounded-md">
                                {ag_aguardando.length} aguardando
                            </p>
                        )
                    }
                />
                <KpiCard
                    title="Procedimentos"
                    value={metrics.procedimentos.length}
                    icon={ActivitySquare}
                    color="amber"
                />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column: Appointments */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <CalendarDays className="text-teal-500" /> Próximas Consultas
                    </h3>

                    {ag_pendentes.length > 0 ? (
                        <div className="space-y-3">
                            {ag_pendentes.map(ag => {
                                const dh = new Date(ag.data_hora);
                                const statusInfo = getStatusBadge(ag.status);
                                const pacienteNome = ag.pacientes?.nome || '—';
                                const dentistaNome = ag.dentistas?.nome || '—';

                                return (
                                    <div key={ag.id} className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between hover:shadow-md transition-shadow group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-xl min-w-[80px] text-center border border-slate-200 dark:border-slate-700">
                                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                                    {dh.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </div>
                                                <div className="font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1">
                                                    <Clock size={14} className="text-teal-500" />
                                                    {dh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                    {pacienteNome}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                    <Stethoscope size={14} /> Dr(a). {dentistaNome}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-dashed rounded-3xl p-10 text-center">
                            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <h4 className="text-slate-700 dark:text-slate-300 font-medium">Nenhuma consulta pendente</h4>
                            <p className="text-sm text-slate-500 mt-1">A agenda está livre no momento.</p>
                        </div>
                    )}
                </div>

                {/* Side Column: Summary & Quick Actions */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
                            <ActivitySquare className="text-cyan-500" /> Resumo Geral
                        </h3>
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Total agendamentos</span>
                                <span className="font-bold text-slate-900 dark:text-white">{totalAge}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2"><CheckCircle size={14} className="text-blue-500" /> Concluídos</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{ag_concluidos.length}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2"><XCircle size={14} className="text-red-500" /> Cancelados/Faltas</span>
                                <span className="font-bold text-red-600 dark:text-red-400">
                                    {metrics.agendamentos.filter(a => a.status === 'cancelado' || a.status === 'falta').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Taxa conclusão</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{taxaConclusao}%</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
                            <Stethoscope className="text-sky-500" /> Equipe (Acesso Rápido)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {metrics.dentistas.slice(0, 4).map(d => (
                                <div key={d.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm">
                                    <span className="text-2xl mb-1 block">👨‍⚕️</span>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{d.nome.split(' ')[0]}</p>
                                    <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium truncate mt-0.5">{d.especialidade}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
