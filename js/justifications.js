const Justifications = {
    allJustifications: [],
    filteredJustifications: [],
    personnelList: [],

    // Filtros actuales
    filters: {
        search: '',
        type: '',
        personnelId: ''
    },

    /**
     * Renderizar vista de justificaciones
     */
    async render() {
        const container = document.getElementById('app-container');
        const t = Translations.justifications;

        container.innerHTML = `<div class="loading-overlay" style="position: absolute;"><div class="spinner"></div></div>`;

        try {
            // Cargar datos en paralelo
            const [justs, personnel] = await Promise.all([
                API.justifications.getAll(),
                API.personnel.getAll()
            ]);

            this.allJustifications = justs || [];
            this.personnelList = personnel || [];
            this.filteredJustifications = [...this.allJustifications];

            // Renderizar estructura base
            container.innerHTML = `
                <div class="page-header">
                    <h1 class="page-title">${t.title}</h1>
                    <p class="page-subtitle">${t.subtitle}</p>
                </div>

                <div id="justifications-stats" class="stats-grid" style="margin-bottom: var(--space-xl);"></div>

                <div class="header-actions" style="flex-wrap: wrap; gap: var(--space-md);">
                    <div class="header-left" style="flex: 1; min-width: 300px;">
                        <div id="justifications-filters" style="display: flex; gap: var(--space-sm); width: 100%;"></div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" id="btn-add-justification">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            ${t.addJustification}
                        </button>
                    </div>
                </div>

                <div id="justifications-content"></div>
            `;

            this.renderStats();
            this.renderFilters();
            this.applyFilters(); // Esto renderizará la tabla inicial
            this.attachEventListeners();

        } catch (error) {
            console.error('Error rendering justifications:', error);
            container.innerHTML = `<div class="error-state">Error al cargar datos</div>`;
        }
    },

    /**
     * Renderizar tarjetas de estadísticas
     */
    renderStats() {
        const t = Translations.justifications.stats;
        const container = document.getElementById('justifications-stats');

        const counts = {
            total: this.allJustifications.length,
            sick: this.allJustifications.filter(j => j.type === 'Enfermo').length,
            vacation: this.allJustifications.filter(j => j.type === 'Vacación').length,
            personal: this.allJustifications.filter(j => j.type === 'Personal').length
        };

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.total}</span>
                    <div class="stat-icon" style="background: var(--bg-tertiary); color: var(--text-secondary);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor"/>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${counts.total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.sick}</span>
                    <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #EF4444;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${counts.sick}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.vacation}</span>
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${counts.vacation}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${t.personal}</span>
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3B82F6;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${counts.personal}</div>
            </div>
        `;
    },

    /**
     * Renderizar controles de filtrado
     */
    renderFilters() {
        const ft = Translations.justifications.filters;
        const container = document.getElementById('justifications-filters');

        container.innerHTML = `
            <div class="search-box" style="flex: 2;">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" class="search-input" id="filter-search" placeholder="${Translations.justifications.searchJustifications}" value="${this.filters.search}">
            </div>
            <select class="select" id="filter-type" style="flex: 1;">
                <option value="">${ft.allTypes}</option>
                <option value="Enfermo" ${this.filters.type === 'Enfermo' ? 'selected' : ''}>Enfermo</option>
                <option value="Vacación" ${this.filters.type === 'Vacación' ? 'selected' : ''}>Vacación</option>
                <option value="Personal" ${this.filters.type === 'Personal' ? 'selected' : ''}>Personal</option>
            </select>
            <select class="select" id="filter-personnel" style="flex: 1.5;">
                <option value="">${ft.allPersonnel}</option>
                ${this.personnelList.map(p => `
                    <option value="${p.id}" ${this.filters.personnelId === p.id ? 'selected' : ''}>${p.name}</option>
                `).join('')}
            </select>
        `;

        // Eventos de filtro
        document.getElementById('filter-search').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });
        document.getElementById('filter-type').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });
        document.getElementById('filter-personnel').addEventListener('change', (e) => {
            this.filters.personnelId = e.target.value;
            this.applyFilters();
        });
    },

    /**
     * Aplicar filtros y redibujar tabla
     */
    applyFilters() {
        const { search, type, personnelId } = this.filters;
        const s = search.toLowerCase();

        this.filteredJustifications = this.allJustifications.filter(j => {
            const matchesSearch = !s ||
                j.personnel_name.toLowerCase().includes(s) ||
                j.personnel_id.toLowerCase().includes(s) ||
                (j.description && j.description.toLowerCase().includes(s));

            const matchesType = !type || j.type === type;
            const matchesPersonnel = !personnelId || j.personnel_id === personnelId;

            return matchesSearch && matchesType && matchesPersonnel;
        });

        this.renderTable();
    },

    /**
     * Renderizar tabla de justificaciones
     */
    renderTable() {
        const t = Translations.justifications;
        const container = document.getElementById('justifications-content');

        if (this.filteredJustifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"/><path d="M14 2V8H20"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">${t.noJustifications}</h3>
                    <p class="empty-state-text">${t.noJustificationsDesc}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="card" style="margin-top: var(--space-lg);">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${t.personnel}</th>
                                <th>${t.date}</th>
                                <th>${t.type}</th>
                                <th>${t.description}</th>
                                <th>${t.created}</th>
                                <th style="text-align: right;">${t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.filteredJustifications.map(j => this.renderRow(j)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar fila individual
     */
    renderRow(j) {
        const typeBadges = {
            'Enfermo': '<span class="badge badge-error">🏥 Enfermo</span>',
            'Vacación': '<span class="badge badge-success">🏖️ Vacación</span>',
            'Personal': '<span class="badge badge-info">👤 Personal</span>'
        };

        const formattedDate = Utils.formatDisplayDate(j.date);
        const createdDate = new Date(j.createdAt).toLocaleDateString();

        return `
            <tr>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${j.personnel_name}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">ID: ${j.personnel_id}</div>
                </td>
                <td style="font-weight: 500;">${formattedDate}</td>
                <td>${typeBadges[j.type] || j.type}</td>
                <td style="max-width: 250px;"><div class="truncate-text" title="${j.description || ''}">${j.description || '-'}</div></td>
                <td style="font-size: var(--font-size-xs); color: var(--text-tertiary);">${createdDate}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 4px; justify-content: flex-end;">
                        <button class="btn btn-ghost btn-icon edit-just-btn" data-id="${j.id}" title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-icon delete-just-btn" data-id="${j.id}" style="color: var(--status-critical);" title="Eliminar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Mostrar modal para agregar/editar
     */
    showModal(justification = null, personnelId = null, personnelName = null) {
        const t = Translations.justifications;
        const isEdit = !!justification;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        // Determinar ID de personal predefinido si no es edición
        const preselectedId = !isEdit && personnelId ? personnelId : null;
        const preselectedName = !isEdit && personnelName ? personnelName : null;

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? t.editJustification : t.addJustification}</h3>
                    <button class="modal-close" id="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="justification-form">
                        <div class="form-group">
                            <label class="form-label">${t.personnel}</label>
                            ${(isEdit || preselectedId) ? `
                                <input type="text" class="input" value="${isEdit ? justification.personnel_name : preselectedName}" disabled>
                                <input type="hidden" id="form-personnel-id" value="${isEdit ? justification.personnel_id : preselectedId}">
                            ` : `
                                <select class="select" id="form-personnel-id" required>
                                    <option value="">Seleccionar personal...</option>
                                    ${this.personnelList.map(p => `<option value="${p.id}">${p.name} (ID: ${p.id})</option>`).join('')}
                                </select>
                            `}
                        </div>
                        <div class="form-group">
                            <label class="form-label">${t.date}</label>
                            <input type="date" class="input" id="form-date" value="${isEdit ? justification.date : ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${t.type}</label>
                            <select class="select" id="form-type" required>
                                <option value="Enfermo" ${isEdit && justification.type === 'Enfermo' ? 'selected' : ''}>Enfermo</option>
                                <option value="Vacación" ${isEdit && justification.type === 'Vacación' ? 'selected' : ''}>Vacación</option>
                                <option value="Personal" ${isEdit && justification.type === 'Personal' ? 'selected' : ''}>Personal</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${t.description}</label>
                            <textarea class="textarea" id="form-description" rows="3">${isEdit ? (justification.description || '') : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-modal" style="flex: 1;">Cancelar</button>
                    <button class="btn btn-primary" id="save-just-btn" style="flex: 1;">${t.saveJustification}</button>
                </div>
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);

        // Handlers
        const close = () => modal.remove();
        document.getElementById('close-modal').addEventListener('click', close);
        document.getElementById('cancel-modal').addEventListener('click', close);

        document.getElementById('save-just-btn').addEventListener('click', async () => {
            const form = document.getElementById('justification-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const selectedPersonnelId = document.getElementById('form-personnel-id').value;
            const person = this.personnelList.find(p => p.id === selectedPersonnelId);

            const data = {
                personnel_id: selectedPersonnelId,
                personnel_name: person ? person.name : (isEdit ? justification.personnel_name : preselectedName),
                date: document.getElementById('form-date').value,
                type: document.getElementById('form-type').value,
                description: document.getElementById('form-description').value
            };

            try {
                Utils.showLoading();
                if (isEdit) {
                    await API.justifications.update(justification.id, data);
                } else {
                    await API.justifications.create(data);
                }
                Utils.hideLoading();
                Utils.showAlert(t.justificationSaved, 'success');
                close();
                this.render(); // Recargar todo
            } catch (error) {
                Utils.hideLoading();
                console.error(error);
                Utils.showAlert(t.errorSaving, 'error');
            }
        });
    },

    /**
     * Eliminar justificación
     */
    async deleteJustification(id) {
        const t = Translations.justifications;
        if (!confirm(t.confirmDelete)) return;

        try {
            Utils.showLoading();
            await API.justifications.delete(id);
            Utils.hideLoading();
            Utils.showAlert(t.justificationDeleted, 'success');
            this.render();
        } catch (error) {
            Utils.hideLoading();
            console.error(error);
            Utils.showAlert(t.errorDeleting, 'error');
        }
    },

    /**
     * Adjuntar event listeners generales
     */
    attachEventListeners() {
        // Botón agregar
        document.getElementById('btn-add-justification')?.addEventListener('click', () => {
            this.showModal();
        });

        // Botones en la tabla (delegación si es posible, pero aquí los pondré directos)
        document.querySelectorAll('.edit-just-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const just = this.allJustifications.find(j => j.id == id);
                this.showModal(just);
            });
        });

        document.querySelectorAll('.delete-just-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.deleteJustification(id);
            });
        });
    }
};
