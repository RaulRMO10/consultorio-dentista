import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import { CalendarDays, Plus, FileWarning, Stethoscope, DollarSign, ChevronLeft, ChevronRight, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AgendamentoForm } from '../components/ui/AgendamentoForm';
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    useDroppable, useDraggable, rectIntersection
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// ─── Constants ────────────────────────────────────────────────────────────────
const START_HOUR = 8;
const END_HOUR = 20;
const PX_PER_MIN = 3;
const SLOT_MIN = 15;

function pxToSnappedTime(px) {
    const totalMin = Math.max(0, Math.round(px / PX_PER_MIN / SLOT_MIN) * SLOT_MIN);
    const h = Math.floor(totalMin / 60) + START_HOUR;
    const m = totalMin % 60;
    const clampedH = Math.min(h, END_HOUR - 1);
    return `${String(clampedH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// ─── Status Styles ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    agendado: { bg: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', border: '#94a3b8', text: '#334155', badge: '#64748b', label: 'Agendado', dot: '#94a3b8' },
    confirmado: { bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#3b82f6', text: '#1e40af', badge: '#2563eb', label: 'Confirmado', dot: '#3b82f6' },
    aguardando: { bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#f59e0b', text: '#92400e', badge: '#d97706', label: 'Aguardando', dot: '#f59e0b' },
    em_atendimento: { bg: 'linear-gradient(135deg,#f0f4ff,#e0e7ff)', border: '#6366f1', text: '#3730a3', badge: '#4f46e5', label: 'Em Atendimento', dot: '#6366f1' },
    concluido: { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#22c55e', text: '#14532d', badge: '#16a34a', label: 'Finalizado', dot: '#22c55e' },
    falta: { bg: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', border: '#f43f5e', text: '#881337', badge: '#e11d48', label: 'Faltou', dot: '#f43f5e' },
    cancelado: { bg: 'linear-gradient(135deg,#fafafa,#f1f5f9)', border: '#cbd5e1', text: '#64748b', badge: '#94a3b8', label: 'Cancelado', dot: '#cbd5e1' },
};
const getStatus = (s) => STATUS_STYLES[s] || STATUS_STYLES.agendado;

// ─── Dentist column colors ─────────────────────────────────────────────────────
const DENTIST_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#14b8a6', '#8b5cf6', '#f97316', '#22c55e'];

// ─── Droppable Column ─────────────────────────────────────────────────────────
function DroppableColumn({ id, totalHeight, children }) {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{
                position: 'relative',
                height: `${totalHeight}px`,
                background: isOver ? 'rgba(99,102,241,0.04)' : 'transparent',
                transition: 'background 0.2s ease',
            }}
        >
            {children}
        </div>
    );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({ agend, onDelete, onEdit, isDragging, colorAccent }) {
    const top = ((new Date(agend.data_hora).getHours() - START_HOUR) * 60 + new Date(agend.data_hora).getMinutes()) * PX_PER_MIN;
    const height = Math.max((agend.duracao_minutos || 60) * PX_PER_MIN, 36);
    const st = getStatus(agend.status);
    const dh = new Date(agend.data_hora);
    const endDh = new Date(dh.getTime() + (agend.duracao_minutos || 60) * 60000);
    const pacienteNome = agend.pacientes?.nome || 'Paciente';
    const STATUS_PROTEGIDOS = ['concluido', 'em_atendimento'];
    const temFaturamento = agend.fin_faturamentos?.length > 0;
    const podeCancelar = !STATUS_PROTEGIDOS.includes(agend.status) && !temFaturamento;
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: agend.id, data: { agend } });

    // Detecta se houve movimento real (drag) ou simples clique
    const pointerStartRef = React.useRef(null);
    const didDragRef = React.useRef(false);

    const handlePointerDown = (e) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        didDragRef.current = false;
    };
    const handlePointerMove = (e) => {
        if (!pointerStartRef.current) return;
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        if (dx > 5 || dy > 5) didDragRef.current = true;
    };
    const handleClick = (e) => {
        if (didDragRef.current) return; // ignorar se foi drag
        e.stopPropagation();
        onEdit(agend);
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                position: 'absolute',
                top: `${top}px`,
                height: `${height}px`,
                left: '6px', right: '6px',
                background: st.bg,
                borderLeft: `4px solid ${st.border}`,
                borderRadius: '12px',
                boxShadow: isDragging
                    ? 'none'
                    : '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
                opacity: isDragging ? 0.25 : 1,
                transform: CSS.Translate.toString(transform),
                transition: isDragging ? 'none' : 'box-shadow 0.2s, opacity 0.15s',
                touchAction: 'none',
                zIndex: 10,
                overflow: 'hidden',
                cursor: 'grab',
            }}
            {...attributes}
            {...listeners}
            onPointerDown={(e) => {
                handlePointerDown(e);
                listeners?.onPointerDown?.(e);
            }}
            onPointerMove={handlePointerMove}
            onClick={handleClick}
            className="group"
        >
            {/* Accent stripe */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, ${st.border}, transparent)`,
                opacity: 0.5,
                pointerEvents: 'none',
            }} />

            {/* Content */}
            <div style={{ padding: '5px 8px', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: st.badge, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={st.badge} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        {dh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {endDh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                        {podeCancelar ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(agend.id); }}
                                style={{
                                    opacity: 0, padding: '2px', border: 'none', background: 'none', cursor: 'pointer',
                                    color: '#94a3b8', transition: 'opacity 0.15s, color 0.15s',
                                }}
                                className="card-delete-btn"
                                title="Cancelar"
                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f43f5e'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
                            >
                                <Trash2 size={11} />
                            </button>
                        ) : (
                            <span style={{ fontSize: '9px', opacity: 0, color: '#94a3b8' }} title={temFaturamento ? 'Faturado' : 'Consulta realizada'}>🔒</span>
                        )}
                    </div>
                </div>

                {/* Patient name */}
                <div
                    style={{ fontSize: '12px', fontWeight: 800, color: st.text, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', pointerEvents: 'auto' }}
                    onClick={(e) => { e.stopPropagation(); onEdit(agend); }}
                >
                    {pacienteNome}
                </div>

                {/* Status badge */}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em',
                        color: st.badge, display: 'flex', alignItems: 'center', gap: '3px',
                        textTransform: 'uppercase',
                    }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }} />
                        {st.label}
                    </span>
                    {temFaturamento && (
                        <span style={{
                            fontSize: '8px', fontWeight: 700, color: '#16a34a',
                            background: '#dcfce7', borderRadius: '99px', padding: '1px 5px',
                            display: 'flex', alignItems: 'center', gap: '2px',
                        }}>
                            <DollarSign size={7} /> FATURADO
                        </span>
                    )}
                </div>

                {/* Procedures */}
                {height >= 80 && agend.agendamento_procedimentos?.length > 0 && (
                    <div style={{ fontSize: '10px', color: st.text, opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        🦷 {agend.agendamento_procedimentos.map(ap => ap.procedimentos?.nome).join(' · ')}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Drag Overlay Card ─────────────────────────────────────────────────────────
function OverlayCard({ agend }) {
    if (!agend) return null;
    const height = Math.max((agend.duracao_minutos || 60) * PX_PER_MIN, 36);
    const st = getStatus(agend.status);
    const pacienteNome = agend.pacientes?.nome || 'Paciente';
    const dh = new Date(agend.data_hora);
    return (
        <div style={{
            width: '260px', height: `${height}px`,
            background: st.bg,
            borderLeft: `4px solid ${st.border}`,
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 6px 20px rgba(0,0,0,0.12)',
            transform: 'rotate(-2deg) scale(1.06)',
            backdropFilter: 'blur(20px)',
            padding: '8px 12px',
            pointerEvents: 'none',
        }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: st.badge, marginBottom: '4px' }}>
                {dh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: st.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pacienteNome}</div>
            <div style={{ fontSize: '10px', color: st.badge, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{st.label}</div>
        </div>
    );
}

// ─── Now Line ─────────────────────────────────────────────────────────────────
function NowLine() {
    const [top, setTop] = useState(null);
    useEffect(() => {
        const update = () => {
            const now = new Date();
            const h = now.getHours(), m = now.getMinutes();
            setTop(h >= START_HOUR && h < END_HOUR ? ((h - START_HOUR) * 60 + m) * PX_PER_MIN : null);
        };
        update();
        const id = setInterval(update, 30000);
        return () => clearInterval(id);
    }, []);
    if (top === null) return null;
    return (
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${top}px`, zIndex: 30, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)', flexShrink: 0, marginLeft: '-4px' }} />
            <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(90deg, #ef4444, rgba(239,68,68,0.15))', boxShadow: '0 0 6px rgba(239,68,68,0.3)' }} />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Agendamentos = () => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [dentistas, setDentistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgendamento, setSelectedAgendamento] = useState(null);
    const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, agendamentoId: null });
    const [activeAgend, setActiveAgend] = useState(null);
    const saveTimerRef = useRef(null);
    const totalGridHeight = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN;

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [agRes, dentRes] = await Promise.all([
                api.get('/api/agendamentos'),
                api.get('/api/dentistas')
            ]);
            setAgendamentos(agRes.data);
            setDentistas(dentRes.data.filter(d => d.ativo !== false));
        } catch { setError('Falha ao carregar a agenda.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredAgendamentos = agendamentos.filter(a => {
        if (!a.data_hora || a.status === 'cancelado') return false;
        return a.data_hora.startsWith(filterDate);
    });

    const handleOpenModal = (ag = null) => { setSelectedAgendamento(ag); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedAgendamento(null); };
    const handleSuccess = () => { handleCloseModal(); fetchData(); };

    const handleDelete = (id) => { setDeleteModalConfig({ isOpen: true, agendamentoId: id }); };
    const confirmDelete = async () => {
        const { agendamentoId } = deleteModalConfig;
        if (!agendamentoId) return;
        try {
            await api.delete(`/api/agendamentos/${agendamentoId}`);
            fetchData();
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Erro ao cancelar agendamento.');
            setTimeout(() => setError(null), 6000);
        } finally {
            setDeleteModalConfig({ isOpen: false, agendamentoId: null });
        }
    };

    const scheduleSave = useCallback((id, newDataHora, newDentistaId) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            try {
                await api.put(`/api/agendamentos/${id}`, { data_hora: newDataHora, dentista_id: newDentistaId });
            } catch (err) {
                const detail = err.response?.data?.detail;
                setError(typeof detail === 'string' ? detail : 'Erro ao salvar no servidor.');
                fetchData();
                setTimeout(() => setError(null), 6000);
            }
        }, 800);
    }, [fetchData]);

    const handleDragStart = ({ active }) => {
        setActiveAgend(agendamentos.find(a => a.id === active.id) || null);
    };

    const handleDragEnd = ({ active, over, delta }) => {
        setActiveAgend(null);
        if (!active || !over) return;
        const agend = agendamentos.find(a => a.id === active.id);
        if (!agend) return;
        const targetDentistaId = over.id;
        const oldDh = new Date(agend.data_hora);
        const oldTopPx = (oldDh.getHours() - START_HOUR) * 60 * PX_PER_MIN + oldDh.getMinutes() * PX_PER_MIN;
        const newTopPx = Math.max(0, oldTopPx + delta.y);
        const snappedTime = pxToSnappedTime(newTopPx);
        const newDataHora = `${filterDate}T${snappedTime}`;
        const oldDataHora = `${filterDate}T${String(oldDh.getHours()).padStart(2, '0')}:${String(oldDh.getMinutes()).padStart(2, '0')}:00`;
        if (newDataHora === oldDataHora && targetDentistaId === agend.dentista_id) return;

        const newStart = new Date(newDataHora);
        const newEnd = new Date(newStart.getTime() + (agend.duracao_minutos || 60) * 60000);
        const colliding = filteredAgendamentos.find(other => {
            if (other.id === agend.id || other.dentista_id !== targetDentistaId || ['cancelado', 'falta'].includes(other.status)) return false;
            const os = new Date(other.data_hora);
            const oe = new Date(os.getTime() + (other.duracao_minutos || 60) * 60000);
            return newStart < oe && newEnd > os;
        });
        if (colliding) { setError('Choque de horário: já existe uma consulta nesse slot.'); setTimeout(() => setError(null), 4000); return; }

        setAgendamentos(prev => prev.map(a => a.id === agend.id ? { ...a, data_hora: newDataHora, dentista_id: targetDentistaId } : a));
        scheduleSave(agend.id, newDataHora, targetDentistaId);
    };

    const navigateDate = (days) => {
        const d = new Date(filterDate + 'T12:00:00');
        d.setDate(d.getDate() + days);
        setFilterDate(d.toISOString().split('T')[0]);
    };

    const totalHours = END_HOUR - START_HOUR;

    return (
        <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", width: '100%', paddingBottom: '48px' }}>
            {/* ── Hero Header ── */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.03em' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                            <CalendarDays size={20} color="white" />
                        </div>
                        Agenda
                    </h1>
                    <p style={{ margin: '4px 0 0 52px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                        Arraste para mover • Clique no nome para editar
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color: 'white', border: 'none', borderRadius: '14px',
                        padding: '11px 22px', fontSize: '14px', fontWeight: 700,
                        cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.55)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; }}
                >
                    <Plus size={17} /> Nova Consulta
                </button>
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', border: '1px solid #fecdd3', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#9f1239', fontWeight: 600, fontSize: '13px' }}>
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {/* ── Toolbar ── */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '10px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Data:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '3px' }}>
                        <button onClick={() => navigateDate(-1)} style={{ padding: '5px 8px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <ChevronLeft size={15} />
                        </button>
                        <input
                            type="date" value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            style={{ border: 'none', background: 'none', fontSize: '13px', fontWeight: 700, color: '#1e293b', cursor: 'pointer', outline: 'none', textAlign: 'center', padding: '0 4px' }}
                        />
                        <button onClick={() => navigateDate(1)} style={{ padding: '5px 8px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        {filteredAgendamentos.length} consulta{filteredAgendamentos.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* ── Calendar ── */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 32px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex' }}>

                {/* Time axis */}
                <div style={{ width: '52px', flexShrink: 0, borderRight: '1px solid #f1f5f9', background: '#fafbff', position: 'relative', paddingTop: '52px' }}>
                    {Array.from({ length: totalHours }).map((_, i) => {
                        const h = START_HOUR + i;
                        return (
                            <React.Fragment key={h}>
                                <div style={{ position: 'absolute', top: `${52 + i * 60 * PX_PER_MIN}px`, right: '8px', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 700, color: h === new Date().getHours() ? '#6366f1' : '#94a3b8', userSelect: 'none' }}>
                                    {String(h).padStart(2, '0')}:00
                                </div>
                                <div style={{ position: 'absolute', top: `${52 + (i * 60 + 30) * PX_PER_MIN}px`, right: '10px', transform: 'translateY(-50%)', fontSize: '9px', fontWeight: 500, color: '#cbd5e1', userSelect: 'none' }}>
                                    :30
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* DnD Canvas */}
                <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
                    {loading && dentistas.length === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #f1f5f9', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <div style={{ display: 'flex', minWidth: 'max-content' }}>
                                {dentistas.map((dentista, idx) => {
                                    const accent = DENTIST_COLORS[idx % DENTIST_COLORS.length];
                                    const dAgends = filteredAgendamentos.filter(a => a.dentista_id === dentista.id);
                                    return (
                                        <div key={dentista.id} style={{ width: '280px', flexShrink: 0, borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                            {/* Column Header */}
                                            <div style={{
                                                height: '52px', borderBottom: '1px solid #f1f5f9',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                background: `linear-gradient(to bottom, ${accent}12, white)`,
                                                position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(8px)',
                                            }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${accent}22`, border: `2px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Stethoscope size={13} color={accent} />
                                                </div>
                                                <span style={{ fontWeight: 800, fontSize: '12px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                                    {dentista.nome}
                                                </span>
                                            </div>

                                            {/* Droppable */}
                                            <DroppableColumn id={dentista.id} totalHeight={totalGridHeight}>
                                                {/* Grid lines */}
                                                {Array.from({ length: totalHours * 4 }).map((_, i) => (
                                                    <div key={i} style={{
                                                        position: 'absolute', width: '100%',
                                                        top: `${i * SLOT_MIN * PX_PER_MIN}px`,
                                                        borderTop: i % 4 === 0
                                                            ? '1px solid #f1f5f9'
                                                            : '1px dashed #f8fafc',
                                                        zIndex: 0, pointerEvents: 'none',
                                                    }} />
                                                ))}
                                                <NowLine />
                                                {dAgends.map(ag => (
                                                    <AppointmentCard
                                                        key={ag.id}
                                                        agend={ag}
                                                        onDelete={handleDelete}
                                                        onEdit={handleOpenModal}
                                                        isDragging={activeAgend?.id === ag.id}
                                                        colorAccent={accent}
                                                    />
                                                ))}
                                            </DroppableColumn>
                                        </div>
                                    );
                                })}
                                {dentistas.length < 3 && (
                                    <div style={{ flex: 1, minWidth: '100px', background: '#fafbff' }} />
                                )}
                            </div>

                            <DragOverlay dropAnimation={null}>
                                {activeAgend ? <OverlayCard agend={activeAgend} /> : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .group:hover .card-delete-btn { opacity: 1 !important; }
            `}</style>

            {/* Modals */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedAgendamento ? 'Atualizar Agendamento' : 'Nova Consulta'}>
                <AgendamentoForm initialData={selectedAgendamento} onSuccess={handleSuccess} onCancel={handleCloseModal} />
            </Modal>

            <ConfirmDialog
                isOpen={deleteModalConfig.isOpen}
                onClose={() => setDeleteModalConfig({ isOpen: false, agendamentoId: null })}
                onConfirm={confirmDelete}
                title="Cancelar Consulta"
                message="Confirma o cancelamento desta consulta?"
                confirmText="Sim, Cancelar"
                cancelText="Voltar"
                isDanger={true}
            />
        </div>
    );
};

export default Agendamentos;
