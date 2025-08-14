// Favorites Manager - Handle favorite questions functionality
class FavoritesManager {
    constructor() {
        this.favorites = new Set();
        this.init();
    }

    init() {
        this.loadFavorites();
        this.setupEventListeners();
    }

    loadFavorites() {
        if (window.storageManager && window.storageManager.isUserSet()) {
            const preferences = window.storageManager.getPreferences();
            this.favorites = new Set(preferences.favorites || []);
        }
    }

    saveFavorites() {
        if (window.storageManager && window.storageManager.isUserSet()) {
            const preferences = window.storageManager.getPreferences();
            preferences.favorites = Array.from(this.favorites);
            window.storageManager.savePreferences(preferences);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) {
                const btn = e.target.closest('.favorite-btn');
                const questionId = btn.getAttribute('data-question-id');
                if (questionId) {
                    this.toggleFavorite(questionId);
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-page="favorites"]')) {
                setTimeout(() => this.displayFavorites(), 100);
            }
        });
    }

    toggleFavorite(questionId) {
        if (this.favorites.has(questionId)) {
            this.favorites.delete(questionId);
            this.updateFavoriteButton(questionId, false);
            window.utils.showToast(
                'info',
                'Removido',
                'Questão removida dos favoritos'
            );
        } else {
            this.favorites.add(questionId);
            this.updateFavoriteButton(questionId, true);
            window.utils.showToast(
                'success',
                'Adicionado',
                'Questão adicionada aos favoritos'
            );
        }

        this.saveFavorites();

        if (
            document
                .getElementById('favorites-page')
                .classList.contains('active')
        ) {
            this.displayFavorites();
        }
    }

    updateFavoriteButton(questionId, isFavorite) {
        const buttons = document.querySelectorAll(
            `[data-question-id="${questionId}"] .favorite-btn`
        );
        buttons.forEach((btn) => {
            const icon = btn.querySelector('i');
            if (icon) {
                if (isFavorite) {
                    icon.className = 'fas fa-heart';
                    btn.classList.add('favorited');
                    btn.title = 'Remover dos favoritos';
                } else {
                    icon.className = 'far fa-heart';
                    btn.classList.remove('favorited');
                    btn.title = 'Adicionar aos favoritos';
                }
            }
        });
    }

    isFavorite(questionId) {
        return this.favorites.has(questionId);
    }

    getFavoriteQuestions() {
        if (!window.storageManager || !window.storageManager.isUserSet()) {
            return [];
        }

        const allQuestions = window.storageManager.getQuestions();
        return allQuestions.filter((question) =>
            this.favorites.has(question.id)
        );
    }

    displayFavorites() {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) return;

        const favoriteQuestions = this.getFavoriteQuestions();

        if (favoriteQuestions.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="far fa-heart"></i>
                    </div>
                    <h3>Nenhuma questão favorita</h3>
                    <p>Marque questões como favoritas para acessá-las rapidamente aqui.</p>
                    <button class="btn btn-primary" onclick="window.app.navigateTo('questions')">
                        <i class="fas fa-list"></i>
                        Ver Todas as Questões
                    </button>
                </div>
            `;
            return;
        }

        const groupedFavorites = this.groupQuestionsBySource(favoriteQuestions);

        let html = `
            <div class="favorites-header">
                <div class="favorites-stats">
                    <span class="stat-item">
                        <i class="fas fa-heart"></i>
                        ${favoriteQuestions.length} questões favoritas
                    </span>
                    <span class="stat-item">
                        <i class="fas fa-folder"></i>
                        ${Object.keys(groupedFavorites).length} fontes
                    </span>
                </div>
                <div class="favorites-actions">
                    <button class="btn btn-secondary" id="clear-all-favorites">
                        <i class="fas fa-trash"></i>
                        Limpar Todos
                    </button>
                    <button class="btn btn-primary" id="export-favorites">
                        <i class="fas fa-file-pdf"></i>
                        Exportar PDF
                    </button>
                </div>
            </div>
        `;

        Object.entries(groupedFavorites).forEach(([source, questions]) => {
            html += `
                <div class="favorites-group">
                    <div class="group-header">
                        <h3>
                            <i class="fas fa-folder-open"></i>
                            ${source}
                        </h3>
                        <span class="question-count">${
                            questions.length
                        } questões</span>
                    </div>
                    <div class="questions-grid">
                        ${questions
                            .map((question) =>
                                this.renderFavoriteQuestion(question)
                            )
                            .join('')}
                    </div>
                </div>
            `;
        });

        favoritesList.innerHTML = html;
        this.setupFavoritesPageEventListeners();
    }

    groupQuestionsBySource(questions) {
        return questions.reduce((groups, question) => {
            const source = question.source || 'Fonte desconhecida';
            if (!groups[source]) {
                groups[source] = [];
            }
            groups[source].push(question);
            return groups;
        }, {});
    }

    renderFavoriteQuestion(question) {
        const difficultyClass = question.difficulty || 'medio';
        const difficultyLabel = this.getDifficultyLabel(question.difficulty);
        const statusClass = question.answered
            ? question.correct
                ? 'correct'
                : 'incorrect'
            : 'unanswered';
        const statusIcon = question.answered
            ? question.correct
                ? 'fa-check-circle'
                : 'fa-times-circle'
            : 'fa-circle';

        return `
            <div class="question-card favorite-card" data-question-id="${
                question.id
            }">
                <div class="question-header">
                    <div class="question-meta">
                        <span class="difficulty-badge ${difficultyClass}">${difficultyLabel}</span>
                        <span class="status-badge ${statusClass}">
                            <i class="fas ${statusIcon}"></i>
                            ${this.getStatusLabel(question)}
                        </span>
                    </div>
                    <div class="question-actions">
                        <button class="favorite-btn favorited" data-question-id="${
                            question.id
                        }" title="Remover dos favoritos">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="action-btn" onclick="window.questionsManager.openQuestionModal('${
                            question.id
                        }')" title="Responder questão">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="question-content">
                    <h4>${this.truncateText(question.question, 100)}</h4>
                    <div class="question-info">
                        <span class="info-item">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(question.createdAt)}
                        </span>
                        <span class="info-item">
                            <i class="fas fa-tag"></i>
                            ${question.type || 'Múltipla escolha'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    setupFavoritesPageEventListeners() {
        const clearAllBtn = document.getElementById('clear-all-favorites');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFavorites();
            });
        }

        const exportBtn = document.getElementById('export-favorites');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportFavoritesToPDF();
            });
        }
    }

    clearAllFavorites() {
        if (this.favorites.size === 0) {
            window.utils.showToast(
                'info',
                'Nenhum favorito',
                'Não há questões favoritas para remover'
            );
            return;
        }

        const confirmMessage = `Tem certeza que deseja remover todas as ${this.favorites.size} questões dos favoritos?`;

        if (confirm(confirmMessage)) {
            this.favorites.clear();
            this.saveFavorites();
            this.displayFavorites();

            document
                .querySelectorAll('.favorite-btn.favorited')
                .forEach((btn) => {
                    const questionId = btn.getAttribute('data-question-id');
                    this.updateFavoriteButton(questionId, false);
                });

            window.utils.showToast(
                'success',
                'Favoritos limpos',
                'Todas as questões foram removidas dos favoritos'
            );
        }
    }

    async exportFavoritesToPDF() {
        const favoriteQuestions = this.getFavoriteQuestions();

        if (favoriteQuestions.length === 0) {
            window.utils.showToast(
                'warning',
                'Sem favoritos',
                'Não há questões favoritas para exportar'
            );
            return;
        }

        try {
            window.utils.showToast(
                'info',
                'Exportando...',
                'Funcionalidade de exportação em desenvolvimento'
            );
        } catch (error) {
            console.error('Error exporting favorites to PDF:', error);
            window.utils.showToast(
                'error',
                'Erro na exportação',
                'Não foi possível exportar os favoritos'
            );
        }
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            facil: 'Fácil',
            medio: 'Médio',
            dificil: 'Difícil',
        };
        return labels[difficulty] || 'Médio';
    }

    getStatusLabel(question) {
        if (!question.answered) return 'Não respondida';
        return question.correct ? 'Correta' : 'Incorreta';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    addFavoriteButton(question) {
        const isFav = this.isFavorite(question.id);
        const heartIcon = isFav ? 'fas fa-heart' : 'far fa-heart';
        const favClass = isFav ? 'favorited' : '';
        const title = isFav
            ? 'Remover dos favoritos'
            : 'Adicionar aos favoritos';

        return `
            <button class="favorite-btn ${favClass}" data-question-id="${question.id}" title="${title}">
                <i class="${heartIcon}"></i>
            </button>
        `;
    }

    getFavoritesCount() {
        return this.favorites.size;
    }

    searchFavorites(query) {
        const favoriteQuestions = this.getFavoriteQuestions();
        const lowercaseQuery = query.toLowerCase();

        return favoriteQuestions.filter(
            (question) =>
                question.question.toLowerCase().includes(lowercaseQuery) ||
                question.source.toLowerCase().includes(lowercaseQuery) ||
                (question.explanation &&
                    question.explanation.toLowerCase().includes(lowercaseQuery))
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.favoritesManager = new FavoritesManager();
});
