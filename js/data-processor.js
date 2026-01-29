// Data processor for attendance records

const DataProcessor = {
    /**
     * Process raw attendance records
     */
    processAttendanceData(rawRecords) {
        if (!rawRecords || rawRecords.length === 0) {
            return null;
        }

        // Group records by personnel and date
        const groupedByPerson = this.groupByPersonnel(rawRecords);

        // Process each person's records
        const processedData = {};

        Object.keys(groupedByPerson).forEach(personnelId => {
            const personRecords = groupedByPerson[personnelId];
            processedData[personnelId] = this.processPersonnelRecords(personnelId, personRecords);
        });

        return processedData;
    },

    /**
     * Group records by personnel
     */
    groupByPersonnel(records) {
        const grouped = {};

        records.forEach(record => {
            if (!grouped[record.id]) {
                grouped[record.id] = [];
            }
            grouped[record.id].push(record);
        });

        return grouped;
    },

    /**
     * Process individual personnel records
     */
    processPersonnelRecords(personnelId, records) {
        // Get personnel name from first record
        const name = records[0].name;

        // Group by date
        const dailyRecords = this.groupByDate(records);

        // Process each day
        const processedDays = [];

        Object.keys(dailyRecords).sort().forEach(date => {
            const dayRecords = dailyRecords[date];
            const processed = this.processDayRecords(date, dayRecords);
            processedDays.push(processed);
        });

        // Calculate statistics
        const stats = this.calculateStatistics(processedDays);

        return {
            id: personnelId,
            name: name,
            dailyRecords: processedDays,
            ...stats
        };
    },

    /**
     * Group records by date
     */
    groupByDate(records) {
        const grouped = {};

        records.forEach(record => {
            const dateTime = Utils.parseExcelDateTime(record.dateTime);
            const date = Utils.formatDate(dateTime);

            if (!grouped[date]) {
                grouped[date] = [];
            }

            grouped[date].push({
                ...record,
                parsedDateTime: dateTime
            });
        });

        return grouped;
    },

    /**
     * Process records for a single day
     */
    processDayRecords(date, records) {
        // Separate entries and exits
        const entries = records.filter(r =>
            r.status.toLowerCase().includes('entrada') ||
            r.status.toLowerCase().includes('entry')
        );

        const exits = records.filter(r =>
            r.status.toLowerCase().includes('salida') ||
            r.status.toLowerCase().includes('exit')
        );

        // Get earliest entry
        let earliestEntry = null;
        if (entries.length > 0) {
            entries.sort((a, b) => a.parsedDateTime - b.parsedDateTime);
            earliestEntry = entries[0].parsedDateTime;
        }

        // Get latest exit
        let latestExit = null;
        if (exits.length > 0) {
            exits.sort((a, b) => b.parsedDateTime - a.parsedDateTime);
            latestExit = exits[0].parsedDateTime;
        }

        // Calculate status BEFORE applying defaults for visual feedback
        let status = 'complete';
        if (entries.length === 0 && exits.length === 0) {
            status = 'incomplete';
        } else if (entries.length === 0) {
            status = 'missing-entry';
        } else if (exits.length === 0) {
            status = 'missing-exit';
        }

        // Apply defaults if missing (12:00 PM = 12:00:00 military time)
        const baseDateString = date; // date is in YYYY-MM-DD format
        const [yearParts, monthParts, dayParts] = baseDateString.split('-').map(Number);
        const defaultTime = new Date(yearParts, monthParts - 1, dayParts, 12, 0, 0);

        if (!earliestEntry) {
            earliestEntry = defaultTime;
        }

        if (!latestExit) {
            latestExit = defaultTime;
        }

        // Calculate hours
        let hours = Utils.calculateHours(earliestEntry, latestExit);

        return {
            date: date,
            entry: Utils.formatTime(earliestEntry),
            exit: Utils.formatTime(latestExit),
            hours: hours,
            status: status,
            entryCount: entries.length,
            exitCount: exits.length
        };
    },

    /**
     * Calculate statistics for personnel
     */
    calculateStatistics(dailyRecords) {
        let totalHours = 0;
        let daysWorked = 0;
        let daysWithCompleteRecords = 0;
        let daysWithIncompleteRecords = 0;

        dailyRecords.forEach(day => {
            if (day.hours > 0) {
                totalHours += day.hours;
                daysWorked++;
            }

            if (day.status === 'complete') {
                daysWithCompleteRecords++;
            } else if (day.status !== 'incomplete') {
                daysWithIncompleteRecords++;
            }
        });

        const averageHours = daysWorked > 0 ? totalHours / daysWorked : 0;

        return {
            totalHours: totalHours,
            daysWorked: daysWorked,
            averageHours: averageHours,
            daysWithCompleteRecords: daysWithCompleteRecords,
            daysWithIncompleteRecords: daysWithIncompleteRecords
        };
    },

    async calculateMonthlySummary(processedData, year, month) {
        const summary = [];
        const workingDays = await this.getWorkingDaysForMonth(year, month);

        // Inject missing days as 12:00 rule for all personnel
        for (const person of Object.values(processedData)) {
            this.injectMissingWorkingDays(person, workingDays);

            // Use all records provided (the API already filters by month/year)
            const monthRecords = person.dailyRecords || [];

            // Calculate stats for the month
            const stats = this.calculateStatistics(monthRecords);

            // Calculate days absent (days with virtual 12:00 records)
            const daysAbsent = monthRecords.filter(r => r.status === 'absent').length;

            // Determine status
            let status = 'on-track';

            // If they have no records at all in the month (after injection), they are critical
            if (monthRecords.length === 0 || stats.daysWorked === 0) {
                status = 'critical';
            } else if (daysAbsent > 5) {
                status = 'critical';
            } else if (daysAbsent > 2) {
                status = 'warning';
            }

            summary.push({
                id: person.id,
                name: person.name,
                totalHours: stats.totalHours,
                accumulatedHours: stats.totalHours,
                daysWorked: stats.daysWorked,
                daysAbsent: daysAbsent,
                averageHours: stats.averageHours,
                status: status,
                incompleteRecords: stats.daysWithIncompleteRecords
            });
        }

        // Sort by total hours descending
        summary.sort((a, b) => b.totalHours - a.totalHours);

        return {
            summary: summary,
            workingDaysCount: workingDays.length
        };
    },

    injectMissingWorkingDays(person, workingDays) {
        const workedDates = new Set(person.dailyRecords.map(r => r.date));

        workingDays.forEach(dayDate => {
            if (!workedDates.has(dayDate)) {
                // User requirement: Default to 12:00:00 PM (12:00:00) for both entry and exit
                person.dailyRecords.push({
                    date: dayDate,
                    entry: '12:00:00',
                    exit: '12:00:00',
                    totalHours: 0,
                    hours: 0,
                    status: 'absent', // Key status for visual feedback
                    entryCount: 0,
                    exitCount: 0
                });
            }
        });

        // Re-sort daily records by date
        person.dailyRecords.sort((a, b) => a.date.localeCompare(b.date));
    },

    async getWorkingDaysForMonth(year, month) {
        // If month is null or undefined, calculate for the whole year
        if (month === null || month === undefined) {
            let yearlyWorkingDays = [];
            for (let m = 0; m < 12; m++) {
                const monthDays = await this.getWorkingDaysForMonth(year, m);
                yearlyWorkingDays = yearlyWorkingDays.concat(monthDays);
            }
            return yearlyWorkingDays;
        }

        // Check if custom working days are configured
        const customWorkingDays = await Storage.getWorkingDays(year, month);
        if (customWorkingDays) {
            return customWorkingDays;
        }

        // Use default: Monday-Friday excluding holidays
        const holidaysData = await Storage.getHolidays();
        const holidays = holidaysData.map(h => h.date);
        return Utils.getWorkingDays(year, month, holidays);
    },

    async getMissingDays(personnelId, processedData, year, month) {
        const person = processedData[personnelId];
        if (!person) return [];

        const workingDays = await this.getWorkingDaysForMonth(year, month);
        const workedDates = new Set(
            person.dailyRecords
                .filter(day => {
                    const date = new Date(day.date);
                    return date.getFullYear() === year && date.getMonth() === month;
                })
                .map(r => r.date)
        );

        return workingDays.filter(day => !workedDates.has(day));
    },

    /**
     * Get incomplete records for personnel
     */
    getIncompleteRecords(personnelId, processedData, year, month) {
        const person = processedData[personnelId];
        if (!person) return [];

        return person.dailyRecords.filter(day => {
            const date = new Date(day.date);
            return date.getFullYear() === year &&
                date.getMonth() === month &&
                day.status !== 'complete';
        });
    },

    /**
     * Calculate ranking for a month
     */
    async calculateRanking(processedData, year, month) {
        const result = await this.calculateMonthlySummary(processedData, year, month);

        // Already sorted by total hours in calculateMonthlySummary
        return result.summary.map((person, index) => ({
            position: index + 1,
            ...person
        }));
    }
};
