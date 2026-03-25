import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ui/ChangePasswordModal';
import {
    FaChartPie,
    FaUsers,
    FaTooth,
    FaCalendarCheck,
    FaClipboardList,
    FaMoneyCheckDollar,
    FaBuildingColumns,
    FaUserShield,
    FaArrowRightFromBracket,
    FaLock,
    FaGear,
    FaMicroscope
} from 'react-icons/fa6';

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
        { name: 'Dashboard', path: '/dashboard', icon: FaChartPie },
        { name: 'Pacientes', path: '/pacientes', icon: FaUsers },
        { name: 'Dentistas', path: '/dentistas', icon: FaTooth },
        { name: 'Agendamentos', path: '/agendamentos', icon: FaCalendarCheck },
        { name: 'Procedimentos', path: '/procedimentos', icon: FaClipboardList },
        { name: 'Faturamentos', path: '/faturamentos', icon: FaMoneyCheckDollar },
        { name: 'Financeiro', path: '/financeiro', icon: FaBuildingColumns },
        { name: 'Protético', path: '/protetico', icon: FaMicroscope },
        { name: 'Configurações', path: '/configuracoes', icon: FaGear },
    ];

    if (userRole === 'admin') {
        navItems.push({ name: 'Usuários', path: '/usuarios', icon: FaUserShield });
    }

    return (
        <aside className="group w-20 hover:w-64 transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed md:sticky top-0 z-50 overflow-hidden shrink-0">
            <div className="p-6 flex items-center gap-4">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20">
                    OS
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    OdontoSystem
                </h1>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-3 mx-3 rounded-xl transition-colors duration-200 mb-1 ${isActive
                                ? 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-500/10 dark:to-cyan-500/10 text-teal-700 dark:text-teal-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={22}
                                    className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                                        }`}
                                />
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                    {item.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-3 py-3 mx-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors duration-200"
                >
                    <FaArrowRightFromBracket size={22} className="shrink-0" />
                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Sair</span>
                </button>
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="flex items-center gap-4 px-3 py-3 mx-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-xl transition-colors duration-200"
                >
                    <FaLock size={22} className="shrink-0" />
                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Trocar Senha</span>
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
