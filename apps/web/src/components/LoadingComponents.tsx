import React from 'react';

interface LoadingButtonProps {
    onClick: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
    children: React.ReactNode;
}

const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30 disabled:opacity-50',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20 disabled:opacity-50',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/30 disabled:opacity-50'
};

export const LoadingButton = ({
    onClick,
    loading = false,
    disabled = false,
    variant = 'primary',
    className = '',
    children
}: LoadingButtonProps) => {
    const handleClick = async () => {
        if (loading || disabled) return;
        await onClick();
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading || disabled}
            className={`
                px-4 py-2.5 rounded-xl font-medium text-sm
                flex items-center justify-center gap-2
                transition-all duration-200
                disabled:cursor-not-allowed
                ${variantStyles[variant]}
                ${className}
            `}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
};

// Skeleton loader component
export const Skeleton = ({
    className = '',
    variant = 'text'
}: {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular'
}) => {
    const baseClass = 'animate-pulse bg-white/10';
    const variantClass = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-md'
    };

    return (
        <div className={`${baseClass} ${variantClass[variant]} ${className}`} />
    );
};

// Connection status indicator
export const ConnectionStatus = ({
    connected,
    label
}: {
    connected: boolean;
    label?: string
}) => {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${connected
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
            <div className={`w-2 h-2 rounded-full ${connected
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                    : 'bg-red-400 shadow-lg shadow-red-400/50'
                } animate-pulse`} />
            <span className={`text-xs font-medium ${connected ? 'text-emerald-400' : 'text-red-400'
                }`}>
                {label || (connected ? 'Connected' : 'Disconnected')}
            </span>
        </div>
    );
};
