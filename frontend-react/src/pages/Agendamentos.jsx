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

// ─── Weekly View ───────────────────────────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function getWeekDays(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay(); // 0 = Sun
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7)); // Segunda
    return Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        return dt.toISOString().split('T')[0];
    });
}

function WeeklyDashboard({ agendamentos: allAgendamentos, dentistas, onDayClick, currentDate }) {
    const weekDays = getWeekDays(currentDate);
    const today = new Date().toISOString().split('T')[0];

    // ── Cross-filter states (Power BI style) ──
    const [selDays, setSelDays] = React.useState(new Set());  // Set<dateStr>
    const [selDentista, setSelDentista] = React.useState(null);        // dentista.id | null
    const [selStatus, setSelStatus] = React.useState(null);        // status string | null
    const [selKpi, setSelKpi] = React.useState(null);        // kpi key | null

    const hasAnyFilter = selDays.size > 0 || selDentista || selStatus || selKpi;

    // Toggle helpers
    const toggleDay = (d) => setSelDays(prev => {
        const next = new Set(prev);
        next.has(d) ? next.delete(d) : next.add(d);
        return next;
    });
    const toggleDentista = (id) => setSelDentista(p => p === id ? null : id);
    const toggleStatus = (s) => setSelStatus(p => p === s ? null : s);

    // ── Full week pool ──
    const weekAll = allAgendamentos.filter(a => weekDays.some(d => a.data_hora?.startsWith(d)));

    // ── KPI config (no filter applied to kpis themselves) ──
    const KPI_DEFS = [
        {
            key: 'todos', label: 'Total', color: '#6366f1', bg: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', icon: '📋',
            fn: a => a.status !== 'cancelado'
        },
        {
            key: 'confirmados', label: 'Confirmadas', color: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', icon: '✅',
            fn: a => ['confirmado', 'em_atendimento'].includes(a.status)
        },
        {
            key: 'concluidos', label: 'Concluídas', color: '#22c55e', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', icon: '🏁',
            fn: a => a.status === 'concluido'
        },
        {
            key: 'faltas', label: 'Faltas', color: '#f43f5e', bg: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', icon: '❌',
            fn: a => a.status === 'falta'
        },
        {
            key: 'cancelados', label: 'Canceladas', color: '#94a3b8', bg: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', icon: '🚫',
            fn: a => a.status === 'cancelado'
        },
    ];

    // ── Apply all filters cross-combined ──
    const applyFilters = (list, excludeKpi = false, excludeDay = false, excludeDentista = false, excludeStatus = false) => {
        let r = list;
        if (!excludeKpi && selKpi) r = r.filter(KPI_DEFS.find(k => k.key === selKpi)?.fn || (() => true));
        if (!excludeDay && selDays.size) r = r.filter(a => selDays.has(a.data_hora?.split('T')[0]));
        if (!excludeDentista && selDentista) r = r.filter(a => a.dentista_id === selDentista);
        if (!excludeStatus && selStatus) r = r.filter(a => a.status === selStatus);
        return r;
    };

    // Main filtered list (all filters applied)
    const listaOrdenada = applyFilters(weekAll).sort((a, b) => a.data_hora.localeCompare(b.data_hora));

    // KPI counts: apply all filters EXCEPT the kpi filter itself (so you see counts relative to other filters)
    const kpiCounts = KPI_DEFS.map(k => ({
        ...k,
        value: applyFilters(weekAll.filter(k.fn), true),
    }));

    // Ocupação por dia: apply all filters EXCEPT day filter (so bars show cross-filtered totals per day)
    const listExcDay = applyFilters(weekAll, false, true);
    const maxDia = Math.max(...weekDays.map(d => listExcDay.filter(a => a.data_hora?.startsWith(d)).length), 1);

    // Dentistas: apply all filters EXCEPT dentista filter
    const listExcDen = applyFilters(weekAll, false, false, true);
    const dentistasRank = dentistas.map((den, i) => ({
        ...den,
        count: listExcDen.filter(a => a.dentista_id === den.id).length,
        accent: DENTIST_COLORS[i % DENTIST_COLORS.length],
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
    const maxDenCount = Math.max(...dentistasRank.map(d => d.count), 1);

    // Status pills: apply all filters EXCEPT status filter
    const listExcSt = applyFilters(weekAll, false, false, false, true);
    const statusCount = {};
    listExcSt.forEach(a => { statusCount[a.status] = (statusCount[a.status] || 0) + 1; });

    const clearAll = () => {
        setSelDays(new Set()); setSelDentista(null); setSelStatus(null); setSelKpi(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Filter bar ── */}
            {hasAnyFilter && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', borderRadius: '12px', border: '1px solid #6366f130' }}>
                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 700 }}>🔍 Filtrando:</span>
                    {selKpi && <span style={{ fontSize: '11px', background: '#6366f1', color: 'white', borderRadius: '99px', padding: '3px 10px', fontWeight: 700 }}>{KPI_DEFS.find(k => k.key === selKpi)?.label}</span>}
                    {selDays.size > 0 && <span style={{ fontSize: '11px', background: '#6366f1', color: 'white', borderRadius: '99px', padding: '3px 10px', fontWeight: 700 }}>{selDays.size} dia{selDays.size > 1 ? 's' : ''}</span>}
                    {selDentista && <span style={{ fontSize: '11px', background: '#6366f1', color: 'white', borderRadius: '99px', padding: '3px 10px', fontWeight: 700 }}>{dentistas.find(d => d.id === selDentista)?.nome?.split(' ')[0]}</span>}
                    {selStatus && <span style={{ fontSize: '11px', background: '#6366f1', color: 'white', borderRadius: '99px', padding: '3px 10px', fontWeight: 700 }}>{getStatus(selStatus).label}</span>}
                    <button onClick={clearAll} style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#6366f1', background: 'white', border: '1px solid #6366f1', borderRadius: '99px', padding: '3px 12px', cursor: 'pointer' }}>✕ Limpar</button>
                </div>
            )}

            {/* ── KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                {kpiCounts.map(k => {
                    const isActive = selKpi === k.key;
                    const cnt = k.value.length;
                    return (
                        <div
                            key={k.key}
                            onClick={() => { toggleStatus(null); setSelKpi(isActive ? null : k.key); }}
                            style={{
                                background: k.bg, borderRadius: '18px', padding: '18px 20px',
                                border: isActive ? `2px solid ${k.color}` : `1px solid ${k.color}22`,
                                cursor: 'pointer', position: 'relative',
                                transform: isActive ? 'translateY(-3px)' : 'none',
                                boxShadow: isActive ? `0 8px 24px ${k.color}35` : '0 1px 4px rgba(0,0,0,0.04)',
                                transition: 'all 0.18s ease',
                                opacity: selKpi && !isActive ? 0.55 : 1,
                            }}
                        >
                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '9px', fontWeight: 800, color: 'white', background: k.color, borderRadius: '99px', padding: '2px 7px' }}>ativo</div>}
                            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{k.icon}</div>
                            <div style={{ fontSize: '30px', fontWeight: 900, color: k.color, lineHeight: 1 }}>{cnt}</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '5px' }}>{k.label}</div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* ── Ocupação por Dia ── */}
                <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📊 Ocupação por Dia
                        <span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8', marginLeft: 'auto' }}>clique para filtrar</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {weekDays.map(dateStr => {
                            const d = new Date(dateStr + 'T12:00:00');
                            const cnt = listExcDay.filter(a => a.data_hora?.startsWith(dateStr)).length;
                            const isToday = dateStr === today;
                            const isSel = selDays.has(dateStr);
                            const pct = maxDia > 0 ? (cnt / maxDia) * 100 : 0;
                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => toggleDay(dateStr)}
                                    style={{
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '4px 6px', borderRadius: '8px',
                                        background: isSel ? '#eef2ff' : 'transparent',
                                        outline: isSel ? '1.5px solid #6366f1' : 'none',
                                        transition: 'all 0.15s',
                                        opacity: selDays.size > 0 && !isSel ? 0.45 : 1,
                                    }}
                                >
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: isSel ? '#6366f1' : isToday ? '#6366f1' : '#64748b', width: '40px', flexShrink: 0 }}>
                                        {DIAS_SEMANA[d.getDay()]} {d.getDate()}
                                    </span>
                                    <div style={{ flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '99px', width: `${pct}%`,
                                            background: isSel ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : isToday ? 'linear-gradient(90deg,#6366f180,#8b5cf680)' : 'linear-gradient(90deg,#94a3b8,#cbd5e1)',
                                            transition: 'width 0.45s ease',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: isSel ? '#6366f1' : cnt > 0 ? '#1e293b' : '#cbd5e1', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                                        {cnt}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Por Dentista + Status ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Dentistas */}
                    <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', flex: 1 }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: '0 0 14px', display: 'flex', alignItems: 'center' }}>
                            🦷 Por Dentista
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8', marginLeft: 'auto' }}>clique para filtrar</span>
                        </h3>
                        {dentistasRank.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Nenhum resultado.</p>
                        ) : dentistasRank.map(den => {
                            const isSel = selDentista === den.id;
                            const pct = maxDenCount > 0 ? (den.count / maxDenCount) * 100 : 0;
                            return (
                                <div
                                    key={den.id}
                                    onClick={() => toggleDentista(den.id)}
                                    style={{
                                        marginBottom: '10px', cursor: 'pointer', padding: '6px 8px', borderRadius: '10px',
                                        background: isSel ? `${den.accent}12` : 'transparent',
                                        outline: isSel ? `1.5px solid ${den.accent}` : 'none',
                                        transition: 'all 0.15s',
                                        opacity: selDentista && !isSel ? 0.4 : 1,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: isSel ? den.accent : '#334155' }}>
                                            {den.nome.split(' ').slice(0, 2).join(' ')}
                                        </span>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: den.accent }}>
                                            {den.count} consulta{den.count > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: isSel ? den.accent : `${den.accent}88`, borderRadius: '99px', transition: 'width 0.45s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Status pills */}
                    <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center' }}>
                            📌 Por Status
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8', marginLeft: 'auto' }}>clique para filtrar</span>
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.entries(statusCount).map(([st, cnt]) => {
                                const s = getStatus(st);
                                const isSel = selStatus === st;
                                return (
                                    <div
                                        key={st}
                                        onClick={() => { setSelKpi(null); toggleStatus(st); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            background: isSel ? s.border + '22' : s.bg,
                                            borderRadius: '99px', padding: '6px 14px',
                                            border: isSel ? `2px solid ${s.border}` : `1px solid ${s.border}44`,
                                            cursor: 'pointer',
                                            transform: isSel ? 'scale(1.06)' : 'scale(1)',
                                            boxShadow: isSel ? `0 4px 12px ${s.border}30` : 'none',
                                            transition: 'all 0.15s',
                                            opacity: selStatus && !isSel ? 0.4 : 1,
                                        }}
                                    >
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: s.text }}>{s.label}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: s.badge }}>{cnt}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Lista da Semana ── */}
            <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        🗓️ Consultas {hasAnyFilter ? 'Filtradas' : 'da Semana'}
                        <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 700, color: '#6366f1', background: '#eef2ff', borderRadius: '99px', padding: '2px 10px' }}>{listaOrdenada.length}</span>
                    </h3>
                    {hasAnyFilter ? (
                        <button onClick={clearAll} style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #6366f130', borderRadius: '99px', padding: '4px 12px', cursor: 'pointer' }}>✕ Limpar filtros</button>
                    ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Clique nos painéis para filtrar</span>
                    )}
                </div>
                {listaOrdenada.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Nenhuma consulta encontrada</p>
                        {hasAnyFilter && <button onClick={clearAll} style={{ marginTop: '8px', fontSize: '12px', color: '#6366f1', fontWeight: 700, background: 'none', border: '1px solid #6366f1', borderRadius: '99px', padding: '5px 16px', cursor: 'pointer' }}>Limpar filtros</button>}
                    </div>
                ) : (
                    <div>
                        {listaOrdenada.map((ag, idx) => {
                            const st = getStatus(ag.status);
                            const dh = new Date(ag.data_hora);
                            const dateStr = ag.data_hora.split('T')[0];
                            const den = dentistas.find(d => d.id === ag.dentista_id);
                            const denIdx = dentistas.findIndex(d => d.id === ag.dentista_id);
                            const accent = DENTIST_COLORS[denIdx % DENTIST_COLORS.length];
                            const isToday = dateStr === today;
                            return (
                                <div
                                    key={ag.id}
                                    onClick={() => onDayClick(dateStr)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '16px',
                                        padding: '11px 22px', cursor: 'pointer',
                                        borderBottom: idx < listaOrdenada.length - 1 ? '1px solid #f8fafc' : 'none',
                                        background: isToday ? '#fefce8' : 'white',
                                        transition: 'background 0.12s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = isToday ? '#fefce8' : 'white'}
                                >
                                    <div style={{ textAlign: 'center', minWidth: '44px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{DIAS_SEMANA[dh.getDay()]}</div>
                                        <div style={{ fontSize: '17px', fontWeight: 900, color: isToday ? '#6366f1' : '#1e293b', lineHeight: 1.1 }}>{dh.getDate()}</div>
                                    </div>
                                    <div style={{ width: '3px', height: '34px', borderRadius: '9px', background: st.border, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {ag.pacientes?.nome || 'Paciente'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>{dh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            {den && <><span style={{ width: '3px', height: '3px', borderRadius: '50%', background: accent, display: 'inline-block' }} /><span>{den.nome.split(' ')[0]}</span></>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: st.bg, borderRadius: '99px', padding: '4px 10px', border: `1px solid ${st.border}44`, flexShrink: 0 }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot }} />
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: st.badge }}>{st.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
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
    const [viewMode, setViewMode] = useState('dia'); // 'dia' | 'semana'
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

    // Navigation helpers
    const navigateDate = (days) => {
        const d = new Date(filterDate + 'T12:00:00');
        d.setDate(d.getDate() + days);
        setFilterDate(d.toISOString().split('T')[0]);
    };
    const navigateWeek = (direction) => navigateDate(direction * 7);

    const handleDayClick = (dateStr) => {
        setFilterDate(dateStr);
        setViewMode('dia');
    };

    // Label for week range
    const weekDays = getWeekDays(filterDate);
    const weekStart = new Date(weekDays[0] + 'T12:00:00');
    const weekEnd = new Date(weekDays[6] + 'T12:00:00');
    const weekLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Toggle Dia/Semana */}
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                        {['dia', 'semana'].map(m => (
                            <button
                                key={m}
                                onClick={() => setViewMode(m)}
                                style={{
                                    padding: '5px 14px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                    background: viewMode === m ? 'white' : 'transparent',
                                    color: viewMode === m ? '#6366f1' : '#64748b',
                                    boxShadow: viewMode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                    transition: 'all 0.15s',
                                    textTransform: 'capitalize',
                                }}
                            >{m === 'dia' ? '📅 Dia' : '📆 Semana'}</button>
                        ))}
                    </div>

                    {/* Navegação */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '3px' }}>
                        <button
                            onClick={() => viewMode === 'dia' ? navigateDate(-1) : navigateWeek(-1)}
                            style={{ padding: '5px 8px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        ><ChevronLeft size={15} /></button>

                        {viewMode === 'dia' ? (
                            <input
                                type="date" value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                style={{ border: 'none', background: 'none', fontSize: '13px', fontWeight: 700, color: '#1e293b', cursor: 'pointer', outline: 'none', textAlign: 'center', padding: '0 4px' }}
                            />
                        ) : (
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', padding: '0 8px', minWidth: '160px', textAlign: 'center' }}>
                                {weekLabel}
                            </span>
                        )}

                        <button
                            onClick={() => viewMode === 'dia' ? navigateDate(1) : navigateWeek(1)}
                            style={{ padding: '5px 8px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        ><ChevronRight size={15} /></button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        {filteredAgendamentos.length} consulta{filteredAgendamentos.length !== 1 ? 's' : ''}
                        {viewMode === 'semana' && ` na semana`}
                    </span>
                </div>
            </div>

            {/* ── View Semanal ── */}
            {viewMode === 'semana' && (
                <WeeklyDashboard
                    agendamentos={agendamentos}
                    dentistas={dentistas}
                    onDayClick={handleDayClick}
                    currentDate={filterDate}
                />
            )}

            {/* ── Calendar Diário ── */}
            {viewMode === 'dia' && (
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
                                                            borderTop: i % 4 === 0 ? '1px solid #f1f5f9' : '1px dashed #f8fafc',
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
            )}

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
