export type NodeType =
    | 'trigger'
    | 'action'
    | 'condition'
    | 'transform'
    | 'delay'
    | 'webhook'
    | 'schedule';

export interface Position {
    x: number;
    y: number;
}

export interface NodeData {
    [key: string]: any;
}

export interface WorkflowNode {
    id: string;
    type: string; // Changed to string to allow custom types
    name: string;
    position: Position;
    data: NodeData;
    width?: number;
    height?: number;
    selected?: boolean;
    dragging?: boolean;
}

export interface NodeConnection {
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    connections: NodeConnection[];
    version: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}

export interface ExecutionLog {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    nodeId?: string;
    data?: any;
}

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    input?: any;
    output?: any;
    logs: ExecutionLog[];
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
}
