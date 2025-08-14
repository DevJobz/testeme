// Storage Manager - Handles all localStorage operations
class StorageManager {
    constructor() {
        this.storageKeys = {
            users: 'questionai_users',
            currentUser: 'questionai_user',
            backups: 'questionai_backups',
        };
        this.currentUserId = null;
        this.init();
    }

    init() {
        this.checkStorageAvailability();
        this.initializeDefaultData();
        this.setupStorageEventListeners();
        this.setCurrentUser();
    }

    setCurrentUser() {
        const currentUser = this.getItem(this.storageKeys.currentUser);
        if (currentUser) {
            this.currentUserId = currentUser.id;
        }
    }

    getUserStorageKey(key) {
        if (!this.currentUserId) {
            console.warn('No current user set for storage operation');
            return null;
        }
        return `questionai_${this.currentUserId}_${key}`;
    }

    // Helper method to check if user is set
    isUserSet() {
        return !!this.currentUserId;
    }

    checkStorageAvailability() {
        try {
            const test = 'storage_test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('localStorage not available:', error);
            window.utils.showToast(
                'error',
                'Erro de armazenamento',
                'localStorage não está disponível'
            );
            return false;
        }
    }

    initializeDefaultData() {
        // Initialize empty arrays if they don't exist
        if (!this.getItem(this.storageKeys.users)) {
            this.setItem(this.storageKeys.users, []);
        }
        if (!this.getItem(this.storageKeys.backups)) {
            this.setItem(this.storageKeys.backups, []);
        }
    }

    initializeUserData(userId) {
        this.currentUserId = userId;

        // Initialize user-specific data
        const userKeys = ['questions', 'sessions', 'preferences', 'stats'];
        userKeys.forEach((key) => {
            const userKey = this.getUserStorageKey(key);
            if (userKey && !this.getItem(userKey)) {
                this.setItem(userKey, key === 'preferences' ? {} : []);
            }
        });
    }

