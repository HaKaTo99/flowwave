const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_KEY = 'flowwave-secret-key'; // Matches backend default

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
});

const handleResponse = async (response: Response) => {
    const text = await response.text();
    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const json = JSON.parse(text);
            errorMessage = json.error || json.message || errorMessage;
        } catch {
            errorMessage = text.slice(0, 100) || `HTTP Error ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    try {
        return text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('JSON Parse Error:', text);
        throw new Error('Invalid JSON response from server');
    }
};

export const saveWorkflow = async (name: string, nodes: any[], edges: any[]) => {
    const response = await fetch(`${API_URL}/workflows`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, nodes, edges })
    });
    return handleResponse(response);
};

export const getWorkflow = async (id: string) => {
    const response = await fetch(`${API_URL}/workflows/${id}`, { headers: getHeaders() });
    return handleResponse(response);
};

export const getWorkflows = async () => {
    const response = await fetch(`${API_URL}/workflows`, { headers: getHeaders() });
    return handleResponse(response);
};

export const deleteWorkflow = async (id: string) => {
    const response = await fetch(`${API_URL}/workflows/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const executeWorkflow = async (id: string, data: any = {}) => {
    const response = await fetch(`${API_URL}/workflows/${id}/execute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

export const getExecutions = async () => {
    const response = await fetch(`${API_URL}/executions`, { headers: getHeaders() });
    return handleResponse(response);
};

export const clearExecutions = async () => {
    const response = await fetch(`${API_URL}/executions`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getUsage = async (userId: string) => {
    const response = await fetch(`${API_URL}/usage/${userId}`, { headers: getHeaders() });
    return handleResponse(response);
};
