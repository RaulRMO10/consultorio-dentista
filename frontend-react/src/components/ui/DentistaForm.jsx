import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Button } from './Button';
import { Input } from './Input';
import { User, Phone, Mail, Award, FileWarning, Fingerprint } from 'lucide-react';

export const DentistaForm = ({
    initialData = null,
    onSuccess,
    onCancel
}) => {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        cro: '',
        especialidade: '',
        telefone: '',
        email: '',
        ativo: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nome: initialData.nome || '',
                cro: initialData.cro || '',
                especialidade: initialData.especialidade || '',
                telefone: initialData.telefone || '',
                email: initialData.email || '',
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

        if (!formData.nome.trim() || !formData.cro.trim()) {
            setError('Nome e CRO são campos obrigatórios.');
            setLoading(false);
            return;
        }

        try {
            const payload = { ...formData };

            if (isEditing) {
                await api.put(`/api/dentistas/${initialData.id}`, payload);
            } else {
                await api.post('/api/dentistas/', payload);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.detail) {
                setError(typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : JSON.stringify(err.response.data.detail));
            } else {
                setError('Ocorreu um erro ao salvar o dentista. Verifique os dados.');
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
                        label="Nome do Profissional *"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        icon={User}
                        placeholder="Dr. Nome Completo"
                        required
                    />
                </div>

                <Input
                    label="Registro CRO *"
                    name="cro"
                    value={formData.cro}
                    onChange={handleChange}
                    icon={Fingerprint}
                    placeholder="Ex: SP-12345"
                    required
                />

                <Input
                    label="Especialidade"
                    name="especialidade"
                    value={formData.especialidade}
                    onChange={handleChange}
                    icon={Award}
                    placeholder="Ex: Ortodontia, Clínico Geral"
                />

                <Input
                    label="Telefone Comercial"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    icon={Phone}
                    placeholder="(00) 0000-0000"
                />

                <Input
                    label="E-mail"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    icon={Mail}
                    placeholder="doutor@clinica.com"
                />

                <div className="md:col-span-2 flex items-center mt-2">
                    <input
                        type="checkbox"
                        name="ativo"
                        id="ativo"
                        checked={formData.ativo}
                        onChange={handleChange}
                        className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <label htmlFor="ativo" className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-300">
                        Médico Ativo (visível nas agendas e tratamentos)
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
                    className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-500/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar Dentista')}
                </Button>
            </div>
        </form>
    );
};
