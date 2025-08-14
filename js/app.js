// Main Application Controller
class QuestionApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'login';
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.hideLoadingScreen();
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.navigateTo(page);
            }
        });

        // Mobile menu toggle
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (
                !e.target.closest('.navbar') &&
                navMenu?.classList.contains('active')
            ) {
                navToggle?.classList.remove('active');
                navMenu?.classList.remove('active');
            }
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Theme toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                this.toggleTheme(e.target.checked);
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    checkAuthentication() {
        const userData = localStorage.getItem('questionai_user');
        if (userData && userData !== 'undefined') {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                this.showNavbar();
                this.navigateTo('dashboard');
                this.loadUserPreferences();
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('questionai_user');
                this.navigateTo('login');
            }
        } else {
            this.navigateTo('login');
        }
    }

    login(userData) {
        this.currentUser = userData;
        this.isAuthenticated = true;
        localStorage.setItem('questionai_user', JSON.stringify(userData));

        // Initialize user-specific storage
        window.storageManager.initializeUserData(userData.id);

        this.showNavbar();
        this.navigateTo('dashboard');
        this.loadUserPreferences();
        this.showToast(
            'success',
            'Login realizado com sucesso!',
            `Bem-vindo, ${userData.name}!`
        );
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('questionai_user');
        this.hideNavbar();
        this.navigateTo('login');
        this.showToast('success', 'Logout realizado', 'Até logo!');
    }

    navigateTo(page) {
        // Verificar se o usuário está autenticado para páginas protegidas
        const protectedPages = [
            'dashboard',
            'generator',
            'questions',
            'reports',
            'profile',
            'faq',
        ];

        if (protectedPages.includes(page) && !this.isAuthenticated) {
            this.navigateTo('login');
            this.showToast(
                'warning',
                'Acesso negado',
                'Faça login para acessar esta página'
            );
            return;
        }

        // Esconder todas as páginas
        const pages = document.querySelectorAll('.page');
        pages.forEach((p) => p.classList.remove('active'));

        // Mostrar a página solicitada
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;

            // Atualizar navegação ativa
            this.updateActiveNavigation(page);

            // Carregar conteúdo específico da página
            this.loadPageContent(page);
        }

        if (page === 'study') {
            window.studyModeManager.loadStudyHistory();
        }
    }

    updateActiveNavigation(page) {
        // Remover classe active de todos os links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach((link) => link.classList.remove('active'));

        // Adicionar classe active ao link atual
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Close mobile menu
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (navToggle && navMenu) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }

    showNavbar() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.style.display = 'block';
            navbar.classList.add('authenticated');
        }
    }

    hideNavbar() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.style.display = 'none';
            navbar.classList.remove('authenticated');
        }
    }
    loadPageContent(page) {
        switch (page) {
            case 'dashboard':
                if (window.reportsManager) {
                    window.reportsManager.generateReportData();
                    window.reportsManager.renderDashboardStats();
                }
                break;
            case 'study':
                if (window.studyModeManager) {
                    window.studyModeManager.renderStudyHistory();
                }
                break;
            case 'questions':
                if (window.questionsManager) {
                    window.questionsManager.loadQuestions();
                }
                break;
            case 'reports':
                if (window.reportsManager) {
                    window.reportsManager.loadReports();
                }
                break;
            case 'profile':
                if (window.profileManager) {
                    window.profileManager.loadProfile();
                }
                // Update gamification achievements in profile
                if (window.gamificationManager) {
                    window.gamificationManager.updateProfileAchievements();
                }
                break;
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1000);
    }

    loadUserPreferences() {
        const preferences = localStorage.getItem('questionai_preferences');
        if (preferences) {
            try {
                const prefs = JSON.parse(preferences);

                // Apply theme
                if (prefs.darkMode) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    const darkModeToggle =
                        document.getElementById('dark-mode-toggle');
                    if (darkModeToggle) {
                        darkModeToggle.checked = true;
                    }
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            }
        }
    }

    toggleTheme(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Save preference
        const preferences = JSON.parse(
            localStorage.getItem('questionai_preferences') || '{}'
        );
        preferences.darkMode = isDark;
        localStorage.setItem(
            'questionai_preferences',
            JSON.stringify(preferences)
        );
    }

    handleResize() {
        // Handle responsive behavior
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');

        if (window.innerWidth > 768) {
            if (navMenu) navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
        }
    }

    showToast(type, title, message) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

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
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuestionApp();
});

// Global utility functions
window.utils = {
    formatDate: (date) => window.app.formatDate(date),
    formatFileSize: (bytes) => window.app.formatFileSize(bytes),
    generateId: () => window.app.generateId(),
    validateEmail: (email) => window.app.validateEmail(email),
    validatePassword: (password) => window.app.validatePassword(password),
    sanitizeInput: (input) => window.app.sanitizeInput(input),
    showToast: (type, title, message) =>
        window.app.showToast(type, title, message),
    showModal: (modalId) => window.app.showModal(modalId),
    hideModal: (modalId) => window.app.hideModal(modalId),
    debounce: (func, wait) => {
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
};
