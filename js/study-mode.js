// Study Mode Manager - Enhanced study sessions with timers and filters
class StudyModeManager {
    constructor() {
        this.currentSession = null;
        this.timer = null;
        this.isPaused = false;
        this.currentQuestionIndex = 0;
        this.sessionQuestions = [];
        this.sessionStartTime = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderStudyHistory();
    }

    setupEventListeners() {
        // Start study session
        const startStudyBtn = document.getElementById('start-study');
        if (startStudyBtn) {
            startStudyBtn.addEventListener('click', () => {
                this.startStudySession();
            });
        }

        // Pause/Resume study
        const pauseStudyBtn = document.getElementById('pause-study');
        if (pauseStudyBtn) {
            pauseStudyBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }

        // Study mode configuration changes
        const studyInputs = document.querySelectorAll('#study-setup select');
        studyInputs.forEach((input) => {
            input.addEventListener('change', () => {
                this.updateStudyConfig();
            });
        });
    }

    async startStudySession() {
        try {
            const config = this.getStudyConfig();
            const questions = await this.getStudyQuestions(config);

            if (questions.length === 0) {
                window.utils.showToast(
                    'warning',
                    'Sem questões',
                    'Não há questões disponíveis com os filtros selecionados'
                );
                return;
            }

            this.sessionQuestions = questions.slice(0, config.questionCount);
            this.currentQuestionIndex = 0;
            this.sessionStartTime = new Date();

            this.currentSession = {
                id: window.utils.generateId(),
                config: config,
                questions: this.sessionQuestions,
                startTime: this.sessionStartTime,
                answers: [],
                timeSpent: 0,
                completed: false,
            };

            this.showStudySession();
            this.startTimer(config.duration * 60); // Convert minutes to seconds
            this.displayCurrentQuestion();

            window.utils.showToast(
                'success',
                'Sessão iniciada',
                'Boa sorte nos seus estudos!'
            );
        } catch (error) {
            console.error('Error starting study session:', error);
            window.utils.showToast(
                'error',
                'Erro',
                'Não foi possível iniciar a sessão de estudo'
            );
        }
    }

    getStudyConfig() {
        return {
            duration: parseInt(
                document.getElementById('study-duration')?.value || '30'
            ),
            questionCount: parseInt(
                document.getElementById('study-question-count')?.value || '20'
            ),
            difficulty:
                document.getElementById('study-difficulty')?.value || 'all',
            mode: document.getElementById('study-mode')?.value || 'practice',
        };
    }

