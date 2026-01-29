// Excel file handling using SheetJS

const ExcelHandler = {
    /**
     * Import Excel file and parse attendance data
     */
    async importFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // Parse and validate data
                    const parsedData = this.parseAttendanceData(jsonData);

                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };

            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Parse attendance data from Excel
     */
    parseAttendanceData(jsonData) {
        const records = [];

        jsonData.forEach((row, index) => {
            try {
                // Map column names (flexible to handle different formats)
                const numero = row['Número'] || row['Numero'] || row['ID'];
                const nombre = row['Nombre'] || row['nombre'];
                const tiempo = row['Tiempo'] || row['tiempo'];
                const estado = row['Estado'] || row['estado'];
                const dispositivo = row['Dispositivos'] || row['dispositivos'];
                const tipoRegistro = row['Tipo de Registro'] || row['Tipo de registro'];

                // Debug log for first row
                if (index === 0) {
                    console.log('Parsing first row:', { numero, nombre, tiempo, estado });
                }

                if (numero && nombre) {
                    records.push({
                        id: String(numero),
                        name: String(nombre).trim(),
                        dateTime: tiempo || null, // Allow null time
                        status: String(estado || '').trim(),
                        device: dispositivo || 'Facultad de Ingenieria',
                        type: tipoRegistro || 0
                    });
                }
            } catch (error) {
                console.warn(`Error parsing row ${index}:`, error);
            }
        });

        return records;
    },

    /**
     * Export processed data to Excel
     */
    exportToExcel(data, filename = 'asistencias.xlsx') {
        try {
            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(data);

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

            // Generate Excel file
            XLSX.writeFile(workbook, filename);

            return true;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            return false;
        }
    },

    /**
     * Export monthly summary to Excel
     */
    exportMonthlySummary(summaryData, month, year) {
        const filename = `asistencias_${year}_${String(month + 1).padStart(2, '0')}.xlsx`;

        const exportData = summaryData.map(person => ({
            'ID': person.id,
            'Nombre': person.name,
            'Horas Totales (MTD)': person.totalHours.toFixed(1),
            'Horas Acumuladas (YTD)': person.accumulatedHours.toFixed(1),
            'Días Ausentes': person.daysAbsent,
            'Promedio Horas/Día': person.averageHours.toFixed(1),
            'Estado': person.status
        }));

        return this.exportToExcel(exportData, filename);
    },

    /**
     * Export detailed attendance report
     */
    exportDetailedReport(personnelData, month, year) {
        const filename = `reporte_detallado_${year}_${String(month + 1).padStart(2, '0')}.xlsx`;

        const exportData = [];

        Object.values(personnelData).forEach(person => {
            person.dailyRecords.forEach(record => {
                exportData.push({
                    'ID': person.id,
                    'Nombre': person.name,
                    'Fecha': record.date,
                    'Entrada': record.entry || 'N/A',
                    'Salida': record.exit || 'N/A',
                    'Horas Trabajadas': record.hours ? record.hours.toFixed(1) : '0.0',
                    'Estado': record.status
                });
            });
        });

        return this.exportToExcel(exportData, filename);
    },

    /**
     * Export ranking to Excel
     */
    exportRanking(rankingData, month, year) {
        const filename = `ranking_${year}_${String(month + 1).padStart(2, '0')}.xlsx`;

        const exportData = rankingData.map((person, index) => ({
            'Posición': index + 1,
            'ID': person.id,
            'Nombre': person.name,
            'Horas Totales': person.totalHours.toFixed(1),
            'Días Trabajados': person.daysWorked,
            'Promedio Horas/Día': person.averageHours.toFixed(1)
        }));

        return this.exportToExcel(exportData, filename);
    },

    /**
     * Export justifications to Excel
     */
    exportJustifications(justifications) {
        const filename = `justificaciones_${new Date().toISOString().split('T')[0]}.xlsx`;

        const exportData = justifications.map(j => ({
            'ID Personal': j.personnelId,
            'Nombre': j.personnelName,
            'Fecha': j.date,
            'Tipo': j.type,
            'Descripción': j.description,
            'Fecha Creación': new Date(j.createdAt).toLocaleDateString('es-ES')
        }));

        return this.exportToExcel(exportData, filename);
    }
};