    setupStorageEventListeners() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('questionai_')) {
                this.handleStorageChange(e);
            }
        });

        // Auto-backup every 5 minutes
        setInterval(() => {
            this.createAutoBackup();
        }, 5 * 60 * 1000);
    }

    handleStorageChange(event) {
        console.log('Storage changed:', event.key, event.newValue);

        // Handle user logout from another tab
        if (event.key === this.storageKeys.currentUser && !event.newValue) {
            if (window.app && window.app.isAuthenticated) {
                window.app.logout();
                window.utils.showToast(
                    'info',
                    'Sessão encerrada',
                    'Você foi desconectado em outra aba'
                );
            }
        }
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Error setting storage item:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting storage item:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing storage item:', error);
            return false;
        }
    }

    // User management
    saveUser(user) {
        const users = this.getUsers();
        const existingIndex = users.findIndex((u) => u.id === user.id);

        if (existingIndex !== -1) {
            users[existingIndex] = { ...users[existingIndex], ...user };
        } else {
            users.push(user);
        }

        return this.setItem(this.storageKeys.users, users);
    }

    getUsers() {
        return this.getItem(this.storageKeys.users) || [];
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find((user) => user.id === id);
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find((user) => user.email === email.toLowerCase());
    }

    deleteUser(id) {
        const users = this.getUsers();
        const filteredUsers = users.filter((user) => user.id !== id);
        return this.setItem(this.storageKeys.users, filteredUsers);
    }

    // Current user session
    setCurrentUser(user) {
        return this.setItem(this.storageKeys.currentUser, user);
    }

    getCurrentUser() {
        return this.getItem(this.storageKeys.currentUser);
    }

    clearCurrentUser() {
        return this.removeItem(this.storageKeys.currentUser);
    }

    // Questions management (user-specific)
    saveQuestion(question) {
        const questions = this.getQuestions();
        const existingIndex = questions.findIndex((q) => q.id === question.id);

        if (existingIndex !== -1) {
            questions[existingIndex] = {
                ...questions[existingIndex],
                ...question,
            };
        } else {
            questions.push(question);
        }

        const userKey = this.getUserStorageKey('questions');
        return userKey ? this.setItem(userKey, questions) : false;
    }

    saveQuestions(questions) {
        const existingQuestions = this.getQuestions();
        const allQuestions = [...existingQuestions, ...questions];
        const userKey = this.getUserStorageKey('questions');
        return userKey ? this.setItem(userKey, allQuestions) : false;
    }

    getQuestions() {
        if (!this.isUserSet()) {
            return [];
        }
        const userKey = this.getUserStorageKey('questions');
        return userKey ? this.getItem(userKey) || [] : [];
    }

    getQuestionById(id) {
        if (!this.isUserSet()) {
            return null;
        }
        const questions = this.getQuestions();
        return questions.find((question) => question.id === id);
    }

    getQuestionsByUser(userId) {
        if (!this.isUserSet()) {
            return [];
        }
        const questions = this.getQuestions();
        return questions.filter((question) => question.userId === userId);
    }

    deleteQuestion(id) {
        const userKey = this.getUserStorageKey('questions');
        if (!userKey) return false;

        const questions = this.getItem(userKey) || [];
        const filteredQuestions = questions.filter(
            (question) => question.id !== id
        );
        return this.setItem(userKey, filteredQuestions);
    }

    // Sessions management (user-specific)
    saveSession(session) {
        const sessions = this.getSessions();
        sessions.push(session);
        const userKey = this.getUserStorageKey('sessions');
        return userKey ? this.setItem(userKey, sessions) : false;
    }

    getSessions() {
        if (!this.isUserSet()) {
            return [];
        }
        const userKey = this.getUserStorageKey('sessions');
        return userKey ? this.getItem(userKey) || [] : [];
    }

    // Preferences management (user-specific)
    savePreferences(preferences) {
        const userKey = this.getUserStorageKey('preferences');
        return userKey ? this.setItem(userKey, preferences) : false;
    }

    getPreferences() {
        const userKey = this.getUserStorageKey('preferences');
        const defaultPrefs = {
            darkMode: false,
            notifications: true,
            autoSave: true,
            language: 'pt-BR',
        };
        return userKey ? this.getItem(userKey) || defaultPrefs : defaultPrefs;
    }

    // Statistics management
    updateUserStats(userId, stats) {
        const user = this.getUserById(userId);
        if (user) {
            user.stats = { ...user.stats, ...stats };
            return this.saveUser(user);
        }
        return false;
    }

    getUserStats(userId) {
        const user = this.getUserById(userId);
        return user ? user.stats : null;
    }

    // Data export/import
    exportAllData() {
        try {
            const data = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                users: this.getUsers(),
                questions: this.getQuestions(),
                sessions: this.getSessions(),
                preferences: this.getPreferences(),
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `questionai_backup_${
                new Date().toISOString().split('T')[0]
            }.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.utils.showToast(
                'success',
                'Dados exportados',
                'Backup criado com sucesso'
            );
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            window.utils.showToast(
                'error',
                'Erro na exportação',
                'Não foi possível exportar os dados'
            );
            return false;
        }
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!this.validateImportData(data)) {
                        throw new Error('Formato de arquivo inválido');
                    }

                    // Backup current data before import
                    this.createBackup('before_import');

                    // Import data
                    if (data.users)
                        this.setItem(this.storageKeys.users, data.users);
                    if (data.questions)
                        this.setItem(
                            this.storageKeys.questions,
                            data.questions
                        );
                    if (data.sessions)
                        this.setItem(this.storageKeys.sessions, data.sessions);
                    if (data.preferences)
                        this.setItem(
                            this.storageKeys.preferences,
                            data.preferences
                        );

                    window.utils.showToast(
                        'success',
                        'Dados importados',
                        'Importação realizada com sucesso'
                    );
                    resolve(true);
                } catch (error) {
                    console.error('Error importing data:', error);
                    window.utils.showToast(
                        'error',
                        'Erro na importação',
                        error.message
                    );
                    reject(error);
                }
            };

            reader.onerror = () => {
                const error = new Error('Erro ao ler arquivo');
                window.utils.showToast(
                    'error',
                    'Erro na importação',
                    error.message
                );
                reject(error);
            };

            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        return (
            data &&
            typeof data === 'object' &&
            data.version &&
            (data.users || data.questions || data.sessions || data.preferences)
        );
    }

    // Backup management
    createBackup(type = 'manual') {
        try {
            const backup = {
                id: window.utils.generateId(),
                type: type,
                timestamp: new Date().toISOString(),
                data: {
                    users: this.getUsers(),
                    questions: this.getQuestions(),
                    sessions: this.getSessions(),
                    preferences: this.getPreferences(),
                },
            };

            const backups = this.getItem(this.storageKeys.backups) || [];
            backups.push(backup);

            // Keep only last 10 backups
            if (backups.length > 10) {
                backups.splice(0, backups.length - 10);
            }

            this.setItem(this.storageKeys.backups, backups);
            return backup.id;
        } catch (error) {
            console.error('Error creating backup:', error);
            return null;
        }
    }

    createAutoBackup() {
        if (window.app && window.app.isAuthenticated) {
            this.createBackup('auto');
        }
    }

    restoreBackup(backupId) {
        try {
            const backups = this.getItem(this.storageKeys.backups) || [];
            const backup = backups.find((b) => b.id === backupId);

            if (!backup) {
                throw new Error('Backup não encontrado');
            }

            // Restore data
            if (backup.data.users)
                this.setItem(this.storageKeys.users, backup.data.users);
            if (backup.data.questions)
                this.setItem(this.storageKeys.questions, backup.data.questions);
            if (backup.data.sessions)
                this.setItem(this.storageKeys.sessions, backup.data.sessions);
            if (backup.data.preferences)
                this.setItem(
                    this.storageKeys.preferences,
                    backup.data.preferences
                );

            window.utils.showToast(
                'success',
                'Backup restaurado',
                'Dados restaurados com sucesso'
            );
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            window.utils.showToast(
                'error',
                'Erro na restauração',
                error.message
            );
            return false;
        }
    }

    getBackups() {
        return this.getItem(this.storageKeys.backups) || [];
    }

    // Data cleanup
    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach((key) => {
                localStorage.removeItem(key);
            });

            this.initializeDefaultData();
            window.utils.showToast(
                'success',
                'Dados limpos',
                'Todos os dados foram removidos'
            );
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            window.utils.showToast(
                'error',
                'Erro na limpeza',
                'Não foi possível limpar os dados'
            );
            return false;
        }
    }

    clearUserData(userId) {
        try {
            // Remove user
            this.deleteUser(userId);

            // Remove user's questions
            const questions = this.getQuestions();
            const filteredQuestions = questions.filter(
                (q) => q.userId !== userId
            );
            this.setItem(this.storageKeys.questions, filteredQuestions);

            // Remove user's sessions
            const sessions = this.getSessions();
            const filteredSessions = sessions.filter(
                (s) => s.userId !== userId
            );
            this.setItem(this.storageKeys.sessions, filteredSessions);

            return true;
        } catch (error) {
            console.error('Error clearing user data:', error);
            return false;
        }
    }

    // Storage statistics
    getStorageStats() {
        try {
            const stats = {
                totalUsers: this.getUsers().length,
                totalQuestions: this.getQuestions().length,
                totalSessions: this.getSessions().length,
                totalBackups: this.getBackups().length,
                storageUsed: this.calculateStorageUsage(),
                lastBackup: this.getLastBackupDate(),
            };

            return stats;
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }

    calculateStorageUsage() {
        let totalSize = 0;

        Object.values(this.storageKeys).forEach((key) => {
            const item = localStorage.getItem(key);
            if (item) {
                totalSize += new Blob([item]).size;
            }
        });

        return this.formatBytes(totalSize);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getLastBackupDate() {
        const backups = this.getBackups();
        if (backups.length === 0) return null;

        const lastBackup = backups[backups.length - 1];
        return new Date(lastBackup.timestamp);
    }

    // Error handling
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            window.utils.showToast(
                'warning',
                'Armazenamento cheio',
                'Considere limpar dados antigos ou fazer backup'
            );
        } else {
            window.utils.showToast(
                'error',
                'Erro de armazenamento',
                'Problema ao salvar dados'
            );
        }
    }

    // Data migration (for future versions)
    migrateData(fromVersion, toVersion) {
        console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
        // Implementation for future data migrations
    }
}

// Initialize storage manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.storageManager = new StorageManager();
});
