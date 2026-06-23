export const API_URL = '/api';

export const api = {
    async getContas() {
        const response = await fetch(`${API_URL}/contas`);
        if (!response.ok) throw new Error('Failed to fetch contas');
        return await response.json();
    },

    async addConta(conta: any) {
        const response = await fetch(`${API_URL}/contas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conta)
        });
        if (!response.ok) throw new Error('Failed to add conta');
        return await response.json();
    },

    async updateConta(id: string, conta: any) {
        const response = await fetch(`${API_URL}/contas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conta)
        });
        if (!response.ok) throw new Error('Failed to update conta');
        return await response.json();
    },

    async deleteConta(id: string) {
        const response = await fetch(`${API_URL}/contas/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete conta');
        return await response.json();
    },

    async migrateContas(contas: any[]) {
        const response = await fetch(`${API_URL}/contas/migrate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contas })
        });
        if (!response.ok) throw new Error('Failed to migrate contas');
        return await response.json();
    }
};
