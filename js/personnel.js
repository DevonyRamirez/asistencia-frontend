// Vista de Personal - Completamente en Español
// Actualizado para usar API Backend

const Personnel = {
    selectedPersonnelId: null,
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
                const currentData = months.find(m => m.month === this.currentMonth && m.year === this.currentYear);
                if (!currentData) {
                    this.currentMonth = parseInt(months[0].month);
                    this.currentYear = parseInt(months[0].year);
                }
            }
        } catch (error) {
            console.warn('Error fetching months summary:', error);
        }
    },

    /**
     * Renderizar vista de personal
     */
    async render() {
        if (!this.initialized) {
            await this.initializeDate();
            this.initialized = true;
        }

        const container = document.getElementById('app-container');
        const t = Translations.personnel;

        // Render layout skeleton immediately
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">${t.title}</h1>
                    <p class="page-subtitle">${t.subtitle}</p>
                </div>
                <button class="btn btn-primary" id="add-personnel-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    ${t.addPersonnel}
                </button>
            </div>

            <div class="flex gap-4" style="align-items: flex-start; justify-content: center;">
                <div class="card" style="flex: 0 0 1200px; max-width: 100%;">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <h3 class="card-title">${t.staffList}</h3>
                            <span class="badge badge-info" id="personnel-count-badge">0</span>
                        </div>
                        <div class="search-box" style="margin-top: var(--space-md);">
                            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input type="text" class="search-input" id="search-personnel-list" placeholder="${t.search}">
                        </div>
                    </div>
                    <div id="personnel-list" style="max-height: 600px; overflow-y: auto;">
                        <div class="flex justify-center p-8"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();

        try {
            // Obtener lista completa de personal desde la API
            const allPersonnel = await API.personnel.getAll();
            this.renderPersonnelList(allPersonnel);
        } catch (error) {
            console.error('Error fetching personnel:', error);
            const listContainer = document.getElementById('personnel-list');
            if (listContainer) {
                listContainer.innerHTML = `
                    <div style="padding: var(--space-2xl); text-align: center; color: var(--text-tertiary);">
                        <p style="color: var(--status-error); margin-bottom: var(--space-md);">Error al cargar la lista de personal</p>
                        <p style="font-size: var(--font-size-sm);">${error.message || 'Verifica la conexión con el servidor'}</p>
                        <button class="btn btn-secondary" onclick="Personnel.render()" style="margin-top: var(--space-lg);">Reintentar</button>
                    </div>
                `;
            }
        }
    },

    /**
     * Renderizar lista de personal
     */
    renderPersonnelList(personnelList) {
        const t = Translations.personnel;
        // Actualizar contador
        const countBadge = document.getElementById('personnel-count-badge');
        if (countBadge) {
            countBadge.textContent = personnelList.length;
        }

        if (personnelList.length === 0) {
            document.getElementById('personnel-list').innerHTML = `
                <div style="padding: var(--space-2xl); text-align: center; color: var(--text-tertiary);">
                    <p>No hay personal registrado aún.</p>
                    <p style="font-size: var(--font-size-sm); margin-top: var(--space-md);">Puedes agregar personal manualmente con el botón superior o importar datos de asistencia.</p>
                </div>
            `;
            return;
        }

        const listHtml = personnelList.map(person => {
            const avatarColor = Utils.getAvatarColor(person.name);
            const initials = Utils.getInitials(person.name);
            const isSelected = person.id === this.selectedPersonnelId;

            return `
                <div class="personnel-list-item ${isSelected ? 'selected' : ''}" data-id="${person.id}">
                    <div class="avatar" style="background: ${avatarColor};">${initials}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${person.name}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">ID: ${person.id}</div>
                    </div>
                    <button class="delete-person-btn btn-icon" data-id="${person.id}" title="${t.deletePersonnel}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        document.getElementById('personnel-list').innerHTML = listHtml;

        // Add click handlers
        document.querySelectorAll('.personnel-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Si hizo clic en el botón de borrar, no seleccionar
                if (e.target.closest('.delete-person-btn')) return;
                this.showPersonnelDetailModal(item.dataset.id);
            });
        });

        // Add delete handlers
        document.querySelectorAll('.delete-person-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmDeletePersonnel(btn.dataset.id);
            });
        });
    },

    /**
     * Seleccionar personal (Para mantener compatibilidad si se llama desde fuera)
     */
    async selectPersonnel(personnelId) {
        this.selectedPersonnelId = personnelId;
        await this.showPersonnelDetailModal(personnelId);
    },

    /**
     * Renderizar detalle de personal
     */
    async showPersonnelDetailModal(personnelId) {
        this.selectedPersonnelId = personnelId;
        const t = Translations.personnel;

        // Update selection in list
        document.querySelectorAll('.personnel-list-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.id === personnelId);
        });

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'personnel-detail-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 900px; width: 95%;">
                <div class="modal-header">
                    <h3 class="modal-title">${t.dailyAttendance}</h3>
                    <button class="modal-close" id="close-detail-modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" id="detail-modal-body">
                    <div class="flex justify-center p-8"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('#close-detail-modal').addEventListener('click', closeModal);

        this.updateDetailModalContent(personnelId);
    },

    /**
     * Actualizar contenido del modal de detalle
     */
    async updateDetailModalContent(personnelId) {
        const t = Translations.personnel;
        const detailContainer = document.getElementById('detail-modal-body');
        if (!detailContainer) return;

        try {
            // Obtener datos frescos para esta persona
            const personData = await API.attendance.getPersonnelAttendance(personnelId, this.currentYear, this.currentMonth);

            if (!personData) {
                const personInfo = await API.personnel.getById(personnelId);
                if (personInfo) {
                    this.renderEmptyDetailInModal(personInfo, detailContainer);
                } else {
                    detailContainer.innerHTML = '<p class="text-center p-8">No se encontró información del empleado.</p>';
                }
                return;
            }

            const workingDays = await DataProcessor.getWorkingDaysForMonth(this.currentYear, this.currentMonth);
            DataProcessor.injectMissingWorkingDays(personData, workingDays);

            const monthRecords = personData.dailyRecords || [];
            const stats = DataProcessor.calculateStatistics(monthRecords);

            detailContainer.innerHTML = `
                <div class="personnel-detail-header" style="margin: 0 0 var(--space-xl) 0; border-radius: var(--radius-md);">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="avatar" style="background: ${Utils.getAvatarColor(personData.name)}; width: 70px; height: 70px; font-size: var(--font-size-2xl); border: 4px solid var(--bg-secondary); shadow: var(--shadow-md);">
                                ${Utils.getInitials(personData.name)}
                            </div>
                            <div>
                                <h2 class="card-title" style="margin: 0; font-size: var(--font-size-2xl);">${personData.name}</h2>
                                <div class="flex items-center gap-3">
                                    <p class="card-subtitle" style="font-size: var(--font-size-base); margin: 0;">ID: ${personData.id}</p>
                                    <span style="color: var(--border-light);">|</span>
                                    <div class="flex items-center gap-2">
                                            <p class="card-subtitle" style="font-size: var(--font-size-base); margin: 0;">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                ${personData.start_date ? new Date(personData.start_date + 'T00:00:00').toLocaleDateString('es-ES') : '---'} 
                                                - 
                                                ${personData.end_date ? new Date(personData.end_date + 'T00:00:00').toLocaleDateString('es-ES') : (personData.start_date ? t.currentlyEmployed : '---')}
                                            </p>
                                        <button class="btn-icon" onclick="Personnel.showEditPersonnelModal('${personData.id}', '${personData.name.replace(/'/g, "\\'")}', '${personData.start_date || ''}', '${personData.end_date || ''}')" title="Editar Información">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="month-selector">
                            <button id="modal-prev-month">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <span class="month-selector-label" style="font-size: var(--font-size-base); min-width: 140px; text-align: center;">${Utils.getMonthYear(new Date(this.currentYear, this.currentMonth))}</span>
                            <button id="modal-next-month">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-xl);">
                    <div class="card" style="padding: var(--space-md); text-align: center;">
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: var(--space-xs);">${t.totalHours}</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 700;">${Utils.formatHours(stats.totalHours)}</div>
                    </div>
                    <div class="card" style="padding: var(--space-md); text-align: center;">
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: var(--space-xs);">${t.daysWorked}</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 700;">${stats.daysWorked}</div>
                    </div>
                    <div class="card" style="padding: var(--space-md); text-align: center;">
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: var(--space-xs);">${t.averageHoursPerDay}</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 700;">${Utils.formatHours(stats.averageHours)}</div>
                    </div>
                </div>

                <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${t.date}</th>
                                <th>${t.entry}</th>
                                <th>${t.exit}</th>
                                <th>${t.hours}</th>
                                <th>${t.status}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monthRecords.length > 0 ? monthRecords.map(day => this.renderDayRow(day)).join('') : `<tr><td colspan="5" style="text-align: center; padding: var(--space-2xl); color: var(--text-tertiary);">${t.noRecordsForMonth}</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            // Navigation within modal
            detailContainer.querySelector('#modal-prev-month').addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
                this.updateDetailModalContent(personnelId);
            });

            detailContainer.querySelector('#modal-next-month').addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
                this.updateDetailModalContent(personnelId);
            });

        } catch (error) {
            console.error(error);
            detailContainer.innerHTML = '<p class="text-center p-8">Error al cargar información.</p>';
        }
    },

    /**
     * Renderizar estado vacío en el modal
     */
    renderEmptyDetailInModal(personData, container) {
        const t = Translations.personnel;
        container.innerHTML = `
            <div class="personnel-detail-header" style="margin: 0 0 var(--space-xl) 0; border-radius: var(--radius-md);">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="avatar" style="background: ${Utils.getAvatarColor(personData.name)}; width: 70px; height: 70px; font-size: var(--font-size-2xl);">
                            ${Utils.getInitials(personData.name)}
                        </div>
                        <div>
                            <h2 class="card-title" style="margin: 0;">${personData.name}</h2>
                            <p class="card-subtitle">ID: ${personData.id}</p>
                        </div>
                    </div>
                    <div class="month-selector">
                        <button id="modal-prev-month">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <span class="month-selector-label" style="min-width: 140px; text-align: center;">${Utils.getMonthYear(new Date(this.currentYear, this.currentMonth))}</span>
                        <button id="modal-next-month">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div style="padding: var(--space-2xl); text-align: center; color: var(--text-tertiary);">
                ${t.noRecordsForMonth}
            </div>
        `;

        container.querySelector('#modal-prev-month').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
            this.updateDetailModalContent(personData.id);
        });

        container.querySelector('#modal-next-month').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
            this.updateDetailModalContent(personData.id);
        });
    },

    /**
     * Renderizar fila de día
     */
    renderDayRow(day) {
        const t = Translations.personnel;
        const date = new Date(day.date);
        const dateStr = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
            .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

        let badgeClass = 'badge-error';
        if (day.status === 'complete') badgeClass = 'badge-success';
        else if (day.status === 'missing-entry' || day.status === 'missing-exit') badgeClass = 'badge-warning';
        else if (day.status === 'absent') badgeClass = 'badge-error';

        const statusBadge = `<span class="badge ${badgeClass}">${t[day.status] || day.status}</span>`;

        return `
            <tr>
                <td>${dateStr}</td>
                <td>${day.entry || '<span style="color: var(--text-tertiary);">--:--</span>'}</td>
                <td>${day.exit || '<span style="color: var(--text-tertiary);">--:--</span>'}</td>
                <td><strong>${day.hours > 0 ? Utils.formatHours(day.hours) : '--'}</strong></td>
                <td>${statusBadge}</td>
            </tr>
        `;
    },

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        const searchInput = document.getElementById('search-personnel-list');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterPersonnelList(e.target.value);
            }, 300));
        }

        const addBtn = document.getElementById('add-personnel-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddPersonnelModal());
        }
    },

    /**
     * Mostrar modal para agregar personal
     */
    showAddPersonnelModal() {
        const t = Translations.personnel;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${t.addPersonnel}</h3>
                    <button class="modal-close" id="close-personnel-modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">${t.personnelId}</label>
                        <input type="text" class="input" id="new-personnel-id" placeholder="ej. 101" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.personnelName}</label>
                        <input type="text" class="input" id="new-personnel-name" placeholder="ej. Juan Pérez" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.startDate}</label>
                        <input type="date" class="input" id="new-personnel-start">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.endDate}</label>
                        <div class="flex items-center gap-2">
                            <input type="date" class="input" id="new-personnel-end" style="flex: 1;">
                            <label class="flex items-center gap-2" style="cursor: pointer; white-space: nowrap;">
                                <input type="checkbox" id="new-personnel-current" checked>
                                <span style="font-size: var(--font-size-xs);">${t.currentlyEmployed}</span>
                            </label>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3" style="margin-top: var(--space-xl);">
                        <button class="btn btn-secondary" id="cancel-personnel-btn">${Translations.common.cancel}</button>
                        <button class="btn btn-primary" id="save-personnel-btn">${Translations.common.save}</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);

        // Toggle end date input based on "Actualidad"
        const currentCheck = modal.querySelector('#new-personnel-current');
        const endInput = modal.querySelector('#new-personnel-end');

        const toggleEndInput = () => {
            endInput.disabled = currentCheck.checked;
            if (currentCheck.checked) {
                endInput.value = '';
                endInput.style.opacity = '0.5';
            } else {
                endInput.style.opacity = '1';
            }
        };

        toggleEndInput();
        currentCheck.addEventListener('change', toggleEndInput);

        const closeModal = () => modal.remove();
        modal.querySelector('#close-personnel-modal').addEventListener('click', closeModal);
        modal.querySelector('#cancel-personnel-btn').addEventListener('click', closeModal);

        modal.querySelector('#save-personnel-btn').addEventListener('click', () => {
            const id = document.getElementById('new-personnel-id').value.trim();
            const name = document.getElementById('new-personnel-name').value.trim();
            const startDate = document.getElementById('new-personnel-start').value;
            const isCurrent = document.getElementById('new-personnel-current').checked;
            const endDate = isCurrent ? null : document.getElementById('new-personnel-end').value;

            if (id && name) {
                this.handleSavePersonnel(id, name, startDate, endDate, modal);
            } else {
                Utils.showAlert('Por favor completa los campos obligatorios (ID y Nombre)', 'warning');
            }
        });
    },

    /**
     * Guardar nuevo personal
     */
    async handleSavePersonnel(id, name, startDate, endDate, modal) {
        const t = Translations.personnel;
        Utils.showLoading();
        try {
            await API.personnel.create(id, name, startDate, endDate);
            Utils.hideLoading();
            modal.remove();
            Utils.showAlert(t.personnelAdded, 'success');
            this.selectedPersonnelId = id;
            await this.render();
        } catch (error) {
            Utils.hideLoading();
            console.error('Error saving personnel:', error);
            Utils.showAlert(t.errorAddingPersonnel + ': ' + (error.message || 'Error desconocido'), 'error');
        }
    },

    /**
     * Mostrar modal para editar personal
     */
    showEditPersonnelModal(id, name, startDate, endDate) {
        const t = Translations.personnel;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${t.edit} ${t.title}</h3>
                    <button class="modal-close" id="close-edit-modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">${t.personnelId} (No editable)</label>
                        <input type="text" class="input" value="${id}" disabled style="opacity: 0.7;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.personnelName}</label>
                        <input type="text" class="input" id="edit-personnel-name" value="${name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.startDate}</label>
                        <input type="date" class="input" id="edit-personnel-start" value="${startDate || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.endDate}</label>
                        <div class="flex items-center gap-2">
                            <input type="date" class="input" id="edit-personnel-end" value="${endDate || ''}" style="flex: 1;">
                            <label class="flex items-center gap-2" style="cursor: pointer; white-space: nowrap;">
                                <input type="checkbox" id="edit-personnel-current" ${!endDate ? 'checked' : ''}>
                                <span style="font-size: var(--font-size-xs);">${t.currentlyEmployed}</span>
                            </label>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3" style="margin-top: var(--space-xl);">
                        <button class="btn btn-secondary" id="cancel-edit-btn">${Translations.common.cancel}</button>
                        <button class="btn btn-primary" id="update-personnel-btn">${Translations.common.save}</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);

        const currentCheck = modal.querySelector('#edit-personnel-current');
        const endInput = modal.querySelector('#edit-personnel-end');

        const toggleEndInput = () => {
            endInput.disabled = currentCheck.checked;
            if (currentCheck.checked) {
                endInput.value = '';
                endInput.style.opacity = '0.5';
            } else {
                endInput.style.opacity = '1';
            }
        };

        toggleEndInput();
        currentCheck.addEventListener('change', toggleEndInput);

        const closeModal = () => modal.remove();
        modal.querySelector('#close-edit-modal').addEventListener('click', closeModal);
        modal.querySelector('#cancel-edit-btn').addEventListener('click', closeModal);

        modal.querySelector('#update-personnel-btn').addEventListener('click', () => {
            const newName = document.getElementById('edit-personnel-name').value.trim();
            const newStart = document.getElementById('edit-personnel-start').value;
            const isCurrent = document.getElementById('edit-personnel-current').checked;
            const newEnd = isCurrent ? null : document.getElementById('edit-personnel-end').value;

            if (newName) {
                this.handleUpdatePersonnel(id, newName, newStart, newEnd, modal);
            } else {
                Utils.showAlert('El nombre es obligatorio', 'warning');
            }
        });
    },

    /**
     * Actualizar personal
     */
    async handleUpdatePersonnel(id, name, startDate, endDate, modal) {
        const t = Translations.personnel;
        Utils.showLoading();
        try {
            await API.personnel.update(id, name, startDate, endDate);
            Utils.hideLoading();
            modal.remove();
            Utils.showAlert(t.personnelUpdated, 'success');
            await this.render();
        } catch (error) {
            Utils.hideLoading();
            console.error('Error updating personnel:', error);
            Utils.showAlert(t.errorUpdatingPersonnel + ': ' + (error.message || 'Error desconocido'), 'error');
        }
    },

    /**
     * Confirmar eliminación de personal
     */
    confirmDeletePersonnel(id) {
        const t = Translations.personnel;
        Utils.showConfirm(
            t.deletePersonnel,
            t.confirmDeletePersonnel,
            () => this.handleDeletePersonnel(id),
            'error'
        );
    },

    /**
     * Ejecutar eliminación de personal
     */
    async handleDeletePersonnel(id) {
        const t = Translations.personnel;
        Utils.showLoading();
        try {
            await API.personnel.delete(id);
            Utils.hideLoading();
            Utils.showAlert(t.personnelDeleted, 'success');

            if (this.selectedPersonnelId === id) {
                this.selectedPersonnelId = null;
            }

            await this.render();
        } catch (error) {
            Utils.hideLoading();
            console.error('Error deleting personnel:', error);
            Utils.showAlert(t.errorDeletingPersonnel + ': ' + (error.message || 'Error desconocido'), 'error');
        }
    },

    /**
     * Mostrar estado sin datos en el detalle
     */
    showNoDataInDetail() {
        const detailContainer = document.getElementById('personnel-detail');
        if (detailContainer) {
            detailContainer.innerHTML = `
                <div class="card">
                    <div class="empty-state">
                        <p class="empty-state-text">Selecciona un empleado para ver sus detalles o agrega uno nuevo.</p>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Filtrar lista de personal
     */
    filterPersonnelList(searchTerm) {
        const items = document.querySelectorAll('.personnel-list-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(term) ? '' : 'none';
        });
    },

    /**
     * Mostrar estado vacío
     */
    showEmptyState() {
        const t = Translations.personnel;
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <h3 class="empty-state-title">${t.noPersonnelData}</h3>
                <p class="empty-state-text">${t.importDataToView}</p>
            </div>
        `;
    }
};

// Add CSS for personnel list items
const personnelStyle = document.createElement('style');
personnelStyle.textContent = `
    .personnel-list-item {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border-light);
        cursor: pointer;
        transition: all 0.2s ease;
        border-left: 4px solid transparent;
    }

    .personnel-list-item:hover {
        background: var(--bg-tertiary);
        padding-left: calc(var(--space-lg) + 4px);
    }

    .personnel-list-item.selected {
        background: hsla(220, 75%, 55%, 0.1);
        border-left-color: var(--accent-blue);
        color: var(--accent-blue);
    }

    .personnel-detail-header {
        background: var(--bg-tertiary);
        margin: calc(var(--space-xl) * -1);
        padding: var(--space-xl);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        margin-bottom: var(--space-xl);
    }

    .btn-icon {
        background: transparent;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .btn-icon:hover {
        background: var(--border-light);
        color: var(--accent-blue);
    }

    .delete-person-btn {
        opacity: 0;
        transform: translateX(10px);
        color: var(--text-tertiary);
    }

    .personnel-list-item:hover .delete-person-btn {
        opacity: 1;
        transform: translateX(0);
    }

    .delete-person-btn:hover {
        color: var(--error-red) !important;
        background: hsla(0, 80%, 60%, 0.1) !important;
    }
`;
document.head.appendChild(personnelStyle);
