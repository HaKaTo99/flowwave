import React, { useState, useEffect } from 'react';
import { getUsage } from '../api';

interface UsageData {
    workflows: { used: number; limit: number };
    executions: { used: number; limit: number };
    ragDocs: { used: number; limit: number };
    textToWorkflow: { used: number; limit: number };
}

interface UsageDashboardProps {
    userId?: string;
    tier?: string;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({
    userId = 'demo',
    tier = 'free'
}) => {
    const [usage, setUsage] = useState<UsageData>({
        workflows: { used: 3, limit: 10 },
        executions: { used: 45, limit: 100 },
        ragDocs: { used: 12, limit: 100 },
        textToWorkflow: { used: 2, limit: 10 }
    });

    const [loading, setLoading] = useState(false);

    // Fetch usage data from API
    useEffect(() => {
        const fetchUsage = async () => {
            setLoading(true);
            try {
                const data = await getUsage(userId);
                setUsage(data);
            } catch (error) {
                console.error('Failed to fetch usage:', error);
            }
            setLoading(false);
        };

        fetchUsage();
    }, [userId]);

    const getUsageColor = (percentage: number): string => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPercentage = (used: number, limit: number): number => {
        if (limit === -1) return 0; // Unlimited
        return Math.min((used / limit) * 100, 100);
    };

    const formatLimit = (limit: number): string => {
        if (limit === -1) return '∞';
        return limit.toLocaleString();
    };

    const usageItems = [
        {
            key: 'workflows',
            label: 'Workflows',
            icon: '🔧',
            ...usage.workflows
        },
        {
            key: 'executions',
            label: 'Executions Today',
            icon: '▶️',
            ...usage.executions
        },
        {
            key: 'ragDocs',
            label: 'RAG Documents',
            icon: '📚',
            ...usage.ragDocs
        },
        {
            key: 'textToWorkflow',
            label: 'AI Generations',
            icon: '🤖',
            ...usage.textToWorkflow
        }
    ];

    const tierBadges: Record<string, { color: string; label: string }> = {
        free: { color: 'bg-slate-600', label: 'Free' },
        supporter: { color: 'bg-blue-600', label: 'Supporter' },
        backer: { color: 'bg-purple-600', label: 'Backer' },
        organization: { color: 'bg-yellow-600', label: 'Organization' }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Usage Dashboard</h3>
                <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${tierBadges[tier]?.color || 'bg-slate-600'}`}>
                    {tierBadges[tier]?.label || tier}
                </span>
            </div>

            {/* Usage Bars */}
            <div className="space-y-4">
                {usageItems.map((item) => {
                    const percentage = getPercentage(item.used, item.limit);
                    const isUnlimited = item.limit === -1;

                    return (
                        <div key={item.key} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-slate-700">
                                    <span>{item.icon}</span>
                                    {item.label}
                                </span>
                                <span className="text-slate-500">
                                    {item.used.toLocaleString()} / {formatLimit(item.limit)}
                                </span>
                            </div>

                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 rounded-full ${isUnlimited ? 'bg-green-400' : getUsageColor(percentage)
                                        }`}
                                    style={{ width: isUnlimited ? '10%' : `${percentage}%` }}
                                />
                            </div>

                            {percentage >= 80 && !isUnlimited && (
                                <p className="text-xs text-amber-600">
                                    ⚠️ Approaching limit. Consider upgrading for more.
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upgrade Prompt */}
            {tier === 'free' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚀</span>
                        <div className="flex-1">
                            <p className="font-medium text-slate-800">Upgrade to Supporter</p>
                            <p className="text-sm text-slate-600">Get 10x more limits starting at Rp 50,000/month</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Upgrade
                        </button>
                    </div>
                </div>
            )}

            {/* Reset Info */}
            <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                    Daily limits reset at 00:00 UTC • Monthly limits reset on 1st of each month
                </p>
            </div>
        </div>
    );
};

export default UsageDashboard;
