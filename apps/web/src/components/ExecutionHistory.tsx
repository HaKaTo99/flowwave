import { useState, useEffect } from 'react';

interface Execution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: string;
    completedAt?: string;
    duration?: number;
    logs?: any[];
    output?: any;
    errorMessage?: string;
}

interface ExecutionHistoryProps {
    onClose: () => void;
}

import { getExecutions, clearExecutions } from '../api';

// ... (interfaces)

const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

const statusIcons: Record<string, string> = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫'
};

export const ExecutionHistory = ({ onClose }: ExecutionHistoryProps) => {
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

    useEffect(() => {
        fetchExecutions();
    }, []);

    const fetchExecutions = async () => {
        try {
            setLoading(true);
            const data = await getExecutions();
            setExecutions(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (window.confirm('Are you sure you want to clear ALL execution history? This cannot be undone.')) {
            try {
                await clearExecutions();
                setExecutions([]);
                setSelectedExecution(null);
            } catch (err: any) {
                alert('Failed to clear history: ' + err.message);
            }
        }
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span>📊</span> Execution History
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClear}
                            title="Clear History"
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors"
                        >
                            🗑️
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="flex h-[60vh]">
                    {/* List */}
                    <div className="w-1/2 border-r border-white/10 overflow-y-auto">
                        {loading && (
                            <div className="text-center py-8 text-white/50">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                                Loading...
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-8 text-red-400 bg-red-500/10 m-4 rounded-xl border border-red-500/20">
                                Error: {error}
                            </div>
                        )}

                        {!loading && !error && executions.length === 0 && (
                            <div className="text-center py-12 text-white/50">
                                <span className="text-4xl mb-3 block">📭</span>
                                No executions yet. Run a workflow to see results here.
                            </div>
                        )}

                        {!loading && !error && executions.map(exec => (
                            <div
                                key={exec.id}
                                onClick={() => setSelectedExecution(exec)}
                                className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedExecution?.id === exec.id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusColors[exec.status]}`}>
                                        {statusIcons[exec.status]} {exec.status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-white/40">
                                        {formatDuration(exec.duration)}
                                    </span>
                                </div>
                                <p className="text-sm text-white/70 mt-2 truncate font-mono">
                                    ID: {exec.id.slice(0, 12)}...
                                </p>
                                <p className="text-xs text-white/40 mt-1">
                                    {formatDate(exec.startedAt)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Detail */}
                    <div className="w-1/2 p-4 overflow-y-auto bg-white/[0.02]">
                        {!selectedExecution ? (
                            <div className="text-center py-12 text-white/40">
                                <span className="text-4xl mb-3 block">👈</span>
                                Select an execution to view details
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-white/60 text-sm uppercase tracking-wide mb-2">Status</h3>
                                    <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[selectedExecution.status]}`}>
                                        {statusIcons[selectedExecution.status]} {selectedExecution.status.toUpperCase()}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-medium text-white/60 text-sm uppercase tracking-wide mb-2">Duration</h3>
                                    <p className="text-white">{formatDuration(selectedExecution.duration)}</p>
                                </div>

                                {selectedExecution.errorMessage && (
                                    <div>
                                        <h3 className="font-medium text-red-400 text-sm uppercase tracking-wide mb-2">Error</h3>
                                        <pre className="bg-red-500/10 p-3 rounded-xl text-sm text-red-400 overflow-x-auto border border-red-500/20">
                                            {selectedExecution.errorMessage}
                                        </pre>
                                    </div>
                                )}

                                {selectedExecution.output && (
                                    <div>
                                        <h3 className="font-medium text-white/60 text-sm uppercase tracking-wide mb-2">Output</h3>
                                        <pre className="bg-white/5 p-3 rounded-xl border border-white/10 text-sm text-white/70 overflow-x-auto max-h-40 font-mono">
                                            {JSON.stringify(selectedExecution.output, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {selectedExecution.logs && selectedExecution.logs.length > 0 && (
                                    <div>
                                        <h3 className="font-medium text-white/60 text-sm uppercase tracking-wide mb-2">Logs ({selectedExecution.logs.length})</h3>
                                        <div className="bg-[#0f0f1a] rounded-xl p-3 text-sm font-mono overflow-x-auto max-h-60 border border-white/10">
                                            {selectedExecution.logs.map((log: any, idx: number) => (
                                                <div key={idx} className={`py-1 ${log.level === 'error' ? 'text-red-400' :
                                                    log.level === 'warn' ? 'text-amber-400' :
                                                        'text-emerald-400'
                                                    }`}>
                                                    [{log.level?.toUpperCase() || 'INFO'}] {log.message}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <button
                        onClick={fetchExecutions}
                        className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};
