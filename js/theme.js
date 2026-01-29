/**
 * Theme Manager
 * Handles dark mode toggle and persistence
 */
const ThemeManager = {
    theme: localStorage.getItem('theme') || 'light',

    init() {
        this.applyTheme();
        this.renderToggle();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
    },

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.updateToggleIcon();
    },

    renderToggle() {
        const toggle = document.createElement('div');
        toggle.className = 'theme-switcher';
        toggle.id = 'theme-toggle';
        toggle.title = 'Cambiar Tema';
        toggle.innerHTML = this.getIcon();

        document.body.appendChild(toggle);

        toggle.addEventListener('click', () => this.toggle());
    },

    getIcon() {
        if (this.theme === 'light') {
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>`;
        } else {
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>`;
        }
    },

    updateToggleIcon() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.innerHTML = this.getIcon();
        }
    }
};

// Initialize theme immediately to avoid flash
ThemeManager.applyTheme();

// Wait for DOM to render toggle
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.renderToggle();
});
