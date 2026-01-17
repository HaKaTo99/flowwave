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
        return null;
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

        // Helper for Select Input
        const RenderSelect = ({ label, name, options }: { label: string, name: string, options: string[] }) => (
            <div className="mb-3">
                <label className={labelClass}>{label}</label>
                <select
                    name={name}
                    className={selectClass}
                    value={selectedNode.data[name] || options[0]}
                    onChange={handleChange}
                >
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        );

        // Helper for Text Input
        const RenderInput = ({ label, name, placeholder, type = "text" }: { label: string, name: string, placeholder?: string, type?: string }) => (
            <div className="mb-3">
                <label className={labelClass}>{label}</label>
                <input
                    name={name}
                    type={type}
                    className={inputClass}
                    value={selectedNode.data[name] || ''}
                    placeholder={placeholder}
                    onChange={handleChange}
                />
            </div>
        );

        // Helper for Textarea
        const RenderTextarea = ({ label, name, placeholder, rows = 3 }: { label: string, name: string, placeholder?: string, rows?: number }) => (
            <div className="mb-3">
                <label className={labelClass}>{label}</label>
                <textarea
                    name={name}
                    rows={rows}
                    className={`${inputClass} font-mono text-xs`}
                    value={selectedNode.data[name] || ''}
                    placeholder={placeholder}
                    onChange={handleChange}
                />
            </div>
        );

        // === 1. HTTP & Webhook ===
        if (type === 'http-request' || type === 'webhook') {
            return (
                <>
                    <RenderSelect label="Method" name="method" options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']} />
                    <RenderInput label="Endpoint URL" name="url" placeholder="https://api.example.com/v1/resource" />
                    <RenderTextarea label="Headers (JSON)" name="headers" placeholder='{ "Authorization": "Bearer..." }' />
                    <RenderTextarea label="Body (JSON)" name="body" placeholder='{ "key": "value" }' />
                </>
            );
        }

        // === 2. AI Agents & LLMs ===
        if (type === 'ai-agent' || type.includes('chat') || type === 'groq' || type === 'anthropic' || type === 'gemini') {
            return (
                <>
                    <RenderSelect label="Provider" name="provider" options={['openai', 'anthropic', 'gemini', 'groq', 'local']} />
                    {selectedNode.data.provider === 'local' && (
                        <RenderInput label="Base URL" name="baseUrl" placeholder="http://localhost:11434/v1" />
                    )}
                    <RenderInput label="Model Name" name="model" placeholder="gpt-4o, llama3, claude-3-opus" />
                    <RenderTextarea label="System Prompt" name="system" rows={6} placeholder="You are a helpful assistant..." />
                    <div className="grid grid-cols-2 gap-2">
                        <RenderInput label="Temperature" name="temperature" type="number" placeholder="0.7" />
                        <RenderInput label="Max Tokens" name="maxTokens" type="number" placeholder="2048" />
                    </div>
                </>
            );
        }

        // === 3. Logic & Control ===
        if (type === 'switch' || type === 'condition') {
            return (
                <>
                    <RenderSelect label="Mode" name="mode" options={['Rules', 'JavaScript', 'LLM Router']} />
                    <div className="mt-2">
                        <label className={labelClass}>Routes (Outputs)</label>
                        <div className="flex flex-col gap-2">
                            {(selectedNode.data.outputs || []).map((output: string, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        className={inputClass}
                                        value={output}
                                        onChange={(e) => handleArrayChange('outputs', idx, e.target.value)}
                                    />
                                    <button onClick={() => removeArrayItem('outputs', idx)} className="text-red-500 hover:text-red-400">×</button>
                                </div>
                            ))}
                            <button onClick={() => addArrayItem('outputs')} className="text-xs text-indigo-400 hover:text-indigo-300">+ Add Route</button>
                        </div>
                    </div>
                    {selectedNode.data.mode === 'JavaScript' && (
                        <RenderTextarea label="Condition Logic (JS)" name="code" rows={6} placeholder="return input.value > 10 ? 'true' : 'false';" />
                    )}
                </>
            );
        }

        if (type === 'delay') {
            return <RenderInput label="Duration (ms)" name="duration" type="number" placeholder="1000" />;
        }

        if (type === 'schedule' || type === 'cron-trigger') {
            return (
                <>
                    <RenderInput label="Cron Expression" name="cron" placeholder="0 9 * * 1-5" />
                    <p className="text-[10px] opacity-50 mb-2">Example: Every weekday at 9am</p>
                    <RenderSelect label="Timezone" name="timezone" options={['UTC', 'America/New_York', 'Asia/Jakarta', 'Europe/London']} />
                </>
            );
        }

        // === 7. Vector Database & RAG ===
        if (type === 'qdrant' || type === 'pinecone' || type === 'weaviate') {
            return (
                <>
                    <RenderSelect label="Operation" name="method" options={['Upsert Vectors', 'Search', 'Create Collection', 'Delete']} />
                    <RenderInput label="Collection / Index Name" name="collection" placeholder="my_documents" />
                    {selectedNode.data.method === 'Search' && (
                        <>
                            <RenderInput label="Query Vector / Text" name="query" placeholder="What is the shipping policy?" />
                            <RenderInput label="Limit (Top K)" name="topK" type="number" placeholder="5" />
                        </>
                    )}
                    <RenderInput label="API URL / Host" name="host" placeholder="http://localhost:6333" />
                    <RenderInput label="API Key" name="apiKey" type="password" placeholder="..." />
                </>
            );
        }

        if (type === 'embeddings') {
            return (
                <>
                    <RenderSelect label="Provider" name="provider" options={['OpenAI', 'HuggingFace', 'Cohere']} />
                    <RenderInput label="Model" name="model" placeholder="text-embedding-3-small" />
                    <RenderTextarea label="Input Text" name="input" rows={4} placeholder="{{ prevNode.data }}" />
                </>
            );
        }

        if (type === 'text-splitter') {
            return (
                <>
                    <RenderSelect label="Strategy" name="strategy" options={['Recursive Character', 'Token', 'Markdown']} />
                    <div className="grid grid-cols-2 gap-2">
                        <RenderInput label="Chunk Size" name="chunkSize" type="number" placeholder="1000" />
                        <RenderInput label="Overlap" name="overlap" type="number" placeholder="200" />
                    </div>
                </>
            );
        }

        // === 8. Infrastructure & Tech ===
        if (type === 's3' || type === 'minio') {
            return (
                <>
                    <RenderSelect label="Action" name="method" options={['Upload File', 'Download File', 'List Objects', 'Delete Object']} />
                    <RenderInput label="Bucket Name" name="bucket" placeholder="my-bucket" />
                    <RenderInput label="Key / Path" name="key" placeholder="folder/file.txt" />
                </>
            );
        }

        if (type === 'redis') {
            return (
                <>
                    <RenderSelect label="Command" name="method" options={['GET', 'SET', 'DEL', 'LPUSH', 'RPOP']} />
                    <RenderInput label="Key" name="key" placeholder="user:session:123" />
                    {['SET', 'LPUSH'].includes(selectedNode.data.method) && (
                        <RenderInput label="Value" name="value" placeholder="some-value" />
                    )}
                </>
            );
        }

        if (type === 'proxmox') {
            return (
                <>
                    <RenderSelect label="Entity" name="entity" options={['VM', 'LXC', 'Node']} />
                    <RenderSelect label="Action" name="method" options={['Start', 'Stop', 'Restart', 'Snapshot', 'Clone']} />
                    <RenderInput label="VM ID / Name" name="vmid" placeholder="100" />
                    <RenderInput label="Node Name" name="node" placeholder="pve" />
                </>
            );
        }

        if (type === 'docker') {
            return (
                <>
                    <RenderSelect label="Action" name="method" options={['Run Container', 'Stop Container', 'List', 'Build']} />
                    <RenderInput label="Image Name" name="image" placeholder="nginx:latest" />
                    <RenderInput label="Command" name="command" placeholder="npm start" />
                </>
            );
        }

        if (type === 'entra-id') {
            return (
                <>
                    <RenderSelect label="Resource" name="resource" options={['User', 'Group', 'Application']} />
                    <RenderSelect label="Operation" name="method" options={['Get', 'List', 'Update', 'Add Member']} />
                    <RenderInput label="Object ID / UPN" name="objectId" placeholder="user@example.com" />
                </>
            );
        }

        // === 9. Advanced Utilities ===
        if (type === 'loop-items') {
            return (
                <>
                    <RenderInput label="Array path to loop" name="arrayPath" placeholder="$.http_request_1.data.users" />
                    <p className="text-[10px] opacity-60 mb-2">Each item will be passed to next nodes as `input`.</p>
                    <RenderInput label="Max Iterations" name="maxIterations" type="number" placeholder="100" />
                </>
            );
        }

        if (type === 'transform') {
            return (
                <>
                    <RenderSelect label="Engine" name="engine" options={['JSONata', 'JavaScript Map']} />
                    <RenderTextarea label="Transformation Expression" name="expression" rows={6} placeholder="$.users[age > 18].name" />
                </>
            );
        }

        // === 4. Communication (Social, Email, Chat) ===
        if (type === 'slack' || type === 'discord') {
            return (
                <>
                    <RenderSelect label="Action" name="method" options={['send: message', 'send: block', 'read: history']} />
                    <RenderInput label="Channel / User ID" name="channel" placeholder="#general or U123456" />
                    <RenderTextarea label="Message" name="message" placeholder="Hello world!" />
                    <RenderInput label="Webhook URL (Optional)" name="webhookUrl" placeholder="https://hooks.slack.com/..." />
                </>
            );
        }

        if (type === 'email') {
            return (
                <>
                    <RenderInput label="To" name="to" placeholder="recipient@example.com" />
                    <RenderInput label="Subject" name="subject" placeholder="Weekly Report" />
                    <RenderTextarea label="Body (HTML/Text)" name="body" rows={6} placeholder="<h1>Hello</h1>..." />
                    <RenderInput label="SMTP Host (Optional)" name="smtp" placeholder="smtp.gmail.com" />
                </>
            );
        }

        if (type === 'whatsapp' || type === 'telegram') {
            return (
                <>
                    <RenderInput label="Phone Number / Chat ID" name="recipient" placeholder="+1234567890" />
                    <RenderSelect label="Message Type" name="msgType" options={['Text', 'Template', 'Image']} />
                    {selectedNode.data.msgType === 'Template' ? (
                        <RenderInput label="Template Name" name="template" placeholder="hello_world" />
                    ) : (
                        <RenderTextarea label="Message Content" name="message" placeholder="Hello there!" />
                    )}
                </>
            );
        }

        if (type === 'twitter' || type === 'linkedin' || type === 'facebook' || type === 'instagram' || type === 'tiktok') {
            return (
                <>
                    <RenderSelect label="Action" name="method" options={['Post Update', 'Upload Media', 'Get Analytics']} />
                    <RenderTextarea label="Content / Caption" name="content" rows={4} placeholder="What's happening?" />
                    <RenderInput label="Media URL (Optional)" name="mediaUrl" placeholder="https://..." />
                </>
            );
        }

        // === 5. Google Workspace & Productivity ===
        if (type === 'google-sheets') {
            return (
                <>
                    <RenderSelect label="Operation" name="method" options={['read: all', 'read: range', 'append: row', 'update: cell', 'clear: range']} />
                    <RenderInput label="Spreadsheet ID" name="spreadsheetId" placeholder="1BxiMVs0XRA5nFMdKvBdBkJ..." />
                    <RenderInput label="Sheet Name / Range" name="range" placeholder="Sheet1!A1:B10" />
                    <RenderTextarea label="Values (JSON Array for Append)" name="values" placeholder='["Value1", "Value2"]' />
                </>
            );
        }

        if (type === 'google-docs' || type === 'notion') {
            return (
                <>
                    <RenderSelect label="Operation" name="method" options={['read: page', 'create: page', 'append: block']} />
                    <RenderInput label="Document / Page ID" name="docId" placeholder="xxxxx-yyyyy-zzzzz" />
                    <RenderTextarea label="Content (Markdown)" name="content" rows={6} placeholder="# Title" />
                </>
            );
        }

        if (type === 'google-drive') {
            return (
                <>
                    <RenderSelect label="Operation" name="method" options={['list: files', 'upload: file', 'create: folder']} />
                    <RenderInput label="Parent Folder ID" name="folderId" placeholder="root" />
                    <RenderInput label="File Name / Query" name="query" placeholder="report.pdf" />
                </>
            );
        }

        if (type === 'google-calendar') {
            return (
                <>
                    <RenderSelect label="Operation" name="method" options={['list: events', 'create: event', 'free-busy: check']} />
                    <RenderInput label="Calendar ID" name="calendarId" placeholder="primary" />
                    <RenderInput label="Event Summary" name="summary" placeholder="Team Meeting" />
                    <div className="grid grid-cols-2 gap-2">
                        <RenderInput label="Start Time" name="startTime" type="datetime-local" placeholder="" />
                        <RenderInput label="End Time" name="endTime" type="datetime-local" placeholder="" />
                    </div>
                </>
            );
        }

        if (type === 'jira' || type === 'linear' || type === 'trello' || type === 'github') {
            return (
                <>
                    <RenderSelect label="Action" name="method" options={['create: issue', 'update: issue', 'get: issue', 'list: issues']} />
                    <RenderInput label="Project / Repo Key" name="projectKey" placeholder="PROJ or owner/repo" />
                    <RenderInput label="Issue Type / Label" name="issueType" placeholder="Task" />
                    <RenderInput label="Title / Summary" name="summary" placeholder="Fix bug" />
                    <RenderTextarea label="Description" name="description" rows={4} placeholder="Details..." />
                </>
            );
        }

        // === 6. Database ===
        if (type === 'postgres' || type === 'mysql' || type === 'mongodb' || type === 'supabase') {
            return (
                <>
                    <RenderSelect label="Query Mode" name="mode" options={['Raw SQL', 'Query Builder']} />
                    {selectedNode.data.mode === 'Raw SQL' ? (
                        <RenderTextarea label="SQL Query" name="query" rows={6} placeholder="SELECT * FROM users WHERE active = true;" />
                    ) : (
                        <>
                            <RenderInput label="Table Name" name="table" placeholder="users" />
                            <RenderSelect label="Operation" name="operation" options={['SELECT', 'INSERT', 'UPDATE', 'DELETE']} />
                            <RenderTextarea label="Where / Data (JSON)" name="data" placeholder='{ "id": 1 }' />
                        </>
                    )}
                    <RenderInput label="Connection String (Env Var Name)" name="connectionEnv" placeholder="DATABASE_URL" />
                </>
            );
        }

        // === Default: Generic Fields ===
        return (
            <>
                <RenderTextarea label="Parameters (JSON)" name="parameters" rows={5} placeholder='{ "key": "value" }' />
                <p className="text-xs opacity-50 text-center mt-4">Generic Node Configuration</p>
            </>
        );
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
