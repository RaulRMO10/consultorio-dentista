import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Mail, User, Shield, Lock, Trash2 } from 'lucide-react';

const UsuarioForm = ({ isOpen, onClose, onSave, onDesativar, initialData }) => {
    const isEdit = !!initialData;
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        role: 'recepcionista',
        ativo: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    nome: initialData.nome || '',
                    email: initialData.email || '',
                    senha: '', // Never show password context
                    nova_senha: '',
                    role: initialData.role || 'recepcionista',
                    ativo: initialData.ativo !== undefined ? initialData.ativo : true
                });
            } else {
                setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    nova_senha: '',
                    role: 'recepcionista',
                    ativo: true
                });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Editar Usuário" : "Novo Usuário"}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    name="nome"
                                    required
                                    value={formData.nome}
                                    onChange={handleChange}
                                    className="pl-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="João da Silva"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail (Login)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="joao@clinica.com"
                                />
                            </div>
                        </div>

                        {!isEdit && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Provisória</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="senha"
                                        required={!isEdit}
                                        value={formData.senha}
                                        onChange={handleChange}
                                        className="pl-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Min. 6 caracteres"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nível de Acesso (Role)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield size={18} className="text-slate-400" />
                                </div>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="pl-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="admin">Administrador Total</option>
                                    <option value="dentista">Dentista Clinic</option>
                                    <option value="recepcionista">Recepcionista</option>
                                    <option value="financeiro">Financeiro Básico</option>
                                </select>
                            </div>
                        </div>

                        {isEdit && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Redefinir Senha (Opcional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="nova_senha"
                                        value={formData.nova_senha}
                                        onChange={handleChange}
                                        className="pl-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Min. 6 caracteres (deixe em branco para não alterar)"
                                    />
                                </div>
                            </div>
                        )}

                        {isEdit && (
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="ativo"
                                    name="ativo"
                                    checked={formData.ativo}
                                    onChange={handleChange}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <label htmlFor="ativo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Usuário Ativo (Permitir Login)
                                </label>
                            </div>
                        )}

                    </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
                    {isEdit && formData.ativo ? (
                        <button
                            type="button"
                            onClick={() => onDesativar(initialData.id)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium text-sm"
                        >
                            <Trash2 size={18} />
                            Desativar Usuário
                        </button>
                    ) : (<div></div>)}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                            Salvar
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default UsuarioForm;
