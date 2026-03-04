import React from 'react';

export const StatusPill = ({ status }) => {
    let style = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    let label = status;

    if (!status) return null;

    switch (status.toUpperCase()) {
        // Appointments
        case 'AGENDADO':
            style = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
            label = "Agendado";
            break;
        case 'CONFIRMADO':
            style = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
            label = "Confirmado";
            break;
        case 'EM_ATENDIMENTO':
            style = "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400";
            label = "Em Atend.";
            break;
        case 'CONCLUIDO':
            style = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
            label = "Concluído";
            break;
        case 'CANCELADO':
            style = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
            label = "Cancelado";
            break;
        case 'FALTA':
            style = "bg-slate-200 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300";
            label = "Falta";
            break;

        // Finances
        case 'A_FATURAR':
            style = "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50";
            label = "A Faturar";
            break;
        case 'PENDENTE':
        case 'ABERTO':
            style = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
            label = status === 'ABERTO' ? "Em Aberto" : "Pendente";
            break;
        case 'PAGO_PARCIAL':
            style = "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50";
            label = "Parcial";
            break;
        case 'PAGO':
        case 'QUITADO':
            style = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
            label = status === 'QUITADO' ? "Quitado" : "Pago";
            break;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
            {label}
        </span>
    );
};
