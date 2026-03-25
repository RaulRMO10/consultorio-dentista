import React, { useState, useEffect } from 'react';
import { X, Save, FlaskConical } from 'lucide-react';
import api from '../../services/api';

const defaultForm = {
    paciente_id: '',
    dentista_id: '',
    laboratorio_id: '',
    descricao: '',
    dente_regiao: '',
    cor_escala: '',
    tipo_werk: '',
    data_envio: new Date().toISOString().split('T')[0],
    previsao_retorno: '',
    custo_laboratorio: '',
    observacoes: '',
};

const ModalNovaOS = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState(defaultForm);
    const [pacientes, setPacientes] = useState([]);
    const [dentistas, setDentistas] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [buscaPaciente, setBuscaPaciente] = useState('');
    const [pacienteSelecionado, setPacienteSelecionado] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        const fetch = async () => {
            const [dentsRes, labsRes] = await Promise.all([
                api.get('/api/dentistas'),
                api.get('/api/protetico/laboratorios'),
            ]);
            setDentistas(dentsRes.data || []);
            setLaboratorios(labsRes.data || []);
        };
        fetch();
        setForm(defaultForm);
        setPacienteSelecionado(null);
        setBuscaPaciente('');
        setError('');
    }, [isOpen]);

    useEffect(() => {
        if (!buscaPaciente || buscaPaciente.length < 2) {
            setPacientes([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/api/pacientes/search?q=${encodeURIComponent(buscaPaciente)}&limit=8`);
                setPacientes(Array.isArray(res.data) ? res.data : []);
            } catch {
                setPacientes([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaPaciente]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const selecionarPaciente = (p) => {
        setPacienteSelecionado(p);
        setForm(prev => ({ ...prev, paciente_id: p.id }));
        setBuscaPaciente('');
        setPacientes([]);
    };

    const handleSave = async () => {
        if (!form.paciente_id) { setError('Selecione um paciente.'); return; }
        if (!form.descricao) { setError('Informe a descrição da peça.'); return; }
        try {
            setSaving(true);
            setError('');
            const payload = { ...form };
            if (!payload.custo_laboratorio) delete payload.custo_laboratorio;
            await api.post('/api/protetico/ordens', payload);
            onSuccess();
        } catch (err) {
            setError('Erro ao salvar a Ordem de Serviço.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

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
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nova Ordem de Serviço</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Paciente */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paciente *</label>
                        {pacienteSelecionado ? (
                            <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-2.5">
                                <span className="font-medium text-indigo-800 dark:text-indigo-200">{pacienteSelecionado.nome}</span>
                                <button onClick={() => { setPacienteSelecionado(null); setForm(f => ({...f, paciente_id: ''})); }} className="text-xs text-indigo-500 underline">Trocar</button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Digite o nome do paciente..."
                                    value={buscaPaciente}
                                    onChange={e => setBuscaPaciente(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {pacientes.length > 0 && (
                                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                                        {pacientes.slice(0, 5).map(p => (
                                            <li key={p.id} onClick={() => selecionarPaciente(p)} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                {p.nome}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Dentista */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dentista</label>
                            <select name="dentista_id" value={form.dentista_id} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white">
                                <option value="">Selecionar...</option>
                                {dentistas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                            </select>
                        </div>
                        {/* Laboratório */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Laboratório</label>
                            <select name="laboratorio_id" value={form.laboratorio_id} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white">
                                <option value="">Selecionar...</option>
                                {laboratorios.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição da Peça *</label>
                        <input type="text" name="descricao" value={form.descricao} onChange={handleChange} placeholder="Ex: Coroa cerâmica dente 21" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
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

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                        <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3} placeholder="Instruções especiais ao laboratório..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none" />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-colors disabled:opacity-70">
                        {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={16} />}
                        Criar OS
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalNovaOS;
