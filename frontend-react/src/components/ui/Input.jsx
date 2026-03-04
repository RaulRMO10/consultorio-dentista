import React from 'react';

export const Input = ({
    icon: Icon,
    className = '',
    containerClassName = '',
    ...props
}) => {
    return (
        <div className={`relative ${containerClassName}`}>
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Icon size={18} />
                </div>
            )}
            <input
                className={`block w-full ${Icon ? 'pl-10' : 'pl-4'} pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all text-sm outline-none ${className}`}
                {...props}
            />
        </div>
    );
};
