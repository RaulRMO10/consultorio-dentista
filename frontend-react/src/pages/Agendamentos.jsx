import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { CalendarDays, Plus, Edit2, Trash2, FileWarning, Clock, Users, Stethoscope, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { AgendamentoForm } from '../components/ui/AgendamentoForm';

const Agendamentos = () => {
    const navigate = useNavigate();
    const [agendamentos, setAgendamentos] = useState([]);
    const [dentistas, setDentistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Calendar Grid Settings
    const START_HOUR = 8;
    const END_HOUR = 19;
    const PIXELS_PER_MINUTE = 3; // 1 hour = 180px, 15m = 45px
    const SLOT_HEIGHT = 15 * PIXELS_PER_MINUTE; // 45px

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgendamento, setSelectedAgendamento] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [agendRes, dentRes] = await Promise.all([
                api.get('/api/agendamentos'),
                api.get('/api/dentistas')
            ]);
            setAgendamentos(agendRes.data);
            setDentistas(dentRes.data);
        } catch (err) {
            setError('Falha ao carregar a agenda e dentistas.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers
    const handleOpenModal = (agendamento = null) => {
        setSelectedAgendamento(agendamento);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAgendamento(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchData();
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja cancelar esta consulta?`)) {
            try {
                await api.delete(`/api/agendamentos/${id}`);
                fetchData();
            } catch (err) {
                console.error(err);
                alert("Erro ao cancelar agendamento.");
            }
        }
    };

    // Filters & Math
    const filteredAgendamentos = agendamentos.filter(a => {
        if (!a.data_hora || a.status === 'cancelado') return false;
        return a.data_hora.startsWith(filterDate);
    });

    const calculateTopOffset = (timeString) => {
        // timeString: "HH:MM:SS" or Date string
        const d = new Date(timeString);
        let hours = d.getHours();
        let minutes = d.getMinutes();

        // Clamp to start logic
        if (hours < START_HOUR) return 0;

        const minutesFromStart = ((hours - START_HOUR) * 60) + minutes;
        return minutesFromStart * PIXELS_PER_MINUTE;
    };

    const calculateHeight = (duracaoMinutos) => {
        const d = duracaoMinutos || 60; // default 60
        return d * PIXELS_PER_MINUTE;
    };

    // Time Slots for the Y Axis
    const timeLabels = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
        const baseTop = (h - START_HOUR) * 60 * PIXELS_PER_MINUTE;
        timeLabels.push({ label: `${h.toString().padStart(2, '0')}:00`, top: baseTop, isMain: true });
        timeLabels.push({ label: `${h.toString().padStart(2, '0')}:15`, top: baseTop + 15 * PIXELS_PER_MINUTE, isMain: false });
        timeLabels.push({ label: `${h.toString().padStart(2, '0')}:30`, top: baseTop + 30 * PIXELS_PER_MINUTE, isMain: false });
        timeLabels.push({ label: `${h.toString().padStart(2, '0')}:45`, top: baseTop + 45 * PIXELS_PER_MINUTE, isMain: false });
    }

    // Interactive Drag Elements
    const parseTimeFromPixels = (pixels) => {
        const totalMinutes = Math.floor(pixels / PIXELS_PER_MINUTE);
        const hours = Math.floor(totalMinutes / 60) + START_HOUR;
        const minutes = totalMinutes % 60;

        // Snap to nearest 15 minutes
        const snappedMinutes = Math.round(minutes / 15) * 15;
        let finalHours = hours;
        let finalMinutes = snappedMinutes;

        if (snappedMinutes === 60) {
            finalHours += 1;
            finalMinutes = 0;
        }

        return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}:00`;
    };

    const handleDragStart = (e, agendamento) => {
        e.dataTransfer.setData('agendamento_id', agendamento.id);
        // Calculate the mouse offset within the card to prevent jumping when dropped
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData('offsetY', offsetY);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetDentistaId) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('agendamento_id');
        const offsetY = parseInt(e.dataTransfer.getData('offsetY') || '0', 10);

        if (!id) return;

        const agendamento = agendamentos.find(a => a.id === id);
        if (!agendamento) return;

        // Calculate dropped coordinates relative to the column container
        const columnRect = e.currentTarget.getBoundingClientRect();
        const dropY = e.clientY - columnRect.top;

        // Adjust for where the user clicked inside the card during drag start
        const adjustedDropY = Math.max(0, dropY - offsetY);

        const newTargetTimeString = parseTimeFromPixels(adjustedDropY);

        // Construct new JS Date to check logic
        const novaDataHoraLocal = `${filterDate}T${newTargetTimeString}`;
        const newStart = new Date(novaDataHoraLocal);
        const duracao = agendamento.duracao_minutos || 60;
        const newEnd = new Date(newStart.getTime() + duracao * 60000);

        // Validation: Collision Check Math (StartA < EndB && EndA > StartB)
        const colliding = filteredAgendamentos.find(other => {
            if (other.id === agendamento.id) return false;
            if (other.dentista_id !== targetDentistaId) return false;

            const otherStart = new Date(other.data_hora);
            const otherDuracao = other.duracao_minutos || 60;
            const otherEnd = new Date(otherStart.getTime() + otherDuracao * 60000);

            return (newStart < otherEnd && newEnd > otherStart);
        });

        if (colliding) {
            alert(`Choque de Horário!\nO dentista já tem um compromisso que cruza com esse horário.`);
            return;
        }

        // Optimistic Update
        setAgendamentos(prev => prev.map(a =>
            a.id === id ? { ...a, data_hora: novaDataHoraLocal, dentista_id: targetDentistaId } : a
        ));

        try {
            await api.put(`/api/agendamentos/${id}`, {
                data_hora: novaDataHoraLocal,
                dentista_id: targetDentistaId
            });
        } catch (err) {
            console.error("Erro ao mover card", err);
            alert("Erro ao salvar no servidor.");
            fetchData(); // Revert
        }
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'agendado': return { border: 'border-slate-400 dark:border-slate-500', dot: 'bg-slate-500', bg: 'bg-slate-200 dark:bg-slate-700/80', label: 'Agendado' };
            case 'confirmado': return { border: 'border-blue-400 dark:border-blue-500', dot: 'bg-blue-600', bg: 'bg-blue-200 dark:bg-blue-900/60', label: 'Confirmado' };
            case 'aguardando': return { border: 'border-orange-400 dark:border-orange-500', dot: 'bg-orange-600', bg: 'bg-orange-200 dark:bg-orange-900/60', label: 'Aguardando' };
            case 'em_atendimento': return { border: 'border-indigo-400 dark:border-indigo-500', dot: 'bg-indigo-600', bg: 'bg-indigo-300 dark:bg-indigo-900/80', label: 'Em Atendimento' };
            case 'concluido': return { border: 'border-emerald-400 dark:border-emerald-500', dot: 'bg-emerald-600', bg: 'bg-emerald-200 dark:bg-emerald-900/60', label: 'Finalizado' };
            case 'falta': return { border: 'border-red-400 dark:border-red-500', dot: 'bg-red-600', bg: 'bg-red-200 dark:bg-red-900/60', label: 'Faltou' };
            case 'cancelado': return { border: 'border-rose-400 dark:border-rose-500', dot: 'bg-rose-600', bg: 'bg-rose-200 dark:bg-rose-900/60', label: 'Cancelado' };
            default: return { border: 'border-slate-300', dot: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: status };
        }
    };

    const renderAbsoluteCard = (agend) => {
        const top = calculateTopOffset(agend.data_hora);
        const height = calculateHeight(agend.duracao_minutos);
        const pacienteNome = agend.pacientes?.nome || 'Paciente Desconhecido';
        const st = getStatusColor(agend.status);

        const dh = new Date(agend.data_hora);
        const endDh = new Date(dh.getTime() + (agend.duracao_minutos || 60) * 60000);

        return (
            <div
                key={agend.id}
                draggable
                onDragStart={(e) => handleDragStart(e, agend)}
                onClick={(e) => {
                    // Prevent drag/drop from bubbling as regular click occasionally
                    e.stopPropagation();
                    handleOpenModal(agend);
                }}
                style={{ top: `${top}px`, height: `${height}px` }}
                className={`absolute left-1 right-1 p-2 rounded-lg border-l-4 border-y border-r shadow-sm hover:shadow-md hover:z-50 cursor-pointer active:cursor-grabbing transition-shadow overflow-hidden group z-10 ${st.bg} ${st.border}`}
            >
                {/* Thin header row */}
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                        {dh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {endDh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button onClick={(e) => handleDelete(agend.id, e)} className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                        <Trash2 size={12} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex flex-col h-full">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1" title={pacienteNome}>
                        {pacienteNome} <span className="text-[10px] font-normal text-slate-500 ml-1">({st.label})</span>
                    </h3>

                    {/* Show extra details if card is tall enough (>= 45m = 90px) */}
                    {height >= 80 && (
                        <div className="mt-1 space-y-1">
                            {agend.agendamento_procedimentos && agend.agendamento_procedimentos.length > 0 && (
                                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate opacity-90" title={agend.agendamento_procedimentos.map(ap => ap.procedimentos?.nome).join(', ')}>
                                    🦷 {agend.agendamento_procedimentos.map(ap => ap.procedimentos?.nome).join(' + ')}
                                </div>
                            )}
                            {agend.fin_faturamentos && agend.fin_faturamentos.length > 0 && (
                                <div className="inline-flex mt-1 items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/50 dark:bg-emerald-900/30 px-1 py-0.5 rounded">
                                    <DollarSign size={10} /> FATURADO
                                </div>
                            )}
                        </div>
                    )}

                    {/* Faturamento / Checkout Actions for Concluido */}
                    {agend.status === 'concluido' && (
                        <div className="mt-auto pt-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (agend.clin_tratamento_id) {
                                        navigate(`/faturamentos?paciente_id=${agend.paciente_id}`);
                                    } else {
                                        navigate(`/faturamentos?paciente_id=${agend.paciente_id}`);
                                    }
                                }}
                                className={`w-full text-[10px] font-bold py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 transition-colors ${agend.clin_tratamento_id
                                    ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' // Ver Financeiro
                                    : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800' // Faturar
                                    }`}
                            >
                                <DollarSign size={12} />
                                {agend.clin_tratamento_id ? 'Ver Financeiro' : 'Faturar / Checkout'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <CalendarDays size={24} />
                        </div>
                        Agenda Calendário
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Visão em grade interativa. Arraste os blocos para ajustar horários ou trocar dentistas.</p>
                </div>
                <div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Nova Consulta
                    </button>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400">
                    <FileWarning size={20} />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Toolbar */}
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data:</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="block pl-4 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-all text-sm font-medium outline-none"
                    />
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    {filteredAgendamentos.length} agendamentos na grade
                </div>
            </div>

            {/* FULL GRID CALENDAR BASE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex">

                {/* 1. Y-Axis Time Labels Strip */}
                <div className="w-16 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 relative pt-12 z-20">
                    {timeLabels.map((t, idx) => (
                        <div
                            key={idx}
                            style={{ top: `${t.top + 48}px` }} // 48 is the header height offset
                            className={`absolute right-2 -translate-y-1/2 ${t.isMain ? 'text-[11px] font-bold text-slate-500' : 'text-[9px] font-medium text-slate-400'}`}
                        >
                            {t.label}
                        </div>
                    ))}
                </div>

                {/* 2. X-Axis Scrollable Columns container */}
                <div className="flex-1 overflow-x-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-900/20">
                    {loading && dentistas.length === 0 ? (
                        <div className="p-20 flex justify-center w-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <div className="flex min-w-max">

                            {/* Render a column for each Dentist */}
                            {dentistas.map((dentista, dIndex) => {
                                const dentistaAgends = filteredAgendamentos.filter(a => a.dentista_id === dentista.id);
                                const totalGridHeight = (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE; // The total height of the day

                                return (
                                    <div key={dentista.id} className="w-[300px] flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800">

                                        {/* Column Header (Dentist Name) */}
                                        <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 sticky top-0 z-30 flex items-center justify-center p-2 backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                    <Stethoscope size={16} />
                                                </div>
                                                <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{dentista.nome}</h3>
                                            </div>
                                        </div>

                                        {/* Column Body Container (Absolute Positioning Bounds) */}
                                        <div
                                            className="relative w-full"
                                            style={{ height: `${totalGridHeight}px` }}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, dentista.id)}
                                        >

                                            {/* Draw horizontal ruled lines for every 15 mins to guide the eye */}
                                            {Array.from({ length: (END_HOUR - START_HOUR) * 4 }).map((_, i) => (
                                                <div
                                                    key={`rule-${i}`}
                                                    className={`absolute w-full border-t pointer-events-none ${i % 4 === 0 ? 'border-slate-200 dark:border-slate-700/60' : 'border-slate-100 dark:border-slate-800/40 border-dashed'}`}
                                                    style={{ top: `${i * 15 * PIXELS_PER_MINUTE}px`, zIndex: 0 }}
                                                ></div>
                                            ))}

                                            {/* Render all cards for this dentist */}
                                            {dentistaAgends.map(agend => renderAbsoluteCard(agend))}

                                        </div>
                                    </div>
                                );
                            })}

                            {/* Grace space block at the end if the list of dentist is small to fill width */}
                            {dentistas.length < 3 && (
                                <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-900/30 pattern-diagonal-lines pattern-slate-100 dark:pattern-slate-800/20 pattern-bg-transparent pattern-size-4 opacity-50"></div>
                            )}

                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedAgendamento ? "Atualizar Agendamento" : "Nova Consulta"}
            >
                <AgendamentoForm
                    initialData={selectedAgendamento}
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default Agendamentos;
