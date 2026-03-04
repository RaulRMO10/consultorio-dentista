import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ui/ChangePasswordModal';
import {
    Home,
    Users,
    Stethoscope,
    CalendarDays,
    ActivitySquare,
    Wallet,
    Settings,
    LogOut,
    CircleDollarSign,
    KeyRound
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const getUserRole = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = token.split('.')[1];
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const decodedInfo = JSON.parse(atob(base64));
            return decodedInfo.role;
        } catch (e) {
            return null;
        }
    };

    const userRole = getUserRole();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Pacientes', path: '/pacientes', icon: Users },
        { name: 'Dentistas', path: '/dentistas', icon: Stethoscope },
        { name: 'Agendamentos', path: '/agendamentos', icon: CalendarDays },
        { name: 'Procedimentos', path: '/procedimentos', icon: ActivitySquare },
        { name: 'Faturamentos', path: '/faturamentos', icon: CircleDollarSign },
        { name: 'Financeiro', path: '/financeiro', icon: Wallet },
    ];

    if (userRole === 'admin') {
        navItems.push({ name: 'Usuários', path: '/usuarios', icon: Users });
    }

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed md:relative z-20">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20">
                    OS
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    OdontoSystem
                </h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items - center gap - 3 px - 3 py - 2.5 rounded - xl transition - all duration - 200 group ${isActive
                                ? 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-500/10 dark:to-cyan-500/10 text-teal-700 dark:text-teal-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                            } `
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={`transition - colors duration - 200 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                                        } `}
                                />
                                {item.name}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sair</span>
                </button>
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-xl transition-all duration-200"
                >
                    <KeyRound size={20} />
                    <span className="font-medium">Trocar Senha</span>
                </button>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </aside>
    );
};

export default Sidebar;
