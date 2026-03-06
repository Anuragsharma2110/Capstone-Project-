import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: number) => void;
}

const toastColors: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
    success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', color: '#10b981', icon: '✓' },
    error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', color: '#ef4444', icon: '✕' },
    warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', color: '#f59e0b', icon: '⚠' },
    info: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)', color: '#3b82f6', icon: 'ℹ' },
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    const style = toastColors[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                minWidth: '300px',
                maxWidth: '420px',
                animation: 'slideInRight 0.25s ease-out',
            }}
        >
            <span style={{ color: style.color, fontWeight: 700, fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>
                {style.icon}
            </span>
            <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                {toast.message}
            </span>
            <button
                onClick={() => onDismiss(toast.id)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    padding: 0,
                    flexShrink: 0,
                    lineHeight: 1,
                }}
            >
                ×
            </button>
        </div>
    );
};

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(120%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}
            >
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
                ))}
            </div>
        </>
    );
};

export default Toast;

// Hook for easy toast management
let _nextId = 1;
export function useToast() {
    const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

    const addToast = React.useCallback((message: string, type: ToastType = 'info') => {
        const id = _nextId++;
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);

    const dismiss = React.useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, dismiss };
}
