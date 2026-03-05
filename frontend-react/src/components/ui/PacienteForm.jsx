import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Button } from './Button';
import { Input } from './Input';
import { User, Phone, MapPin, Mail, Calendar, FileWarning } from 'lucide-react';
import { maskCPF, maskPhone, maskCEP } from '../../utils/masks';

export const PacienteForm = ({
    initialData = null,
    onSuccess,
    onCancel
}) => {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state corresponding to FastAPI PacienteBase / PacienteUpdate
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        data_nascimento: '',
        telefone: '',
        celular: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
        ativo: true
    });

    // Populate form if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                nome: initialData.nome || '',
                cpf: initialData.cpf || '',
                data_nascimento: initialData.data_nascimento || '',
                telefone: initialData.telefone || '',
                celular: initialData.celular || '',
                email: initialData.email || '',
                endereco: initialData.endereco || '',
                cidade: initialData.cidade || '',
                estado: initialData.estado || '',
                cep: initialData.cep || '',
                observacoes: initialData.observacoes || '',
                ativo: initialData.ativo !== undefined ? initialData.ativo : true
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let formattedValue = type === 'checkbox' ? checked : value;

        if (name === 'cpf') formattedValue = maskCPF(value);
        if (name === 'telefone' || name === 'celular') formattedValue = maskPhone(value);
        if (name === 'cep') formattedValue = maskCEP(value);

        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Required field validation (Nome, Telefone)
        if (!formData.nome.trim() || !formData.telefone.trim()) {
            setError('Nome e Telefone são campos obrigatórios.');
            setLoading(false);
            return;
        }

        try {
            // Clean empty strings for optional dates to pass Pydantic validation
            const payload = { ...formData };
            if (!payload.data_nascimento) payload.data_nascimento = null;

            if (isEditing) {
                await api.put(`/api/pacientes/${initialData.id}`, payload);
            } else {
                await api.post('/api/pacientes/', payload);
            }
            onSuccess(); // Triggers a list refetch on the parent component
        } catch (err) {
            console.error(err);
            if (err.response?.data?.detail) {
                setError(typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : JSON.stringify(err.response.data.detail));
            } else {
                setError('Ocorreu um erro ao salvar o paciente. Verifique os dados.');
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
                <Input
                    label="Nome Completo *"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    icon={User}
                    placeholder="Nome do paciente"
                    required
                />
                <Input
                    label="CPF / RG"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                />

                <Input
                    label="Telefone Principal *"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    icon={Phone}
                    placeholder="(00) 0000-0000"
                    maxLength={14}
                    required
                />
                <Input
                    label="Celular (Opcional)"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    icon={Phone}
                    placeholder="(00) 90000-0000"
                    maxLength={15}
                />

                <Input
                    label="E-mail"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    icon={Mail}
                />
                <Input
                    label="Data de Nascimento"
                    name="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    icon={Calendar}
                />

                <div className="md:col-span-2">
                    <Input
                        label="Endereço Completo"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        icon={MapPin}
                        placeholder="Rua, Número, Bairro..."
                    />
                </div>

                <Input
                    label="Cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    placeholder="Ex: São Paulo"
                />

                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            label="Estado (UF)"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            placeholder="SP"
                            maxLength={2}
                        />
                    </div>
                    <div className="flex-1">
                        <Input
                            label="CEP"
                            name="cep"
                            value={formData.cep}
                            onChange={handleChange}
                            placeholder="00000-000"
                            maxLength={9}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Observações Clínicas
                    </label>
                    <textarea
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleChange}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
                        rows="3"
                        placeholder="Alergias, histórico médico, preferências..."
                    />
                </div>

                <div className="md:col-span-2 flex items-center mt-2">
                    <input
                        type="checkbox"
                        name="ativo"
                        id="ativo"
                        checked={formData.ativo}
                        onChange={handleChange}
                        className="w-4 h-4 text-teal-600 bg-slate-100 border-slate-300 rounded focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <label htmlFor="ativo" className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-300">
                        Paciente Ativo (visível nas listas e agendamentos)
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
                    className={loading ? 'opacity-70 cursor-not-allowed' : ''}
                >
                    {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente')}
                </Button>
            </div>

        </form>
    );
};
