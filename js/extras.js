// Extra Features Manager
class ExtrasManager {
    constructor() {
        this.searchIndex = [];
        this.favorites = [];
        this.notifications = [];
        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupSearchFunctionality();
        this.setupNotifications();
        this.loadFavorites();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearchModal();
            }

            // Ctrl/Cmd + N for new question generation
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                window.app.navigateTo('generator');
            }

            // Ctrl/Cmd + D for dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                window.app.navigateTo('dashboard');
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }

            // Ctrl/Cmd + / for help
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
    }

    setupSearchFunctionality() {
        this.buildSearchIndex();

        // Add search functionality to questions page
        this.addSearchToQuestionsPage();
    }

    buildSearchIndex() {
        // Wait for storageManager to be available
        if (!window.storageManager || !window.storageManager.currentUserId) {
            setTimeout(() => this.buildSearchIndex(), 100);
            return;
        }

        const questions = window.storageManager.getQuestions();

        this.searchIndex = questions.map((question) => ({
            id: question.id,
            question: question.question.toLowerCase(),
            type: question.type,
            difficulty: question.difficulty,
            source: question.source.toLowerCase(),
            answered: question.answered,
            correct: question.correct,
            explanation: question.explanation?.toLowerCase() || '',
            options:
                question.options?.map((opt) => opt.toLowerCase()).join(' ') ||
                '',
        }));
    }

    addSearchToQuestionsPage() {
        const questionsPage = document.getElementById('questions-page');
        if (!questionsPage) return;

        // Add search bar to questions page
        const filtersDiv = questionsPage.querySelector('.questions-filters');
        if (filtersDiv && !filtersDiv.querySelector('.search-bar')) {
            const searchHTML = `
                <div class="filter-group search-bar" style="flex: 1; max-width: 300px;">
                    <label for="questions-search">Buscar</label>
                    <div style="position: relative;">
                        <input type="text" id="questions-search" placeholder="Buscar questões..." style="padding-left: 40px;">
                        <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                    </div>
                </div>
            `;
            filtersDiv.insertAdjacentHTML('beforeend', searchHTML);

            // Add search functionality
            const searchInput = document.getElementById('questions-search');
            if (searchInput) {
                const searchHandler = (e) => {
                    const query = e.target.value.toLowerCase().trim();
                    this.filterQuestions(query);
                };

                if (window.utils && window.utils.debounce) {
                    searchInput.addEventListener(
                        'input',
                        window.utils.debounce(searchHandler, 300)
                    );
                } else {
                    searchInput.addEventListener('input', searchHandler);
                }
            }
        }
    }

    filterQuestions(query) {
        if (!query.trim()) {
            // Reset to show all questions
            if (window.questionsManager) {
                window.questionsManager.applyFilters();
            }
            return;
        }

        const searchTerms = query
            .toLowerCase()
            .split(' ')
            .filter((term) => term.length > 0);
        const results = this.searchIndex.filter((item) => {
            return searchTerms.every(
                (term) =>
                    item.question.includes(term) ||
                    item.source.includes(term) ||
                    item.explanation.includes(term) ||
                    item.options.includes(term) ||
                    item.type.includes(term) ||
                    item.difficulty.includes(term)
            );
        });

        // Update questions display with search results
        if (window.questionsManager) {
            const allQuestions = window.storageManager.getQuestions();
            const filteredQuestions = allQuestions.filter((q) =>
                results.some((r) => r.id === q.id)
            );

            window.questionsManager.filteredQuestions = filteredQuestions;
            window.questionsManager.renderQuestions();
        }
    }

    openSearchModal() {
        // Create search modal if it doesn't exist
        if (!document.getElementById('search-modal')) {
            this.createSearchModal();
        }

        const modal = document.getElementById('search-modal');
        const searchInput = document.getElementById('global-search-input');

        if (modal && searchInput) {
            modal.classList.add('active');
            searchInput.focus();
            searchInput.select();
        }
    }

    createSearchModal() {
        const modalHTML = `
            <div class="modal" id="search-modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-search"></i> Busca Global</h3>
                        <button class="modal-close" id="close-search-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <input type="text" id="global-search-input" placeholder="Digite para buscar questões, relatórios, configurações..." style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid var(--border); border-radius: 8px;">
                        </div>
                        <div id="search-results" style="max-height: 400px; overflow-y: auto;">
                            <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                                <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                                <p>Digite algo para começar a buscar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners
        const closeBtn = document.getElementById('close-search-modal');
        const searchInput = document.getElementById('global-search-input');
        const modal = document.getElementById('search-modal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        if (searchInput) {
            const searchHandler = (e) => {
                this.performGlobalSearch(e.target.value);
            };

            if (window.utils && window.utils.debounce) {
                searchInput.addEventListener(
                    'input',
                    window.utils.debounce(searchHandler, 300)
                );
            } else {
                searchInput.addEventListener('input', searchHandler);
            }
        }
    }

    performGlobalSearch(query) {
        const resultsDiv = document.getElementById('search-results');
        if (!resultsDiv) return;

        if (!query.trim()) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                    <p>Digite algo para começar a buscar</p>
                </div>
            `;
            return;
        }

        const results = this.searchEverything(query);

        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                    <p>Nenhum resultado encontrado</p>
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = results
            .map(
                (result) => `
            <div class="search-result-item" style="padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;" onclick="window.extrasManager.handleSearchResultClick('${result.type}', '${result.id}')">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas ${result.icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 4px; color: var(--text-primary);">${result.title}</h4>
                        <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">${result.description}</p>
                    </div>
                    <div style="color: var(--text-light); font-size: 12px;">
                        ${result.category}
                    </div>
                </div>
            </div>
        `
            )
            .join('');
    }

    searchEverything(query) {
        const results = [];
        const searchTerms = query
            .toLowerCase()
            .split(' ')
            .filter((term) => term.length > 0);

        // Search questions
        this.searchIndex.forEach((item) => {
            const matches = searchTerms.every(
                (term) =>
                    item.question.includes(term) ||
                    item.source.includes(term) ||
                    item.explanation.includes(term) ||
                    item.options.includes(term)
            );

            if (matches) {
                results.push({
                    type: 'question',
                    id: item.id,
                    title: this.truncateText(item.question, 60),
                    description: `Fonte: ${item.source} | ${
                        item.answered ? 'Respondida' : 'Não respondida'
                    }`,
                    category: 'Questão',
                    icon: 'fa-question-circle',
                });
            }
        });

        // Search pages/features
        const pages = [
            {
                id: 'dashboard',
                title: 'Dashboard',
                description: 'Visão geral e estatísticas',
                icon: 'fa-home',
            },
            {
                id: 'generator',
                title: 'Gerar Questões',
                description: 'Criar novas questões a partir de PDFs ou textos',
                icon: 'fa-magic',
            },
            {
                id: 'questions',
                title: 'Minhas Questões',
                description: 'Visualizar e responder questões',
                icon: 'fa-list',
            },
            {
                id: 'reports',
                title: 'Relatórios',
                description: 'Análises e gráficos de desempenho',
                icon: 'fa-chart-bar',
            },
            {
                id: 'profile',
                title: 'Perfil',
                description: 'Configurações pessoais e preferências',
                icon: 'fa-user',
            },
        ];

        pages.forEach((page) => {
            const matches = searchTerms.every(
                (term) =>
                    page.title.toLowerCase().includes(term) ||
                    page.description.toLowerCase().includes(term)
            );

            if (matches) {
                results.push({
                    type: 'page',
                    id: page.id,
                    title: page.title,
                    description: page.description,
                    category: 'Página',
                    icon: page.icon,
                });
            }
        });

        return results.slice(0, 10); // Limit to 10 results
    }

    handleSearchResultClick(type, id) {
        const modal = document.getElementById('search-modal');
        if (modal) {
            modal.classList.remove('active');
        }

        if (type === 'question') {
            window.app.navigateTo('questions');
            setTimeout(() => {
                if (window.questionsManager) {
                    window.questionsManager.openQuestionModal(id);
                }
            }, 100);
        } else if (type === 'page') {
            window.app.navigateTo(id);
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach((modal) => {
            modal.classList.remove('active');
        });
    }

    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl/Cmd + K', description: 'Abrir busca global' },
            { key: 'Ctrl/Cmd + N', description: 'Gerar novas questões' },
            { key: 'Ctrl/Cmd + D', description: 'Ir para dashboard' },
            { key: 'Ctrl/Cmd + /', description: 'Mostrar atalhos' },
            { key: 'Escape', description: 'Fechar modais' },
        ];

        const shortcutsHTML = shortcuts
            .map(
                (shortcut) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
                <span style="font-family: monospace; background: var(--surface); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${shortcut.key}</span>
                <span style="color: var(--text-secondary);">${shortcut.description}</span>
            </div>
        `
            )
            .join('');

        window.utils.showToast(
            'info',
            'Atalhos de Teclado',
            `
            <div style="max-width: 300px;">
                ${shortcutsHTML}
            </div>
        `
        );
    }

    // Favorites system
    loadFavorites() {
        this.favorites = JSON.parse(
            localStorage.getItem('questionai_favorites') || '[]'
        );
    }

    addToFavorites(questionId) {
        if (!this.favorites.includes(questionId)) {
            this.favorites.push(questionId);
            this.saveFavorites();
            window.utils.showToast(
                'success',
                'Adicionado aos favoritos',
                'Questão salva nos favoritos'
            );
        }
    }

    removeFromFavorites(questionId) {
        this.favorites = this.favorites.filter((id) => id !== questionId);
        this.saveFavorites();
        window.utils.showToast(
            'info',
            'Removido dos favoritos',
            'Questão removida dos favoritos'
        );
    }

    saveFavorites() {
        localStorage.setItem(
            'questionai_favorites',
            JSON.stringify(this.favorites)
        );
    }

    isFavorite(questionId) {
        return this.favorites.includes(questionId);
    }

    // Notifications system
    setupNotifications() {
        this.loadNotifications();
        this.scheduleNotifications();
    }

    loadNotifications() {
        this.notifications = JSON.parse(
            localStorage.getItem('questionai_notifications') || '[]'
        );
    }

    addNotification(notification) {
        const newNotification = {
            id: window.utils.generateId(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification,
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.showNotificationToast(newNotification);
    }

    saveNotifications() {
        localStorage.setItem(
            'questionai_notifications',
            JSON.stringify(this.notifications)
        );
    }

    showNotificationToast(notification) {
        window.utils.showToast(
            notification.type || 'info',
            notification.title,
            notification.message
        );
    }

    scheduleNotifications() {
        // Verificar se o usuário está definido
        if (
            !window.app ||
            !window.app.currentUser ||
            !window.app.currentUser.lastLogin
        ) {
            return;
        }

        const lastLogin = window.app.currentUser.lastLogin;
        if (lastLogin) {
            const daysSinceLogin = Math.floor(
                (Date.now() - new Date(lastLogin)) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLogin >= 1) {
                this.addNotification({
                    type: 'info',
                    title: 'Hora de praticar!',
                    message: 'Que tal responder algumas questões hoje?',
                });
            }
        }
    }

    // Utility functions
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Export/Import functionality
    exportData() {
        const data = {
            questions: window.storageManager.getQuestions(),
            sessions: window.storageManager.getSessions(),
            preferences: JSON.parse(
                localStorage.getItem('questionai_preferences') || '{}'
            ),
            favorites: this.favorites,
            exportDate: new Date().toISOString(),
            version: '1.0',
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `questionai-backup-${
            new Date().toISOString().split('T')[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.utils.showToast(
            'success',
            'Dados exportados',
            'Backup criado com sucesso!'
        );
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (data.questions) {
                    data.questions.forEach((question) => {
                        window.storageManager.saveQuestion(question);
                    });
                }

                if (data.sessions) {
                    data.sessions.forEach((session) => {
                        window.storageManager.saveSession(session);
                    });
                }

                if (data.preferences) {
                    localStorage.setItem(
                        'questionai_preferences',
                        JSON.stringify(data.preferences)
                    );
                }

                if (data.favorites) {
                    this.favorites = data.favorites;
                    this.saveFavorites();
                }

                window.utils.showToast(
                    'success',
                    'Dados importados',
                    'Backup restaurado com sucesso!'
                );

                // Refresh current page
                if (
                    window.app.currentPage === 'questions' &&
                    window.questionsManager
                ) {
                    window.questionsManager.loadQuestions();
                }
            } catch (error) {
                console.error('Import error:', error);
                window.utils.showToast(
                    'error',
                    'Erro na importação',
                    'Arquivo inválido ou corrompido'
                );
            }
        };

        reader.readAsText(file);
    }
}

// Initialize ExtrasManager
document.addEventListener('DOMContentLoaded', () => {
    window.extrasManager = new ExtrasManager();
});
