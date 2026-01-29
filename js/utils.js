// Utility functions for the attendance system

const Utils = {
    /**
     * Format date to YYYY-MM-DD
     */
    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Format time to HH:MM (military time)
     */
    formatTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    },

    /**
     * Parse Excel date/time string to Date object
     */
    parseExcelDateTime(dateTimeStr) {
        if (!dateTimeStr) return new Date();

        // Handle format: "1/12/2025 7:12:36 a. m." or "2/12/2025 4:11:42 p. m."
        const cleanStr = dateTimeStr.trim().replace(/\s+/g, ' ');

        // Try manual parsing first for DD/MM/YYYY which is common in Spanish
        const dateParts = cleanStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

        if (dateParts) {
            const day = parseInt(dateParts[1]);
            const month = parseInt(dateParts[2]);
            const year = parseInt(dateParts[3]);

            let hour = 0, minute = 0, second = 0;
            const timeParts = cleanStr.match(/(\d{1,2}):(\d{1,2})(:(\d{1,2}))?(\s+([ap]\.?\s*m\.?|am|pm))?/i);

            if (timeParts) {
                hour = parseInt(timeParts[1]);
                minute = parseInt(timeParts[2]);
                second = timeParts[4] ? parseInt(timeParts[4]) : 0;
                const period = timeParts[6];

                if (period) {
                    const p = period.toLowerCase();
                    if ((p.includes('p') || p === 'pm') && hour !== 12) {
                        hour += 12;
                    } else if ((p.includes('a') || p === 'am') && hour === 12) {
                        hour = 0;
                    }
                }
            }

            if (month > 12) {
                return new Date(year, day - 1, month, hour, minute, second);
            } else {
                return new Date(year, month - 1, day, hour, minute, second);
            }
        }

        const date = new Date(cleanStr);
        return isNaN(date.getTime()) ? new Date() : date;
    },

    /**
     * Calculate hours between two times
     */
    calculateHours(startTime, endTime) {
        const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
        const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);

        return Math.max(0, diffHours);
    },

    /**
     * Format hours to display (e.g., "8.5h" or "168.5h")
     */
    formatHours(hours) {
        return `${hours.toFixed(1)}h`;
    },

    /**
     * Get month name from date
     */
    getMonthName(date) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[date.getMonth()];
    },

    /**
     * Get month and year string
     */
    getMonthYear(date) {
        return `${this.getMonthName(date)} ${date.getFullYear()}`;
    },

    /**
     * Get days in month
     */
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    /**
     * Check if date is weekend
     */
    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    },

    /**
     * Get working days in month
     */
    getWorkingDays(year, month, holidays = []) {
        const daysInMonth = this.getDaysInMonth(year, month);
        const workingDays = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);

            if (!this.isWeekend(date) && !holidays.includes(dateStr)) {
                workingDays.push(dateStr);
            }
        }

        return workingDays;
    },

    /**
     * Generate avatar color from name
     */
    getAvatarColor(name) {
        const colors = [
            'hsl(210, 100%, 60%)',
            'hsl(270, 80%, 65%)',
            'hsl(150, 70%, 55%)',
            'hsl(30, 95%, 60%)',
            'hsl(340, 85%, 60%)',
            'hsl(180, 70%, 55%)',
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    },

    /**
     * Get initials from name
     */
    getInitials(name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show loading overlay
     */
    showLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Show alert message
     */
    showAlert(message, type = 'info', duration = 3000) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '10000';
        alert.style.minWidth = '300px';
        alert.style.animation = 'slideIn 0.3s ease';

        alert.innerHTML = `
            <div class="alert-icon">
                ${this.getAlertIcon(type)}
            </div>
            <div class="alert-content">
                <div class="alert-message">${message}</div>
            </div>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, duration);
    },

    /**
     * Get alert icon SVG
     */
    getAlertIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        return icons[type] || icons.info;
    },

    /**
     * Show confirmation modal
     */
    showConfirm(title, message, onConfirm, type = 'info') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '11000';

        const confirmBtnClass = type === 'error' ? 'btn-danger' : 'btn-primary';

        modal.innerHTML = `
            <div class="modal" style="max-width: 450px;">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: var(--space-xl); color: var(--text-secondary); line-height: 1.6;">${message}</p>
                    <div class="flex justify-end gap-3">
                        <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
                        <button class="btn ${confirmBtnClass}" id="confirm-ok">Confirmar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();

        modal.querySelector('#confirm-cancel').addEventListener('click', close);
        modal.querySelector('#confirm-ok').addEventListener('click', () => {
            onConfirm();
            close();
        });
    },

    /**
     * Download data as file
     */
    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
