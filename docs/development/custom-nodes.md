# Creating Custom Nodes

This guide explains how to create custom nodes for FlowWave.

## Node Architecture

Each node consists of two parts:
1. **Executor** (Backend) - Handles the actual logic
2. **Component** (Frontend) - Visual representation

## Creating a Node Executor

### 1. Create the Executor Class

```typescript
// packages/connectors/src/my-node.ts
import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

export class MyNodeExecutor extends BaseNodeExecutor {
    // Node type identifier (must be unique)
    type = 'my-node';

    async execute(
        node: WorkflowNode, 
        context: ExecutionContext
    ): Promise<Record<string, any>> {
        // Get configuration from node data
        const { param1, param2 } = node.data;
        
        // Access data from previous nodes
        const previousResult = context.data.previousOutput;
        
        // Add execution log
        this.addLog(context, 'info', 'Processing...', node.id);
        
        // Perform your logic
        const result = await this.doSomething(param1, param2);
        
        // Return output (will be available to next nodes)
        return {
            success: true,
            data: result
        };
    }
    
    private async doSomething(param1: string, param2: number) {
        // Your custom logic here
        return { processed: true };
    }
}
```

### 2. Register the Executor

```typescript
// packages/connectors/src/index.ts
export * from './my-node';
```

### 3. Register in Engine

```typescript
// apps/server/src/engine.ts
import { MyNodeExecutor } from '@waveforai/connectors';

executor.registerExecutor(new MyNodeExecutor());
```

## Creating the Frontend Component

### 1. Add Node Type to Sidebar

```typescript
// apps/web/src/components/Sidebar.tsx
const nodeTypes = [
    // ... existing nodes
    { 
        type: 'my-node', 
        label: 'My Node', 
        icon: '🔧' 
    }
];
```

### 2. Create Custom Node Card (Optional)

```tsx
// apps/web/src/components/nodes/MyNode.tsx
import { Handle, Position } from 'reactflow';

export const MyNode = ({ data }: { data: any }) => {
    return (
        <div className="node-card">
            <Handle type="target" position={Position.Top} />
            <div className="node-header">
                <span>🔧</span>
                <span>My Node</span>
            </div>
            <div className="node-body">
                {data.param1 || 'Configure me'}
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};
```

### 3. Add Properties Panel

```tsx
// apps/web/src/components/NodeInspector.tsx
// Add case for your node type
case 'my-node':
    return (
        <div>
            <label>Parameter 1</label>
            <input 
                value={data.param1 || ''} 
                onChange={(e) => updateNode('param1', e.target.value)} 
            />
            <label>Parameter 2</label>
            <input 
                type="number"
                value={data.param2 || 0} 
                onChange={(e) => updateNode('param2', parseInt(e.target.value))} 
            />
        </div>
    );
```

## Best Practices

### Error Handling

```typescript
async execute(node: WorkflowNode, context: ExecutionContext) {
    try {
        // Your logic
    } catch (error) {
        this.addLog(context, 'error', `Failed: ${error.message}`, node.id);
        throw error; // Re-throw to mark execution as failed
    }
}
```

### Accessing Previous Node Output

```typescript
// Get result from a specific node
const prevResult = context.nodeResults.get('previous-node-id');

// Get from context data (accumulated)
const allData = context.data;
```

### Async Operations

```typescript
async execute(node: WorkflowNode, context: ExecutionContext) {
    // Long-running operations are fine
    const result = await this.fetchExternalAPI();
    
    // Update log with progress
    this.addLog(context, 'info', 'Fetched data successfully', node.id);
    
    return result;
}
```

## Testing Your Node

```typescript
// tests/my-node.test.ts
import { describe, it, expect } from 'vitest';
import { MyNodeExecutor } from '../packages/connectors/src/my-node';

describe('MyNodeExecutor', () => {
    it('should execute correctly', async () => {
        const executor = new MyNodeExecutor();
        const context = {
            workflowId: 'test',
            executionId: 'test',
            data: {},
            logs: [],
            nodeResults: new Map()
        };
        
        const result = await executor.execute(
            { id: 'test', type: 'my-node', data: { param1: 'value' } },
            context
        );
        
        expect(result.success).toBe(true);
    });
});
```
