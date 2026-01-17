import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Connection,
    Edge,
    Node
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './components/Sidebar';
import SyncToggle from './components/SyncToggle';
import SyncStatus from './components/SyncStatus';
import Toolbar from './components/Toolbar';
import NodeInspector from './components/NodeInspector';
import CustomNode from './components/CustomNode';
import ThemeToggle from './components/ThemeToggle';
import { WorkflowList } from './components/WorkflowList';
import { ExecutionHistory } from './components/ExecutionHistory';
import { Confetti } from './components/Confetti';
import { CanvasEmptyState } from './components/CanvasEmptyState';
import { useToast } from './components/Toast';
import { ConnectionStatus } from './components/LoadingComponents';
import { useSyncManager } from './hooks/useSyncManager';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { saveWorkflow, executeWorkflow, getWorkflow } from './api';

let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
    default: CustomNode,
    'http-request': CustomNode,
    'delay': CustomNode,
    'condition': CustomNode,
    'debug': CustomNode,
    'webhook': CustomNode,
    'ai-agent': CustomNode,
    'slack': CustomNode,
    'email': CustomNode,
    'postgres': CustomNode,
    'openai': CustomNode,
    'google-sheets': CustomNode,
    'schedule': CustomNode,
    'telegram': CustomNode,
    'notion': CustomNode,
    'qdrant': CustomNode,
    'algorithm': CustomNode,
    'transform': CustomNode,
    'google-gemini': CustomNode,
    'groq': CustomNode,
    'switch': CustomNode,
    'proxmox': CustomNode,
    'output-parser': CustomNode,
    'openai-chat': CustomNode
};

