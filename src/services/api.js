const API_BASE_URL = 'http://localhost:5000/api';

// Helper for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// Players API
export const playersApi = {
    getAll: () => apiCall('/players'),

    add: (name) => apiCall('/players', {
        method: 'POST',
        body: { name },
    }),

    update: (id, updates) => apiCall(`/players/${id}`, {
        method: 'PUT',
        body: updates,
    }),

    delete: (id) => apiCall(`/players/${id}`, {
        method: 'DELETE',
    }),

    resetStats: () => apiCall('/players/reset-stats', {
        method: 'POST',
    }),
};

// Teams API
export const teamsApi = {
    get: () => apiCall('/teams'),

    update: (teams) => apiCall('/teams', {
        method: 'PUT',
        body: teams,
    }),
};

// Match API
export const matchApi = {
    get: () => apiCall('/match'),

    update: (matchState) => apiCall('/match', {
        method: 'PUT',
        body: matchState,
    }),

    archive: (data) => apiCall('/match/archive', {
        method: 'POST',
        body: data,
    }),

    reset: () => apiCall('/match/reset', {
        method: 'POST',
    }),
};

// History API
export const historyApi = {
    getAll: () => apiCall('/history'),
};

// Full reset
export const resetAll = () => apiCall('/reset-all', {
    method: 'POST',
});

// Health check
export const healthCheck = () => apiCall('/health');
