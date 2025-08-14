// FAB (Floating Action Button) Manager - Quick access to main functions
class FABManager {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollBehavior();
    }

    setupEventListeners() {
        const fabMain = document.getElementById('fab-main');
        const fabContainer = document.getElementById('fab-container');

        if (fabMain) {
            fabMain.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFAB();
            });
        }

        // Handle FAB item clicks
        document.addEventListener('click', (e) => {
            const fabItem = e.target.closest('.fab-item');
            if (fabItem) {
                e.stopPropagation();
                const action = fabItem.getAttribute('data-action');
                this.handleFABAction(action);
                this.closeFAB();
            }
        });

        // Close FAB when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container') && this.isOpen) {
                this.closeFAB();
            }
        });

        // Close FAB on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeFAB();
            }
        });

        // Hide/show FAB based on page
        document.addEventListener('pageChanged', (e) => {
            this.updateFABVisibility(e.detail.page);
        });
    }

    setupScrollBehavior() {
        let lastScrollTop = 0;
        const fabContainer = document.getElementById('fab-container');

        window.addEventListener('scroll', () => {
            if (!fabContainer) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Hide FAB when scrolling down, show when scrolling up
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                fabContainer.classList.add('fab-hidden');
            } else {
                // Scrolling up
                fabContainer.classList.remove('fab-hidden');
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        });
    }

    toggleFAB() {
        if (this.isOpen) {
            this.closeFAB();
        } else {
            this.openFAB();
        }
    }

    openFAB() {
        const fabContainer = document.getElementById('fab-container');
        const fabMain = document.getElementById('fab-main');
        const fabMenu = document.getElementById('fab-menu');

        if (fabContainer && fabMain && fabMenu) {
            this.isOpen = true;
            fabContainer.classList.add('fab-open');
            
            // Rotate main button icon
            const mainIcon = fabMain.querySelector('i');
            if (mainIcon) {
                mainIcon.style.transform = 'rotate(45deg)';
            }

            // Animate menu items
            const fabItems = fabMenu.querySelectorAll('.fab-item');
            fabItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('fab-item-visible');
                }, index * 50);
            });

            // Add backdrop
            this.addBackdrop();
        }
    }

    closeFAB() {
        const fabContainer = document.getElementById('fab-container');
        const fabMain = document.getElementById('fab-main');
        const fabMenu = document.getElementById('fab-menu');

        if (fabContainer && fabMain && fabMenu) {
            this.isOpen = false;
            fabContainer.classList.remove('fab-open');
            
            // Reset main button icon
            const mainIcon = fabMain.querySelector('i');
            if (mainIcon) {
                mainIcon.style.transform = 'rotate(0deg)';
            }

            // Hide menu items
            const fabItems = fabMenu.querySelectorAll('.fab-item');
            fabItems.forEach(item => {
                item.classList.remove('fab-item-visible');
            });

            // Remove backdrop
            this.removeBackdrop();
        }
    }

    addBackdrop() {
        if (document.querySelector('.fab-backdrop')) return;

        const backdrop = document.createElement('div');
        backdrop.className = 'fab-backdrop';
        backdrop.addEventListener('click', () => this.closeFAB());
        document.body.appendChild(backdrop);

        // Animate backdrop
        setTimeout(() => {
            backdrop.classList.add('fab-backdrop-visible');
        }, 10);
    }

    removeBackdrop() {
        const backdrop = document.querySelector('.fab-backdrop');
        if (backdrop) {
            backdrop.classList.remove('fab-backdrop-visible');
            setTimeout(() => {
                backdrop.remove();
            }, 200);
        }
    }

    handleFABAction(action) {
        switch (action) {
            case 'generate':
                this.navigateToGenerator();
                break;
            case 'study':
                this.startStudyMode();
                break;
            case 'favorites':
                this.navigateToFavorites();
                break;
            case 'export':
                this.exportQuestions();
                break;
            default:
                console.warn('Unknown FAB action:', action);
        }
    }

    navigateToGenerator() {
        window.app.navigateTo('generator');
        window.utils.showToast('info', 'Gerador', 'Navegando para o gerador de questões');
    }

    startStudyMode() {
        window.app.navigateTo('study');
        window.utils.showToast('info', 'Modo Estudo', 'Navegando para o modo estudo');
    }

    navigateToFavorites() {
        window.app.navigateTo('favorites');
        window.utils.showToast('info', 'Favoritos', 'Navegando para questões favoritas');
    }

    async exportQuestions() {
        try {
            if (!window.storageManager || !window.storageManager.isUserSet()) {
                window.utils.showToast('warning', 'Login necessário', 'Faça login para exportar questões');
                return;
            }

            const questions = window.storageManager.getQuestions();
            if (questions.length === 0) {
                window.utils.showToast('warning', 'Sem questões', 'Não há questões para exportar');
                return;
            }

            // Show export options modal
            this.showExportModal(questions);

        } catch (error) {
            console.error('Error exporting questions:', error);
            window.utils.showToast('error', 'Erro na exportação', 'Não foi possível exportar as questões');
        }
    }

    showExportModal(questions) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content export-modal">
                <div class="modal-header">
                    <h3>Exportar Questões</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <div class="export-stats">
                            <p><strong>${questions.length}</strong> questões disponíveis para exportação</p>
                        </div>
                        <div class="export-filters">
                            <h4>Filtros de Exportação</h4>
                            <div class="filter-group">
                                <label for="export-status">Status</label>
                                <select id="export-status">
                                    <option value="all">Todas as questões</option>
                                    <option value="answered">Apenas respondidas</option>
                                    <option value="unanswered">Apenas não respondidas</option>
                                    <option value="correct">Apenas corretas</option>
                                    <option value="incorrect">Apenas incorretas</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="export-difficulty">Dificuldade</label>
                                <select id="export-difficulty">
                                    <option value="all">Todas</option>
                                    <option value="facil">Fácil</option>
                                    <option value="medio">Médio</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>
                                    <input type="checkbox" id="include-answers" checked>
                                    Incluir respostas e explicações
                                </label>
                            </div>
                            <div class="filter-group">
                                <label>
                                    <input type="checkbox" id="include-stats" checked>
                                    Incluir estatísticas pessoais
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="btn btn-primary" id="confirm-export">
                        <i class="fas fa-file-pdf"></i>
                        Exportar PDF
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle export confirmation
        const confirmBtn = modal.querySelector('#confirm-export');
        confirmBtn.addEventListener('click', () => {
            this.performExport(questions, modal);
        });

        // Animate modal
        setTimeout(() => {
            modal.classList.add('modal-visible');
        }, 10);
    }

    async performExport(allQuestions, modal) {
        try {
            const filters = this.getExportFilters(modal);
            const filteredQuestions = this.applyExportFilters(allQuestions, filters);

            if (filteredQuestions.length === 0) {
                window.utils.showToast('warning', 'Sem questões', 'Nenhuma questão corresponde aos filtros selecionados');
                return;
            }

            // Generate PDF content
            const pdfContent = this.generatePDFContent(filteredQuestions, filters);
            
            // Create and download PDF
            this.downloadPDF(pdfContent, 'questionai-questoes.pdf');

            modal.remove();
            window.utils.showToast('success', 'Exportado', `${filteredQuestions.length} questões exportadas com sucesso`);

        } catch (error) {
            console.error('Error performing export:', error);
            window.utils.showToast('error', 'Erro na exportação', 'Não foi possível gerar o PDF');
        }
    }

    getExportFilters(modal) {
        return {
            status: modal.querySelector('#export-status').value,
            difficulty: modal.querySelector('#export-difficulty').value,
            includeAnswers: modal.querySelector('#include-answers').checked,
            includeStats: modal.querySelector('#include-stats').checked
        };
    }

    applyExportFilters(questions, filters) {
        let filtered = [...questions];

        // Apply status filter
        switch (filters.status) {
            case 'answered':
                filtered = filtered.filter(q => q.answered);
                break;
            case 'unanswered':
                filtered = filtered.filter(q => !q.answered);
                break;
            case 'correct':
                filtered = filtered.filter(q => q.answered && q.correct);
                break;
            case 'incorrect':
                filtered = filtered.filter(q => q.answered && !q.correct);
                break;
        }

        // Apply difficulty filter
        if (filters.difficulty !== 'all') {
            filtered = filtered.filter(q => q.difficulty === filters.difficulty);
        }

        return filtered;
    }

    generatePDFContent(questions, filters) {
        // This is a simplified version - in a real implementation,
        // you would use a proper PDF generation library like jsPDF
        let content = `
            QuestionAI - Exportação de Questões
            Data: ${new Date().toLocaleDateString('pt-BR')}
            Total de questões: ${questions.length}
            
            ========================================
            
        `;

        questions.forEach((question, index) => {
            content += `
            ${index + 1}. ${question.question}
            
            Dificuldade: ${this.getDifficultyLabel(question.difficulty)}
            Fonte: ${question.source}
            
            `;

            if (question.options && filters.includeAnswers) {
                question.options.forEach((option, optIndex) => {
                    const marker = optIndex === question.correctAnswer ? '✓' : ' ';
                    content += `${marker} ${String.fromCharCode(65 + optIndex)}) ${option}\n`;
                });
            }

            if (filters.includeAnswers && question.explanation) {
                content += `\nExplicação: ${question.explanation}\n`;
            }

            if (filters.includeStats && question.answered) {
                const status = question.correct ? 'Correta' : 'Incorreta';
                content += `Status: ${status}\n`;
            }

            content += '\n----------------------------------------\n\n';
        });

        return content;
    }

    downloadPDF(content, filename) {
        // Simple text download - in a real implementation, use jsPDF
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            'facil': 'Fácil',
            'medio': 'Médio',
            'dificil': 'Difícil'
        };
        return labels[difficulty] || difficulty;
    }

    updateFABVisibility(currentPage) {
        const fabContainer = document.getElementById('fab-container');
        if (!fabContainer) return;

        // Hide FAB on login/register pages
        const hiddenPages = ['login', 'register'];
        
        if (hiddenPages.includes(currentPage)) {
            fabContainer.style.display = 'none';
        } else {
            fabContainer.style.display = 'flex';
        }
    }

    // Public methods for external control
    show() {
        const fabContainer = document.getElementById('fab-container');
        if (fabContainer) {
            fabContainer.classList.remove('fab-hidden');
        }
    }

    hide() {
        const fabContainer = document.getElementById('fab-container');
        if (fabContainer) {
            fabContainer.classList.add('fab-hidden');
        }
    }

    updateFABItems(items) {
        const fabMenu = document.getElementById('fab-menu');
        if (!fabMenu) return;

        fabMenu.innerHTML = items.map(item => `
            <button class="fab-item" data-action="${item.action}" title="${item.title}">
                <i class="${item.icon}"></i>
            </button>
        `).join('');
    }
}

