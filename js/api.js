// API Client para comunicación con el backend
// CAMBIAR ESTA URL POR LA DE TU BACKEND EN VERCEL CUANDO LO TENGAS
// Ejemplo: const API_BASE_URL = 'https://tu-backend.vercel.app/api';
const API_BASE_URL = 'https://asistencia-backend-delta.vercel.app/api';
const API = {
    /**
     * Helper para hacer requests
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    // ========== ATTENDANCE ==========
    attendance: {
        async import(data, year, month) {
            return API.request('/attendance/import', {
                method: 'POST',
                body: JSON.stringify({ data, year, month })
            });
        },

        async getByMonth(year, month) {
            return API.request(`/attendance/${year}/${month}`);
        },

        async getByYear(year) {
            return API.request(`/attendance/${year}`);
        },

        async getPersonnelAttendance(id, year, month) {
            return API.request(`/attendance/personnel/${id}/${year}/${month}`);
        },

        async deleteMonth(year, month) {
            return API.request(`/attendance/${year}/${month}`, {
                method: 'DELETE'
            });
        },

        async getImportedMonths() {
            return API.request('/attendance/summary/months');
        }
    },

    // ========== PERSONNEL ==========
    personnel: {
        async getAll() {
            return API.request('/personnel');
        },

        async getById(id) {
            return API.request(`/personnel/${id}`);
        },

        async create(id, name, startDate, endDate) {
            return API.request('/personnel', {
                method: 'POST',
                body: JSON.stringify({ id, name, start_date: startDate, end_date: endDate })
            });
        },

        async update(id, name, startDate, endDate) {
            return API.request(`/personnel/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name, start_date: startDate, end_date: endDate })
            });
        },

        async delete(id) {
            return API.request(`/personnel/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ========== JUSTIFICATIONS ==========
    justifications: {
        async getAll() {
            return API.request('/justifications');
        },

        async create(justification) {
            return API.request('/justifications', {
                method: 'POST',
                body: JSON.stringify(justification)
            });
        },

        async update(id, justification) {
            return API.request(`/justifications/${id}`, {
                method: 'PUT',
                body: JSON.stringify(justification)
            });
        },

        async delete(id) {
            return API.request(`/justifications/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ========== HOLIDAYS ==========
    holidays: {
        async getAll() {
            return API.request('/holidays/holidays');
        },

        async create(date, name) {
            return API.request('/holidays/holidays', {
                method: 'POST',
                body: JSON.stringify({ date, name })
            });
        },

        async delete(id) {
            return API.request(`/holidays/holidays/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ========== SETTINGS ==========
    settings: {
        async get() {
            return API.request('/settings');
        },

        async update(settings) {
            return API.request('/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
        },

        async getWorkingDays(year, month) {
            return API.request(`/settings/working-days/${year}/${month}`);
        },

        async updateWorkingDays(year, month, workingDates) {
            return API.request(`/settings/working-days/${year}/${month}`, {
                method: 'PUT',
                body: JSON.stringify({ working_dates: workingDates })
            });
        }
    },

    // ========== HEALTH CHECK ==========
    async healthCheck() {
        return API.request('/health');
    }
};
