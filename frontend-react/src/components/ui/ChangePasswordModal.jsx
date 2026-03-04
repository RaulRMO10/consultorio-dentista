import React, { useState } from 'react';
import Modal from './Modal';
import { Lock, FileWarning } from 'lucide-react';
import api from '../../services/api';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        senha_atual: '',
        nova_senha: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (formData.nova_senha.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            setLoading(true);
            await api.post('/auth/change-password', formData);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setFormData({ senha_atual: '', nova_senha: '' });
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('A senha atual está incorreta.');
            } else {
                setError('Erro ao trocar a senha. Tente novamente mais tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Trocar Minha Senha"
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {success && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium border border-emerald-200 dark:border-emerald-800 text-center">
                        Senha alterada com sucesso!
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800">
                        <FileWarning size={16} />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Atual</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="password"
                                name="senha_atual"
                                required
                                value={formData.senha_atual}
                                onChange={handleChange}
                                className="pl-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500 text-sm"
                                placeholder="Digite sua senha atual"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="password"
                                name="nova_senha"
                                required
                                value={formData.nova_senha}
                                onChange={handleChange}
                                className="pl-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500 text-sm"
                                placeholder="Pelo menos 6 caracteres"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                        {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                        Confirmar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;
