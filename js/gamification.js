// Gamification Manager - Handles achievements, streaks, and rewards
class GamificationManager {
    constructor() {
        this.achievements = [
            {
                id: 'first_question',
                name: 'Primeira Questão',
                description: 'Responda sua primeira questão',
                icon: 'fas fa-play',
                points: 10,
                unlocked: false,
            },
            {
                id: 'streak_3',
                name: 'Sequência de 3',
                description: 'Acerte 3 questões seguidas',
                icon: 'fas fa-fire',
                points: 25,
                unlocked: false,
            },
            {
                id: 'streak_7',
                name: 'Semana Perfeita',
                description: 'Acerte 7 questões seguidas',
                icon: 'fas fa-trophy',
                points: 50,
                unlocked: false,
            },
            {
                id: 'daily_streak_7',
                name: 'Dedicação Semanal',
                description: 'Use o app por 7 dias consecutivos',
                icon: 'fas fa-calendar-check',
                points: 75,
                unlocked: false,
            },
            {
                id: 'questions_50',
                name: 'Meio Centenário',
                description: 'Responda 50 questões',
                icon: 'fas fa-medal',
                points: 100,
                unlocked: false,
            },
            {
                id: 'perfect_score',
                name: 'Perfeição',
                description:
                    'Obtenha 100% de acerto em uma sessão de 10 questões',
                icon: 'fas fa-star',
                points: 150,
                unlocked: false,
            },
        ];

        this.userStats = {
            totalQuestions: 0,
            correctAnswers: 0,
            currentStreak: 0,
            bestStreak: 0,
            dailyStreak: 0,
            lastActiveDate: null,
            totalPoints: 0,
            level: 1,
            achievements: [],
        };

        this.init();
    }

    init() {
        this.loadUserStats();
        this.setupEventListeners();
    }

    loadUserStats() {
        // Wait for storageManager to be available
        if (!window.storageManager || !window.storageManager.currentUserId) {
            setTimeout(() => this.loadUserStats(), 100);
            return;
        }

        const userKey = window.storageManager.getUserStorageKey('gamification');
        if (userKey) {
            const savedStats = window.storageManager.getItem(userKey);
            if (savedStats) {
                this.userStats = { ...this.userStats, ...savedStats };
            }
        }
    }

    saveUserStats() {
        if (!window.storageManager || !window.storageManager.currentUserId) {
            return;
        }

        const userKey = window.storageManager.getUserStorageKey('gamification');
        if (userKey) {
            window.storageManager.setItem(userKey, this.userStats);
        }
    }

    setupEventListeners() {
        // Listen for question answered events
        document.addEventListener('questionAnswered', (e) => {
            this.handleQuestionAnswered(e.detail);
        });

        // Listen for daily login
        this.checkDailyLogin();
    }

    handleQuestionAnswered(data) {
        const { correct, timeSpent, difficulty, sessionStats } = data;

        this.userStats.totalQuestions++;

        if (correct) {
            this.userStats.correctAnswers++;
            this.userStats.currentStreak++;

            // Calculate points based on difficulty and time
            const points = this.calculateQuestionPoints(difficulty, timeSpent);
            this.userStats.totalPoints += points;

            if (this.userStats.currentStreak > this.userStats.bestStreak) {
                this.userStats.bestStreak = this.userStats.currentStreak;
            }
        } else {
            this.userStats.currentStreak = 0;
        }

        // Check achievements
        this.checkAchievements(sessionStats);

        // Update level
        this.updateLevel();

        // Save stats
        this.saveUserStats();

        // Update UI
        this.updateGamificationUI();
    }

    calculateQuestionPoints(difficulty, timeSpent) {
        const basePoints = {
            facil: 10,
            medio: 20,
            dificil: 30,
        };

        let points = basePoints[difficulty] || 20;

        // Time bonus (faster = more points, max 30 seconds for full bonus)
        const timeBonus = Math.max(0, 30 - Math.floor(timeSpent / 1000));
        points += timeBonus;

        return points;
    }

    checkAchievements(sessionStats = null) {
        const newAchievements = [];

        // First question
        if (
            this.userStats.totalQuestions >= 1 &&
            !this.isAchievementUnlocked('first_question')
        ) {
            newAchievements.push(this.unlockAchievement('first_question'));
        }

        // Streak achievements
        if (
            this.userStats.currentStreak >= 3 &&
            !this.isAchievementUnlocked('streak_3')
        ) {
            newAchievements.push(this.unlockAchievement('streak_3'));
        }

        if (
            this.userStats.currentStreak >= 7 &&
            !this.isAchievementUnlocked('streak_7')
        ) {
            newAchievements.push(this.unlockAchievement('streak_7'));
        }

        // Total questions
        if (
            this.userStats.totalQuestions >= 50 &&
            !this.isAchievementUnlocked('questions_50')
        ) {
            newAchievements.push(this.unlockAchievement('questions_50'));
        }

        // Perfect score in session
        if (
            sessionStats &&
            sessionStats.total >= 10 &&
            sessionStats.correct === sessionStats.total &&
            !this.isAchievementUnlocked('perfect_score')
        ) {
            newAchievements.push(this.unlockAchievement('perfect_score'));
        }

        // Daily streak
        if (
            this.userStats.dailyStreak >= 7 &&
            !this.isAchievementUnlocked('daily_streak_7')
        ) {
            newAchievements.push(this.unlockAchievement('daily_streak_7'));
        }

        // Show achievement notifications
        newAchievements.forEach((achievement) => {
            this.showAchievementNotification(achievement);
        });
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievements.find(
            (a) => a.id === achievementId
        );
        if (achievement && !this.isAchievementUnlocked(achievementId)) {
            achievement.unlocked = true;
            this.userStats.achievements.push(achievementId);
            this.userStats.totalPoints += achievement.points;
            return achievement;
        }
        return null;
    }

