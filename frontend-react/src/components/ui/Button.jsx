import React from 'react';

const variants = {
    primary: 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-teal-500/20',
    indigo: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/20',
    sky: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sky-500/20',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/20',
    outline: 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
    ghost: 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5',
    lg: 'px-6 py-3 text-lg'
};

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`flex items-center justify-center gap-2 rounded-xl font-medium shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
            {children}
        </button>
    );
};
