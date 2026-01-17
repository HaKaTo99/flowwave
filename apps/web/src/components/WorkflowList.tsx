import { useState, useEffect } from 'react';

interface Workflow {
    id: string;
    name: string;
    description?: string;
    updatedAt: string;
    createdAt: string;
}

interface WorkflowListProps {
    onLoad: (workflowId: string) => void;
    onClose: () => void;
}

import { getWorkflows, deleteWorkflow } from '../api';

// ... (interfaces)

export const WorkflowList = ({ onLoad, onClose }: WorkflowListProps) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const data = await getWorkflows();
            setWorkflows(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return;

        try {
            await deleteWorkflow(id);
            setWorkflows(wfs => wfs.filter(w => w.id !== id));
        } catch (err: any) {
            alert('Delete failed: ' + err.message);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span>📂</span> My Workflows
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[60vh] p-4">
                    {loading && (
                        <div className="text-center py-8 text-white/50">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                            Loading workflows...
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                            <span className="text-2xl mb-2 block">⚠️</span>
                            Error: {error}
                        </div>
                    )}

                    {!loading && !error && workflows.length === 0 && (
                        <div className="text-center py-12 text-white/50">
                            <span className="text-4xl mb-3 block">📭</span>
                            No workflows saved yet. Create your first one!
                        </div>
                    )}

                    {!loading && !error && workflows.length > 0 && (
                        <div className="space-y-3">
                            {workflows.map(wf => (
                                <div
                                    key={wf.id}
                                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-white">{wf.name}</h3>
                                        <p className="text-sm text-white/50">
                                            {wf.description || 'No description'}
                                        </p>
                                        <p className="text-xs text-white/30 mt-1">
                                            Updated: {formatDate(wf.updatedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onLoad(wf.id)}
                                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all"
                                        >
                                            Load
                                        </button>
                                        <button
                                            onClick={() => handleDelete(wf.id)}
                                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm transition-all"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <button
                        onClick={fetchWorkflows}
                        className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors"
                    >
                        <span className="animate-spin">🔄</span> Refresh List
                    </button>
                </div>
            </div>
        </div>
    );
};
