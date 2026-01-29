// Settings view

const Settings = {
    /**
     * Render settings view
     */
    async render() {
        const container = document.getElementById('app-container');
        const t = Translations.settings;

        Utils.showLoading();
        const settings = await Storage.getSettings();
        const holidays = await Storage.getHolidays();
        Utils.hideLoading();

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${t.title}</h1>
                <p class="page-subtitle">${t.subtitle}</p>
            </div>

            <div style="display: grid; gap: var(--space-xl);">
                <!-- Working Days Configuration -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">${t.workingDaysConfig}</h2>
                        <p class="card-subtitle">${t.workingDaysConfigDesc}</p>
                    </div>

                    <div class="alert alert-info">
                        <div class="alert-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">${t.defaultConfig}</div>
                            <div class="alert-message">${t.defaultConfigDesc}</div>
                        </div>
                    </div>

                    <div style="margin-top: var(--space-lg);">
                        <button class="btn btn-primary" onclick="Settings.showCalendarModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${t.configureMonthlyCalendar}
                        </button>
                    </div>
                </div>

                <!-- Holidays -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="card-title">${t.holidays}</h2>
                                <p class="card-subtitle">${t.holidaysDesc}</p>
                            </div>
                            <button class="btn btn-primary" onclick="Settings.showAddHolidayModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                ${t.addHoliday}
                            </button>
                        </div>
                    </div>

                    <div id="holidays-list">
                        ${this.renderHolidaysList(holidays)}
                    </div>
                </div>


                <!-- Data Management -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">${t.dataManagement}</h2>
                        <p class="card-subtitle">${t.dataManagementDesc}</p>
                    </div>

                    <div class="alert alert-error">
                        <div class="alert-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">${t.warningTitle}</div>
                            <div class="alert-message">${t.warningMessage}</div>
                        </div>
                    </div>

                    <button class="btn btn-secondary" onclick="Settings.clearAllData()" style="margin-top: var(--space-lg); background: var(--status-error); color: white; border: none;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        ${t.clearAllData}
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render holidays list
     */
    renderHolidaysList(holidays) {
        const t = Translations.settings;
        if (holidays.length === 0) {
            return `<p style="color: var(--text-tertiary); padding: var(--space-lg);">${t.noHolidaysConfigured}</p>`;
        }

        return `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>${Translations.dashboard.date}</th>
                            <th>${t.holidayName}</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${holidays.map(h => `
                            <tr>
                                <td>${new Date(h.date).toLocaleDateString('es-ES')}</td>
                                <td>${h.name}</td>
                                <td>
                                    <button class="btn btn-secondary" style="padding: var(--space-xs) var(--space-sm);" onclick="Settings.deleteHoliday('${h.id || h.date}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Show calendar modal for configuring working days
     */
    async showCalendarModal() {
        const t = Translations.settings;
        const now = new Date();
        let currentMonth = now.getMonth();
        let currentYear = now.getFullYear();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">${t.configureWorkingDays}</h3>
                    <button class="modal-close" id="close-modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info" style="margin-bottom: var(--space-lg);">
                        <div class="alert-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>
                        <div class="alert-content">
                            <div class="alert-message">${t.clickToToggle}</div>
                        </div>
                    </div>
                    <div id="calendar-modal-content"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-btn">${Translations.common.cancel}</button>
                    <button class="btn btn-primary" id="save-calendar-btn">${Translations.common.save}</button>
                </div>
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);

        const renderCalendar = async () => {
            const content = document.getElementById('calendar-modal-content');
            content.innerHTML = `<div style="display: flex; justify-content: center; padding: var(--space-2xl);"><div class="spinner"></div></div>`;

            const holidays = await Storage.getHolidays();
            const holidayDates = holidays.map(h => h.date);
            const workingDays = await Storage.getWorkingDays(currentYear, currentMonth);

            content.innerHTML = `
                <div class="calendar">
                    <div class="calendar-header">
                        <button class="btn btn-secondary" id="prev-cal-month">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h3>${Utils.getMonthYear(new Date(currentYear, currentMonth))}</h3>
                        <button class="btn btn-secondary" id="next-cal-month">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                    ${this.renderCalendarGrid(currentYear, currentMonth, workingDays, holidayDates)}
                </div>
            `;

            content.querySelector('#prev-cal-month').addEventListener('click', async () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                await renderCalendar();
            });

            content.querySelector('#next-cal-month').addEventListener('click', async () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                await renderCalendar();
            });
        };

        await renderCalendar();

        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        modal.querySelector('#save-calendar-btn').addEventListener('click', () => {
            Utils.showAlert(t.calendarConfigSaved, 'success');
            modal.remove();
        });
    },

    /**
     * Render calendar grid
     */
    renderCalendarGrid(year, month, customWorkingDays, holidayDates) {
        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();

        let workingDates = customWorkingDays;
        if (!workingDates) {
            workingDates = Utils.getWorkingDays(year, month, holidayDates);
        }

        const workingDaysSet = new Set(workingDates);

        let html = '<div class="calendar-grid">';

        // Day headers
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayNames.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = Utils.formatDate(date);
            const isWorkingDay = workingDaysSet.has(dateStr);
            const isToday = dateStr === Utils.formatDate(new Date());

            html += `
                <div class="calendar-day ${isWorkingDay ? 'working-day' : 'non-working-day'} ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}" 
                     onclick="Settings.toggleWorkingDay('${dateStr}', ${year}, ${month})">
                    ${day}
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Toggle working day
     */
    async toggleWorkingDay(dateStr, year, month) {
        let workingDays = await Storage.getWorkingDays(year, month);
        const allHolidays = await Storage.getHolidays();
        const holidayDates = allHolidays.map(h => h.date);

        if (!workingDays) {
            workingDays = Utils.getWorkingDays(year, month, holidayDates);
        }

        const index = workingDays.indexOf(dateStr);
        if (index > -1) {
            workingDays.splice(index, 1);
        } else {
            workingDays.push(dateStr);
            workingDays.sort();
        }

        Storage.saveWorkingDays(year, month, workingDays);

        // Update UI
        const dayElement = document.querySelector(`[data-date="${dateStr}"]`);
        if (dayElement) {
            dayElement.classList.toggle('working-day');
            dayElement.classList.toggle('non-working-day');
        }
    },

    /**
     * Show add holiday modal
     */
    showAddHolidayModal() {
        const t = Translations.settings;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${t.addHoliday}</h3>
                    <button class="modal-close" id="close-modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">${t.holidayDate}</label>
                        <input type="date" class="input" id="holiday-date" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.holidayName}</label>
                        <input type="text" class="input" id="holiday-name" placeholder="${t.holidayNamePlaceholder}" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-btn">${Translations.common.cancel}</button>
                    <button class="btn btn-primary" id="save-btn">${t.addHoliday}</button>
                </div>
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);

        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        modal.querySelector('#save-btn').addEventListener('click', async () => {
            const date = document.getElementById('holiday-date').value;
            const name = document.getElementById('holiday-name').value;

            if (date && name) {
                try {
                    await API.holidays.create({ date, name });
                    Utils.showAlert(t.holidayAdded, 'success');
                    modal.remove();
                    await this.render();
                } catch (error) {
                    console.error(error);
                    Utils.showAlert('Error al agregar feriado', 'error');
                }
            }
        });
    },

    /**
     * Delete holiday
     */
    async deleteHoliday(id) {
        const t = Translations.settings;
        if (confirm(t.confirmDeleteHoliday)) {
            try {
                await API.holidays.delete(id);
                Utils.showAlert(t.holidayDeleted, 'success');
                await this.render();
            } catch (error) {
                console.error(error);
                Utils.showAlert('Error al eliminar feriado', 'error');
            }
        }
    },

    /**
     * Save settings
     */
    async saveSettings() {
        const t = Translations.settings;
        const settings = {
            workHoursPerDay: parseInt(document.getElementById('work-hours-per-day').value),
            workDaysPerWeek: parseInt(document.getElementById('work-days-per-week').value),
            defaultWorkingDays: [1, 2, 3, 4, 5]
        };

        try {
            await Storage.saveSettings(settings);
            Utils.showAlert(t.settingsSaved, 'success');
        } catch (error) {
            console.error(error);
            Utils.showAlert('Error al guardar configuración', 'error');
        }
    },

    /**
     * Clear all data
     */
    async clearAllData() {
        const t = Translations.settings;
        if (confirm(t.confirmClearAll)) {
            if (confirm(t.confirmClearAllFinal)) {
                // Feature explicitly NOT implemented for safety in this version
                Utils.showAlert('Esta función está deshabilitada temporalmente por seguridad', 'warning');
            }
        }
    }
};