const Flow = () => {
    const { isDark } = useTheme();
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
    const [currentWorkflowName, setCurrentWorkflowName] = useState<string>('Untitled Workflow');

    // Loading states
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [backendConnected, setBackendConnected] = useState(false);

    // Modal states
    const [showWorkflowList, setShowWorkflowList] = useState(false);
    const [showExecutionHistory, setShowExecutionHistory] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const { mode, switchMode, syncStatus } = useSyncManager();
    const toast = useToast();

    // Check backend connection on mount
    useEffect(() => {
        console.log('FlowWave App v2.1 loaded');
        const checkConnection = async () => {
            try {
                const res = await fetch('http://localhost:3001/health');
                setBackendConnected(res.ok);
            } catch {
                setBackendConnected(false);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onDragOver = useCallback((event: any) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: any) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            if (!reactFlowInstance) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode = {
                id: getId(),
                type: 'default',
                position,
                data: { label: type },
            };

            setNodes((nds) => nds.concat(newNode));
            toast.info(`Added ${type} node`);
        },
        [reactFlowInstance, setNodes, toast],
    );

    const onNodeClick = useCallback((event: any, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
        toast.info('Node deleted');
    }, [selectedNode, setNodes, setEdges, toast]);

    // Keyboard shortcuts
    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            handleDeleteNode();
        }
    }, [handleDeleteNode]);

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onKeyDown]);

    const handleUseTemplate = useCallback((templateAction: string) => {
        const templateId = `template_${Date.now()}`;
        let newNodes: Node[] = [];
        let newEdges: Edge[] = [];

        // Simple mock templates
        if (templateAction.includes('On-board')) {
            newNodes = [
                // Trigger
                { id: '1', type: 'webhook', position: { x: 50, y: 250 }, data: { label: "On 'Create User' form submission", type: 'webhook', method: 'POST', description: 'Triggered when HR submits new hire form' } },

                // Central Agent
                { id: '2', type: 'ai-agent', position: { x: 350, y: 250 }, data: { label: 'AI Agent', type: 'ai-agent', model: 'Tools Agent', description: 'Orchestrates access provisioning logic' } },

                // Tools & Context (Below Agent)
                { id: '3', type: 'anthropic-chat', position: { x: 200, y: 450 }, data: { label: 'Anthropic Chat Model', type: 'anthropic-chat', description: 'Claude 3.5 Sonnet for reasoning' } },
                { id: '4', type: 'postgres-memory', position: { x: 350, y: 450 }, data: { label: 'Postgres Chat Memory', type: 'postgres-memory' } },
                { id: '5', type: 'entra-id', position: { x: 500, y: 450 }, data: { label: 'Microsoft Entra ID', type: 'entra-id', method: 'getAll: user', description: 'Fetches user groups/roles' } },
                { id: '6', type: 'jira', position: { x: 650, y: 450 }, data: { label: 'Jira Software', type: 'jira', method: 'create: user', description: 'Creates onboarding ticket' } },

                // Decision
                { id: '7', type: 'condition', position: { x: 650, y: 250 }, data: { label: 'Is manager?', type: 'condition', outputs: ['true', 'false'], description: 'Checks if new hire is Manager' } },

                // Actions (Right)
                { id: '8', type: 'slack', position: { x: 900, y: 150 }, data: { label: 'Add to channel', type: 'slack', method: 'invite: channel' } },
                { id: '9', type: 'slack', position: { x: 900, y: 350 }, data: { label: 'Update profile', type: 'slack', method: 'updateProfile: user' } }
            ];

            newEdges = [
                // Main Flow
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-7', source: '2', target: '7' },

                // Tool Connections (Dashed)
                { id: 'e3-2', source: '3', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Model' },
                { id: 'e4-2', source: '4', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Memory' },
                { id: 'e5-2', source: '5', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Tool' },
                { id: 'e6-2', source: '6', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Tool' },

                // Conditional Branches
                { id: 'e7-8', source: '7', target: '8', label: 'true', type: 'smoothstep', sourceHandle: 'true' },
                { id: 'e7-9', source: '7', target: '9', label: 'false', type: 'smoothstep', sourceHandle: 'false' }
            ];
        } else if (templateAction.includes('Enrich')) {
            newNodes = [
                { id: '1', type: 'webhook', position: { x: 100, y: 100 }, data: { label: 'New Security Ticket' } },
                { id: '2', type: 'ai-agent', position: { x: 400, y: 100 }, data: { label: 'Threat Analysis Agent' } },
                { id: '3', type: 'postgres', position: { x: 700, y: 100 }, data: { label: 'Update DB' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' }
            ];
        } else if (templateAction.includes('Convert')) {
            // DevOps: Natural Language to API (Complex)
            newNodes = [
                // Main Flow
                { id: '1', type: 'webhook', position: { x: 50, y: 200 }, data: { label: 'Webhook', type: 'webhook', method: 'GET', description: 'API Gateway Trigger' } },
                { id: '2', type: 'ai-agent', position: { x: 300, y: 200 }, data: { label: 'AI Agent', type: 'ai-agent', model: 'Tools Agent', description: 'Parses natural language intent' } },
                { id: '3', type: 'switch', position: { x: 600, y: 200 }, data: { label: 'Switch', type: 'switch', method: 'mode: Rules', outputs: ['GET', 'POST', 'DELETE'], description: 'Routes based on HTTP Method' } },

                // Switch Branches
                { id: '4', type: 'http-request', position: { x: 900, y: 100 }, data: { label: 'Get properties', type: 'http-request' } },
                { id: '5', type: 'http-request', position: { x: 900, y: 250 }, data: { label: 'Post URL', type: 'http-request' } },
                { id: '6', type: 'switch', position: { x: 900, y: 400 }, data: { label: 'Delete/Return', type: 'switch', outputs: ['true', 'false'] } },

                // Nested Branch
                { id: '7', type: 'http-request', position: { x: 1200, y: 350 }, data: { label: 'Delete URL', type: 'http-request' } },
                { id: '8', type: 'http-request', position: { x: 1200, y: 500 }, data: { label: 'Return output', type: 'http-request' } },

                // Inputs to AI Agent
                { id: '9', type: 'google-gemini', position: { x: 100, y: 450 }, data: { label: 'Google Gemini Chat Model', type: 'google-gemini' } },
                { id: '10', type: 'proxmox', position: { x: 300, y: 450 }, data: { label: 'Proxmox API Documentation', type: 'proxmox' } },
                { id: '11', type: 'proxmox', position: { x: 450, y: 550 }, data: { label: 'Proxmox API Wiki', type: 'proxmox' } },
                { id: '12', type: 'proxmox', position: { x: 450, y: 650 }, data: { label: 'Proxmox', type: 'proxmox' } },

                // Parser Logic
                { id: '13', type: 'output-parser', position: { x: 600, y: 550 }, data: { label: 'Auto-fixing Output Parser', type: 'output-parser' } },
                { id: '14', type: 'groq', position: { x: 600, y: 700 }, data: { label: 'Groq Chat Model', type: 'groq' } },
                { id: '15', type: 'output-parser', position: { x: 750, y: 700 }, data: { label: 'Structured Output Parser', type: 'output-parser' } }
            ];

            newEdges = [
                // Main Flow
                { id: 'e1-2', source: '1', target: '2', label: 'GET' },
                { id: 'e2-3', source: '2', target: '3' },

                // Switch connections
                { id: 'e3-4', source: '3', target: '4', label: 'GET', type: 'smoothstep', sourceHandle: 'GET' },
                { id: 'e3-5', source: '3', target: '5', label: 'POST', type: 'smoothstep', sourceHandle: 'POST' },
                { id: 'e3-6', source: '3', target: '6', label: 'DELETE', type: 'smoothstep', sourceHandle: 'DELETE' },

                // Nested Switch connections
                { id: 'e6-7', source: '6', target: '7', label: 'true', type: 'smoothstep', sourceHandle: 'true' },
                { id: 'e6-8', source: '6', target: '8', label: 'false', type: 'smoothstep', sourceHandle: 'false' },

                // Tool/Model Inputs (Dashed)
                { id: 'e9-2', source: '9', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Model' },
                { id: 'e10-2', source: '10', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Tool' },
                { id: 'e11-2', source: '11', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Tool' },
                { id: 'e12-2', source: '12', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Tool' },

                // Parser Connections
                { id: 'e13-2', source: '13', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Output Parser' },
                { id: 'e14-13', source: '14', target: '13', animated: true, style: { strokeDasharray: '5,5' }, label: 'Model' },
                { id: 'e15-13', source: '15', target: '13', animated: true, style: { strokeDasharray: '5,5' }, label: 'Parser' }
            ];
        } else if (templateAction.includes('Screening')) {
            // HR: Candidate Screening
            newNodes = [
                { id: '1', type: 'webhook', position: { x: 50, y: 250 }, data: { label: 'New Application', type: 'webhook', method: 'POST' } },
                { id: '2', type: 'ai-agent', position: { x: 300, y: 250 }, data: { label: 'Resume Screener', type: 'ai-agent', system: 'You are an expert HR recruiter. Extract skills and score the candidate from 0-100.' } },
                { id: '3', type: 'condition', position: { x: 600, y: 250 }, data: { label: 'Score > 80?', type: 'condition', mode: 'Rules', outputs: ['yes', 'no'] } },
                { id: '4', type: 'email', position: { x: 900, y: 150 }, data: { label: 'Invite Interview', type: 'email', subject: 'Interview Invitation' } },
                { id: '5', type: 'email', position: { x: 900, y: 350 }, data: { label: 'Rejection Email', type: 'email', subject: 'Application Status' } },
                { id: '6', type: 'openai-chat', position: { x: 300, y: 450 }, data: { label: 'OpenAI Evaluator', type: 'openai-chat' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e6-2', source: '6', target: '2', animated: true, style: { strokeDasharray: '5,5' }, label: 'Model' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4', label: 'yes', type: 'smoothstep', sourceHandle: 'yes' },
                { id: 'e3-5', source: '3', target: '5', label: 'no', type: 'smoothstep', sourceHandle: 'no' }
            ];
        } else if (templateAction.includes('Tweet')) {
            // Marketing: Viral Tweet
            newNodes = [
                { id: '1', type: 'webhook', position: { x: 50, y: 200 }, data: { label: 'Every Morning 9AM', type: 'webhook' } },
                { id: '2', type: 'http-request', position: { x: 300, y: 200 }, data: { label: 'Get Trends', type: 'http-request', url: 'https://api.twitter.com/2/trends' } },
                { id: '3', type: 'ai-agent', position: { x: 550, y: 200 }, data: { label: 'Viral Content Creator', type: 'ai-agent', system: 'Create a viral tweet based on these trends.' } },
                { id: '4', type: 'slack', position: { x: 800, y: 200 }, data: { label: 'Request Approval', type: 'slack', channel: '#marketing-approvals' } },
                { id: '5', type: 'http-request', position: { x: 1050, y: 200 }, data: { label: 'Post to Twitter', type: 'http-request', method: 'POST', url: 'https://api.twitter.com/2/tweets' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4' },
                { id: 'e4-5', source: '4', target: '5', label: 'Approved' }
            ];
        } else if (templateAction.includes('Support')) {
            // Support: Auto-Response
            newNodes = [
                { id: '1', type: 'email', position: { x: 50, y: 250 }, data: { label: 'New Email In' } },
                { id: '2', type: 'ai-agent', position: { x: 300, y: 250 }, data: { label: 'Sentiment Analyzer', type: 'ai-agent', system: 'Analyze sentiment: POSITIVE, NEUTRAL, or NEGATIVE.' } },
                { id: '3', type: 'switch', position: { x: 600, y: 250 }, data: { label: 'Route Ticket', type: 'switch', outputs: ['URGENT', 'NORMAL'] } },
                { id: '4', type: 'slack', position: { x: 900, y: 150 }, data: { label: 'Alert Manager', type: 'slack', channel: '#emergency' } },
                { id: '5', type: 'ai-agent', position: { x: 900, y: 350 }, data: { label: 'Draft Reply', type: 'ai-agent' } },
                { id: '6', type: 'email', position: { x: 1150, y: 350 }, data: { label: 'Send Reply', type: 'email' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4', label: 'URGENT', sourceHandle: 'URGENT' },
                { id: 'e3-5', source: '3', target: '5', label: 'NORMAL', sourceHandle: 'NORMAL' },
                { id: 'e5-6', source: '5', target: '6' }
            ];
        } else if (templateAction.includes('Expense')) {
            // Finance: Expense Approval
            newNodes = [
                { id: '1', type: 'webhook', position: { x: 50, y: 200 }, data: { label: 'Receipt Upload' } },
                { id: '2', type: 'ai-agent', position: { x: 300, y: 200 }, data: { label: 'Receipt OCR', type: 'ai-agent', system: 'Extract total_amount and vendor.' } },
                { id: '3', type: 'condition', position: { x: 600, y: 200 }, data: { label: 'Amount < $1000', type: 'condition' } },
                { id: '4', type: 'http-request', position: { x: 900, y: 100 }, data: { label: 'Auto-Pay via Stripe', type: 'http-request' } },
                { id: '5', type: 'slack', position: { x: 900, y: 300 }, data: { label: 'Ask CFO', type: 'slack' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4', label: 'true', sourceHandle: 'true' },
                { id: 'e3-5', source: '3', target: '5', label: 'false', sourceHandle: 'false' }
            ];
        } else if (templateAction.includes('Generate')) {
            // Sales: Customer Insights (Complex)
            newNodes = [
                { id: '1', type: 'qdrant', position: { x: 100, y: 150 }, data: { label: 'Get reviews', type: 'qdrant', url: 'http://qdrant:6333/coll...' } },
                { id: '2', type: 'algorithm', position: { x: 400, y: 150 }, data: { label: 'Apply K-means Algorithm', type: 'algorithm' } },
                { id: '3', type: 'transform', position: { x: 400, y: 350 }, data: { label: 'Clusters To List', type: 'transform' } },
                { id: '4', type: 'ai-agent', position: { x: 700, y: 350 }, data: { label: 'Customer Insights Agent', type: 'ai-agent', model: 'gpt-4-turbo' } },
                { id: '5', type: 'openai-chat', position: { x: 700, y: 550 }, data: { label: 'OpenAI Chat Model', type: 'openai-chat' } },
                { id: '6', type: 'google-sheets', position: { x: 1000, y: 350 }, data: { label: 'Insights To GSheets', type: 'google-sheets', method: 'append: sheet' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
                { id: 'e3-4', source: '3', target: '4' },
                { id: 'e5-4', source: '5', target: '4', animated: true, style: { strokeDasharray: '5,5' } }, // Model connection
                { id: 'e4-6', source: '4', target: '6' }
            ];
        } else if (templateAction.includes('Contract')) {
            // Legal: Contract Review
            newNodes = [
                { id: '1', type: 'webhook', position: { x: 50, y: 250 }, data: { label: 'Upload Contract (PDF)' } },
                { id: '2', type: 'document-loader', position: { x: 300, y: 250 }, data: { label: 'PDF Text Extractor', type: 'document-loader', method: 'read: pdf' } },
                { id: '3', type: 'ai-agent', position: { x: 550, y: 250 }, data: { label: 'Risk Analyzer', type: 'ai-agent', system: 'Analyze for high-risk clauses: Indemnity, Termination, Liability.' } },
                { id: '4', type: 'openai-chat', position: { x: 550, y: 450 }, data: { label: 'GPT-4 Legal Core', type: 'openai-chat' } },
                { id: '5', type: 'google-docs', position: { x: 800, y: 250 }, data: { label: 'Generate Summary Doc', type: 'google-docs' } },
                { id: '6', type: 'email', position: { x: 1050, y: 250 }, data: { label: 'Email Legal Team', type: 'email' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e4-3', source: '4', target: '3', animated: true, style: { strokeDasharray: '5,5' }, label: 'Model' },
                { id: 'e3-5', source: '3', target: '5' },
                { id: 'e5-6', source: '5', target: '6' }
            ];
        } else if (templateAction.includes('SQL')) {
            // Data: Text-to-SQL
            newNodes = [
                { id: '1', type: 'slack', position: { x: 50, y: 200 }, data: { label: 'Ask Data Question', type: 'slack' } },
                { id: '2', type: 'ai-agent', position: { x: 300, y: 200 }, data: { label: 'SQL Generator', type: 'ai-agent', system: 'Convert natural language to PostgreSQL query. Schema provided.' } },
                { id: '3', type: 'postgres', position: { x: 550, y: 200 }, data: { label: 'Execute Query', type: 'postgres', method: 'query: raw' } },
                { id: '4', type: 'ai-agent', position: { x: 800, y: 200 }, data: { label: 'Data Interpreter', type: 'ai-agent', system: 'Explain the data results in plain English.' } },
                { id: '5', type: 'slack', position: { x: 1050, y: 200 }, data: { label: 'Reply with Report', type: 'slack' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4', label: 'Results' },
                { id: 'e4-5', source: '4', target: '5' }
            ];
        } else if (templateAction.includes('Paper')) {
            // Research: Paper Summarizer
            newNodes = [
                { id: '1', type: 'webhook', position: { x: 50, y: 250 }, data: { label: 'New arXiv Paper' } },
                { id: '2', type: 'http-request', position: { x: 300, y: 250 }, data: { label: 'Download PDF', type: 'http-request' } },
                { id: '3', type: 'document-loader', position: { x: 550, y: 250 }, data: { label: 'Parse Sections', type: 'document-loader' } },
                { id: '4', type: 'ai-agent', position: { x: 800, y: 150 }, data: { label: 'Abstract Summary', type: 'ai-agent' } },
                { id: '5', type: 'ai-agent', position: { x: 800, y: 350 }, data: { label: 'Key Findings', type: 'ai-agent' } },
                { id: '6', type: 'notion', position: { x: 1100, y: 250 }, data: { label: 'Save to Notion', type: 'notion' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4' },
                { id: 'e3-5', source: '3', target: '5' },
                { id: 'e4-6', source: '4', target: '6' },
                { id: 'e5-6', source: '5', target: '6' }
            ];
        } else if (templateAction.includes('Stock')) {
            // Inventory: Excel Stock Alert
            newNodes = [
                { id: '1', type: 'google-drive', position: { x: 50, y: 200 }, data: { label: 'Watch Excel File', type: 'google-drive' } },
                { id: '2', type: 'google-sheets', position: { x: 300, y: 200 }, data: { label: 'Read Inventory', type: 'google-sheets', method: 'read: all' } },
                { id: '3', type: 'algorithm', position: { x: 550, y: 200 }, data: { label: 'Filter: Stock < 10', type: 'algorithm' } },
                { id: '4', type: 'ai-agent', position: { x: 800, y: 200 }, data: { label: 'Draft Re-Order', type: 'ai-agent', system: 'Create purchase order email for supplier.' } },
                { id: '5', type: 'email', position: { x: 1050, y: 200 }, data: { label: 'Email Supplier', type: 'email' } }
            ];
            newEdges = [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4' },
                { id: 'e4-5', source: '4', target: '5' }
            ];
        } else {
            // Fallback
            newNodes = [
                { id: '1', type: 'default', position: { x: 100, y: 100 }, data: { label: 'AI Agent' } },
                { id: '2', type: 'debug', position: { x: 400, y: 100 }, data: { label: 'Debug Output' } }
            ];
            newEdges = [{ id: 'e1-2', source: '1', target: '2' }];
        }

        setNodes(newNodes);
        setEdges(newEdges);
        setCurrentWorkflowName(templateAction);
        toast.success(`Template loaded: ${templateAction}`);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
    }, [setNodes, setEdges, toast]);

    const handleSave = async () => {
        if (nodes.length === 0) {
            toast.warning('Workflow is empty. Add some nodes first!');
            return;
        }

        const name = prompt('Workflow Name:', currentWorkflowName) || currentWorkflowName;
        // Save nodes as is, relying on data.type for CustomNode
        const nodesToSave = nodes;

        setSaving(true);
        try {
            const res = await saveWorkflow(name, nodesToSave, edges);
            console.log('Saved:', res);
            toast.success(`Workflow "${name}" saved successfully!`);
            setCurrentWorkflowId(res.id);
            setCurrentWorkflowName(name);
            localStorage.setItem('currentWorkflowId', res.id);
        } catch (e: any) {
            console.error(e);
            toast.error(`Save failed: ${e.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleRun = useCallback(async () => {
        if (nodes.length === 0) {
            toast.warning('Workflow is empty. Add some nodes first!');
            return;
        }

        let workflowId = currentWorkflowId;

        // Auto-save if unsaved
        if (!workflowId) {
            setSaving(true);
            try {
                const name = currentWorkflowName || 'Untitled Workflow';
                const nodesToSave = nodes; // Save as is
                const res = await saveWorkflow(name, nodesToSave, edges);
                workflowId = res.id;
                setCurrentWorkflowId(res.id);
                localStorage.setItem('currentWorkflowId', res.id);
                toast.success(`Workflow auto-saved as "${name}"`);
            } catch (e: any) {
                console.error('Auto-save failed:', e);
                toast.error(`Auto-save failed: ${e.message || 'Unknown error'}`);
                setSaving(false);
                return;
            }
            setSaving(false);
        }

        setRunning(true);

        // VISUAL SIMULATION START
        // Reset all nodes to idle
        setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executionStatus: 'idle' } })));

        // Simple BFS Simulation to show "flowing" progress
        const simulateStep = async (nodeIds: string[]) => {
            if (nodeIds.length === 0) return;

            // Mark current batch as running
            setNodes(nds => nds.map(n => nodeIds.includes(n.id) ? { ...n, data: { ...n.data, executionStatus: 'running' } } : n));
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s

            // Mark completed
            setNodes(nds => nds.map(n => nodeIds.includes(n.id) ? { ...n, data: { ...n.data, executionStatus: 'completed' } } : n));

            // Find next nodes
            const nextNodeIds: string[] = [];
            edges.forEach(edge => {
                if (nodeIds.includes(edge.source)) {
                    nextNodeIds.push(edge.target);
                }
            });

            if (nextNodeIds.length > 0) {
                await simulateStep(nextNodeIds);
            }
        };

        // Start simulation in background (optimistic)
        const startNodes = nodes.filter(n => edges.every(e => e.target !== n.id)).map(n => n.id);
        if (startNodes.length > 0) simulateStep(startNodes);
        else if (nodes.length > 0) simulateStep([nodes[0].id]); // Fallback if cyclic or weird
        // VISUAL SIMULATION END

        try {
            const result = await executeWorkflow(
                workflowId as string,
                { nodes, edges }
            );
            console.log('Execution result:', result);
            toast.success('Workflow executed successfully');
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        } catch (error: any) {
            console.error('Run failed:', error);
            toast.error(error.message || 'Execution failed');
            // Mark all as failed if backend fails
            setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executionStatus: 'failed' } })));
        } finally {
            setRunning(false);
        }
    }, [nodes, edges, currentWorkflowId, currentWorkflowName, toast, setNodes]);

    const handleLoadWorkflow = async (workflowId: string) => {
        try {
            const workflow = await getWorkflow(workflowId);
            setNodes(workflow.nodes || []);
            setEdges(workflow.edges || []);
            setCurrentWorkflowId(workflow.id);
            setCurrentWorkflowName(workflow.name);
            localStorage.setItem('currentWorkflowId', workflow.id);
            setShowWorkflowList(false);
            toast.success(`Loaded: ${workflow.name}`);
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed to load workflow: ${e.message || 'Unknown error'}`);
        }
    };

    const handleNewWorkflow = () => {
        if (nodes.length > 0 && !confirm('Clear current workflow?')) return;
        setNodes([]);
        setEdges([]);
        setCurrentWorkflowId(null);
        setCurrentWorkflowName('Untitled Workflow');
        localStorage.removeItem('currentWorkflowId');
        toast.info('Started new workflow');
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-primary transition-colors">
            {/* Header - Glassmorphism */}
            <div className="app-header flex h-16 border-b px-6 items-center justify-between shadow-lg z-20 border-theme">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                        <span className="text-2xl">🌊</span> FlowWave
                    </div>
                    <div className={`h-6 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                    <span className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-all ${isDark
                        ? 'text-white/70 bg-white/5 border-white/10'
                        : 'text-slate-900 bg-white border-slate-200 shadow-sm'
                        }`}>
                        {currentWorkflowName}
                    </span>
                    <button
                        onClick={handleNewWorkflow}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium flex items-center gap-1 ${isDark
                            ? 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50'
                            : 'text-indigo-600 hover:bg-indigo-50 bg-white border-indigo-200 shadow-sm'
                            }`}
                    >
                        + New
                    </button>
                    <div className={`h-6 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                    <SyncToggle mode={mode} setMode={switchMode} />
                    <ConnectionStatus connected={backendConnected} label={backendConnected ? 'API Connected' : 'API Offline'} />
                </div>

                <div className="flex items-center gap-4">
                    <Toolbar
                        onSave={handleSave}
                        onRun={handleRun}
                        onOpen={() => setShowWorkflowList(true)}
                        onHistory={() => setShowExecutionHistory(true)}
                        saving={saving}
                        running={running}
                    />
                    <div className="h-6 w-px bg-theme border-theme"></div>
                    <SyncStatus status={syncStatus} />
                    <div className="h-6 w-px bg-theme border-theme"></div>
                    <ThemeToggle />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar />

                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        fitView
                        attributionPosition="bottom-right"
                        deleteKeyCode={null}
                    >
                        <Controls className='!bg-surface !border-theme !shadow-lg !rounded-xl [&_button]:!text-primary [&_button:hover]:!bg-surface-hover' />
                        <MiniMap
                            className='!bg-surface !border-theme !shadow-lg !rounded-xl'
                            nodeColor={isDark ? '#6366f1' : '#8b5cf6'}
                            maskColor={isDark ? 'rgba(19, 19, 32, 0.7)' : 'rgba(240, 244, 248, 0.6)'}
                        />
                        <Background
                            color={isDark ? '#312e81' : '#cbd5e1'}
                            gap={20}
                            size={1}
                        />
                        {nodes.length === 0 && (
                            <CanvasEmptyState
                                onOpenTemplates={() => setShowWorkflowList(true)}
                                onUseTemplate={handleUseTemplate}
                            />
                        )}
                    </ReactFlow>
                </div>

                <NodeInspector selectedNode={selectedNode} setNodes={setNodes} onDelete={handleDeleteNode} />
            </div>

            {/* Visual Effects */}
            {showConfetti && <Confetti />}

            {/* Modals */}
            {showWorkflowList && (
                <WorkflowList
                    onLoad={handleLoadWorkflow}
                    onClose={() => setShowWorkflowList(false)}
                />
            )}
            {showExecutionHistory && (
                <ExecutionHistory
                    onClose={() => setShowExecutionHistory(false)}
                />
            )}
        </div>
    );
};

export default () => (
    <ThemeProvider>
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    </ThemeProvider>
);
