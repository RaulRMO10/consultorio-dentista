import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Ação',
    message = 'Você tem certeza que deseja realizar esta ação?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = true
}) => {

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Box */}
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 overflow-hidden p-6">

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 whitespace-pre-line">
                    {message}
                </p>

                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={isDanger ? 'danger' : 'primary'}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
