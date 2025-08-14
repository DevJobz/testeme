// Theme Manager - Handle dark/light theme switching
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.applyTheme();
    }

    loadTheme() {
        // Load theme from user preferences
        if (window.storageManager && window.storageManager.isUserSet()) {
            const preferences = window.storageManager.getPreferences();
            this.currentTheme = preferences.theme || 'light';
        } else {
            // Fallback to localStorage for non-logged users
            this.currentTheme = localStorage.getItem('questionai_theme') || 'light';
        }

        // Check system preference if no saved theme
        if (this.currentTheme === 'auto' || !this.currentTheme) {
            this.currentTheme = this.getSystemTheme();
        }
    }

    saveTheme() {
        if (window.storageManager && window.storageManager.isUserSet()) {
            const preferences = window.storageManager.getPreferences();
            preferences.theme = this.currentTheme;
            window.storageManager.savePreferences(preferences);
        } else {
            localStorage.setItem('questionai_theme', this.currentTheme);
        }
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setupEventListeners() {
        // Theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Profile page theme toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                this.setTheme(e.target.checked ? 'dark' : 'light');
            });
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme();
            }
        });

        // Update theme toggle when user logs in/out
        document.addEventListener('userLogin', () => {
            this.loadTheme();
            this.applyTheme();
        });

        document.addEventListener('userLogout', () => {
            this.loadTheme();
            this.applyTheme();
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.saveTheme();
        this.applyTheme();
        this.updateThemeControls();
        
        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));

        // Show feedback
        const themeLabel = theme === 'dark' ? 'escuro' : 'claro';
        window.utils.showToast('info', 'Tema alterado', `Tema ${themeLabel} ativado`);
    }

    applyTheme() {
        const effectiveTheme = this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.body.classList.toggle('dark-theme', effectiveTheme === 'dark');
        document.body.classList.toggle('light-theme', effectiveTheme === 'light');

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(effectiveTheme);
    }

    updateMetaThemeColor(theme) {
        let themeColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
        
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = themeColor;
    }

    updateThemeControls() {
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                if (this.currentTheme === 'dark') {
                    icon.className = 'fas fa-sun';
                    themeToggle.title = 'Alternar para tema claro';
                } else {
                    icon.className = 'fas fa-moon';
                    themeToggle.title = 'Alternar para tema escuro';
                }
            }
        }

        // Update profile page toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.currentTheme === 'dark';
        }
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Check if current theme is dark
    isDarkTheme() {
        const effectiveTheme = this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
        return effectiveTheme === 'dark';
    }

    // Get theme-specific colors for charts and other components
    getThemeColors() {
        const isDark = this.isDarkTheme();
        
        return {
            primary: isDark ? '#6366f1' : '#4f46e5',
            secondary: isDark ? '#64748b' : '#6b7280',
            success: isDark ? '#10b981' : '#059669',
            warning: isDark ? '#f59e0b' : '#d97706',
            error: isDark ? '#ef4444' : '#dc2626',
            background: isDark ? '#1a1a1a' : '#ffffff',
            surface: isDark ? '#2d2d2d' : '#f8fafc',
            text: isDark ? '#ffffff' : '#1f2937',
            textSecondary: isDark ? '#d1d5db' : '#6b7280',
            border: isDark ? '#374151' : '#e5e7eb'
        };
    }

    // Apply theme-specific styles to charts
    applyChartTheme(chart) {
        const colors = this.getThemeColors();
        
        if (chart && chart.options) {
            // Update chart colors based on theme
            chart.options.plugins = chart.options.plugins || {};
            chart.options.plugins.legend = chart.options.plugins.legend || {};
            chart.options.plugins.legend.labels = chart.options.plugins.legend.labels || {};
            chart.options.plugins.legend.labels.color = colors.text;

            chart.options.scales = chart.options.scales || {};
            Object.keys(chart.options.scales).forEach(scaleKey => {
                const scale = chart.options.scales[scaleKey];
                scale.ticks = scale.ticks || {};
                scale.ticks.color = colors.textSecondary;
                scale.grid = scale.grid || {};
                scale.grid.color = colors.border;
            });

            chart.update();
        }
    }

    // Initialize theme for new components
    initializeComponentTheme(component) {
        // This method can be called when new components are created
        // to ensure they use the correct theme
        const colors = this.getThemeColors();
        
        if (component && typeof component.updateTheme === 'function') {
            component.updateTheme(colors);
        }
    }
}

// CSS Custom Properties for theme switching
const themeStyles = `
:root {
    /* Light theme colors */
    --primary-color: #4f46e5;
    --primary-hover: #4338ca;
    --secondary-color: #6b7280;
    --success-color: #059669;
    --warning-color: #d97706;
    --error-color: #dc2626;
    --background-color: #ffffff;
    --surface-color: #f8fafc;
    --text-color: #1f2937;
    --text-secondary: #6b7280;
    --border-color: #e5e7eb;
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
    /* Dark theme colors */
    --primary-color: #6366f1;
    --primary-hover: #5b21b6;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --background-color: #1a1a1a;
    --surface-color: #2d2d2d;
    --text-color: #ffffff;
    --text-secondary: #d1d5db;
    --border-color: #374151;
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

/* Theme transition */
* {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Dark theme specific adjustments */
[data-theme="dark"] .loading-screen {
    background: var(--background-color);
}

[data-theme="dark"] .navbar {
    background: var(--surface-color);
    border-bottom-color: var(--border-color);
}

[data-theme="dark"] .page {
    background: var(--background-color);
    color: var(--text-color);
}

[data-theme="dark"] .card,
[data-theme="dark"] .question-card,
[data-theme="dark"] .dashboard-card {
    background: var(--surface-color);
    border-color: var(--border-color);
}

[data-theme="dark"] input,
[data-theme="dark"] textarea,
[data-theme="dark"] select {
    background: var(--surface-color);
    border-color: var(--border-color);
    color: var(--text-color);
}

[data-theme="dark"] .btn-secondary {
    background: var(--surface-color);
    border-color: var(--border-color);
    color: var(--text-color);
}

[data-theme="dark"] .btn-secondary:hover {
    background: var(--border-color);
}
`;

// Inject theme styles
if (!document.getElementById('theme-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'theme-styles';
    styleSheet.textContent = themeStyles;
    document.head.appendChild(styleSheet);
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

