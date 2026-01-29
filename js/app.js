// Main application controller

const App = {
    currentView: 'dashboard',
    state: {
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    },

    /**
     * Initialize application
     */
    init() {
        console.log('Initializing Engineering Lab Attendance System...');

        // Set up navigation
        this.setupNavigation();

        // Load initial view
        this.loadView('dashboard');

        console.log('Application initialized successfully!');
    },

    /**
     * Setup navigation
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-view]');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.loadView(view);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.loadView(e.state.view, false);
            }
        });
    },

    /**
     * Load view
     */
    loadView(viewName, pushState = true) {
        console.log(`Loading view: ${viewName}`);

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        // Update current view
        this.currentView = viewName;

        // Update URL
        if (pushState) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }

        // Render view
        switch (viewName) {
            case 'dashboard':
                Dashboard.render();
                break;
            case 'personnel':
                Personnel.render();
                break;
            case 'justifications':
                Justifications.render();
                break;
            case 'ranking':
                Ranking.render();
                break;
            case 'settings':
                Settings.render();
                break;
            default:
                console.warn(`Unknown view: ${viewName}`);
                Dashboard.render();
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
