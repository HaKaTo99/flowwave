import { useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

interface NodeInspectorProps {
    selectedNode: any;
    setNodes: any;
    onDelete?: () => void;
}

const NodeInspector = ({ selectedNode, setNodes, onDelete }: NodeInspectorProps) => {
    const { isDark } = useTheme();

    const handleChange = useCallback((e: any) => {
        const { name, value } = e.target;
        setNodes((nds: any[]) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [name]: value
                        }
                    };
                }
                return node;
            })
        );
    }, [selectedNode, setNodes]);

    if (!selectedNode) {
        return (
            <div className={`w-80 h-full border-l backdrop-blur-xl p-6 flex flex-col gap-4 transition-colors
                ${isDark
                    ? 'bg-[#0f0f1a]/90 border-white/10'
                    : 'bg-white/95 border-slate-200'
                }`}>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className={`text-4xl mb-3 ${isDark ? 'opacity-30' : 'opacity-50'}`}>📋</div>
                        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                            Select a node to edit properties
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Input field styling
    const inputClass = `w-full rounded-lg px-3 py-2.5 text-sm transition-all
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        ${isDark
            ? 'bg-white/5 border border-white/10 text-white placeholder-white/30'
            : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-500'
        }`;
    const selectClass = `w-full rounded-lg px-3 py-2.5 text-sm transition-all appearance-none
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        ${isDark
            ? 'bg-white/5 border border-white/10 text-white'
            : 'bg-slate-50 border border-slate-300 text-slate-900'
        }`;
    const labelClass = `block text-xs font-semibold uppercase tracking-wide mb-2
        ${isDark ? 'text-white/50' : 'text-slate-700'}`;

    const handleArrayChange = (key: string, index: number, value: string) => {
        const list = [...(selectedNode.data[key] || [])];
        list[index] = value;

        setNodes((nds: any[]) => nds.map((n) => {
            if (n.id === selectedNode.id) {
                return { ...n, data: { ...n.data, [key]: list } };
            }
            return n;
        }));
    };

    const addArrayItem = (key: string) => {
        const list = [...(selectedNode.data[key] || [])];
        list.push(`option-${list.length + 1}`);
        setNodes((nds: any[]) => nds.map((n) => {
            if (n.id === selectedNode.id) {
                return { ...n, data: { ...n.data, [key]: list } };
            }
            return n;
        }));
    };

    const removeArrayItem = (key: string, index: number) => {
        const list = [...(selectedNode.data[key] || [])];
        list.splice(index, 1);
        setNodes((nds: any[]) => nds.map((n) => {
            if (n.id === selectedNode.id) {
                return { ...n, data: { ...n.data, [key]: list } };
            }
            return n;
        }));
    };

    const renderFields = () => {
        const type = selectedNode.type || selectedNode.data.type || 'default';

        // 1. HTTP Request
        if (type === 'http-request' || type === 'webhook') {
            return (
                <>
                    <div>
                        <label className={labelClass}>Method</label>
                        <select
                            name="method"
                            className={selectClass}
                            value={selectedNode.data.method || 'GET'}
                            onChange={handleChange}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Endpoint URL</label>
                        <input
                            name="url"
                            className={`${inputClass} font-mono`}
                            value={selectedNode.data.url || ''}
                            placeholder="https://api.example.com"
                            onChange={handleChange}
                        />
                    </div>
                </>
            );
        }

        // 2. AI Agents / LLMs
        if (type === 'ai-agent' || type.includes('chat') || type === 'groq') {
            return (
                <>
                    <div>
                        <label className={labelClass}>Provider</label>
                        <select
                            name="provider"
                            className={selectClass}
                            value={selectedNode.data.provider || 'openai'}
                            onChange={handleChange}
                        >
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="local">Local AI (Ollama/LM Studio)</option>
                        </select>
                    </div>
                    {selectedNode.data.provider === 'local' && (
                        <div>
                            <label className={labelClass}>Base URL</label>
                            <input
                                name="baseUrl"
                                className={inputClass}
                                value={selectedNode.data.baseUrl || 'http://localhost:11434/v1'}
                                placeholder="http://localhost:11434/v1"
                                onChange={handleChange}
                            />
                        </div>
                    )}
                    {selectedNode.data.provider !== 'local' && (
                        <div>
                            <label className={labelClass}>API Key (Optional)</label>
                            <input
                                name="apiKey"
                                type="password"
                                className={`${inputClass} font-mono`}
                                value={selectedNode.data.apiKey || ''}
                                placeholder="sk-..."
                                onChange={handleChange}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Leave empty to use System Key. Enter user key to override.</p>
                        </div>
                    )}
                    <div>
                        <label className={labelClass}>Model</label>
                        <select
                            name="model"
                            className={selectClass}
                            value={selectedNode.data.model || 'llama3'}
                            onChange={handleChange}
                        >
                            {(selectedNode.data.provider === 'gemini') ? (
                                <>
                                    <option value="gemini-pro">Gemini Pro</option>
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                </>
                            ) : (selectedNode.data.provider === 'local') ? (
                                <>
                                    <option value="llama3">Llama 3</option>
                                    <option value="mistral">Mistral</option>
                                    <option value="phi3">Phi-3</option>
                                    <option value="gemma">Gemma</option>
                                </>
                            ) : (
                                <>
                                    <option value="gpt-4o">GPT-4o</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>System Prompt</label>
                        <textarea
                            name="system"
                            rows={4}
                            className={inputClass}
                            value={selectedNode.data.system || ''}
                            onChange={handleChange}
                            placeholder="You are a helpful assistant..."
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Temperature</label>
                        <input
                            name="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            className={inputClass}
                            value={selectedNode.data.temperature || 0.7}
                            onChange={handleChange}
                        />
                    </div>
                </>
            );
        }

        // 3. Logic / Switch / Condition
        if (type === 'switch' || type === 'condition' || type === 'router') {
            return (
                <>
                    <div>
                        <label className={labelClass}>Condition Mode</label>
                        <select
                            name="mode"
                            className={selectClass}
                            value={selectedNode.data.mode || 'Rules'}
                            onChange={handleChange}
                        >
                            <option value="Rules">Rules Engine</option>
                            <option value="LLM">LLM Router</option>
                            <option value="Code">JavaScript</option>
                        </select>
                    </div>

                    <div className="mt-2">
                        <label className={labelClass}>Outputs (Poles)</label>
                        <div className="flex flex-col gap-2">
                            {(selectedNode.data.outputs || []).map((output: string, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        className={inputClass}
                                        value={output}
                                        onChange={(e) => handleArrayChange('outputs', idx, e.target.value)}
                                    />
                                    <button
                                        onClick={() => removeArrayItem('outputs', idx)}
                                        className="px-2 text-red-500 hover:bg-red-500/10 rounded"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addArrayItem('outputs')}
                                className={`text-xs py-1.5 rounded-md border border-dashed transition-colors
                                    ${isDark ? 'border-white/20 hover:bg-white/5 text-white/50' : 'border-slate-300 hover:bg-slate-50 text-slate-500'}
                                `}
                            >
                                + Add Output Pole
                            </button>
                        </div>
                    </div>
                </>
            );
        }

        // 4. Integrations (Slack, Discord, Email)
        if (type === 'slack' || type === 'discord' || type === 'email') {
            return (
                <>
                    <div>
                        <label className={labelClass}>Webhook URL / Target</label>
                        <input
                            name={type === 'email' ? 'to' : 'webhookUrl'}
                            className={inputClass}
                            value={selectedNode.data[type === 'email' ? 'to' : 'webhookUrl'] || ''}
                            placeholder={type === 'email' ? 'recipient@example.com' : 'https://hooks.slack.com/...'}
                            onChange={handleChange}
                        />
                    </div>
                    {type === 'slack' && (
                        <div>
                            <label className={labelClass}>Channel (Optional)</label>
                            <input
                                name="channel"
                                className={inputClass}
                                value={selectedNode.data.channel || ''}
                                placeholder="#general"
                                onChange={handleChange}
                            />
                        </div>
                    )}
                    {type === 'email' && (
                        <div>
                            <label className={labelClass}>Subject</label>
                            <input
                                name="subject"
                                className={inputClass}
                                value={selectedNode.data.subject || ''}
                                placeholder="Notification Subject"
                                onChange={handleChange}
                            />
                        </div>
                    )}
                </>
            );
        }

        // Default Fallback
        return null;
    };

    return (
        <div className={`w-80 h-full border-l backdrop-blur-xl shadow-2xl flex flex-col z-10 transition-colors
            ${isDark
                ? 'bg-[#0f0f1a]/90 border-white/10'
                : 'bg-white/95 border-slate-200'
            }`}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg shadow-lg">
                        {selectedNode.data.label?.includes('http') ? '🌐' :
                            selectedNode.data.label?.includes('delay') ? '⏱️' :
                                selectedNode.type?.includes('ai') ? '🤖' : '📦'}
                    </div>
                    <div>
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedNode.data.label}</h3>
                        <span className={`text-xs font-mono ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{selectedNode.id}</span>
                    </div>
                </div>
            </div>

            {/* Properties */}
            <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
                <div className={`text-xs uppercase tracking-wide font-semibold mb-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                    Properties
                </div>
                {/* Common Fields */}
                <div className="mb-4 flex flex-col gap-4 border-b border-dashed border-slate-200 dark:border-white/10 pb-4">
                    <div>
                        <label className={labelClass}>Label</label>
                        <input
                            name="label"
                            className={inputClass}
                            value={selectedNode.data.label || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                            name="description"
                            rows={2}
                            className={inputClass}
                            value={selectedNode.data.description || ''}
                            onChange={handleChange}
                            placeholder="Explain function..."
                        />
                    </div>
                </div>

                {/* Specific Fields */}
                {renderFields()}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                <button
                    onClick={onDelete}
                    className="w-full py-2.5 bg-gradient-to-r from-red-500/80 to-rose-500/80 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-rose-600 transition-all"
                >
                    🗑️ Delete Node
                </button>
            </div>
        </div>
    );
};

export default NodeInspector;
