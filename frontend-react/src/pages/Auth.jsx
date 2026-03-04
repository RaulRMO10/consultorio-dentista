import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Auth = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulated login - replace with actual API call to FastAPI
        try {
            const payload = {
                email: username,
                senha: password
            };

            const response = await api.post('/auth/login', payload);

            if (response.data && response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                navigate('/dashboard');
            } else {
                throw new Error('Token inválido retornado pela API.');
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError(err.message || 'Erro ao conectar. A API está rodando?');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            {/* Abstract Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl mix-blend-multiply filter animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl mix-blend-multiply filter animate-blob animation-delay-2000"></div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg text-white mb-6">
                                <Activity size={32} />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-400">
                                OdontoSystem
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Acesso ao painel administrativo</p>
                        </div>

                        {error && (
                            <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    E-mail de Login
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all placeholder-slate-400"
                                        placeholder="Digite seu usuário"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all placeholder-slate-400"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-500 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-500/30 text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-medium transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Entrar'
                                )}
                            </button>
                        </form>
                    </div>
                    <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 text-center">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Precisa de ajuda? <a href="#" className="font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors">Contate o suporte</a>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
