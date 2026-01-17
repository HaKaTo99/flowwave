import React from 'react';

const SyncStatus: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig: Record<string, { icon: string; color: string; bg: string; text: string }> = {
        synced: {
            icon: '✓',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/20 border-emerald-500/30',
            text: 'Synced'
        },
        pending: {
            icon: '↻',
            color: 'text-amber-400',
            bg: 'bg-amber-500/20 border-amber-500/30',
            text: 'Pending'
        },
        offline: {
            icon: '○',
            color: 'text-slate-400',
            bg: 'bg-slate-500/20 border-slate-500/30',
            text: 'Offline'
        }
    };

    const current = statusConfig[status] || statusConfig.offline;

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${current.bg}`}>
            <span className={`text-sm ${current.color}`}>{current.icon}</span>
            <span className={`text-xs font-medium uppercase tracking-wide ${current.color}`}>
                {current.text}
            </span>
        </div>
    );
};

export default SyncStatus;
