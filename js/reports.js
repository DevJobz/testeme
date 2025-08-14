// Reports Manager
class ReportsManager {
    constructor() {
        this.charts = {};
        this.reportData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add any report-specific event listeners here
        window.addEventListener('resize', () => {
            this.resizeCharts();
        });
    }

    loadReports() {
        this.generateReportData();
        this.renderDashboardStats();
        this.renderCharts();
    }

    generateReportData() {
        const questions = window.storageManager.getQuestions();
        const user = window.app.currentUser;

        if (!user) return;

        const answeredQuestions = questions.filter((q) => q.answered);
        const correctAnswers = questions.filter((q) => q.answered && q.correct);

        // Adicione esta linha para garantir que as estatísticas são calculadas
        user.stats = user.stats || {};
        user.stats.questionsAnswered = answeredQuestions.length;
        user.stats.correctAnswers = correctAnswers.length;

        this.reportData = {
            totalQuestions: questions.length,
            answeredQuestions: answeredQuestions.length,
            correctAnswers: correctAnswers.length,
            successRate:
                answeredQuestions.length > 0
                    ? Math.round(
                          (correctAnswers.length / answeredQuestions.length) *
                              100
                      )
                    : 0,

            // Performance by difficulty
            difficultyStats: this.calculateDifficultyStats(answeredQuestions),

            // Progress over time
            progressData: this.calculateProgressData(answeredQuestions),

            // Category performance
            categoryStats: this.calculateCategoryStats(answeredQuestions),

            // Time analysis
            timeStats: this.calculateTimeStats(answeredQuestions),

            // User stats
            userStats: user.stats || {},
        };
    }

    calculateDifficultyStats(questions) {
        const stats = {
            facil: { total: 0, correct: 0 },
            medio: { total: 0, correct: 0 },
            dificil: { total: 0, correct: 0 },
        };

        questions.forEach((q) => {
            if (stats[q.difficulty]) {
                stats[q.difficulty].total++;
                if (q.correct) {
                    stats[q.difficulty].correct++;
                }
            }
        });

        // Calculate percentages
        Object.keys(stats).forEach((difficulty) => {
            const stat = stats[difficulty];
            stat.percentage =
                stat.total > 0
                    ? Math.round((stat.correct / stat.total) * 100)
                    : 0;
        });

        return stats;
    }

    calculateProgressData(questions) {
        const dailyStats = {};

        questions.forEach((q) => {
            // Corrigir o cálculo de datas
            const date = new Date(q.answeredAt || q.createdAt);
            const dateKey = date.toISOString().split('T')[0];

            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { total: 0, correct: 0 };
            }

            dailyStats[dateKey].total++;
            if (q.correct) dailyStats[dateKey].correct++;
        });

        // Convert to array and sort by date
        const progressArray = Object.entries(dailyStats)
            .map(([date, stats]) => ({
                date: new Date(date),
                total: stats.total,
                correct: stats.correct,
                percentage: Math.round((stats.correct / stats.total) * 100),
            }))
            .sort((a, b) => a.date - b.date);

