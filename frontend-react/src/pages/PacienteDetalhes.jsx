import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, Phone, Mail, MapPin, Calendar, Clock, ActivitySquare, Plus, CheckCircle, ArrowLeft, FileWarning, BriefcaseMedical } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import FaturamentoForm from '../components/ui/FaturamentoForm';

const PacienteDetalhes = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [paciente, setPaciente] = useState(null);
    const [tratamentos, setTratamentos] = useState([]);
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal
    const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pacRes, tratRes, agendRes] = await Promise.all([
                api.get(`/api/pacientes/${id}`),
                api.get('/api/tratamentos', { params: { paciente_id: id } }),
                api.get('/api/agendamentos', { params: { paciente_id: id } })
            ]);
            setPaciente(pacRes.data);
            setTratamentos(tratRes.data);
            setAgendamentos(agendRes.data);
        } catch (err) {
            console.error(err);
            setError("Erro ao carregar dados do paciente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleSuccessOrcamento = () => {
        setIsOrcamentoModalOpen(false);
        fetchData(); // Reload all to see the new active treatment
    };

    const handleMudarStatusAgendamento = async (agendamentoId, novoStatus) => {
        try {
            await api.put(`/api/agendamentos/${agendamentoId}`, { status: novoStatus });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Erro ao alterar o status do procedimento.");
        }
    };

    const handleMarcarProcedimentoFeito = async (agendamentoId, procedimentoId) => {
        try {
            await api.patch(`/api/agendamentos/${agendamentoId}/procedimentos/${procedimentoId}/status`, { status: "CONCLUIDO" });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Erro ao finalizar procedimento clinicamente.");
        }
    };

    const handleReabrirProcedimento = async (agendamentoId, procedimentoId) => {
        try {
            await api.patch(`/api/agendamentos/${agendamentoId}/procedimentos/${procedimentoId}/status`, { status: "EM_ANDAMENTO" });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Erro ao reabrir procedimento clinicamente.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <span className="ml-3 text-slate-500">Carregando prontuário...</span>
            </div>
        );
    }

    if (error || !paciente) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <FileWarning size={20} />
                    <p>{error || "Paciente não encontrado."}</p>
                </div>
                <button onClick={() => navigate('/pacientes')} className="mt-4 text-indigo-600 font-medium">Voltar para a lista</button>
            </div>
        );
    }

    // Extracting all valid procedured tied to appointments for the clinical record
    const procedimentosDoPaciente = agendamentos
        .filter(ag => ag.agendamento_procedimentos && ag.agendamento_procedimentos.length > 0 && ag.status !== 'cancelado' && ag.status !== 'falta')
        .flatMap(ag =>
            ag.agendamento_procedimentos.map(ap => ({
                agendamento_id: ag.id,
                procedimento_id: ap.procedimentos?.id,
                data_hora: ag.data_hora,
                status_agendamento: ag.status,
                status_clinico: ap.status,
                nome_procedimento: ap.procedimentos?.nome || 'Desconhecido',
                dentista_nome: ag.dentistas?.nome || '—',
                observacoes: ag.observacoes
            }))
        )
        .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));

    const procedimentosPendentes = procedimentosDoPaciente.filter(p => p.status_clinico !== 'CONCLUIDO');
    const procedimentosConcluidos = procedimentosDoPaciente.filter(p => p.status_clinico === 'CONCLUIDO');

    return (
        <div className="w-full animate-in fade-in duration-500 pb-12">
            {/* Header: Dados do Paciente */}
            <header className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/pacientes')}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                        title="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <User className="text-indigo-500" size={28} />
                            {paciente.nome}
                        </h2>
                        <div className="flex gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1.5"><Phone size={14} /> {paciente.telefone}</span>
                            {paciente.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {paciente.email}</span>}
                            {paciente.cpf && <span className="flex items-center gap-1.5">CPF: {paciente.cpf}</span>}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Prontuário Clínico (Procedimentos) */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <BriefcaseMedical size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Procedimentos do Prontuário</h3>
                        </div>

                        {procedimentosPendentes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {procedimentosPendentes.map(proc => (
                                    <div key={proc.agendamento_id} className="relative p-5 border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">
                                                🦷 {proc.nome_procedimento}
                                            </h4>
                                            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                {proc.status_agendamento === 'aguardando' ? 'Aguardando' :
                                                    proc.status_agendamento === 'em_atendimento' ? 'Em Atendimento' :
                                                        proc.status_agendamento === 'confirmado' ? 'Confirmado' : 'Agendado'}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                                            Data da Sessão: <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(proc.data_hora).toLocaleDateString()}</span> <br />
                                            Dents. Resp: <span className="font-medium text-slate-800 dark:text-slate-200">{proc.dentista_nome}</span>
                                            {proc.observacoes && <span className="block mt-2 italic text-slate-500">"{proc.observacoes}"</span>}
                                        </p>
                                        <div className="flex justify-end gap-2 pt-3 border-t border-indigo-200/50 dark:border-indigo-800/50">
                                            <button
                                                onClick={() => handleMarcarProcedimentoFeito(proc.agendamento_id, proc.procedimento_id)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-emerald-500/20"
                                            >
                                                <CheckCircle size={14} /> Finalizar Clinicamente
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-60">
                                <CheckCircle size={32} className="mx-auto text-slate-400 mb-2" />
                                <p className="text-slate-500 font-medium">Nenhum procedimento pendente na fila.</p>
                            </div>
                        )}
                    </section>

                    {procedimentosConcluidos.length > 0 && (
                        <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Histórico de Concluídos</h3>
                            <div className="space-y-3">
                                {procedimentosConcluidos.map(proc => (
                                    <div key={proc.agendamento_id} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 opacity-80">
                                        <div>
                                            <h4 className="font-medium text-slate-700 dark:text-slate-300">
                                                {proc.nome_procedimento}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Feito em {new Date(proc.data_hora).toLocaleDateString()} com {proc.dentista_nome}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleReabrirProcedimento(proc.agendamento_id, proc.procedimento_id)}
                                                className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 underline"
                                            >
                                                Reabrir Sessão Clínica
                                            </button>
                                            <div className="text-emerald-600 dark:text-emerald-500">
                                                <CheckCircle size={18} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* 2. Histórico de Agendamentos */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Consultas</h3>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {agendamentos.map(ag => {
                                const dh = new Date(ag.data_hora);
                                const isPast = dh < new Date();
                                const isConcluido = ag.status === 'concluido';
                                return (
                                    <div
                                        key={ag.id}
                                        className={`p-4 border rounded-xl flex gap-4 \${
                                            isConcluido ? 'border-emerald-200 bg-emerald-50/30' : 
                                            isPast ? 'border-slate-200 bg-slate-50/50 opacity-60' : 'border-indigo-200 bg-indigo-50/20'
                                        } dark:border-slate-700 dark:bg-transparent`}
                                    >
                                        <div className="shrink-0 pt-1 text-slate-400">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                {dh.toLocaleDateString('pt-BR')} às {dh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Dr. {ag.dentistas?.nome}
                                            </p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {ag.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                            {agendamentos.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">Nenhuma consulta registrada.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal Novo Orçamento */}
            <Modal
                isOpen={isOrcamentoModalOpen}
                onClose={() => setIsOrcamentoModalOpen(false)}
                title={`Criar Orçamento para ${paciente.nome}`}
                maxWidth="max-w-3xl"
            >
                {/* 
                  Passing initialData pre-filled with the paciente_id.
                  The FaturamentoForm should be able to handle this.
                */}
                <FaturamentoForm
                    initialData={{ paciente_id: paciente.id }}
                    onSuccess={handleSuccessOrcamento}
                    onCancel={() => setIsOrcamentoModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default PacienteDetalhes;
