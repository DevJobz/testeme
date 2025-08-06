// Profile Manager
class ProfileManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Preference toggles
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const notificationsToggle = document.getElementById('notifications-toggle');
        const autoSaveToggle = document.getElementById('auto-save-toggle');

        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                this.updatePreference('darkMode', e.target.checked);
                window.app.toggleTheme(e.target.checked);
            });
        }

        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', (e) => {
                this.updatePreference('notifications', e.target.checked);
            });
        }

        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('change', (e) => {
                this.updatePreference('autoSave', e.target.checked);
            });
        }

        // Data management buttons
        const exportDataBtn = document.getElementById('export-data-btn');
        const importDataBtn = document.getElementById('import-data-btn');
        const clearDataBtn = document.getElementById('clear-data-btn');

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportUserData();
            });
        }

        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                this.showImportDialog();
            });
        }

        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.confirmClearData();
            });
        }

        // Avatar upload (placeholder)
        const avatarCircle = document.getElementById('avatar-circle');
        if (avatarCircle) {
            avatarCircle.addEventListener('click', () => {
                this.changeAvatar();
            });
        }
    }

    loadProfile() {
        const user = window.app.currentUser;
        if (!user) return;

        // Load basic profile information
        this.populateProfileForm(user);
        
        // Load preferences
        this.loadPreferences(user);
        
        // Update avatar
        this.updateAvatarDisplay(user);
    }

    populateProfileForm(user) {
        const fields = {
            'profile-name': user.name || '',
            'profile-email': user.email || '',
            'profile-phone': user.profile?.phone || '',
            'profile-occupation': user.profile?.occupation || '',
            'profile-bio': user.profile?.bio || ''
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
            }
        });
    }

    loadPreferences(user) {
        const preferences = user.preferences || {};
        
        const toggles = {
            'dark-mode-toggle': preferences.darkMode || false,
            'notifications-toggle': preferences.notifications !== false, // Default true
            'auto-save-toggle': preferences.autoSave !== false // Default true
        };

        Object.entries(toggles).forEach(([toggleId, checked]) => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.checked = checked;
            }
        });
    }

    updateAvatarDisplay(user) {
        const avatarCircle = document.getElementById('avatar-circle');
        if (!avatarCircle) return;

        if (user.profile?.avatar) {
            avatarCircle.innerHTML = `<img src="${user.profile.avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            // Show initials
            const initials = this.getInitials(user.name);
            avatarCircle.innerHTML = `<span style="font-size: 40px; font-weight: 600;">${initials}</span>`;
        }
    }

    getInitials(name) {
        if (!name) return 'U';
        
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        }
        
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    async saveProfile() {
        const user = window.app.currentUser;
        if (!user) return;

        // Get form data
        const formData = {
            name: document.getElementById('profile-name')?.value.trim() || '',
            email: document.getElementById('profile-email')?.value.trim() || '',
            phone: document.getElementById('profile-phone')?.value.trim() || '',
            occupation: document.getElementById('profile-occupation')?.value.trim() || '',
            bio: document.getElementById('profile-bio')?.value.trim() || ''
        };

        // Validate required fields
        if (!formData.name) {
            window.utils.showToast('error', 'Campo obrigatório', 'Nome é obrigatório');
            return;
        }

        if (!formData.email || !window.utils.validateEmail(formData.email)) {
            window.utils.showToast('error', 'Email inválido', 'Por favor, insira um email válido');
            return;
        }

        // Check if email is already used by another user
        const existingUser = window.storageManager.getUserByEmail(formData.email);
        if (existingUser && existingUser.id !== user.id) {
            window.utils.showToast('error', 'Email em uso', 'Este email já está sendo usado por outro usuário');
            return;
        }

        try {
            // Update user data
            user.name = formData.name;
            user.email = formData.email.toLowerCase();
            user.profile = {
                ...user.profile,
                phone: formData.phone,
                occupation: formData.occupation,
                bio: formData.bio
            };

            // Save to storage
            window.authManager.updateStoredUser(user);

            window.utils.showToast('success', 'Perfil atualizado', 'Suas informações foram salvas com sucesso');
            
            // Update avatar display
            this.updateAvatarDisplay(user);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            window.utils.showToast('error', 'Erro ao salvar', 'Não foi possível salvar o perfil');
        }
    }

    updatePreference(key, value) {
        const user = window.app.currentUser;
        if (!user) return;

        if (!user.preferences) {
            user.preferences = {};
        }

        user.preferences[key] = value;
        
        // Save to storage
        window.authManager.updateStoredUser(user);
        
        // Also save to global preferences
        const globalPrefs = window.storageManager.getPreferences();
        globalPrefs[key] = value;
        window.storageManager.savePreferences(globalPrefs);

        window.utils.showToast('success', 'Preferência atualizada', `${this.getPreferenceLabel(key)} foi ${value ? 'ativado' : 'desativado'}`);
    }

    getPreferenceLabel(key) {
        const labels = {
            darkMode: 'Modo escuro',
            notifications: 'Notificações',
            autoSave: 'Salvamento automático'
        };
        return labels[key] || key;
    }

    changeAvatar() {
        // Create file input for avatar upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processAvatarFile(file);
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    processAvatarFile(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            window.utils.showToast('error', 'Arquivo inválido', 'Por favor, selecione uma imagem');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            window.utils.showToast('error', 'Arquivo muito grande', 'A imagem deve ter no máximo 2MB');
            return;
        }

        // Read file as data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.saveAvatar(dataUrl);
        };
        reader.onerror = () => {
            window.utils.showToast('error', 'Erro ao ler arquivo', 'Não foi possível processar a imagem');
        };
        reader.readAsDataURL(file);
    }

    saveAvatar(dataUrl) {
        const user = window.app.currentUser;
        if (!user) return;

        if (!user.profile) {
            user.profile = {};
        }

        user.profile.avatar = dataUrl;
        
        // Save to storage
        window.authManager.updateStoredUser(user);
        
        // Update display
        this.updateAvatarDisplay(user);
        
        window.utils.showToast('success', 'Avatar atualizado', 'Sua foto foi alterada com sucesso');
    }

    exportUserData() {
        try {
            const user = window.app.currentUser;
            if (!user) return;

            const questions = window.storageManager.getQuestions();
            const sessions = window.storageManager.getSessions();

            const userData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    profile: user.profile,
                    preferences: user.preferences,
                    stats: user.stats,
                    createdAt: user.createdAt
                },
                questions: questions,
                sessions: sessions
            };

            const blob = new Blob([JSON.stringify(userData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meus_dados_questionai_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.utils.showToast('success', 'Dados exportados', 'Seus dados foram salvos com sucesso');
        } catch (error) {
            console.error('Error exporting user data:', error);
            window.utils.showToast('error', 'Erro na exportação', 'Não foi possível exportar os dados');
        }
    }

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importUserData(file);
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    async importUserData(file) {
        try {
            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);

            if (!this.validateImportData(data)) {
                throw new Error('Formato de arquivo inválido');
            }

            // Confirm import
            if (!confirm('Isso irá substituir seus dados atuais. Deseja continuar?')) {
                return;
            }

            // Create backup before import
            window.storageManager.createBackup('before_import');

            // Import user data
            if (data.user) {
                const currentUser = window.app.currentUser;
                const updatedUser = { ...currentUser, ...data.user, id: currentUser.id };
                window.authManager.updateStoredUser(updatedUser);
            }

            // Import questions and sessions
            if (data.questions) {
                window.storageManager.setItem('questionai_questions', data.questions);
            }
            if (data.sessions) {
                window.storageManager.setItem('questionai_sessions', data.sessions);
            }

            window.utils.showToast('success', 'Dados importados', 'Importação realizada com sucesso');
            
            // Reload profile
            this.loadProfile();
            
        } catch (error) {
            console.error('Error importing user data:', error);
            window.utils.showToast('error', 'Erro na importação', error.message);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        return data && 
               typeof data === 'object' && 
               data.version && 
               (data.user || data.questions || data.sessions);
    }

    confirmClearData() {
        const confirmation = prompt(
            'ATENÇÃO: Esta ação irá apagar TODOS os seus dados permanentemente.\n\n' +
            'Para confirmar, digite "APAGAR TUDO" (sem aspas):'
        );

        if (confirmation === 'APAGAR TUDO') {
            this.clearAllUserData();
        } else if (confirmation !== null) {
            window.utils.showToast('info', 'Operação cancelada', 'Texto de confirmação incorreto');
        }
    }

    clearAllUserData() {
        try {
            const user = window.app.currentUser;
            if (!user) return;

            // Create final backup
            window.storageManager.createBackup('before_clear');

            // Clear user-specific data
            window.storageManager.clearUserData(user.id);

            // Clear current session
            window.app.logout();

            window.utils.showToast('success', 'Dados limpos', 'Todos os dados foram removidos');
        } catch (error) {
            console.error('Error clearing user data:', error);
            window.utils.showToast('error', 'Erro na limpeza', 'Não foi possível limpar os dados');
        }
    }

    // Account management
    changePassword() {
        // Placeholder for password change functionality
        window.utils.showToast('info', 'Em breve', 'Alteração de senha será implementada em breve');
    }

    deleteAccount() {
        const confirmation = prompt(
            'ATENÇÃO: Esta ação irá deletar sua conta permanentemente.\n\n' +
            'Para confirmar, digite "DELETAR CONTA" (sem aspas):'
        );

        if (confirmation === 'DELETAR CONTA') {
            this.performAccountDeletion();
        } else if (confirmation !== null) {
            window.utils.showToast('info', 'Operação cancelada', 'Texto de confirmação incorreto');
        }
    }

    performAccountDeletion() {
        try {
            const user = window.app.currentUser;
            if (!user) return;

            // Remove user and all associated data
            window.storageManager.clearUserData(user.id);

            // Logout
            window.app.logout();

            window.utils.showToast('success', 'Conta deletada', 'Sua conta foi removida permanentemente');
        } catch (error) {
            console.error('Error deleting account:', error);
            window.utils.showToast('error', 'Erro na deleção', 'Não foi possível deletar a conta');
        }
    }

    // Profile statistics
    getProfileStats() {
        const user = window.app.currentUser;
        if (!user) return null;

        const questions = window.storageManager.getQuestions();
        const sessions = window.storageManager.getSessions();

        return {
            memberSince: user.createdAt,
            lastLogin: user.lastLogin,
            totalQuestions: questions.length,
            totalSessions: sessions.length,
            profileCompleteness: this.calculateProfileCompleteness(user)
        };
    }

    calculateProfileCompleteness(user) {
        const fields = [
            user.name,
            user.email,
            user.profile?.phone,
            user.profile?.occupation,
            user.profile?.bio,
            user.profile?.avatar
        ];

        const filledFields = fields.filter(field => field && field.trim()).length;
        return Math.round((filledFields / fields.length) * 100);
    }

    // Profile suggestions
    getProfileSuggestions() {
        const user = window.app.currentUser;
        if (!user) return [];

        const suggestions = [];
        const completeness = this.calculateProfileCompleteness(user);

        if (completeness < 100) {
            suggestions.push({
                type: 'info',
                title: 'Complete seu perfil',
                message: `Seu perfil está ${completeness}% completo. Adicione mais informações para uma experiência personalizada.`
            });
        }

        if (!user.profile?.avatar) {
            suggestions.push({
                type: 'info',
                title: 'Adicione uma foto',
                message: 'Uma foto de perfil torna sua experiência mais pessoal.'
            });
        }

        const questions = window.storageManager.getQuestions();
        if (questions.length === 0) {
            suggestions.push({
                type: 'info',
                title: 'Gere suas primeiras questões',
                message: 'Comece criando questões para acompanhar seu progresso.'
            });
        }

        return suggestions;
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

