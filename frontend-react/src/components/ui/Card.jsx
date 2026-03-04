import React from 'react';

export const Card = ({ children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center ${className}`}>
        {children}
    </div>
);

export const CardContent = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`p-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 ${className}`}>
        {children}
    </div>
);