    isAchievementUnlocked(achievementId) {
        return this.userStats.achievements.includes(achievementId);
    }

    updateLevel() {
        const pointsPerLevel = 100;
        const newLevel =
            Math.floor(this.userStats.totalPoints / pointsPerLevel) + 1;

        if (newLevel > this.userStats.level) {
            this.userStats.level = newLevel;
            this.showLevelUpNotification(newLevel);
        }
    }

    checkDailyLogin() {
        const today = new Date().toDateString();
        const lastActive = this.userStats.lastActiveDate;

        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastActive === yesterday.toDateString()) {
                this.userStats.dailyStreak++;
            } else if (lastActive !== null) {
                this.userStats.dailyStreak = 1;
            } else {
                this.userStats.dailyStreak = 1;
            }

            this.userStats.lastActiveDate = today;
            this.saveUserStats();
        }
    }

    showAchievementNotification(achievement) {
        if (!achievement) return;

        // Add CSS for achievement notifications if not already added
        if (!document.getElementById('achievement-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'achievement-notification-styles';
            style.textContent = `
                .achievement-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    max-width: 350px;
                    transform: translateX(100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .achievement-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .achievement-content {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .achievement-content i {
                    font-size: 32px;
                    color: #ffd700;
                }
                
                .achievement-text h4 {
                    margin: 0 0 5px 0;
                    font-size: 16px;
                    font-weight: bold;
                }
                
                .achievement-text p {
                    margin: 0;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .achievement-points {
                    color: #ffd700 !important;
                    font-weight: bold !important;
                }
            `;
            document.head.appendChild(style);
        }

        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <i class="${achievement.icon}"></i>
                <div class="achievement-text">
                    <h4>Conquista Desbloqueada!</h4>
                    <p><strong>${achievement.name}</strong></p>
                    <p>${achievement.description}</p>
                    <p class="achievement-points">+${achievement.points} pontos</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    showLevelUpNotification(level) {
        window.utils.showToast(
            'success',
            'Level Up!',
            `Parabéns! Você alcançou o nível ${level}!`
        );
    }

    updateGamificationUI() {
        const progress = this.getProgressToNextLevel();
        const progressBar = document.getElementById('level-progress');

        if (progressBar) {
            progressBar.style.width = `${progress.percentage}%`;
            progressBar.textContent = `${Math.round(progress.percentage)}%`;
        }

        // Atualização em tempo real dos pontos
        const pointsElement = document.getElementById('user-points');
        if (pointsElement) {
            pointsElement.textContent = this.userStats.totalPoints;
        }

        // Atualizar texto de progresso
        const progressText = document.getElementById('level-progress-text');
        if (progressText) {
            progressText.textContent = `${progress.current}/${progress.total} pontos`;
        }
        // Update dashboard stats
        this.updateDashboardStats();

        // Update profile achievements
        this.updateProfileAchievements();
    }

    updateDashboardStats() {
        const levelElement = document.getElementById('user-level');
        const pointsElement = document.getElementById('user-points');
        const streakElement = document.getElementById('current-streak');

        if (levelElement) levelElement.textContent = this.userStats.level;
        if (pointsElement)
            pointsElement.textContent = this.userStats.totalPoints;
        if (streakElement)
            streakElement.textContent = this.userStats.currentStreak;
    }

    updateProfileAchievements() {
        const achievementsContainer = document.getElementById(
            'achievements-container'
        );
        if (!achievementsContainer) return;

        achievementsContainer.innerHTML = '';

        this.achievements.forEach((achievement) => {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${
                achievement.unlocked ? 'unlocked' : 'locked'
            }`;
            achievementElement.innerHTML = `
                <i class="${achievement.icon}"></i>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    <span class="achievement-points">${achievement.points} pontos</span>
                </div>
            `;
            achievementsContainer.appendChild(achievementElement);
        });
    }

    getProgressToNextLevel() {
        const pointsPerLevel = 100;
        const currentLevelPoints = (this.userStats.level - 1) * pointsPerLevel;
        const nextLevelPoints = this.userStats.level * pointsPerLevel;
        const progress = this.userStats.totalPoints - currentLevelPoints;
        const total = nextLevelPoints - currentLevelPoints;

        return {
            current: progress,
            total: total,
            percentage: (progress / total) * 100,
        };
    }

    getUserStats() {
        return {
            ...this.userStats,
            accuracy:
                this.userStats.totalQuestions > 0
                    ? Math.round(
                          (this.userStats.correctAnswers /
                              this.userStats.totalQuestions) *
                              100
                      )
                    : 0,
            progressToNextLevel: this.getProgressToNextLevel(),
        };
    }
}

// Initialize Gamification Manager
window.gamificationManager = new GamificationManager();
