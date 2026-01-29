// Vista del Panel Principal - Completamente en Español
// Actualizado para usar API Backend

const Dashboard = {
    get currentMonth() { return App.state.month; },
    set currentMonth(val) { App.state.month = val; },
    get currentYear() { return App.state.year; },
    set currentYear(val) { App.state.year = val; },

    /**
     * Inicializar fecha basada en datos disponibles
     */
    async initializeDate() {
        try {
            const months = await API.attendance.getImportedMonths();
            if (months && months.length > 0) {
                // Si el mes actual está vacío, saltar al mes más reciente con datos
                const currentData = months.find(m => m.month === this.currentMonth && m.year === this.currentYear);
                if (!currentData) {
                    console.log(`Auto-switching to ${months[0].month}/${months[0].year} as it has data`);
                    this.currentMonth = parseInt(months[0].month);
                    this.currentYear = parseInt(months[0].year);
                }
            }
        } catch (error) {
            console.warn('Error fetching months summary:', error);
        }
    },

    /**
     * Renderizar vista del panel
     */
    async render() {
        // Inicializar fecha si es necesario antes del primer render
        if (!this.initialized) {
            await this.initializeDate();
            this.initialized = true;
        }
        const container = document.getElementById('app-container');
        const t = Translations.dashboard; // Usar traducciones

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${t.title}</h1>
                <p class="page-subtitle">${t.subtitle}</p>
            </div>
            
            <div class="header-actions">
                <div class="header-left">
                    <div class="month-selector">
                        <button id="prev-month" aria-label="${Translations.common.previousMonth}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <span class="month-selector-label" id="current-month-label"></span>
                        <button id="next-month" aria-label="${Translations.common.nextMonth}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="header-right">
                    <button class="btn btn-secondary" id="import-excel-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        ${t.importExcel}
                    </button>
                    <button class="btn btn-primary" id="export-excel-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        ${t.exportToExcel}
                    </button>
                </div>
            </div>
            
            <div class="stats-grid" id="stats-grid"></div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">${t.monthlySummary}</h2>
                    <div class="search-box">
                        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input type="text" class="search-input" id="search-personnel" placeholder="${t.searchStaff}">
                    </div>
                </div>
                <div id="personnel-table-container"></div>
            </div>
        `;

        this.updateMonthLabel();
        this.attachEventListeners();
        await this.loadData();
    },

    /**
     * Actualizar etiqueta del mes
     */
    updateMonthLabel() {
        const label = document.getElementById('current-month-label');
        if (label) {
            const date = new Date(this.currentYear, this.currentMonth);
            label.textContent = Utils.getMonthYear(date);
        }
    },

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Navegación de mes
        document.getElementById('prev-month')?.addEventListener('click', async () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.updateMonthLabel();
            await this.loadData();
        });

        document.getElementById('next-month')?.addEventListener('click', async () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.updateMonthLabel();
            await this.loadData();
        });

        // Importar Excel
        document.getElementById('import-excel-btn')?.addEventListener('click', () => {
            this.showImportModal();
        });

        // Exportar Excel
        document.getElementById('export-excel-btn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Búsqueda
        const searchInput = document.getElementById('search-personnel');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterTable(e.target.value);
            }, 300));
        }

        // Delegación de eventos para filas de personal
        document.getElementById('personnel-table-container')?.addEventListener('click', (e) => {
            const row = e.target.closest('.personnel-row');
            if (row) {
                const id = row.dataset.id;
                this.showPersonnelDetail(id);
            }
        });
    },

    /**
     * Cargar y mostrar datos desde la API
     */
    async loadData() {
        Utils.showLoading();
        try {
            console.log(`Loading data for ${this.currentMonth}/${this.currentYear}`);
            // Cargar datos directamente de la API
            const processedData = await API.attendance.getByMonth(this.currentYear, this.currentMonth);

            Utils.hideLoading();

            if (!processedData) {
                console.log('API returned null/undefined for processedData');
                this.showEmptyState();
                return;
            }

            const recordsCount = Object.keys(processedData).length;
            console.log(`Loaded ${recordsCount} personnel records from API for ${this.currentMonth}/${this.currentYear}`);

            if (recordsCount === 0) {
                console.log('Showing empty state: No data found for this specific month');
                this.showEmptyState();
                return;
            }

            // Muestra una muestra del primer registro para debug
            console.log('Sample data processed:', Object.values(processedData)[0]);

            const result = await DataProcessor.calculateMonthlySummary(
                processedData,
                this.currentYear,
                this.currentMonth
            );

            this.renderStats(result, processedData);
            this.renderTable(result.summary);
        } catch (error) {
            Utils.hideLoading();
            console.error('Error in loadData:', error);
            this.showEmptyState();
        }
    },

    /**
     * Renderizar tarjetas de estadísticas
     */
    async renderStats(result, processedData) {
        const summary = result.summary;
        const workingDaysCount = result.workingDaysCount;
        const t = Translations.dashboard;
        const totalPersonnel = summary.length;
        const totalHours = summary.reduce((sum, p) => sum + p.totalHours, 0);
        const avgHours = totalPersonnel > 0 ? totalHours / totalPersonnel : 0;

        // Obtener justificaciones vía API
        let pendingJustifications = 0;
        try {
            const justifications = await API.justifications.getAll();
            pendingJustifications = justifications ? justifications.length : 0;
        } catch (e) {
            console.error('Error loading justifications', e);
        }

        const statsHtml = `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.totalPersonnel}</span>
                    <div class="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${totalPersonnel}</div>
                <div class="stat-change positive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    </svg>
                    +2%
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.workingDays}</span>
                    <div class="stat-icon" style="color: var(--status-success);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${workingDaysCount}</div>
                <div class="stat-change">${t.days}</div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.avgMonthlyHours}</span>
                    <div class="stat-icon" style="color: var(--accent-purple);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${Utils.formatHours(avgHours)}</div>
                <div class="stat-change positive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    </svg>
                    +5%
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.pendingJustifications}</span>
                    <div class="stat-icon" style="color: var(--accent-orange);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${pendingJustifications}</div>
                ${pendingJustifications > 0 ? `<div class="stat-change negative">${t.actionRequired}</div>` : ''}
            </div>
        `;

        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid) statsGrid.innerHTML = statsHtml;
    },

    /**
     * Renderizar tabla de personal
     */
    renderTable(summary) {
        const t = Translations.dashboard;

        if (summary.length === 0) {
            this.showEmptyState();
            return;
        }

        const tableHtml = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>${t.personnelName}</th>
                            <th>${t.totalHoursMTD}</th>
                            <th>${t.accumulatedHoursYTD}</th>
                            <th>${t.daysAbsent}</th>
                            <th>${t.status}</th>
                        </tr>
                    </thead>
                    <tbody id="personnel-tbody">
                        ${summary.map(person => this.renderPersonRow(person)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('personnel-table-container').innerHTML = tableHtml;
    },

    /**
     * Renderizar fila de persona
     */
    renderPersonRow(person) {
        const t = Translations.dashboard;
        const statusBadge = this.getStatusBadge(person.status, person.daysAbsent);
        const avatarColor = Utils.getAvatarColor(person.name);
        const initials = Utils.getInitials(person.name);

        return `
            <tr class="personnel-row" data-id="${person.id}">
                <td>
                    <div class="flex items-center gap-3">
                        <div class="avatar" style="background: ${avatarColor};">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-weight: 500;">${person.name}</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">ID: ${person.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600;">${Utils.formatHours(person.totalHours)}</div>
                </td>
                <td>
                    <div class="flex items-center gap-3">
                        <div class="progress-bar" style="width: 100px;">
                            <div class="progress-fill" style="width: ${Math.min(100, (person.accumulatedHours / 2000) * 100)}%"></div>
                        </div>
                        <span>${person.accumulatedHours.toFixed(0)}</span>
                    </div>
                </td>
                <td>
                    <span class="${person.daysAbsent > 0 ? 'badge badge-error' : 'badge badge-success'}">
                        ${person.daysAbsent} ${t.days}
                    </span>
                </td>
                <td>${statusBadge}</td>
            </tr>
        `;
    },

    /**
     * Obtener badge de estado
     */
    getStatusBadge(status, daysAbsent) {
        const t = Translations.dashboard;
        const badges = {
            'on-track': `<span class="badge badge-success">${t.onTrack}</span>`,
            'warning': `<span class="badge badge-warning">${t.warning}</span>`,
            'critical': `<span class="badge badge-error">${t.critical}</span>`
        };
        return badges[status] || badges['on-track'];
    },

    /**
     * Filtrar tabla
     */
    filterTable(searchTerm) {
        const rows = document.querySelectorAll('.personnel-row');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    },

    /**
     * Mostrar detalle de personal en un modal
     */
    async showPersonnelDetail(personnelId) {
        Utils.showLoading();
        try {
            const personData = await API.attendance.getPersonnelAttendance(personnelId, this.currentYear, this.currentMonth);
            Utils.hideLoading();

            if (!personData) {
                Utils.showAlert('No se encontraron datos para este mes', 'info');
                return;
            }

            const t = Translations.personnel;

            // Get working days for the month
            const workingDays = await DataProcessor.getWorkingDaysForMonth(this.currentYear, this.currentMonth);

            // Inject missing days as 12:00 rule
            DataProcessor.injectMissingWorkingDays(personData, workingDays);

            const monthRecords = personData.dailyRecords || [];
            const stats = DataProcessor.calculateStatistics(monthRecords);

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal" style="max-width: 900px; width: 95%;">
                    <div class="modal-header">
                        <div class="flex items-center gap-3">
                            <div class="avatar" style="background: ${Utils.getAvatarColor(personData.name)};">
                                ${Utils.getInitials(personData.name)}
                            </div>
                            <div>
                                <h3 class="modal-title">${personData.name}</h3>
                                <p class="card-subtitle">ID: ${personData.id} - ${Utils.getMonthYear(new Date(this.currentYear, this.currentMonth))}</p>
                            </div>
                        </div>
                        <button class="modal-close" id="close-detail-modal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg); margin-bottom: var(--space-xl); background: var(--bg-tertiary); padding: var(--space-lg); border-radius: var(--radius-md);">
                            <div>
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${t.totalHours}</div>
                                <div style="font-size: var(--font-size-xl); font-weight: 700;">${Utils.formatHours(stats.totalHours)}</div>
                            </div>
                            <div>
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${t.daysWorked}</div>
                                <div style="font-size: var(--font-size-xl); font-weight: 700;">${stats.daysWorked}</div>
                            </div>
                            <div>
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${t.averageHoursPerDay}</div>
                                <div style="font-size: var(--font-size-xl); font-weight: 700;">${Utils.formatHours(stats.averageHours)}</div>
                            </div>
                        </div>

                        <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                            <table class="table">
                                <thead style="position: sticky; top: 0; z-index: 10;">
                                    <tr>
                                        <th>${t.date}</th>
                                        <th>${t.entry}</th>
                                        <th>${t.exit}</th>
                                        <th>${t.hours}</th>
                                        <th>${t.status}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${monthRecords.map(day => {
                const date = new Date(day.date);
                const dateStr = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
                    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

                let badgeClass = 'badge-error';
                if (day.status === 'complete') badgeClass = 'badge-success';
                else if (day.status === 'missing-entry' || day.status === 'missing-exit') badgeClass = 'badge-warning';
                else if (day.status === 'absent') badgeClass = 'badge-error';

                return `
                                            <tr>
                                                <td>${dateStr}</td>
                                                <td>${day.entry || '--:--'}</td>
                                                <td>${day.exit || '--:--'}</td>
                                                <td><strong>${day.hours > 0 ? Utils.formatHours(day.hours) : '--'}</strong></td>
                                                <td><span class="badge ${badgeClass}">${t[day.status] || day.status}</span></td>
                                            </tr>
                                        `;
            }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('modal-container').appendChild(modal);
            modal.querySelector('#close-detail-modal').addEventListener('click', () => modal.remove());

        } catch (error) {
            Utils.hideLoading();
            console.error(error);
            Utils.showAlert('Error al cargar el detalle', 'error');
        }
    },

    /**
     * Mostrar estado vacío
     */
    showEmptyState() {
        const t = Translations.dashboard;
        const container = document.getElementById('personnel-table-container');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h3 class="empty-state-title">${t.noDataAvailable}</h3>
                <p class="empty-state-text">${t.importExcelToStart}</p>
                <button class="btn btn-primary" onclick="Dashboard.showImportModal()">
                    ${t.importExcelFile}
                </button>
            </div>
        `;
    },

    /**
     * Mostrar modal de importación
     */
    showImportModal() {
        const t = Translations.dashboard;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${t.importAttendanceData}</h3>
                    <button class="modal-close" id="close-modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: var(--space-lg); color: var(--text-secondary);">${t.selectMonthYear}</p>
                    
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-md); margin-bottom: var(--space-xl);">
                        <div class="form-group">
                            <label class="form-label">${t.month}</label>
                            <select class="select" id="import-month" required>
                                <option value="">${t.selectMonth}</option>
                                <option value="0">Enero</option>
                                <option value="1">Febrero</option>
                                <option value="2">Marzo</option>
                                <option value="3">Abril</option>
                                <option value="4">Mayo</option>
                                <option value="5">Junio</option>
                                <option value="6">Julio</option>
                                <option value="7">Agosto</option>
                                <option value="8">Septiembre</option>
                                <option value="9">Octubre</option>
                                <option value="10">Noviembre</option>
                                <option value="11">Diciembre</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">${t.year}</label>
                            <select class="select" id="import-year" required>
                                <option value="${currentYear - 1}">${currentYear - 1}</option>
                                <option value="${currentYear}" selected>${currentYear}</option>
                                <option value="${currentYear + 1}">${currentYear + 1}</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="file-upload" id="file-upload-area">
                        <div class="file-upload-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <p class="file-upload-text">${t.clickToUpload}</p>
                        <p class="file-upload-hint">${t.excelFiles}</p>
                        <input type="file" id="file-input" accept=".xlsx,.xls">
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);

        // Event listeners
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        const fileUpload = modal.querySelector('#file-upload-area');
        const fileInput = modal.querySelector('#file-input');

        fileUpload.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0], modal));

        // Drag and drop
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });

        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files[0], modal);
        });
    },

    /**
     * Manejar carga de archivo y envíar a API
     */
    async handleFileUpload(file, modal) {
        const t = Translations.dashboard;
        if (!file) return;

        // Validar que se haya seleccionado mes y año
        const monthSelect = modal.querySelector('#import-month');
        const yearSelect = modal.querySelector('#import-year');

        if (!monthSelect.value) {
            Utils.showAlert('Por favor selecciona el mes del reporte', 'warning');
            return;
        }

        const selectedMonth = parseInt(monthSelect.value);
        const selectedYear = parseInt(yearSelect.value);

        Utils.showLoading();

        try {
            // 1. Parsear Excel en el cliente
            const rawData = await ExcelHandler.importFile(file);

            // 2. Filtrar datos solo para el mes y año seleccionado
            const filteredData = rawData.filter(record => {
                const dateTime = Utils.parseExcelDateTime(record.dateTime);
                return dateTime.getMonth() === selectedMonth && dateTime.getFullYear() === selectedYear;
            });

            if (filteredData.length === 0) {
                Utils.hideLoading();
                Utils.showAlert(`No se encontraron datos para ${Utils.getMonthName(new Date(selectedYear, selectedMonth))} ${selectedYear}`, 'warning');
                return;
            }

            // 3. Procesar datos localmente para obtener estructura diaria
            const processedDataMap = DataProcessor.processAttendanceData(filteredData);

            // 4. Transformar a formato plano para el backend
            // El backend espera: [{ personnelId, personnelName, date, entry, exit, hours, status }, ...]
            const flatData = [];

            Object.values(processedDataMap).forEach(person => {
                person.dailyRecords.forEach(day => {
                    flatData.push({
                        personnelId: person.id,
                        personnelName: person.name,
                        date: day.date,
                        entry: day.entry,
                        exit: day.exit,
                        hours: day.hours,
                        status: day.status
                    });
                });
            });

            console.log(`Sending ${flatData.length} records to API for ${selectedMonth}/${selectedYear}`);

            // 5. Enviar a la API
            const response = await API.attendance.import(flatData, selectedYear, selectedMonth);

            Utils.hideLoading();
            modal.remove();

            // Cambiar al mes importado y recargar
            this.currentMonth = selectedMonth;
            this.currentYear = selectedYear;
            this.updateMonthLabel();

            // Forzar re-inicialización para que reconozca los nuevos meses disponibles
            this.initialized = true;

            Utils.showAlert(`${t.dataImportedSuccessfully} (${flatData.length} registros)`, 'success');

            // Pequeño delay para asegurar que el backend procesó todo antes de recargar
            setTimeout(() => this.loadData(), 500);
        } catch (error) {
            Utils.hideLoading();
            console.error('Import error:', error);
            Utils.showAlert(t.errorImportingFile + (error.message || 'Error desconocido'), 'error');
        }
    },

    /**
     * Exportar datos usando API
     */
    async exportData() {
        const t = Translations.dashboard;

        try {
            // Obtener datos del mes seleccionado desde la API
            const processedData = await API.attendance.getByMonth(this.currentYear, this.currentMonth);

            if (!processedData || Object.keys(processedData).length === 0) {
                Utils.showAlert(`No hay datos para ${Utils.getMonthName(new Date(this.currentYear, this.currentMonth))} ${this.currentYear}`, 'warning');
                return;
            }

            // IMPORTANTE: Exportar SOLO los datos del mes seleccionado
            const summary = DataProcessor.calculateMonthlySummary(
                processedData,
                this.currentYear,
                this.currentMonth
            );

            const success = ExcelHandler.exportMonthlySummary(summary, this.currentMonth, this.currentYear);

            if (success) {
                Utils.showAlert(t.dataExportedSuccessfully, 'success');
            } else {
                Utils.showAlert(t.errorExportingData, 'error');
            }
        } catch (error) {
            console.error(error);
            Utils.showAlert(t.errorExportingData + ': ' + error.message, 'error');
        }
    }
};
