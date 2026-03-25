import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, FlaskConical, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const STATUS_LABELS = {
    PRE_ENVIO: 'Pré-Envio',
    EM_LABORATORIO: 'Em Laboratório',
    RETORNOU: 'Retornou à Clínica',
    AGENDADO: 'Agendado / Prova',
    INSTALADO: 'Instalado',
};

const ModalEditOS = ({ os, isOpen, onClose, onSuccess, onDelete }) => {
    const [form, setForm] = useState({});
    const [dentistas, setDentistas] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !os) return;
        setForm({
            descricao: os.descricao || '',
            dente_regiao: os.dente_regiao || '',
            cor_escala: os.cor_escala || '',
            tipo_werk: os.tipo_werk || '',
            laboratorio_id: os.laboratorio_id || '',
            dentista_id: os.dentista_id || '',
            data_envio: os.data_envio || '',
            previsao_retorno: os.previsao_retorno || '',
            custo_laboratorio: os.custo_laboratorio || '',
            observacoes: os.observacoes || '',
            status: os.status || 'PRE_ENVIO',
        });
        setError('');
        const fetch = async () => {
            const [dentsRes, labsRes] = await Promise.all([
                api.get('/api/dentistas'),
                api.get('/api/protetico/laboratorios'),
            ]);
            setDentistas(dentsRes.data || []);
            setLaboratorios(labsRes.data || []);
        };
        fetch();
    }, [isOpen, os]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!form.descricao) { setError('Informe a descrição da peça.'); return; }
        try {
            setSaving(true);
            setError('');
            // always include paciente_id (required by backend schema)
            const payload = {
                paciente_id: os.paciente_id,
                descricao: form.descricao,
                status: form.status,
                // optional fields — send null if empty to avoid Pydantic validation errors
                dentista_id: form.dentista_id || null,
                laboratorio_id: form.laboratorio_id || null,
                dente_regiao: form.dente_regiao || null,
                cor_escala: form.cor_escala || null,
                tipo_werk: form.tipo_werk || null,
                data_envio: form.data_envio || null,
                previsao_retorno: form.previsao_retorno || null,
                custo_laboratorio: form.custo_laboratorio ? parseFloat(form.custo_laboratorio) : null,
                observacoes: form.observacoes || null,
            };
            await api.put(`/api/protetico/ordens/${os.id}`, payload);
            onSuccess();
        } catch (err) {
            console.error('Erro ao salvar OS:', err.response?.data || err);
            setError(err.response?.data?.detail || 'Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Deseja excluir esta Ordem de Serviço permanentemente?')) return;
        try {
            setDeleting(true);
            await api.delete(`/api/protetico/ordens/${os.id}`);
            onDelete(os.id);
            onClose();
        } catch (err) {
            alert('Erro ao excluir a OS.');
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen || !os) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <FlaskConical size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Editar Ordem de Serviço</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Paciente: <span className="font-semibold text-slate-700 dark:text-slate-300">{os.pacientes?.nome}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                        <select name="status" value={form.status} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold">
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dentista</label>
                            <select name="dentista_id" value={form.dentista_id} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white">
                                <option value="">Selecionar...</option>
                                {dentistas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Laboratório</label>
                            <select name="laboratorio_id" value={form.laboratorio_id} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white">
                                <option value="">Selecionar...</option>
                                {laboratorios.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição da Peça *</label>
                        <input type="text" name="descricao" value={form.descricao} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dente / Região</label>
                            <input type="text" name="dente_regiao" value={form.dente_regiao} onChange={handleChange} placeholder="Ex: 21" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor / Escala</label>
                            <input type="text" name="cor_escala" value={form.cor_escala} onChange={handleChange} placeholder="Ex: A2 Vita" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                            <input type="text" name="tipo_werk" value={form.tipo_werk} onChange={handleChange} placeholder="Ex: Definitiva" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Envio</label>
                            <input type="date" name="data_envio" value={form.data_envio} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prev. Retorno</label>
                            <input type="date" name="previsao_retorno" value={form.previsao_retorno} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custo Lab (R$)</label>
                            <input type="number" name="custo_laboratorio" value={form.custo_laboratorio} onChange={handleChange} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                        <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none" />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-60"
                    >
                        {deleting ? <div className="w-4 h-4 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" /> : <Trash2 size={16} />}
                        Excluir OS
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-colors disabled:opacity-70">
                            {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={16} />}
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalEditOS;
