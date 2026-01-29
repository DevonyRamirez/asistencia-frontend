// Storage layer - Ahora usa la API en lugar de LocalStorage

const Storage = {
    /**
     * Guardar datos de asistencia (ahora usa API)
     */
    async saveAttendanceData(data) {
        console.log('Datos guardados en la base de datos vía API');
        return true;
    },

    /**
     * Obtener datos de asistencia
     */
    async getAttendanceData() {
        return {};
    },

    /**
     * Obtener datos de un mes específico
     */
    async getMonthData(year, month) {
        try {
            return await API.attendance.getByMonth(year, month);
        } catch (error) {
            console.error('Error al obtener datos del mes:', error);
            return null;
        }
    },

    /**
     * Guardar justificaciones
     */
    async saveJustifications(justifications) {
        return true;
    },

    /**
     * Obtener justificaciones
     */
    async getJustifications() {
        try {
            return await API.justifications.getAll();
        } catch (error) {
            console.error('Error al obtener justificaciones:', error);
            return [];
        }
    },

    /**
     * Guardar feriados
     */
    async saveHolidays(holidays) {
        return true;
    },

    /**
     * Obtener feriados
     */
    async getHolidays() {
        try {
            return await API.holidays.getAll();
        } catch (error) {
            console.error('Error al obtener feriados:', error);
            return [];
        }
    },

    /**
     * Guardar días laborables
     */
    async saveWorkingDays(year, month, workingDates) {
        try {
            await API.settings.updateWorkingDays(year, month, workingDates);
            return true;
        } catch (error) {
            console.error('Error al guardar días laborables:', error);
            return false;
        }
    },

    /**
     * Obtener días laborables
     */
    async getWorkingDays(year, month) {
        try {
            const result = await API.settings.getWorkingDays(year, month);
            return result?.working_dates || null;
        } catch (error) {
            console.error('Error al obtener días laborables:', error);
            return null;
        }
    },

    /**
     * Guardar configuración
     */
    async saveSettings(settings) {
        try {
            await API.settings.update(settings);
            return true;
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            return false;
        }
    },

    /**
     * Obtener configuración
     */
    async getSettings() {
        try {
            return await API.settings.get();
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            return {};
        }
    },

    /**
     * Limpiar todos los datos
     */
    async clearAll() {
        if (confirm('¿Estás seguro de que deseas eliminar TODOS los datos de la base de datos?')) {
            console.warn('Función de limpiar datos no implementada en la API');
            return false;
        }
        return false;
    }
};
