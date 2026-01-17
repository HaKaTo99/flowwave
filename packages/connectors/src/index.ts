// Core nodes
export * from './http';
export * from './delay';
export * from './condition';
export * from './debug';
export * from './webhook';

// AI Nodes
export * from './ai/openai';
export * from './ai/anthropic';
export * from './ai/memory';
export * from './ai/agent';
export * from './ai/text-to-workflow';

// RAG / Vector Nodes
export * from './vector/rag';

// Trigger Nodes
export * from './triggers/schedule';
export * from './ai/groq';
export * from './ai/memory';

// Utility Nodes
export * from './utils/loop-items';
export * from './utils/logic';
export * from './utils/algorithm';
export * from './utils/transform';
export * from './utils/parser';

// Communication Nodes
export * from './communication/messaging';

// Database Nodes
export * from './database/sql';
export * from './database/memory';

// Productivity Nodes
export * from './productivity/apps';
export * from './productivity/jira';
export * from './productivity/entra';
export * from './productivity/proxmox';

// Vector
export * from './vector/qdrant';

// Social Media Nodes
export * from './social/media';

// Node Registry - All available nodes
export const nodeRegistry = {
    // Core
    'http-request': 'HTTPRequestNodeExecutor',
    'delay': 'DelayNodeExecutor',
    'condition': 'ConditionNodeExecutor',
    'debug': 'DebugNodeExecutor',
    'webhook': 'WebhookNodeExecutor',

    // AI & Agents
    'ai-agent': 'AIAgentNodeExecutor',
    'openai-chat': 'OpenAINodeExecutor',
    'anthropic-chat': 'AnthropicNodeExecutor',
    'gemini-chat': 'GeminiNodeExecutor',
    'buffer-memory': 'BufferMemoryNodeExecutor',
    'simple-memory': 'SimpleMemoryNodeExecutor',
    'text-to-workflow': 'TextToWorkflowNodeExecutor',

    // RAG / Vector
    'embeddings': 'EmbeddingsNodeExecutor',
    'text-splitter': 'TextSplitterNodeExecutor',
    'pinecone': 'PineconeNodeExecutor',
    'qdrant': 'QdrantNodeExecutor',
    'rag-query': 'RAGQueryNodeExecutor',

    // Triggers
    'schedule': 'ScheduleNodeExecutor',
    'cron-trigger': 'CronTriggerNodeExecutor',
    'interval-trigger': 'IntervalTriggerNodeExecutor',

    // Utilities
    'loop-items': 'LoopOverItemsNodeExecutor',
    'switch': 'SwitchNodeExecutor',
    'algorithm': 'AlgorithmNodeExecutor',
    'transform': 'TransformNodeExecutor',
    'output-parser': 'OutputParserNodeExecutor',
    'code': 'CodeNodeExecutor',
    'edit-fields': 'EditFieldsNodeExecutor',
    'structured-output': 'StructuredOutputNodeExecutor',

    // Communication
    'email': 'EmailNodeExecutor',
    'telegram': 'TelegramNodeExecutor',
    'discord': 'DiscordNodeExecutor',
    'slack': 'SlackNodeExecutor',
    'whatsapp': 'WhatsAppNodeExecutor',

    // Database
    'postgres': 'PostgresNodeExecutor',
    'postgres-memory': 'PostgresMemoryNodeExecutor',
    'mysql': 'MySQLNodeExecutor',
    'mongodb': 'MongoDBNodeExecutor',
    'supabase': 'SupabaseNodeExecutor',

    // Productivity
    'notion': 'NotionNodeExecutor',
    'google-sheets': 'GoogleSheetsNodeExecutor',
    'airtable': 'AirtableNodeExecutor',
    'google-docs': 'GoogleDocsNodeExecutor',
    'github': 'GitHubNodeExecutor',
    'jira': 'JiraNodeExecutor',
    'entra-id': 'EntraIDNodeExecutor',
    'proxmox': 'ProxmoxNodeExecutor',

    // Social
    'twitter': 'TwitterNodeExecutor',
    'linkedin': 'LinkedInNodeExecutor',
    'tiktok': 'TikTokNodeExecutor'
};

// Node categories for UI
export const nodeCategories = [
    {
        id: 'triggers',
        name: '⚡ Triggers',
        nodes: ['schedule', 'cron-trigger', 'interval-trigger', 'webhook']
    },
    {
        id: 'ai',
        name: '🤖 AI & Agents',
        nodes: ['ai-agent', 'openai-chat', 'anthropic-chat', 'gemini-chat', 'text-to-workflow']
    },
    {
        id: 'memory',
        name: '🧠 Memory',
        nodes: ['buffer-memory', 'simple-memory']
    },
    {
        id: 'rag',
        name: '📚 RAG & Vector',
        nodes: ['embeddings', 'text-splitter', 'pinecone', 'rag-query']
    },
    {
        id: 'core',
        name: '🔧 Core',
        nodes: ['http-request', 'delay', 'condition', 'debug']
    },
    {
        id: 'utilities',
        name: '⚙️ Utilities',
        nodes: ['loop-items', 'code', 'edit-fields', 'structured-output']
    },
    {
        id: 'communication',
        name: '💬 Communication',
        nodes: ['email', 'telegram', 'discord', 'slack', 'whatsapp']
    },
    {
        id: 'database',
        name: '🗄️ Database',
        nodes: ['postgres', 'mysql', 'mongodb', 'supabase']
    },
    {
        id: 'productivity',
        name: '📱 Apps',
        nodes: ['notion', 'google-sheets', 'google-docs', 'airtable', 'github']
    },
    {
        id: 'social',
        name: '📢 Social Media',
        nodes: ['twitter', 'linkedin', 'tiktok']
    }
];

// Total node count
export const totalNodeCount = Object.keys(nodeRegistry).length;
