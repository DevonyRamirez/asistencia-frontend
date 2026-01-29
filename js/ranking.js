// Vista de Ranking - Completamente en Español
// Actualizado para usar API Backend

const Ranking = {
    get currentMonth() { return App.state.month; },
    set currentMonth(val) { App.state.month = val; },
    get currentYear() { return App.state.year; },
    set currentYear(val) { App.state.year = val; },
    rankingType: 'monthly', // 'monthly' o 'yearly'

    /**
     * Inicializar fecha basada en datos disponibles
     */
    async initializeDate() {
        try {
            const months = await API.attendance.getImportedMonths();
            if (months && months.length > 0) {
                // Sort by year and month descending to get the latest
                months.sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });

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
     * Renderizar vista de ranking
     */
    async render() {
        if (!this.initialized) {
            await this.initializeDate();
            this.initialized = true;
        }
        const container = document.getElementById('app-container');
        const t = Translations.ranking;

        container.innerHTML = `<div class="loading-overlay" style="position: absolute;"><div class="spinner"></div></div>`;

        try {
            // Obtener datos desde la API según el tipo
            let processedData;
            if (this.rankingType === 'monthly') {
                processedData = await API.attendance.getByMonth(this.currentYear, this.currentMonth);
            } else {
                processedData = await API.attendance.getByYear(this.currentYear);
            }

            // Renderizar base (estructura)
            container.innerHTML = `
                <div class="page-header">
                    <div>
                        <h1 class="page-title">${t.title}</h1>
                        <p class="page-subtitle">${t.subtitle}</p>
                    </div>
                    <div class="header-right">
                        <div class="btn-group" style="background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                            <button class="btn ${this.rankingType === 'monthly' ? 'btn-primary' : 'btn-ghost'}" id="btn-ranking-monthly" style="padding: 6px 16px; font-size: var(--font-size-xs); shadow: none;">Mensual</button>
                            <button class="btn ${this.rankingType === 'yearly' ? 'btn-primary' : 'btn-ghost'}" id="btn-ranking-yearly" style="padding: 6px 16px; font-size: var(--font-size-xs); shadow: none;">Anual</button>
                        </div>
                    </div>
                </div>

                <div class="header-actions">
                    <div class="header-left">
                        ${this.rankingType === 'monthly' ? `
                            <div class="month-selector">
                                <button id="prev-month-ranking">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                </button>
                                <span class="month-selector-label" id="ranking-month-label" style="min-width: 140px; text-align: center;">${Utils.getMonthYear(new Date(this.currentYear, this.currentMonth))}</span>
                                <button id="next-month-ranking">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            </div>
                        ` : `
                            <div class="month-selector">
                                <button id="prev-year-ranking">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                </button>
                                <span class="month-selector-label" style="min-width: 100px; text-align: center;">Año ${this.currentYear}</span>
                                <button id="next-year-ranking">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            </div>
                        `}
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" id="export-ranking-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            ${t.exportRanking}
                        </button>
                    </div>
                </div>

                <div id="ranking-content"></div>
            `;

            // Manejar datos vacíos o transformar datos
            if (!processedData || Object.keys(processedData).length === 0) {
                this.showEmptyState();
            } else {
                const ranking = await DataProcessor.calculateRanking(processedData, this.currentYear, this.rankingType === 'monthly' ? this.currentMonth : null);
                this.renderRankingContent(ranking);
            }

            this.attachEventListeners();
        } catch (error) {
            console.error(error);
            this.showEmptyState();
        }
    },

    /**
     * Renderizar contenido del ranking
     */
    renderRankingContent(ranking) {
        const t = Translations.ranking;
        const container = document.getElementById('ranking-content');

        if (ranking.length === 0) {
            this.showEmptyState();
            return;
        }

        const top3 = ranking.slice(0, 3);
        const rest = ranking.slice(3);

        let html = `
            <div class="podium">
        `;

        // Places logic (Order: 2nd, 1st, 3rd for visual balance)
        if (top3[1]) {
            html += this.renderPodiumCard(top3[1], 2);
        }

        if (top3[0]) {
            html += this.renderPodiumCard(top3[0], 1);
        }

        if (top3[2]) {
            html += this.renderPodiumCard(top3[2], 3);
        }

        html += `
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${t.completeRanking}</h3>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${t.position}</th>
                                <th>${t.personnel}</th>
                                <th>${t.totalHours}</th>
                                <th>${t.daysWorked}</th>
                                <th>${t.avgHoursPerDay}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rest.map(person => this.renderRankingRow(person)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Renderizar tarjeta de podio
     */
    renderPodiumCard(person, position) {
        const t = Translations.ranking;
        const avatarColor = Utils.getAvatarColor(person.name);
        const initials = Utils.getInitials(person.name);

        let medal = '';
        let placeClass = '';
        let positionText = '';

        if (position === 1) {
            medal = '🥇';
            placeClass = 'first';
            positionText = '1';
        } else if (position === 2) {
            medal = '🥈';
            placeClass = 'second';
            positionText = '2';
        } else {
            medal = '🥉';
            placeClass = 'third';
            positionText = '3';
        }

        return `
            <div class="podium-card ${placeClass}">
                <div class="podium-rank">${positionText}</div>
                <div class="podium-medal">${medal}</div>
                <div class="avatar podium-avatar" style="background: ${avatarColor};">
                    ${initials}
                </div>
                <div class="podium-name" title="${person.name}">${person.name}</div>
                <div class="podium-stats">
                    <div class="stat-main">${Utils.formatHours(person.totalHours)}</div>
                    <div class="stat-label">Horas Totales</div>
                </div>
                <div class="podium-substats">
                    <span>${person.daysWorked} días</span>
                    <span class="separator">•</span>
                    <span>${Utils.formatHours(person.averageHours)}/día</span>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar fila de ranking
     */
    renderRankingRow(person) {
        const avatarColor = Utils.getAvatarColor(person.name);
        const initials = Utils.getInitials(person.name);

        return `
            <tr>
                <td>
                    <div class="flex items-center justify-center" style="width: 32px; height: 32px; background: var(--bg-secondary); border-radius: 50%; font-weight: 600;">
                        ${person.position}
                    </div>
                </td>
                <td>
                    <div class="flex items-center gap-3">
                        <div class="avatar" style="background: ${avatarColor}; width: 32px; height: 32px; font-size: var(--font-size-xs);">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-weight: 500;">${person.name}</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">ID: ${person.id}</div>
                        </div>
                    </div>
                </td>
                <td><strong>${Utils.formatHours(person.totalHours)}</strong></td>
                <td>${person.daysWorked}</td>
                <td>${Utils.formatHours(person.averageHours)}</td>
            </tr>
        `;
    },

    /**
     * Mostrar estado vacío
     */
    showEmptyState() {
        const t = Translations.ranking;
        const container = document.getElementById('ranking-content');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">${t.noRankingData}</h3>
                    <p class="empty-state-text">${t.importDataToView}</p>
                </div>
            `;
        }
    },

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Toggles de tipo de ranking
        document.getElementById('btn-ranking-monthly')?.addEventListener('click', () => {
            if (this.rankingType === 'monthly') return;
            this.rankingType = 'monthly';
            this.render();
        });

        document.getElementById('btn-ranking-yearly')?.addEventListener('click', () => {
            if (this.rankingType === 'yearly') return;
            this.rankingType = 'yearly';
            this.render();
        });

        // Navegación de mes
        document.getElementById('prev-month-ranking')?.addEventListener('click', async () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            await this.render();
        });

        document.getElementById('next-month-ranking')?.addEventListener('click', async () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            await this.render();
        });

        // Navegación de año
        document.getElementById('prev-year-ranking')?.addEventListener('click', async () => {
            this.currentYear--;
            await this.render();
        });

        document.getElementById('next-year-ranking')?.addEventListener('click', async () => {
            this.currentYear++;
            await this.render();
        });

        document.getElementById('export-ranking-btn')?.addEventListener('click', async () => {
            const t = Translations.ranking;
            try {
                const processedData = await API.attendance.getByMonth(this.currentYear, this.currentMonth);

                if (!processedData || Object.keys(processedData).length === 0) {
                    Utils.showAlert(t.noDataToExport, 'warning');
                    return;
                }

                const ranking = await DataProcessor.calculateRanking(processedData, this.currentYear, this.currentMonth);
                const success = ExcelHandler.exportRanking(ranking, this.currentMonth, this.currentYear);

                if (success) {
                    Utils.showAlert(t.rankingExported, 'success');
                } else {
                    Utils.showAlert(t.errorExporting, 'error');
                }
            } catch (error) {
                console.error(error);
                Utils.showAlert(t.errorExporting, 'error');
            }
        });
    }
};