    async getStudyQuestions(config) {
        if (!window.storageManager || !window.storageManager.isUserSet()) {
            return [];
        }

        let questions = window.storageManager.getQuestions();

        // Apply difficulty filter
        if (config.difficulty !== 'all') {
            questions = questions.filter(
                (q) => q.difficulty === config.difficulty
            );
        }

        // Apply mode-specific filters
        switch (config.mode) {
            case 'practice':
                // Mix of answered and unanswered questions
                break;
            case 'exam':
                // Only unanswered questions for exam simulation
                questions = questions.filter((q) => !q.answered);
                break;
            case 'review':
                // Only incorrectly answered questions
                questions = questions.filter((q) => q.answered && !q.correct);
                break;
        }

        // Shuffle questions for variety
        return this.shuffleArray(questions);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showStudySession() {
        const setupDiv = document.getElementById('study-setup');
        const sessionDiv = document.getElementById('study-session');

        if (setupDiv) setupDiv.style.display = 'none';
        if (sessionDiv) sessionDiv.style.display = 'block';
    }

    hideStudySession() {
        const setupDiv = document.getElementById('study-setup');
        const sessionDiv = document.getElementById('study-session');

        if (setupDiv) setupDiv.style.display = 'block';
        if (sessionDiv) sessionDiv.style.display = 'none';
    }

    startTimer(seconds) {
        let timeLeft = seconds;
        const timerDisplay = document.getElementById('timer-display');

        this.timer = setInterval(() => {
            if (!this.isPaused) {
                timeLeft--;

                const minutes = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;

                if (timerDisplay) {
                    timerDisplay.textContent = `${minutes
                        .toString()
                        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }

                if (timeLeft <= 0) {
                    this.endStudySession('time');
                }
            }
        }, 1000);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-study');

        if (pauseBtn) {
            if (this.isPaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
                window.utils.showToast('info', 'Pausado', 'Sessão pausada');
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
                window.utils.showToast(
                    'info',
                    'Continuando',
                    'Sessão retomada'
                );
            }
        }
    }

    displayCurrentQuestion() {
        if (this.currentQuestionIndex >= this.sessionQuestions.length) {
            this.endStudySession('completed');
            return;
        }

        const question = this.sessionQuestions[this.currentQuestionIndex];
        const questionDiv = document.getElementById('study-question');
        const progressSpan = document.getElementById('question-progress');
        const progressFill = document.getElementById('progress-fill');

        // Update progress
        if (progressSpan) {
            progressSpan.textContent = `${this.currentQuestionIndex + 1} / ${
                this.sessionQuestions.length
            }`;
        }

        if (progressFill) {
            const progress =
                ((this.currentQuestionIndex + 1) /
                    this.sessionQuestions.length) *
                100;
            progressFill.style.width = `${progress}%`;
        }

        // Display question
        if (questionDiv) {
            questionDiv.innerHTML = this.renderQuestion(question);
            this.setupQuestionEventListeners(question);
        }
    }

    renderQuestion(question) {
        let optionsHtml = '';

        if (question.type === 'multipla-escolha' && question.options) {
            optionsHtml = question.options
                .map(
                    (option, index) => `
                <div class="study-option" data-index="${index}">
                    <input type="radio" name="study-answer" id="option-${index}" value="${index}">
                    <label for="option-${index}">${option}</label>
                </div>
            `
                )
                .join('');
        } else if (question.type === 'verdadeiro-falso') {
            optionsHtml = `
                <div class="study-option" data-index="true">
                    <input type="radio" name="study-answer" id="option-true" value="true">
                    <label for="option-true">Verdadeiro</label>
                </div>
                <div class="study-option" data-index="false">
                    <input type="radio" name="study-answer" id="option-false" value="false">
                    <label for="option-false">Falso</label>
                </div>
            `;
        } else if (question.type === 'dissertativa') {
            optionsHtml = `
                <div class="study-textarea">
                    <textarea id="dissertative-answer" placeholder="Digite sua resposta aqui..."></textarea>
                </div>
            `;
        }

        return `
            <div class="question-card study-card">
                <div class="question-header">
                    <div class="question-meta">
                        <span class="difficulty-badge ${
                            question.difficulty
                        }">${this.getDifficultyLabel(
            question.difficulty
        )}</span>
                        <span class="source-badge">${question.source}</span>
                    </div>
                </div>
                <div class="question-content">
                    <h3>${question.question}</h3>
                    <div class="question-options">
                        ${optionsHtml}
                    </div>
                </div>
                <div class="question-actions">
                    <button class="btn btn-secondary" id="skip-question">
                        <i class="fas fa-forward"></i>
                        Pular
                    </button>
                    <button class="btn btn-primary" id="submit-answer" disabled>
                        <i class="fas fa-check"></i>
                        Responder
                    </button>
                </div>
            </div>
        `;
    }

    renderStudyHistory() {
        const historyContainer = document.getElementById('study-history');
        if (!historyContainer) return;

        // Tratamento seguro para dados inválidos
        let history = [];
        try {
            const historyData = localStorage.getItem('study_sessions');
            if (historyData && historyData.trim() !== '') {
                history = JSON.parse(historyData);
            }
        } catch (error) {
            console.error('Error parsing study sessions:', error);
            localStorage.removeItem('study_sessions');
        }

        // Ordenar do mais recente para o mais antigo
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (history.length === 0) {
            historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <h3>Nenhuma sessão realizada ainda</h3>
                <p>Comece uma nova sessão de estudo para ver seu histórico aqui</p>
            </div>
        `;
            return;
        }

        historyContainer.innerHTML = history
            .map(
                (session) => `
        <div class="session-card" data-session-id="${session.id}">
            <div class="session-card-header">
                <div>
                    <h3>Sessão #${session.id.substring(0, 6)}</h3>
                    <div class="session-date">${new Date(
                        session.date
                    ).toLocaleDateString('pt-BR')}</div>
                </div>
                <span class="mode-badge mode-${session.config.mode}">
                    ${this.formatMode(session.config.mode)}
                </span>
            </div>
            
            <div class="session-card-body">
                <div class="session-stats">
                    <div class="session-stat">
                        <div class="stat-value">${
                            session.stats.correctAnswers
                        }</div>
                        <div class="stat-label">Acertos</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-value">${session.stats.accuracy}%</div>
                        <div class="stat-label">Taxa Acerto</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-value">${
                            session.stats.totalQuestions
                        }</div>
                        <div class="stat-label">Questões</div>
                    </div>
                </div>
                
                <div class="session-details">
                    <div class="detail-item">
                        <span>Modo:</span>
                        <span><strong>${this.formatMode(
                            session.config.mode
                        )}</strong></span>
                    </div>
                    <div class="detail-item">
                        <span>Duração:</span>
                        <span><strong>${Math.floor(
                            session.stats.totalTime / 60
                        )}min ${session.stats.totalTime % 60}s</strong></span>
                    </div>
                    <div class="detail-item">
                        <span>Dificuldade:</span>
                        <span><strong>${this.formatDifficulty(
                            session.config.difficulty
                        )}</strong></span>
                    </div>
                </div>
            </div>
            
            <div class="session-card-footer">
                <button class="delete-session-btn" data-session-id="${
                    session.id
                }">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `
            )
            .join('');

        // Adicionar event listeners para os botões de exclusão
        document.querySelectorAll('.delete-session-btn').forEach((button) => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = button.getAttribute('data-session-id');
                this.deleteSession(sessionId);
            });
        });

        // Adicionar event listener para limpar todo o histórico
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (
                    confirm(
                        'Tem certeza que deseja limpar todo o histórico de sessões?'
                    )
                ) {
                    localStorage.removeItem('study_sessions');
                    this.renderStudyHistory();
                    window.utils.showToast(
                        'success',
                        'Histórico limpo',
                        'Todas as sessões foram removidas'
                    );
                }
            });
        }
    }

    formatMode(mode) {
        const modes = {
            practice: 'Prática',
            exam: 'Simulado',
            review: 'Revisão',
        };
        return modes[mode] || mode;
    }

    formatDifficulty(difficulty) {
        const difficulties = {
            all: 'Todas',
            facil: 'Fácil',
            medio: 'Médio',
            dificil: 'Difícil',
        };
        return difficulties[difficulty] || difficulty;
    }

    deleteSession(sessionId) {
        const history = JSON.parse(
            localStorage.getItem('study_sessions') || []
        );
        const newHistory = history.filter(
            (session) => session.id !== sessionId
        );

        localStorage.setItem('study_sessions', JSON.stringify(newHistory));
        this.renderStudyHistory();
        window.utils.showToast(
            'success',
            'Sessão excluída',
            'A sessão foi removida do histórico'
        );
    }

    setupQuestionEventListeners(question) {
        // Answer selection
        const answerInputs = document.querySelectorAll(
            'input[name="study-answer"]'
        );
        const submitBtn = document.getElementById('submit-answer');
        const skipBtn = document.getElementById('skip-question');
        const textArea = document.getElementById('dissertative-answer');

        // Enable submit button when answer is selected
        const checkAnswerSelected = () => {
            let hasAnswer = false;

            if (question.type === 'dissertativa') {
                hasAnswer = textArea && textArea.value.trim().length > 0;
            } else {
                hasAnswer = Array.from(answerInputs).some(
                    (input) => input.checked
                );
            }

            if (submitBtn) {
                submitBtn.disabled = !hasAnswer;
            }
        };

        answerInputs.forEach((input) => {
            input.addEventListener('change', checkAnswerSelected);
        });

        if (textArea) {
            textArea.addEventListener('input', checkAnswerSelected);
        }

        // Submit answer
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitStudyAnswer(question);
            });
        }

        // Skip question
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.skipQuestion();
            });
        }
    }

    submitStudyAnswer(question) {
        let userAnswer = null;
        let isCorrect = false;

        if (
            question.type === 'multipla-escolha' ||
            question.type === 'verdadeiro-falso'
        ) {
            const selectedInput = document.querySelector(
                'input[name="study-answer"]:checked'
            );
            if (selectedInput) {
                userAnswer = selectedInput.value;

                if (question.type === 'multipla-escolha') {
                    isCorrect = parseInt(userAnswer) === question.correctAnswer;
                } else {
                    isCorrect =
                        (userAnswer === 'true') === question.correctAnswer;
                }
            }
        } else if (question.type === 'dissertativa') {
            const textArea = document.getElementById('dissertative-answer');
            if (textArea) {
                userAnswer = textArea.value.trim();
                // For dissertative questions, we'll mark as correct for now
                // In a real implementation, this would need manual review or AI evaluation
                isCorrect = userAnswer.length > 20; // Basic length check
            }
        }

        // Record answer
        this.currentSession.answers.push({
            questionId: question.id,
            userAnswer: userAnswer,
            correct: isCorrect,
            timeSpent: Date.now() - this.sessionStartTime,
        });

        // Update question in storage
        question.answered = true;
        question.correct = isCorrect;
        question.userAnswer = userAnswer;
        window.storageManager.saveQuestion(question);

        // Show feedback
        this.showAnswerFeedback(question, isCorrect, userAnswer);
    }

    // Substitua a função showAnswerFeedback por esta versão corrigida
    showAnswerFeedback(question, isCorrect, userAnswer) {
        const questionDiv = document.getElementById('study-question');
        if (!questionDiv) return;

        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        const feedbackIcon = isCorrect ? 'fa-check-circle' : 'fa-times-circle';
        const feedbackText = isCorrect ? 'Correto!' : 'Incorreto!';

        // Corrigido: usando let em vez de const para permitir reatribuição
        let feedbackHtml = `
        <div class="answer-feedback ${feedbackClass}">
            <div class="feedback-header">
                <i class="fas ${feedbackIcon}"></i>
                <h3>${feedbackText}</h3>
            </div>
            <div class="feedback-content">
                ${
                    question.explanation
                        ? `<p><strong>Explicação:</strong> ${question.explanation}</p>`
                        : ''
                }
                ${
                    !isCorrect && question.type === 'multipla-escolha'
                        ? `<p><strong>Resposta correta:</strong> ${
                              question.options[question.correctAnswer]
                          }</p>`
                        : ''
                }
            </div>
            <div class="feedback-footer" style="margin-top: 20px; text-align: center;">
                <button class="btn btn-primary" id="next-question-btn">
                    Próxima Questão <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;

        questionDiv.innerHTML = feedbackHtml;

        // Adicionar event listener para o botão
        document
            .getElementById('next-question-btn')
            .addEventListener('click', () => {
                this.nextQuestion();
            });
    }

    // Atualize a função submitStudyAnswer removendo o setTimeout
    submitStudyAnswer(question) {
        let userAnswer = null;
        let isCorrect = false;

        if (
            question.type === 'multipla-escolha' ||
            question.type === 'verdadeiro-falso'
        ) {
            const selectedInput = document.querySelector(
                'input[name="study-answer"]:checked'
            );
            if (selectedInput) {
                userAnswer = selectedInput.value;

                if (question.type === 'multipla-escolha') {
                    isCorrect = parseInt(userAnswer) === question.correctAnswer;
                } else {
                    isCorrect =
                        (userAnswer === 'true') === question.correctAnswer;
                }
            }
        } else if (question.type === 'dissertativa') {
            const textArea = document.getElementById('dissertative-answer');
            if (textArea) {
                userAnswer = textArea.value.trim();
                // Para dissertative questions, vamos marcar como correto por agora
                isCorrect = userAnswer.length > 20; // Verificação básica de comprimento
            }
        }

        // Record answer
        this.currentSession.answers.push({
            questionId: question.id,
            userAnswer: userAnswer,
            correct: isCorrect,
            timeSpent: Date.now() - this.sessionStartTime,
        });

        // Update question in storage
        question.answered = true;
        question.correct = isCorrect;
        question.userAnswer = userAnswer;
        window.storageManager.saveQuestion(question);

        // Show feedback
        this.showAnswerFeedback(question, isCorrect, userAnswer);
    }

    skipQuestion() {
        this.currentSession.answers.push({
            questionId: this.sessionQuestions[this.currentQuestionIndex].id,
            userAnswer: null,
            correct: false,
            skipped: true,
            timeSpent: Date.now() - this.sessionStartTime,
        });

        this.nextQuestion();
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.displayCurrentQuestion();
    }

    endStudySession(reason) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.currentSession.endTime = new Date();
        this.currentSession.completed = true;
        this.currentSession.endReason = reason;

        // Calculate session statistics
        const stats = this.calculateSessionStats();

        // Salvar sessão no histórico (com tratamento seguro)
        try {
            const historyData = localStorage.getItem('study_sessions');
            let history = [];

            if (historyData && historyData.trim() !== '') {
                try {
                    history = JSON.parse(historyData);
                } catch (parseError) {
                    console.error(
                        'Error parsing existing sessions:',
                        parseError
                    );
                    history = [];
                }
            }

            history.push({
                id: this.currentSession.id,
                date: new Date().toISOString(),
                config: this.currentSession.config,
                stats: stats,
            });

            localStorage.setItem('study_sessions', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving session history:', error);
        }

        // Save session
        if (window.storageManager) {
            const sessions = window.storageManager.getSessions();
            sessions.push(this.currentSession);
            window.storageManager.setItem(
                window.storageManager.getUserStorageKey('sessions'),
                sessions
            );
        }

        // Update user statistics
        this.updateUserStats(stats);

        // Show session results
        this.showSessionResults(stats);

        // Reset session
        this.currentSession = null;
        this.hideStudySession();

        // Adicionar no FINAL da função:
        this.renderStudyHistory();
    }

    // Adicione este novo método
    renderStudyHistory() {
        const historyContainer = document.getElementById('study-history');
        if (!historyContainer) return;

        const history = JSON.parse(
            localStorage.getItem('study_sessions') || '[]'
        );

        // Atualizar a lógica de empty state:
        if (history.length === 0) {
            historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <h3>Nenhuma sessão realizada ainda</h3>
                <p>Comece uma nova sessão de estudo para ver seu histórico aqui</p>
            </div>
        `;
            return;
        }

        historyContainer.innerHTML = history
            .map(
                (session) => `
        <div class="session-card">
            <div class="session-header">
                <h3>Sessão ${new Date(session.date).toLocaleDateString()}</h3>
                <span>${session.config.mode} • ${
                    session.config.questionCount
                } questões</span>
            </div>
            <div class="session-stats">
                <div class="stat">
                    <i class="fas fa-check"></i>
                    ${session.stats.correctAnswers} acertos
                </div>
                <div class="stat">
                    <i class="fas fa-percentage"></i>
                    ${session.stats.accuracy}% taxa
                </div>
                <div class="stat">
                    <i class="fas fa-clock"></i>
                    ${Math.floor(session.stats.totalTime / 60)}min
                </div>
            </div>
        </div>
    `
            )
            .join('');
    }

    // Adicione esta função para carregar o histórico
    loadStudyHistory() {
        if (window.storageManager) {
            const sessions = window.storageManager.getSessions();
            // Implementar lógica para exibir histórico na UI
        }
    }

    calculateSessionStats() {
        const answers = this.currentSession.answers;
        const totalQuestions = answers.length;
        const correctAnswers = answers.filter(
            (a) => a.correct && !a.skipped
        ).length;
        const skippedQuestions = answers.filter((a) => a.skipped).length;
        const accuracy =
            totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const totalTime =
            this.currentSession.endTime - this.currentSession.startTime;

        return {
            totalQuestions,
            correctAnswers,
            skippedQuestions,
            accuracy: Math.round(accuracy),
            totalTime: Math.round(totalTime / 1000), // Convert to seconds
            averageTimePerQuestion:
                totalQuestions > 0
                    ? Math.round(totalTime / totalQuestions / 1000)
                    : 0,
        };
    }

    updateUserStats(sessionStats) {
        if (!window.app.currentUser) return;

        const user = window.app.currentUser;
        user.stats.studySessions = (user.stats.studySessions || 0) + 1;
        user.stats.totalStudyTime =
            (user.stats.totalStudyTime || 0) + sessionStats.totalTime;
        user.stats.questionsAnswered += sessionStats.totalQuestions;
        user.stats.correctAnswers += sessionStats.correctAnswers;

        // Update accuracy
        if (user.stats.questionsAnswered > 0) {
            user.stats.accuracy = Math.round(
                (user.stats.correctAnswers / user.stats.questionsAnswered) * 100
            );
        }

        window.authManager.updateStoredUser(user);
    }

    showSessionResults(stats) {
        const message = `
            Sessão concluída!
            
            📊 Estatísticas:
            • Questões respondidas: ${stats.totalQuestions}
            • Respostas corretas: ${stats.correctAnswers}
            • Taxa de acerto: ${stats.accuracy}%
            • Tempo total: ${Math.floor(stats.totalTime / 60)}min ${
            stats.totalTime % 60
        }s
        `;

        window.utils.showToast('success', 'Sessão Concluída', message);
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            facil: 'Fácil',
            medio: 'Médio',
            dificil: 'Difícil',
        };
        return labels[difficulty] || difficulty;
    }

    updateStudyConfig() {
        // This method can be used to update UI based on configuration changes
        // For example, showing estimated time, question count, etc.
    }
}

// Initialize study mode manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studyModeManager = new StudyModeManager();
});