        return progressArray;
    }

    calculateCategoryStats(questions) {
        const stats = {
            'multipla-escolha': { total: 0, correct: 0 },
            'verdadeiro-falso': { total: 0, correct: 0 },
            dissertativa: { total: 0, correct: 0 },
        };

        questions.forEach((q) => {
            if (stats[q.type]) {
                stats[q.type].total++;
                if (q.correct) {
                    stats[q.type].correct++;
                }
            }
        });

        // Calculate percentages
        Object.keys(stats).forEach((type) => {
            const stat = stats[type];
            stat.percentage =
                stat.total > 0
                    ? Math.round((stat.correct / stat.total) * 100)
                    : 0;
        });

        return stats;
    }

    calculateTimeStats(questions) {
        if (questions.length === 0)
            return { average: 0, fastest: 0, slowest: 0 };

        const times = questions.map((q) => q.timeSpent).filter((t) => t > 0);

        if (times.length === 0) return { average: 0, fastest: 0, slowest: 0 };

        return {
            average: Math.round(
                times.reduce((a, b) => a + b, 0) / times.length
            ),
            fastest: Math.min(...times),
            slowest: Math.max(...times),
        };
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

        return {
            totalQuestions,
            correctAnswers,
            skippedQuestions,
            accuracy: Math.round(accuracy),
            totalTime: Math.round(
                (this.currentSession.endTime - this.currentSession.startTime) /
                    1000
            ),
        };
    }

    renderDashboardStats() {
        if (!this.reportData) return;

        // Update dashboard cards
        this.updateStatCard('total-questions', this.reportData.totalQuestions);
        this.updateStatCard(
            'total-answered',
            this.reportData.answeredQuestions
        );
        this.updateStatCard('success-rate', `${this.reportData.successRate}%`);
        this.updateStatCard(
            'total-documents',
            this.reportData.userStats.documentsProcessed || 0
        );

        // Update detailed stats
        this.updateStatCard(
            'best-streak',
            this.reportData.userStats.bestStreak || 0
        );
        this.updateStatCard(
            'avg-time',
            this.formatTime(this.reportData.userStats.averageTime || 0)
        );
        this.updateStatCard(
            'total-points',
            this.reportData.userStats.totalPoints || 0
        );
        this.updateStatCard('favorite-category', this.getFavoriteCategory());
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    getFavoriteCategory() {
        if (!this.reportData || !this.reportData.categoryStats) return '-';

        const categories = this.reportData.categoryStats;
        let maxTotal = 0;
        let favoriteCategory = '-';

        Object.entries(categories).forEach(([type, stats]) => {
            if (stats.total > maxTotal) {
                maxTotal = stats.total;
                favoriteCategory = this.formatQuestionType(type);
            }
        });

        return favoriteCategory;
    }

    renderCharts() {
        this.renderDifficultyChart();
        this.renderProgressChart();
    }

    renderDifficultyChart() {
        const ctx = document.getElementById('difficulty-chart');
        if (!ctx || !this.reportData) return;

        // Destroy existing chart
        if (this.charts.difficulty) {
            this.charts.difficulty.destroy();
        }

        const difficultyStats = this.reportData.difficultyStats;

        this.charts.difficulty = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Fácil', 'Médio', 'Difícil'],
                datasets: [
                    {
                        label: 'Taxa de Acerto (%)',
                        data: [
                            difficultyStats.facil.percentage,
                            difficultyStats.medio.percentage,
                            difficultyStats.dificil.percentage,
                        ],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)',
                            'rgba(239, 68, 68, 1)',
                        ],
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                            },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const difficulty = [
                                    'facil',
                                    'medio',
                                    'dificil',
                                ][context.dataIndex];
                                const stats = difficultyStats[difficulty];
                                return `${label}: ${value}% (${stats.correct}/${stats.total})`;
                            },
                        },
                    },
                },
            },
        });
    }

    renderProgressChart() {
        const ctx = document.getElementById('progress-chart');
        if (!ctx || !this.reportData) return;

        // Destroy existing chart
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        const progressData = this.reportData.progressData;

        if (progressData.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: progressData.map((d) =>
                    d.date.toLocaleDateString('pt-BR')
                ),
                datasets: [
                    {
                        label: 'Taxa de Acerto (%)',
                        data: progressData.map((d) => d.percentage),
                        borderColor: 'rgba(99, 102, 241, 1)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            },
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const dataPoint =
                                    progressData[context.dataIndex];
                                return `Taxa de Acerto: ${context.parsed.y}% (${dataPoint.correct}/${dataPoint.total})`;
                            },
                        },
                    },
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            },
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach((chart) => {
            if (chart) {
                chart.resize();
            }
        });
    }

    // Dashboard manager for main dashboard page
    loadDashboard() {
        this.generateReportData();
        this.renderDashboardStats();
        this.loadRecentActivity();
        this.updateGamificationStats();
    }

    updateGamificationStats() {
        if (window.gamificationManager) {
            const gamificationStats = window.gamificationManager.getUserStats();

            // Update level and points
            this.updateStatCard('user-level', gamificationStats.level);
            this.updateStatCard('user-points', gamificationStats.totalPoints);
            this.updateStatCard(
                'current-streak',
                gamificationStats.currentStreak
            );

            // Atualizar barra de progresso
            const progressBar = document.getElementById('level-progress');
            if (progressBar && gamificationStats.progressToNextLevel) {
                progressBar.style.width = `${gamificationStats.progressToNextLevel.percentage}%`;
            }

            // Update progress text
            const progressText = document.getElementById('level-progress-text');
            if (progressText && gamificationStats.progressToNextLevel) {
                progressText.textContent = `${gamificationStats.progressToNextLevel.current}/${gamificationStats.progressToNextLevel.total} pontos`;
            }
        }
    }

    loadRecentActivity() {
        const questions = window.storageManager.getQuestions();
        const sessions = window.storageManager.getSessions();

        // Combine and sort recent activities
        const activities = [];

        // Add recent questions
        questions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .forEach((q) => {
                activities.push({
                    type: 'question',
                    timestamp: q.createdAt,
                    title: q.answered ? 'Questão respondida' : 'Questão gerada',
                    description: this.truncateText(q.question, 60),
                    icon: q.answered ? 'fa-check-circle' : 'fa-plus-circle',
                });
            });

        // Add recent sessions
        sessions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3)
            .forEach((s) => {
                activities.push({
                    type: 'session',
                    timestamp: s.timestamp,
                    title: 'Questões geradas',
                    description: `${s.questionCount} questões de ${s.source}`,
                    icon: 'fa-magic',
                });
            });

        // Sort all activities by timestamp
        activities.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        this.renderRecentActivity(activities.slice(0, 8));
    }

    renderRecentActivity(activities) {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        if (activities.length === 0) {
            activityList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-history" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = activities
            .map(
                (activity) => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">
                    <small>${this.formatRelativeTime(
                        activity.timestamp
                    )}</small>
                </div>
            </div>
        `
            )
            .join('');
    }

    // Export reports
    exportReportData() {
        if (!this.reportData) {
            window.utils.showToast(
                'warning',
                'Sem dados',
                'Não há dados para exportar'
            );
            return;
        }

        const reportSummary = {
            generatedAt: new Date().toISOString(),
            user: window.app.currentUser?.name || 'Usuário',
            summary: {
                totalQuestions: this.reportData.totalQuestions,
                answeredQuestions: this.reportData.answeredQuestions,
                successRate: this.reportData.successRate,
                totalPoints: this.reportData.userStats.totalPoints || 0,
                bestStreak: this.reportData.userStats.bestStreak || 0,
            },
            difficultyPerformance: this.reportData.difficultyStats,
            categoryPerformance: this.reportData.categoryStats,
            progressData: this.reportData.progressData,
            timeStats: this.reportData.timeStats,
        };

        const blob = new Blob([JSON.stringify(reportSummary, null, 2)], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_questionai_${
            new Date().toISOString().split('T')[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.utils.showToast(
            'success',
            'Relatório exportado',
            'Dados salvos com sucesso'
        );
    }

    // Utility methods
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    formatQuestionType(type) {
        const labels = {
            'multipla-escolha': 'Múltipla Escolha',
            'verdadeiro-falso': 'Verdadeiro/Falso',
            dissertativa: 'Dissertativa',
        };
        return labels[type] || type;
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) {
            return 'Agora mesmo';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} min atrás`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h atrás`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} dia${days > 1 ? 's' : ''} atrás`;
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Performance insights
    generateInsights() {
        if (!this.reportData) return [];

        const insights = [];
        const stats = this.reportData;

        // Success rate insights
        if (stats.successRate >= 80) {
            insights.push({
                type: 'success',
                title: 'Excelente desempenho!',
                message: `Você tem uma taxa de acerto de ${stats.successRate}%. Continue assim!`,
            });
        } else if (stats.successRate >= 60) {
            insights.push({
                type: 'info',
                title: 'Bom desempenho',
                message: `Taxa de acerto de ${stats.successRate}%. Há espaço para melhorar!`,
            });
        } else {
            insights.push({
                type: 'warning',
                title: 'Foque nos estudos',
                message: `Taxa de acerto de ${stats.successRate}%. Pratique mais para melhorar.`,
            });
        }

        // Difficulty insights
        const diffStats = stats.difficultyStats;
        const weakestDifficulty = Object.entries(diffStats)
            .filter(([_, stat]) => stat.total > 0)
            .sort((a, b) => a[1].percentage - b[1].percentage)[0];

        if (weakestDifficulty) {
            const [difficulty, stat] = weakestDifficulty;
            if (stat.percentage < 50) {
                insights.push({
                    type: 'warning',
                    title: 'Área de melhoria',
                    message: `Questões de nível ${this.formatDifficulty(
                        difficulty
                    )} precisam de mais atenção (${
                        stat.percentage
                    }% de acerto).`,
                });
            }
        }

        // Streak insights
        if (stats.userStats.bestStreak >= 10) {
            insights.push({
                type: 'success',
                title: 'Sequência impressionante!',
                message: `Sua melhor sequência foi de ${stats.userStats.bestStreak} acertos consecutivos.`,
            });
        }

        return insights;
    }

    formatDifficulty(difficulty) {
        const labels = {
            facil: 'fácil',
            medio: 'médio',
            dificil: 'difícil',
        };
        return labels[difficulty] || difficulty;
    }
}

// Initialize reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reportsManager = new ReportsManager();
    window.dashboardManager = window.reportsManager; // Alias for dashboard functionality
});
