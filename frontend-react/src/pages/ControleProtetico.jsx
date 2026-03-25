import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Calendar, User, FlaskConical, AlertCircle, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ModalNovaOS from '../components/ui/ModalNovaOS';
import ModalEditOS from '../components/ui/ModalEditOS';

const COLUNAS = [
    { id: 'PRE_ENVIO',       label: 'Pré-Envio',          color: 'bg-slate-100 dark:bg-slate-800',        badge: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
    { id: 'EM_LABORATORIO',  label: 'Em Laboratório',     color: 'bg-amber-50 dark:bg-amber-900/20',       badge: 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300' },
    { id: 'RETORNOU',        label: 'Retornou à Clínica', color: 'bg-blue-50 dark:bg-blue-900/20',         badge: 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300' },
    { id: 'AGENDADO',        label: 'Agendado / Prova',   color: 'bg-purple-50 dark:bg-purple-900/20',     badge: 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300' },
    { id: 'INSTALADO',       label: 'Instalado ✅',        color: 'bg-emerald-50 dark:bg-emerald-900/20',   badge: 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' },
];

const OSCard = ({ os, index, onClick }) => {
    const isLast = os.status === 'INSTALADO';
    const isOverdue = os.previsao_retorno && !isLast && new Date(os.previsao_retorno) < new Date();

    return (
        <Draggable draggableId={os.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm transition-all cursor-pointer ${
                        snapshot.isDragging
                            ? 'shadow-xl ring-2 ring-indigo-400 border-indigo-300 rotate-1 scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700'
                    }`}
                    onClick={() => { if (!snapshot.isDragging) onClick(os); }}
                >
                    {/* Drag Handle — stops click from propagating */}
                    <div
                        {...provided.dragHandleProps}
                        className="flex items-center mb-2 cursor-grab active:cursor-grabbing"
                        onClick={e => e.stopPropagation()}
                    >
                        <GripVertical size={14} className="text-slate-300 dark:text-slate-600 mr-1.5" />
                        {isOverdue && (
                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-bold">
                                <AlertCircle size={12} /> ATRASADO
                            </span>
                        )}
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-2 truncate">
                        🦷 {os.descricao}
                    </h4>
                    <div className="space-y-1.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <User size={12} className="shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                {os.pacientes?.nome || '—'}
                            </span>
                        </p>
                        {os.dente_regiao && (
                            <p className="text-xs text-slate-400">
                                Dente: <span className="font-medium text-slate-600 dark:text-slate-300">{os.dente_regiao}</span>
                            </p>
                        )}
                        {os.cor_escala && (
                            <p className="text-xs text-slate-400">
                                Cor: <span className="font-medium text-slate-600 dark:text-slate-300">{os.cor_escala}</span>
                            </p>
                        )}
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <FlaskConical size={12} className="shrink-0 text-indigo-400" />
                            <span className="truncate">{os.laboratorios?.nome || 'Laboratório não informado'}</span>
                        </p>
                        {os.previsao_retorno && (
                            <p className={`text-xs flex items-center gap-1.5 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                <Calendar size={12} className="shrink-0" />
                                Prev: {new Date(os.previsao_retorno + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-indigo-400 mt-3 text-right">Clique para editar →</p>
                </div>
            )}
        </Draggable>
    );
};

const ControleProtetico = () => {
    const [ordens, setOrdens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNovaOSOpen, setIsNovaOSOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState(null);
    const [filtroTexto, setFiltroTexto] = useState('');

    const fetchOrdens = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/protetico/ordens');
            setOrdens(res.data || []);
        } catch (err) {
            console.error('Erro ao buscar ordens protéticas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrdens(); }, []);

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination || source.droppableId === destination.droppableId) return;

        const novoStatus = destination.droppableId;

        // Optimistic update
        setOrdens(prev =>
            prev.map(os => os.id === draggableId ? { ...os, status: novoStatus } : os)
        );

        try {
            await api.patch(`/api/protetico/ordens/${draggableId}/status`, { status: novoStatus });
        } catch (err) {
            console.error('Erro ao mover OS:', err);
            fetchOrdens(); // rollback on error
        }
    };

    const handleDelete = (id) => {
        setOrdens(prev => prev.filter(os => os.id !== id));
    };

    const handleEditSuccess = () => {
        setSelectedOS(null);
        fetchOrdens();
    };

    const ordensFiltradas = ordens.filter(os =>
        !filtroTexto ||
        os.pacientes?.nome?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        os.descricao?.toLowerCase().includes(filtroTexto.toLowerCase())
    );

    const getOrdensByStatus = (status) => ordensFiltradas.filter(os => os.status === status);

    return (
        <div className="w-full animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <FlaskConical className="text-indigo-500" size={30} />
                        Controle Protético
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        Arraste os cards entre colunas · Clique para editar ou excluir
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Buscar por paciente ou peça..."
                        value={filtroTexto}
                        onChange={e => setFiltroTexto(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                    <button
                        onClick={() => setIsNovaOSOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-colors whitespace-nowrap"
                    >
                        <Plus size={18} /> Nova OS
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {COLUNAS.map(coluna => {
                            const cards = getOrdensByStatus(coluna.id);
                            return (
                                <div
                                    key={coluna.id}
                                    className={`flex-shrink-0 w-72 rounded-3xl ${coluna.color} border border-slate-200 dark:border-slate-700/50 p-4 flex flex-col`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{coluna.label}</h3>
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${coluna.badge}`}>
                                            {cards.length}
                                        </span>
                                    </div>

                                    <Droppable droppableId={coluna.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 space-y-3 min-h-[120px] rounded-2xl p-1 transition-colors ${
                                                    snapshot.isDraggingOver
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-300 ring-dashed'
                                                        : ''
                                                }`}
                                            >
                                                {cards.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="text-center py-8 text-slate-300 dark:text-slate-600 text-xs">
                                                        Nenhuma OS aqui
                                                    </div>
                                                )}
                                                {cards.map((os, index) => (
                                                    <OSCard
                                                        key={os.id}
                                                        os={os}
                                                        index={index}
                                                        onClick={setSelectedOS}
                                                    />
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            )}

            <ModalNovaOS
                isOpen={isNovaOSOpen}
                onClose={() => setIsNovaOSOpen(false)}
                onSuccess={() => { setIsNovaOSOpen(false); fetchOrdens(); }}
            />

            <ModalEditOS
                os={selectedOS}
                isOpen={!!selectedOS}
                onClose={() => setSelectedOS(null)}
                onSuccess={handleEditSuccess}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default ControleProtetico;
