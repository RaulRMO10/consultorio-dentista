import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Button } from './Button';
import { Input } from './Input';
import { FileWarning, CalendarDays, Clock, Users, Stethoscope, ActivitySquare } from 'lucide-react';

export const AgendamentoForm = ({
    initialData = null,
    onSuccess,
    onCancel
}) => {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Relational data for selects
    const [pacientes, setPacientes] = useState([]);
    const [dentistas, setDentistas] = useState([]);
    const [procedimentos, setProcedimentos] = useState([]);
    const [tratamentosAtivos, setTratamentosAtivos] = useState([]);
    const [sessoesPorProcedimento, setSessoesPorProcedimento] = useState({});
    const [carregandoListas, setCarregandoListas] = useState(true);
    const [carregandoTratamentos, setCarregandoTratamentos] = useState(false);

    const formatDataHoraForInput = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const [formData, setFormData] = useState({
        paciente_id: '',
        dentista_id: '',
        procedimentos_ids: [],
        clin_tratamento_id: '',
        data_hora: '',
        duracao_minutos: '',
        status: 'agendado',
        observacoes: ''
    });

    useEffect(() => {
        const fetchRelationalData = async () => {
            try {
                setCarregandoListas(true);
                const [pacRes, dentRes, procRes] = await Promise.all([
                    api.get('/api/pacientes', { params: { ativo: true } }),
                    api.get('/api/dentistas', { params: { ativo: true } }),
                    api.get('/api/procedimentos', { params: { ativo: true } })
                ]);
                setPacientes(pacRes.data);
                setDentistas(dentRes.data);
                setProcedimentos(procRes.data);
            } catch (err) {
                console.error("Erro ao carregar listas do BD:", err);
                setError('Erro de conexão ao carregar pacientes/dentistas disponíveis.');
            } finally {
                setCarregandoListas(false);
            }
        };

        fetchRelationalData();

        if (initialData) {
            const preSelectedProcs = initialData.agendamento_procedimentos
                ? initialData.agendamento_procedimentos.map(ap => ap.procedimentos.id)
                : [];

            setFormData({
                paciente_id: initialData.paciente_id || '',
                dentista_id: initialData.dentista_id || '',
                procedimentos_ids: preSelectedProcs,
                clin_tratamento_id: initialData.clin_tratamento_id || '',
                data_hora: formatDataHoraForInput(initialData.data_hora),
                duracao_minutos: initialData.duracao_minutos !== null ? String(initialData.duracao_minutos) : '',
                status: initialData.status || 'agendado',
                observacoes: initialData.observacoes || ''
            });
        }
    }, [initialData]);

    useEffect(() => {
        const fetchTratamentosPorPaciente = async () => {
            if (!formData.paciente_id) {
                setTratamentosAtivos([]);
                return;
            }
            try {
                setCarregandoTratamentos(true);
                const res = await api.get('/api/tratamentos', {
                    params: { paciente_id: formData.paciente_id, status_filtro: 'EM_ANDAMENTO' }
                });
                setTratamentosAtivos(res.data);

                // If the current selected treatment doesn't belong to this patient anymore, clear it
                if (formData.clin_tratamento_id && !res.data.find(t => t.id === formData.clin_tratamento_id)) {
                    setFormData(prev => ({ ...prev, clin_tratamento_id: '' }));
                }
            } catch (err) {
                console.error("Erro ao buscar tratamentos ativos", err);
            } finally {
                setCarregandoTratamentos(false);
            }
        };

        fetchTratamentosPorPaciente();
    }, [formData.paciente_id]);

    useEffect(() => {
        if (!formData.clin_tratamento_id) {
            setSessoesPorProcedimento({});
            return;
        }

        const fetchHistoricoSessoes = async () => {
            try {
                const res = await api.get('/api/agendamentos/', {
                    params: { clin_tratamento_id: formData.clin_tratamento_id }
                });

                const counts = {};
                res.data.forEach(ag => {
                    if (['concluido', 'em_atendimento'].includes(ag.status)) {
                        ag.agendamento_procedimentos?.forEach(ap => {
                            const pid = ap.procedimentos?.id;
                            if (pid) {
                                counts[pid] = (counts[pid] || 0) + 1;
                            }
                        });
                    }
                });
                setSessoesPorProcedimento(counts);
            } catch (err) {
                console.error("Erro ao buscar histórico de sessões do tratamento:", err);
            }
        };

        fetchHistoricoSessoes();
    }, [formData.clin_tratamento_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.paciente_id || !formData.dentista_id || !formData.data_hora) {
            setError('Paciente, Dentista e Data/Hora são campos obrigatórios.');
            setLoading(false);
            return;
        }

        try {
            // Send local time directly without converting to UTC to avoid timezone shifts
            // Format from input is "YYYY-MM-DDTHH:mm", so we just append ":00"
            const dataHoraString = formData.data_hora.length === 16 ? `${formData.data_hora}:00` : formData.data_hora;

            const payload = {
                ...formData,
                data_hora: dataHoraString,
                duracao_minutos: formData.duracao_minutos ? parseInt(formData.duracao_minutos, 10) : 60
            };

            if (isEditing) {
                await api.put(`/api/agendamentos/${initialData.id}`, payload);
            } else {
                await api.post('/api/agendamentos/', payload);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.detail) {
                setError(typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : JSON.stringify(err.response.data.detail));
            } else {
                setError('Ocorreu um erro ao salvar o agendamento.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (carregandoListas) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Carregando formulário...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                    <FileWarning size={20} />
                    <p className="font-medium text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Paciente *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Users size={18} />
                        </div>
                        <select
                            name="paciente_id"
                            value={formData.paciente_id}
                            onChange={handleChange}
                            required
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                        >
                            <option value="" disabled>Selecione um Paciente...</option>
                            {pacientes.map(p => (
                                <option key={p.id} value={p.id}>{p.nome} {p.cpf ? `(${p.cpf})` : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Dentista Responsável *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Stethoscope size={18} />
                        </div>
                        <select
                            name="dentista_id"
                            value={formData.dentista_id}
                            onChange={handleChange}
                            required
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                        >
                            <option value="" disabled>Selecione um Especialista...</option>
                            {dentistas.map(d => (
                                <option key={d.id} value={d.id}>Dra/Dr. {d.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Listagem Dinâmica de Procedimentos */}
                <div className="space-y-4">
                    {/* Procedimentos em Aberto */}
                    {formData.paciente_id && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-indigo-700 dark:text-indigo-400">
                                Procedimentos em Andamento (do Paciente)
                            </label>
                            {(() => {
                                // Compute open procedures map
                                const openIds = [];
                                const treatmentMap = {};
                                tratamentosAtivos.forEach(t => {
                                    let procs = t.procedimentos_ids || [];
                                    const concluidos = t.procedimentos_concluidos_ids || [];
                                    if (procs.length === 0 && t.procedimento_id) procs = [t.procedimento_id];
                                    if (procs.length === 0 && t.observacoes) {
                                        const parsed = procedimentos.filter(p => t.observacoes.toLowerCase().includes(p.nome.toLowerCase()));
                                        procs = parsed.map(p => p.id);
                                    }
                                    procs.forEach(pId => {
                                        if (!concluidos.includes(pId) && !openIds.includes(pId)) {
                                            openIds.push(pId);
                                            treatmentMap[pId] = t.id; // Map proc to its treatment
                                        }
                                    });
                                });

                                const openProcedures = procedimentos.filter(p => openIds.includes(p.id));

                                if (openProcedures.length === 0) {
                                    return <p className="text-xs text-slate-500">Nenhum procedimento em aberto encontrado.</p>;
                                }

                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10">
                                        {openProcedures.map(p => {
                                            const isChecked = formData.procedimentos_ids.includes(p.id);
                                            return (
                                                <label key={p.id} className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40' : 'border-indigo-100 dark:border-indigo-800/30 hover:bg-white dark:hover:bg-slate-800'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 shrink-0 w-4 h-4 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 border-indigo-300 rounded"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setFormData(prev => {
                                                                const novosIds = checked
                                                                    ? [...prev.procedimentos_ids, p.id]
                                                                    : prev.procedimentos_ids.filter(id => id !== p.id);

                                                                const duracaoDesseProc = p.duracao_estimada || 60;
                                                                const duracaoAtual = parseInt(prev.duracao_minutos) || 0;
                                                                const novaDuracao = checked
                                                                    ? duracaoAtual + duracaoDesseProc
                                                                    : Math.max(0, duracaoAtual - duracaoDesseProc);

                                                                // Se marcou um procedimento que tem tratamento, vincula. Se desmarcar e for o último, desvincula.
                                                                let novoTratId = prev.clin_tratamento_id;
                                                                if (checked && treatmentMap[p.id]) {
                                                                    novoTratId = treatmentMap[p.id];
                                                                }

                                                                return {
                                                                    ...prev,
                                                                    procedimentos_ids: novosIds,
                                                                    clin_tratamento_id: novoTratId,
                                                                    duracao_minutos: String(novaDuracao)
                                                                };
                                                            });
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">{p.nome}</span>
                                                        <span className="text-[10px] text-indigo-500 font-medium">{p.duracao_estimada || 60} min</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Todos / Outros Procedimentos */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {formData.paciente_id ? 'Adicionar Novos Procedimentos' : 'Procedimento(s) Associado(s)'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                            {procedimentos.filter(p => {
                                // Se paciente selecionado, esconde os que já estão abertos para não duplicar
                                if (!formData.paciente_id) return true;
                                const openIds = [];
                                tratamentosAtivos.forEach(t => {
                                    let procs = t.procedimentos_ids || [];
                                    if (procs.length === 0 && t.procedimento_id) procs = [t.procedimento_id];
                                    if (procs.length === 0 && t.observacoes) {
                                        const parsed = procedimentos.filter(proc => t.observacoes.toLowerCase().includes(proc.nome.toLowerCase()));
                                        procs = parsed.map(p => p.id);
                                    }
                                    procs.forEach(id => openIds.push(id));
                                });
                                return !openIds.includes(p.id);
                            }).map(p => {
                                const isChecked = formData.procedimentos_ids.includes(p.id);
                                return (
                                    <label key={p.id} className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                        <input
                                            type="checkbox"
                                            className="mt-1 shrink-0 w-4 h-4 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 border-slate-300 rounded"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => {
                                                    const novosIds = checked
                                                        ? [...prev.procedimentos_ids, p.id]
                                                        : prev.procedimentos_ids.filter(id => id !== p.id);

                                                    const duracaoDesseProc = p.duracao_estimada || 60;
                                                    const duracaoAtual = parseInt(prev.duracao_minutos) || 0;
                                                    const novaDuracao = checked
                                                        ? duracaoAtual + duracaoDesseProc
                                                        : Math.max(0, duracaoAtual - duracaoDesseProc);

                                                    return {
                                                        ...prev,
                                                        procedimentos_ids: novosIds,
                                                        duracao_minutos: String(novaDuracao)
                                                    };
                                                });
                                            }}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.nome}</span>
                                            <span className="text-[10px] text-slate-500">{p.duracao_estimada || 60} min</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Data e Hora *"
                        name="data_hora"
                        type="datetime-local"
                        value={formData.data_hora}
                        onChange={handleChange}
                        icon={CalendarDays}
                        required
                    />

                    <Input
                        label="Duração (minutos)"
                        name="duracao_minutos"
                        type="number"
                        min="15"
                        step="15"
                        value={formData.duracao_minutos}
                        onChange={handleChange}
                        icon={Clock}
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Status do Agendamento
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                    >
                        <option value="agendado">📅 Agendado</option>
                        <option value="confirmado">✅ Confirmado pelo Paciente</option>
                        <option value="aguardando">⏱️ Aguardando Paciente</option>
                        <option value="em_atendimento">⏳ Em Atendimento</option>
                        <option value="concluido">🦷 Concluído</option>
                        <option value="falta">❌ Faltou</option>
                        <option value="cancelado">🛑 Cancelado</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Observações e Lembretes
                    </label>
                    <textarea
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleChange}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        rows="2"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700/50 mt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className={`bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/20 text-white ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Salvando...' : (isEditing ? 'Atualizar Consulta' : 'Marcar Consulta')}
                </Button>
            </div>
        </form>
    );
};
