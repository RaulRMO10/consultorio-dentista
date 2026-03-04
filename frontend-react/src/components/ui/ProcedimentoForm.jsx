import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Button } from './Button';
import { Input } from './Input';
import { ActivitySquare, DollarSign, Clock, FileWarning, AlignLeft } from 'lucide-react';

export const ProcedimentoForm = ({
    initialData = null,
    onSuccess,
    onCancel
}) => {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        valor_padrao: '',
        duracao_minutos: '60',
        ativo: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nome: initialData.nome || '',
                descricao: initialData.descricao || '',
                valor_padrao: initialData.valor_padrao !== null ? String(initialData.valor_padrao) : '',
                duracao_minutos: initialData.duracao_minutos !== null ? String(initialData.duracao_minutos) : '60',
                ativo: initialData.ativo !== undefined ? initialData.ativo : true
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.nome.trim() || formData.valor_padrao === '') {
            setError('Nome e Valor Base são campos obrigatórios.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                valor_padrao: parseFloat(formData.valor_padrao),
                duracao_minutos: formData.duracao_minutos ? parseInt(formData.duracao_minutos, 10) : 60
            };

            if (isEditing) {
                await api.put(`/api/procedimentos/${initialData.id}`, payload);
            } else {
                await api.post('/api/procedimentos/', payload);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.detail) {
                setError(typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : JSON.stringify(err.response.data.detail));
            } else {
                setError('Ocorreu um erro ao salvar o procedimento.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                    <FileWarning size={20} />
                    <p className="font-medium text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <Input
                        label="Nome do Procedimento *"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        icon={ActivitySquare}
                        placeholder="Ex: Clareamento a Laser"
                        required
                    />
                </div>

                <div className="md:col-span-2">
                    <Input
                        label="Descrição"
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        icon={AlignLeft}
                        placeholder="Detalhes ou observações padrão do tratamento..."
                    />
                </div>

                <Input
                    label="Valor Base (R$) *"
                    name="valor_padrao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_padrao}
                    onChange={handleChange}
                    icon={DollarSign}
                    placeholder="250.00"
                    required
                />

                <Input
                    label="Duração Estimada (Minutos)"
                    name="duracao_minutos"
                    type="number"
                    min="1"
                    value={formData.duracao_minutos}
                    onChange={handleChange}
                    icon={Clock}
                    placeholder="60"
                />

                <div className="md:col-span-2 flex items-center mt-2">
                    <input
                        type="checkbox"
                        name="ativo"
                        id="ativo"
                        checked={formData.ativo}
                        onChange={handleChange}
                        className="w-4 h-4 text-amber-600 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <label htmlFor="ativo" className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-300">
                        Disponível (Permitir agendamentos para este serviço)
                    </label>
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
                    className={`bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20 text-white ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Procedimento')}
                </Button>
            </div>
        </form>
    );
};
