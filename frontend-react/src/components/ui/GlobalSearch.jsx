import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, ChevronRight, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await api.get(`/api/pacientes/search?q=${encodeURIComponent(query)}&limit=8`);
                setResults(response.data);
                setIsOpen(true);
            } catch (error) {
                console.error("Erro na busca global:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchResults();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelectPatient = (id) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/pacientes/${id}`);
    };

    return (
        <div className="relative w-full max-w-md mx-auto md:mx-0 md:ml-4 z-50 flex-1" ref={containerRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length >= 2) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (query.length >= 2) setIsOpen(true);
                    }}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 rounded-full leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                    placeholder="Buscar paciente por nome, celular ou CPF..."
                />
                
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown de Resultados */}
            {isOpen && query.length >= 2 && (
                <div className="absolute mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    {loading && results.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500 flex justify-center items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                            Buscando registros...
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                                {results.map((paciente) => (
                                    <li 
                                        key={paciente.id}
                                        onClick={() => handleSelectPatient(paciente.id)}
                                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                <User size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                    {paciente.nome}
                                                </p>
                                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    {paciente.celular && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone size={10} /> {paciente.celular}
                                                        </span>
                                                    )}
                                                    {paciente.cpf && (
                                                        <span className="truncate">CPF: {paciente.cpf}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0" />
                                    </li>
                                ))}
                            </ul>
                            {results.length === 8 && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
                                    Mostrando os 8 melhores resultados.
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">
                            <p className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-5 h-5 text-slate-400" />
                            </p>
                            Nenhum paciente encontrado com "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