// FAB Styles
const fabStyles = `
.fab-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.fab-container.fab-hidden {
    transform: translateY(100px);
    opacity: 0;
}

.fab-main {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    border: none;
    box-shadow: var(--shadow-lg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1001;
}

.fab-main:hover {
    background: var(--primary-hover);
    transform: scale(1.1);
}

.fab-main i {
    transition: transform 0.3s ease;
}

.fab-menu {
    position: absolute;
    bottom: 70px;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.fab-item {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--surface-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.3s ease;
    transform: scale(0);
    opacity: 0;
}

.fab-item.fab-item-visible {
    transform: scale(1);
    opacity: 1;
}

.fab-item:hover {
    background: var(--primary-color);
    color: white;
    transform: scale(1.1);
}

.fab-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.fab-backdrop.fab-backdrop-visible {
    opacity: 1;
}

.theme-toggle {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--surface-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.3s ease;
    z-index: 1000;
}

.theme-toggle:hover {
    background: var(--primary-color);
    color: white;
    transform: scale(1.1);
}

.export-modal {
    max-width: 500px;
    width: 90%;
}

.export-options {
    padding: 20px 0;
}

.export-stats {
    text-align: center;
    margin-bottom: 20px;
    padding: 15px;
    background: var(--surface-color);
    border-radius: 8px;
}

.export-filters h4 {
    margin-bottom: 15px;
    color: var(--text-color);
}

.filter-group {
    margin-bottom: 15px;
}

.filter-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: var(--text-color);
}

.filter-group select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background-color);
    color: var(--text-color);
}

.filter-group input[type="checkbox"] {
    margin-right: 8px;
}

@media (max-width: 768px) {
    .fab-container {
        bottom: 16px;
        right: 16px;
    }
    
    .theme-toggle {
        top: 16px;
        right: 16px;
    }
}
`;

// Inject FAB styles
if (!document.getElementById('fab-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'fab-styles';
    styleSheet.textContent = fabStyles;
    document.head.appendChild(styleSheet);
}

// Initialize FAB manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fabManager = new FABManager();
});

