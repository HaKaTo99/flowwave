import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '../context/ThemeContext';

const nodeConfig: Record<string, { icon: string; gradient: string }> = {
    'http-request': { icon: '🌐', gradient: 'from-purple-500 to-indigo-500' },
    'delay': { icon: '⏱️', gradient: 'from-amber-500 to-orange-500' },
    'condition': { icon: '⑂', gradient: 'from-blue-500 to-cyan-500' },
    'debug': { icon: '🐛', gradient: 'from-gray-500 to-slate-500' },
    'webhook': { icon: '🔗', gradient: 'from-indigo-500 to-violet-500' },
    'ai-agent': { icon: '🤖', gradient: 'from-violet-500 to-purple-600' },
    'openai-chat': { icon: '⚡', gradient: 'from-emerald-500 to-green-500' },
    'anthropic-chat': { icon: '🧠', gradient: 'from-orange-500 to-amber-500' },
    'gemini-chat': { icon: '✨', gradient: 'from-blue-500 to-cyan-500' },
    'schedule': { icon: '📅', gradient: 'from-amber-500 to-orange-500' },
    'email': { icon: '📧', gradient: 'from-red-500 to-rose-500' },
    'telegram': { icon: '✈️', gradient: 'from-sky-500 to-blue-500' },
    'postgres': { icon: '🐘', gradient: 'from-blue-500 to-indigo-600' },
    'notion': { icon: '📝', gradient: 'from-slate-500 to-gray-600' },
    'google-sheets': { icon: '📊', gradient: 'from-green-500 to-emerald-600' },
    'algorithm': { icon: '🧮', gradient: 'from-pink-500 to-rose-500' },
    'transform': { icon: '🔄', gradient: 'from-violet-500 to-fuchsia-500' },
    'qdrant': { icon: '🔍', gradient: 'from-red-500 to-orange-600' },
    'google-gemini': { icon: 'G', gradient: 'from-blue-500 to-indigo-500' },
    'groq': { icon: '⚡', gradient: 'from-orange-500 to-red-500' },
    'switch': { icon: '⑂', gradient: 'from-gray-500 to-slate-600' },
    'proxmox': { icon: '🖥️', gradient: 'from-orange-600 to-red-600' },
    'output-parser': { icon: '🛠️', gradient: 'from-slate-600 to-gray-700' },
    'slack': { icon: '#', gradient: 'from-purple-500 to-fuchsia-500' },
    'openai': { icon: '🤖', gradient: 'from-green-500 to-emerald-600' },
    'entra-id': { icon: '🔑', gradient: 'from-blue-600 to-indigo-600' },
    'jira': { icon: '📋', gradient: 'from-blue-500 to-cyan-500' },
    'postgres-memory': { icon: '🐘', gradient: 'from-blue-400 to-indigo-500' },
    'default': { icon: '⚡', gradient: 'from-slate-500 to-gray-500' }
};

const CustomNode = ({ data, selected, type }: any) => {
    const { isDark } = useTheme();
    // Prioritize data.type (explicit), then prop type (from ReactFlow), then label, then default
    const nodeType = data.type || type || data.label || 'default';
    const config = nodeConfig[nodeType] || nodeConfig[data.label] || nodeConfig.default;

    return (
        <div
            title={data.description} // Hover tooltip for full description
            className={`
            px-4 py-3 min-w-[180px] rounded-xl
            backdrop-blur-sm border-2 transition-all duration-200
            ${isDark
                    ? 'bg-[#1a1a2e]/90 border-white/10'
                    : 'bg-white/95 border-slate-200'
                }
            ${selected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                    : isDark ? 'hover:border-white/30' : 'hover:border-indigo-300'
                }
        `}>
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !bg-gradient-to-r !from-indigo-500 !to-purple-500 !border-2 ${isDark ? '!border-[#0f0f1a]' : '!border-white'}`}
            />

            {/* Status Indicators */}
            {data.executionStatus === 'running' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center animate-spin z-20 shadow-sm border border-white dark:border-slate-900">
                    <span className="text-[10px] text-white">⚙️</span>
                </div>
            )}
            {data.executionStatus === 'completed' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center z-20 shadow-sm border border-white dark:border-slate-900">
                    <span className="text-[10px] text-white">✓</span>
                </div>
            )}
            {data.executionStatus === 'failed' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center z-20 shadow-sm border border-white dark:border-slate-900">
                    <span className="text-[10px] text-white">✕</span>
                </div>
            )}

            <div className={`flex items-center gap-3 ${data.executionStatus === 'running' ? 'animate-pulse' : ''}`}>
                <div className={`
                    rounded-xl w-10 h-10 flex justify-center items-center text-lg
                    bg-gradient-to-br ${config.gradient}
                    shadow-lg
                `}>
                    {config.icon}
                </div>
                <div className="flex-1">
                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.label}</div>
                    {/* Subtitle: Prioritize user description, else show technical detail */}
                    <div className={`text-[10px] truncate max-w-[120px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        {data.description || data.url || data.model || data.method || 'Click to configure'}
                    </div>
                </div>
            </div>

            {/* Dynamic Output Poles */}
            {data.outputs && data.outputs.length > 0 ? (
                <div className="absolute bottom-0 left-0 w-full flex justify-around translate-y-1/2 px-2">
                    {data.outputs.map((output: string, idx: number) => (
                        <div key={idx} className="relative group">
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                id={output}
                                className={`
                                    !relative !transform-none !w-3 !h-3 !left-auto !right-auto
                                    !bg-gradient-to-r !from-indigo-500 !to-purple-500 !border-2 
                                    ${isDark ? '!border-[#0f0f1a]' : '!border-white'}
                                `}
                            />
                            <span className={`
                                absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] 
                                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                                ${isDark ? 'text-white/70' : 'text-slate-600'}
                            `}>
                                {output}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className={`!w-3 !h-3 !bg-gradient-to-r !from-indigo-500 !to-purple-500 !border-2 ${isDark ? '!border-[#0f0f1a]' : '!border-white'}`}
                />
            )}
        </div>
    );
};

export default memo(CustomNode);
