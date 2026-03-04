import React from 'react';

const gradients = {
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-white',
    sky: 'from-sky-500 to-sky-600 shadow-sky-500/20 text-white',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/20 text-white',
    purple: 'from-purple-500 to-indigo-600 shadow-purple-500/20 text-white',
    slate: 'from-slate-700 to-slate-800 shadow-slate-500/20 text-white',
    // Special handling for the plain white variant but mimicking the format
    white: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 border shadow-sm text-slate-900 dark:text-white'
};

const textColors = {
    emerald: 'text-emerald-100',
    sky: 'text-sky-100',
    amber: 'text-amber-100',
    purple: 'text-purple-100',
    slate: 'text-slate-300',
    white: 'text-slate-500 dark:text-slate-400'
};

const valueColors = {
    white: 'text-slate-800 dark:text-white'
};

const topIconColors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    slate: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'
};

export const KpiCard = ({
    title,
    value,
    icon: Icon,
    topIcon: TopIcon,
    color = 'emerald',
    variant = 'gradient',
    extra
}) => {

    if (variant === 'plain') {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm tracking-wide uppercase">{title}</h3>
                    {TopIcon && (
                        <span className={`p-2 rounded-lg ${topIconColors[color] || topIconColors.slate}`}>
                            <TopIcon size={18} />
                        </span>
                    )}
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                {extra && <div className="mt-2 text-sm">{extra}</div>}
            </div>
        );
    }

    // Gradient Variant
    const isWhite = color === 'white';

    return (
        <div className={`p-6 rounded-3xl ${isWhite ? '' : 'border border-white/10 bg-gradient-to-br shadow-lg'} relative overflow-hidden group ${gradients[color] || gradients.emerald}`}>
            <div className={`absolute -right-6 -top-6 transform group-hover:scale-110 transition-transform ${isWhite ? 'opacity-[0.03] dark:opacity-5 text-slate-900 dark:text-white' : 'opacity-20'}`}>
                {Icon && <Icon size={120} />}
            </div>
            <div className="relative z-10">
                <h3 className={`${textColors[color] || textColors.emerald} font-medium text-sm tracking-wide uppercase mb-1`}>{title}</h3>
                <p className={`text-4xl font-bold ${isWhite ? valueColors.white : ''}`}>{value}</p>
                {extra && (
                    <div className="mt-2">
                        {extra}
                    </div>
                )}
            </div>
        </div>
    );
};
