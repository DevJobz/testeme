// Questions Manager
class QuestionsManager {
    constructor() {
        this.questions = [];
        this.filteredQuestions = [];
        this.currentQuestion = null;
        this.questionStartTime = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
        this.setupQuestionCardBehavior(); // Adicione esta linha
    }

    setupEventListeners() {
        // Filter controls
        const filterStatus = document.getElementById('filter-status');
        const filterDifficulty = document.getElementById('filter-difficulty');
        const filterType = document.getElementById('filter-type');

        [filterStatus, filterDifficulty, filterType].forEach((filter) => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });
    }

    setupModal() {
        const modal = document.getElementById('question-modal');
        const closeBtn = document.getElementById('close-question-modal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeQuestionModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeQuestionModal();
                }
            });
        }
    }

    resetQuestionState() {
        this.currentQuestion = null;
        this.questionStartTime = null;

        const expandedElements = document.querySelectorAll(
            '.question-expanded-content'
        );
        expandedElements.forEach((el) => (el.style.display = 'none'));
    }

    loadQuestions() {
        this.questions = window.storageManager.getQuestions();
        this.applyFilters();
        this.renderQuestions();
    }

    applyFilters() {
        const statusFilter =
            document.getElementById('filter-status')?.value || 'all';
        const difficultyFilter =
            document.getElementById('filter-difficulty')?.value || 'all';
        const typeFilter =
            document.getElementById('filter-type')?.value || 'all';

        this.filteredQuestions = this.questions.filter((question) => {
            // Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'answered' && !question.answered)
                    return false;
                if (statusFilter === 'unanswered' && question.answered)
                    return false;
            }

            // Difficulty filter
            if (
                difficultyFilter !== 'all' &&
                question.difficulty !== difficultyFilter
            ) {
                return false;
            }

            // Type filter
            if (typeFilter !== 'all' && question.type !== typeFilter) {
                return false;
            }

            return true;
        });

        this.renderQuestions();
    }

    renderQuestions() {
        const questionsList = document.getElementById('questions-list');
        if (!questionsList) return;

        if (this.filteredQuestions.length === 0) {
            questionsList.innerHTML = this.renderEmptyState();
            return;
        }

        questionsList.innerHTML = this.filteredQuestions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((question) => this.renderQuestionCard(question))
            .join('');

        // Add event listeners to question cards
        this.attachQuestionCardListeners();
    }

    renderQuestionCard(question) {
        const difficultyClass = this.getDifficultyClass(question.difficulty);
        const statusIcon = question.answered
            ? '<i class="fas fa-check-circle" style="color: var(--accent-color);"></i>'
            : '<i class="fas fa-clock" style="color: var(--warning-color);"></i>';

        const correctnessIndicator = question.answered
            ? question.correct
                ? '<span class="question-badge badge-easy"><i class="fas fa-check"></i> Correto</span>'
                : '<span class="question-badge badge-hard"><i class="fas fa-times"></i> Incorreto</span>'
            : '';

        // Render expanded content if this question is being answered
        const expandedContent = this.renderExpandedQuestionContent(question);

        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-meta">
                        ${statusIcon}
                        <span class="question-badge ${difficultyClass}">
                            ${this.formatDifficulty(question.difficulty)}
                        </span>
                        <span class="question-badge">
                            ${this.formatType(question.type)}
                        </span>
                        ${correctnessIndicator}
                    </div>
                    <small style="color: var(--text-light);">
                        ${window.utils.formatDate(question.createdAt)}
                    </small>
                </div>
                <div class="question-content">
                    <h4>${this.truncateText(question.question, 100)}</h4>
                    <p><strong>Fonte:</strong> ${question.source}</p>
                    ${
                        question.answered
                            ? `<p><strong>Tempo gasto:</strong> ${this.formatTime(
                                  question.timeSpent
                              )}</p>`
                            : ''
                    }
                </div>
                <div class="question-actions">
                    <button class="btn btn-primary btn-sm answer-question-btn" data-question-id="${
                        question.id
                    }">
                        <i class="fas fa-play"></i>
                        ${question.answered ? 'Ver Resposta' : 'Responder'}
                    </button>
                    <button class="btn btn-secondary btn-sm view-details-btn" data-question-id="${
                        question.id
                    }">
                        <i class="fas fa-eye"></i>
                        Detalhes
                    </button>
                    ${
                        window.favoritesManager
                            ? window.favoritesManager.addFavoriteButton(
                                  question
                              )
                            : ''
                    }
                    <button class="btn btn-danger btn-sm delete-question-btn" data-question-id="${
                        question.id
                    }">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>
                </div>
                <div class="question-expanded-content" id="expanded-${
                    question.id
                }" style="display: none;">
                    ${expandedContent}
                </div>
            </div>
        `;
    }

    renderExpandedQuestionContent(question) {
        const isAnswered = question.answered;
        const showResults = isAnswered;

        let optionsHtml = '';

        if (question.type === 'dissertativa') {
            optionsHtml = `
                <div class="question-options">
                    <textarea 
                        id="essay-answer-${question.id}" 
                        placeholder="Digite sua resposta aqui..."
                        style="width: 100%; min-height: 150px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-family: inherit;"
                        ${isAnswered ? 'readonly' : ''}
                    >${isAnswered ? question.userAnswer || '' : ''}</textarea>
                </div>
            `;
        } else if (question.options) {
            optionsHtml = `
                <div class="question-options">
                    ${question.options
                        .map((option, index) => {
                            let optionClass = '';
                            if (showResults) {
                                if (index === question.correctAnswer) {
                                    optionClass = 'correct-answer';
                                } else if (
                                    index === question.userAnswer &&
                                    index !== question.correctAnswer
                                ) {
                                    optionClass = 'wrong-answer';
                                }
                            }

                            return `
                            <div class="option-item ${optionClass}" data-option-index="${index}">
                                <input 
                                    type="radio" 
                                    name="question-option-${question.id}" 
                                    id="option-${question.id}-${index}" 
                                    value="${index}"
                                    ${isAnswered ? 'disabled' : ''}
                                    ${
                                        isAnswered &&
                                        index === question.userAnswer
                                            ? 'checked'
                                            : ''
                                    }
                                >
                                <label for="option-${
                                    question.id
                                }-${index}">${option}</label>
                                ${
                                    showResults &&
                                    index === question.correctAnswer
                                        ? '<i class="fas fa-check" style="color: var(--accent-color); margin-left: auto;"></i>'
                                        : ''
                                }
                                ${
                                    showResults &&
                                    index === question.userAnswer &&
                                    index !== question.correctAnswer
                                        ? '<i class="fas fa-times" style="color: var(--danger-color); margin-left: auto;"></i>'
                                        : ''
                                }
                            </div>
                        `;
                        })
                        .join('')}
                </div>
            `;
        }

        const explanationHtml =
            showResults && question.explanation
                ? `
            <div class="question-explanation" style="margin-top: 20px; padding: 16px; background: var(--surface); border-radius: 8px; border-left: 4px solid var(--primary-color);">
                <h4 style="margin-bottom: 8px; color: var(--text-primary);">
                    <i class="fas fa-lightbulb"></i> Explicação
                </h4>
                <p style="color: var(--text-secondary); line-height: 1.6;">${question.explanation}</p>
            </div>
        `
                : '';

        const resultHtml = showResults
            ? `
            <div class="question-result" style="margin-top: 20px; padding: 16px; background: ${
                question.correct
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)'
            }; border-radius: 8px;">
                <h4 style="color: ${
                    question.correct
                        ? 'var(--accent-color)'
                        : 'var(--danger-color)'
                };">
                    <i class="fas fa-${
                        question.correct ? 'check-circle' : 'times-circle'
                    }"></i>
                    ${
                        question.correct
                            ? 'Resposta Correta!'
                            : 'Resposta Incorreta'
                    }
                </h4>
                <p style="margin-top: 8px; color: var(--text-secondary);">
                    Tempo gasto: ${this.formatTime(question.timeSpent)}
                </p>
            </div>
        `
            : '';

        return `
            <div class="question-expanded-inner" style="margin-top: 20px; padding: 20px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                <div class="question-full-text" style="margin-bottom: 20px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 16px;">${
                        question.question
                    }</h4>
                </div>
                
                ${optionsHtml}
                
                ${resultHtml}
                
                ${explanationHtml}
                
                <div class="question-actions-inline" style="margin-top: 20px; display: flex; gap: 12px;">
                    ${
                        !isAnswered
                            ? `
                        <button class="btn btn-primary submit-answer-inline-btn" data-question-id="${question.id}">
                            <i class="fas fa-check"></i>
                            Enviar Resposta
                        </button>
                    `
                            : ''
                    }
                    <button class="btn btn-secondary collapse-question-btn" data-question-id="${
                        question.id
                    }">
                        <i class="fas fa-chevron-up"></i>
                        Recolher
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <i class="fas fa-question-circle" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>Nenhuma questão encontrada</h3>
                <p>Gere suas primeiras questões na página "Gerar Questões"</p>
                <button class="btn btn-primary" onclick="window.app.navigateTo('generator')">
                    <i class="fas fa-magic"></i>
                    Gerar Questões
                </button>
            </div>
        `;
    }

    attachQuestionCardListeners() {
        // Answer question buttons - toggle expanded view
        document.querySelectorAll('.answer-question-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target
                    .closest('[data-question-id]')
                    .getAttribute('data-question-id');
                this.toggleQuestionExpanded(questionId);
            });
        });

        // Submit answer buttons (inline)
        document
            .querySelectorAll('.submit-answer-inline-btn')
            .forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const questionId =
                        e.currentTarget.getAttribute('data-question-id');
                    this.submitAnswerInline(questionId);
                });
            });

        // Collapse question buttons
        document.querySelectorAll('.collapse-question-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target.getAttribute('data-question-id');
                this.collapseQuestion(questionId);
            });
        });

        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target
                    .closest('[data-question-id]')
                    .getAttribute('data-question-id');
                this.showQuestionDetails(questionId);
            });
        });

        // Delete question buttons
        document.querySelectorAll('.delete-question-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target
                    .closest('[data-question-id]')
                    .getAttribute('data-question-id');
                this.deleteQuestion(questionId);
            });
        });
    }

    toggleQuestionExpanded(questionId) {
        this.resetQuestionState(); // Resetar estado antes de abrir nova questão
        // Fecha todas as questões expandidas primeiro
        document
            .querySelectorAll('.question-expanded-content')
            .forEach((el) => {
                if (el.id !== `expanded-${questionId}`) {
                    el.style.display = 'none';
                }
            });

        const expandedElement = document.getElementById(
            `expanded-${questionId}`
        );
        if (!expandedElement) return;

        // Alterna a questão atual
        if (
            expandedElement.style.display === 'none' ||
            !expandedElement.style.display
        ) {
            expandedElement.style.display = 'block';
            this.currentQuestion = this.questions.find(
                (q) => q.id === questionId
            );
            this.questionStartTime = Date.now();

            // Rolagem suave
            setTimeout(() => {
                expandedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }, 100);
        } else {
            expandedElement.style.display = 'none';
            this.currentQuestion = null;
            this.questionStartTime = null;
        }
    }

    collapseQuestion(questionId) {
        const expandedElement = document.getElementById(
            `expanded-${questionId}`
        );
        if (expandedElement) {
            expandedElement.style.display = 'none';
        }
        this.currentQuestion = null;
        this.questionStartTime = null;
    }

    submitAnswerInline(questionId) {
        const question = this.questions.find((q) => q.id === questionId);
        if (!question) return;

        let userAnswer = null;
        let isCorrect = false;

        if (question.type === 'dissertativa') {
            const textArea = document.getElementById(
                `essay-answer-${questionId}`
            );
            if (textArea) {
                userAnswer = textArea.value.trim();
                isCorrect = userAnswer.length > 20; // Verificação básica
            }
        } else {
            const selectedOption = document.querySelector(
                `input[name="question-option-${questionId}"]:checked`
            );
            if (!selectedOption) {
                window.utils.showToast(
                    'warning',
                    'Selecione uma opção',
                    'Por favor, escolha uma resposta'
                );
                return;
            }

            userAnswer = parseInt(selectedOption.value);
            isCorrect = userAnswer === question.correctAnswer;
        }

        const timeSpent = this.questionStartTime
            ? Date.now() - this.questionStartTime
            : 0;

        // Atualiza a questão
        question.answered = true;
        question.userAnswer = userAnswer;
        question.correct = isCorrect;
        question.timeSpent = timeSpent;

        // Salva no armazenamento
        window.storageManager.saveQuestion(question);

        // Atualiza o card da questão
        this.updateSingleQuestionCard(questionId);

        // Mantenha o estado expandido após atualizar o conteúdo
        const expandedElement = document.getElementById(
            `expanded-${questionId}`
        );
        if (expandedElement) {
            // Preserva o estado de exibição
            const wasExpanded = expandedElement.style.display === 'block';

            // Atualiza apenas o conteúdo interno sem substituir o elemento principal
            const newContent = this.renderExpandedQuestionContent(question);
            expandedElement.innerHTML = newContent;

            // Mantém o estado expandido
            if (wasExpanded) {
                expandedElement.style.display = 'block';
            }

            this.attachQuestionCardListeners();

            // Rolagem suave para a explicação
            if (wasExpanded) {
                setTimeout(() => {
                    expandedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                    });
                }, 100);
            }
        }

        // Atualiza estatísticas do usuário
        this.updateUserStats(isCorrect, timeSpent);
    }

    // Adicione este novo método para preservar o estado durante atualizações
    updateExpandedContent(questionId) {
        const question = this.questions.find((q) => q.id === questionId);
        if (!question) return;

        const expandedElement = document.getElementById(
            `expanded-${questionId}`
        );
        if (!expandedElement) return;

        // Preserva o estado de exibição
        const wasExpanded = expandedElement.style.display === 'block';

        expandedElement.innerHTML =
            this.renderExpandedQuestionContent(question);

        // Restaura o estado de exibição
        if (wasExpanded) {
            expandedElement.style.display = 'block';
        } else {
            expandedElement.style.display = 'none';
        }

        this.attachQuestionCardListeners();
    }

    // Adicione esta nova função para atualizar apenas uma questão
    updateSingleQuestionCard(questionId) {
        const question = this.questions.find((q) => q.id === questionId);
        if (!question) return;

        const questionCard = document.querySelector(
            `.question-card[data-question-id="${questionId}"]`
        );
        if (!questionCard) return;

        // Atualiza apenas as partes necessárias do card
        const metaElement = questionCard.querySelector('.question-meta');
        if (metaElement) {
            const statusIcon = question.answered
                ? '<i class="fas fa-check-circle" style="color: var(--accent-color);"></i>'
                : '<i class="fas fa-clock" style="color: var(--warning-color);"></i>';

            const correctnessIndicator = question.answered
                ? question.correct
                    ? '<span class="question-badge badge-easy"><i class="fas fa-check"></i> Correto</span>'
                    : '<span class="question-badge badge-hard"><i class="fas fa-times"></i> Incorreto</span>'
                : '';

            metaElement.innerHTML = `
            ${statusIcon}
            <span class="question-badge ${this.getDifficultyClass(
                question.difficulty
            )}">
                ${this.formatDifficulty(question.difficulty)}
            </span>
            <span class="question-badge">
                ${this.formatType(question.type)}
            </span>
            ${correctnessIndicator}
        `;
        }

        // Atualiza o tempo gasto se respondida
        if (question.answered) {
            const timeElement = questionCard.querySelector(
                '.question-content p'
            );
            if (timeElement) {
                timeElement.innerHTML = `<strong>Tempo gasto:</strong> ${this.formatTime(
                    question.timeSpent
                )}`;
            }
        }
    }

    setupQuestionCardBehavior() {
        document.addEventListener('click', (e) => {
            // Fecha questões ao clicar fora
            if (
                !e.target.closest('.question-card') &&
                !e.target.closest('.question-modal-content')
            ) {
                document
                    .querySelectorAll('.question-expanded-content')
                    .forEach((el) => {
                        el.style.display = 'none';
                    });
                this.currentQuestion = null;
                this.questionStartTime = null;
            }
        });
    }

    openQuestionModal(questionId) {
        const question = this.questions.find((q) => q.id === questionId);
        if (!question) return;

        this.currentQuestion = question;
        this.questionStartTime = Date.now();

        const modalBody = document.getElementById('question-modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = this.renderQuestionModalContent(question);
        this.attachModalListeners();
        window.utils.showModal('question-modal');
    }

    renderQuestionModalContent(question) {
        const isAnswered = question.answered;
        const showResults = isAnswered;

        let optionsHtml = '';

        if (question.type === 'dissertativa') {
            optionsHtml = `
                <div class="question-options">
                    <textarea 
                        id="essay-answer" 
                        placeholder="Digite sua resposta aqui..."
                        style="width: 100%; min-height: 150px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-family: inherit;"
                        ${isAnswered ? 'readonly' : ''}
                    >${isAnswered ? question.userAnswer || '' : ''}</textarea>
                </div>
            `;
        } else if (question.options) {
            optionsHtml = `
                <div class="question-options">
                    ${question.options
                        .map((option, index) => {
                            let optionClass = '';
                            if (showResults) {
                                if (index === question.correctAnswer) {
                                    optionClass = 'correct-answer';
                                } else if (
                                    index === question.userAnswer &&
                                    index !== question.correctAnswer
                                ) {
                                    optionClass = 'wrong-answer';
                                }
                            }

                            return `
                            <div class="option-item ${optionClass}" data-option-index="${index}">
                                <input 
                                    type="radio" 
                                    name="question-option" 
                                    id="option-${index}" 
                                    value="${index}"
                                    ${isAnswered ? 'disabled' : ''}
                                    ${
                                        isAnswered &&
                                        index === question.userAnswer
                                            ? 'checked'
                                            : ''
                                    }
                                >
                                <label for="option-${index}">${option}</label>
                                ${
                                    showResults &&
                                    index === question.correctAnswer
                                        ? '<i class="fas fa-check" style="color: var(--accent-color); margin-left: auto;"></i>'
                                        : ''
                                }
                                ${
                                    showResults &&
                                    index === question.userAnswer &&
                                    index !== question.correctAnswer
                                        ? '<i class="fas fa-times" style="color: var(--danger-color); margin-left: auto;"></i>'
                                        : ''
                                }
                            </div>
                        `;
                        })
                        .join('')}
                </div>
            `;
        }

        const explanationHtml =
            showResults && question.explanation
                ? `
            <div class="question-explanation" style="margin-top: 20px; padding: 16px; background: var(--surface); border-radius: 8px; border-left: 4px solid var(--primary-color);">
                <h4 style="margin-bottom: 8px; color: var(--text-primary);">
                    <i class="fas fa-lightbulb"></i> Explicação
                </h4>
                <p style="color: var(--text-secondary); line-height: 1.6;">${question.explanation}</p>
            </div>
        `
                : '';

        const resultHtml = showResults
            ? `
            <div class="question-result" style="margin-top: 20px; padding: 16px; background: ${
                question.correct
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)'
            }; border-radius: 8px;">
                <h4 style="color: ${
                    question.correct
                        ? 'var(--accent-color)'
                        : 'var(--danger-color)'
                };">
                    <i class="fas fa-${
                        question.correct ? 'check-circle' : 'times-circle'
                    }"></i>
                    ${
                        question.correct
                            ? 'Resposta Correta!'
                            : 'Resposta Incorreta'
                    }
                </h4>
                <p style="margin-top: 8px; color: var(--text-secondary);">
                    Tempo gasto: ${this.formatTime(question.timeSpent)}
                </p>
            </div>
        `
            : '';

        return `
            <div class="question-modal-content">
                <div class="question-info" style="margin-bottom: 20px; padding: 12px; background: var(--surface); border-radius: 8px;">
                    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
                        <span class="question-badge ${this.getDifficultyClass(
                            question.difficulty
                        )}">
                            ${this.formatDifficulty(question.difficulty)}
                        </span>
                        <span class="question-badge">
                            ${this.formatType(question.type)}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: var(--text-secondary);">
                        <strong>Fonte:</strong> ${question.source} | 
                        <strong>Criada em:</strong> ${window.utils.formatDate(
                            question.createdAt
                        )}
                    </p>
                </div>
                
                <div class="question-text">${question.question}</div>
                
                ${optionsHtml}
                
                ${resultHtml}
                
                ${explanationHtml}
                
                <div class="question-actions-modal">
                    ${
                        !isAnswered
                            ? `
                        <button class="btn btn-primary" id="submit-answer-btn">
                            <i class="fas fa-check"></i>
                            Enviar Resposta
                        </button>
                    `
                            : ''
                    }
                    ${
                        window.favoritesManager
                            ? window.favoritesManager.addFavoriteButton(
                                  question
                              )
                            : ''
                    }
                    <button class="btn btn-secondary" id="close-modal-btn">
                        <i class="fas fa-times"></i>
                        Fechar
                    </button>
                </div>
            </div>
        `;
    }

    attachModalListeners() {
        const submitBtn = document.getElementById('submit-answer-btn');
        const closeBtn = document.getElementById('close-modal-btn');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitAnswer();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeQuestionModal();
            });
        }

        // Add CSS for correct/wrong answers
        const style = document.createElement('style');
        style.textContent = `
            .option-item.correct-answer {
                border-color: var(--accent-color) !important;
                background: rgba(16, 185, 129, 0.1) !important;
            }
            .option-item.wrong-answer {
                border-color: var(--danger-color) !important;
                background: rgba(239, 68, 68, 0.1) !important;
            }
        `;
        document.head.appendChild(style);
    }

    submitAnswer() {
        if (!this.currentQuestion) return;

        let userAnswer = null;
        let isCorrect = false;

        if (this.currentQuestion.type === 'dissertativa') {
            const essayAnswer = document.getElementById('essay-answer');
            userAnswer = essayAnswer ? essayAnswer.value.trim() : '';
            isCorrect = userAnswer.length > 10; // Basic validation for essay
        } else {
            const selectedOption = document.querySelector(
                'input[name="question-option"]:checked'
            );
            if (!selectedOption) {
                window.utils.showToast(
                    'warning',
                    'Selecione uma opção',
                    'Por favor, escolha uma resposta'
                );
                return;
            }

            userAnswer = parseInt(selectedOption.value);
            isCorrect = userAnswer === this.currentQuestion.correctAnswer;
        }

        const timeSpent = Date.now() - this.questionStartTime;

        // Update question
        this.currentQuestion.answered = true;
        this.currentQuestion.userAnswer = userAnswer;
        this.currentQuestion.correct = isCorrect;
        this.currentQuestion.timeSpent = timeSpent;

        // Save to storage
        window.storageManager.saveQuestion(this.currentQuestion);

        // Update user stats
        this.updateUserStats(isCorrect, timeSpent);

        // Trigger gamification event
        if (window.gamificationManager) {
            window.gamificationManager.handleQuestionAnswered({
                correct: isCorrect,
                timeSpent: timeSpent,
                difficulty: this.currentQuestion.difficulty,
                sessionStats: null, // Could be enhanced to track session stats
            });
        }

        // Refresh modal content
        const modalBody = document.getElementById('question-modal-body');
        if (modalBody) {
            modalBody.innerHTML = this.renderQuestionModalContent(
                this.currentQuestion
            );
            this.attachModalListeners();
        }

        // Refresh questions list
        this.updateSingleQuestionCard(this.currentQuestion.id);

        // Show result toast
        const message = isCorrect
            ? 'Parabéns! Resposta correta!'
            : 'Resposta incorreta. Veja a explicação.';
        const type = isCorrect ? 'success' : 'error';
        window.utils.showToast(type, 'Resposta enviada', message);
    }

    updateUserStats(isCorrect, timeSpent) {
        if (!window.app.currentUser || !this.currentQuestion) return; // Verificação adicional

        const user = window.app.currentUser;

        // Initialize stats if they don't exist
        if (!user.stats) {
            user.stats = {
                questionsGenerated: 0,
                questionsAnswered: 0,
                correctAnswers: 0,
                documentsProcessed: 0,
                totalPoints: 0,
                bestStreak: 0,
                currentStreak: 0,
                averageTime: 0,
            };
        }

        user.stats.questionsAnswered += 1;

        if (isCorrect) {
            user.stats.correctAnswers += 1;
            user.stats.totalPoints += this.calculatePoints(
                this.currentQuestion.difficulty,
                timeSpent
            );
        }

        // Update average time
        const totalTime =
            user.stats.averageTime * (user.stats.questionsAnswered - 1) +
            timeSpent;
        user.stats.averageTime = Math.round(
            totalTime / user.stats.questionsAnswered
        );

        // Update streak
        if (isCorrect) {
            user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
            user.stats.bestStreak = Math.max(
                user.stats.bestStreak || 0,
                user.stats.currentStreak
            );
        } else {
            user.stats.currentStreak = 0;
        }

        // Update stored user
        if (window.authManager) {
            window.authManager.updateStoredUser(user);
        }

        // Update current user in app
        window.app.currentUser = user;
        localStorage.setItem('questionai_user', JSON.stringify(user));
    }

    calculatePoints(difficulty, timeSpent) {
        const basePoints = {
            facil: 10,
            medio: 20,
            dificil: 30,
        };

        let points = basePoints[difficulty] || 20;

        // Time bonus (faster = more points)
        const timeBonus = Math.max(0, 30 - Math.floor(timeSpent / 1000));
        points += timeBonus;

        return points;
    }

    closeQuestionModal() {
        this.currentQuestion = null;
        this.questionStartTime = null;
        window.utils.hideModal('question-modal');

        // Resetar o estado das questões
        const expandedElements = document.querySelectorAll(
            '.question-expanded-content'
        );
        expandedElements.forEach((el) => (el.style.display = 'none'));
    }

    showQuestionDetails(questionId) {
        const question = this.questions.find((q) => q.id === questionId);
        if (!question) return;

        const details = `
            <strong>ID:</strong> ${question.id}<br>
            <strong>Tipo:</strong> ${this.formatType(question.type)}<br>
            <strong>Dificuldade:</strong> ${this.formatDifficulty(
                question.difficulty
            )}<br>
            <strong>Fonte:</strong> ${question.source}<br>
            <strong>Criada em:</strong> ${window.utils.formatDate(
                question.createdAt
            )}<br>
            <strong>Status:</strong> ${
                question.answered ? 'Respondida' : 'Não respondida'
            }<br>
            ${
                question.answered
                    ? `<strong>Acertou:</strong> ${
                          question.correct ? 'Sim' : 'Não'
                      }<br>`
                    : ''
            }
            ${
                question.answered
                    ? `<strong>Tempo gasto:</strong> ${this.formatTime(
                          question.timeSpent
                      )}<br>`
                    : ''
            }
        `;

        window.utils.showToast('info', 'Detalhes da Questão', details);
    }

    deleteQuestion(questionId) {
        if (!confirm('Tem certeza que deseja excluir esta questão?')) return;

        const success = window.storageManager.deleteQuestion(questionId);

        if (success) {
            window.utils.showToast(
                'success',
                'Questão excluída',
                'A questão foi removida com sucesso'
            );
            this.loadQuestions();
        } else {
            window.utils.showToast(
                'error',
                'Erro',
                'Não foi possível excluir a questão'
            );
        }

        // Atualizar estatísticas imediatamente
        if (window.reportsManager) {
            window.reportsManager.generateReportData();
            window.reportsManager.renderDashboardStats();
        }
    }

    // Utility methods
    getDifficultyClass(difficulty) {
        const classes = {
            facil: 'badge-easy',
            medio: 'badge-medium',
            dificil: 'badge-hard',
        };
        return classes[difficulty] || 'badge-medium';
    }

    formatDifficulty(difficulty) {
        const labels = {
            facil: 'Fácil',
            medio: 'Médio',
            dificil: 'Difícil',
        };
        return labels[difficulty] || difficulty;
    }

    formatType(type) {
        const labels = {
            'multipla-escolha': 'Múltipla Escolha',
            'verdadeiro-falso': 'Verdadeiro/Falso',
            dissertativa: 'Dissertativa',
        };
        return labels[type] || type;
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Initialize questions manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.questionsManager = new QuestionsManager();
});
