// Authentication Manager
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }

        // Show register page
        const showRegisterBtn = document.getElementById('show-register');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterPage();
            });
        }

        // Show login page
        const showLoginBtn = document.getElementById('show-login');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginPage();
            });
        }

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateEmailField(input);
            });
        });

        // Password validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validatePasswordField(input);
            });
        });

        // Confirm password validation
        const confirmPasswordInput = document.getElementById('register-confirm-password');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validateConfirmPassword();
            });
        }
    }

    validateEmailField(input) {
        const email = input.value.trim();
        const isValid = window.utils.validateEmail(email);
        
        this.setFieldValidation(input, isValid, isValid ? '' : 'Email inválido');
        return isValid;
    }

    validatePasswordField(input) {
        const password = input.value;
        const isValid = window.utils.validatePassword(password);
        
        this.setFieldValidation(input, isValid, isValid ? '' : 'Senha deve ter pelo menos 6 caracteres');
        return isValid;
    }

    validateConfirmPassword() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const isValid = password === confirmPassword && password.length > 0;
        
        const confirmInput = document.getElementById('register-confirm-password');
        this.setFieldValidation(confirmInput, isValid, isValid ? '' : 'Senhas não coincidem');
        return isValid;
    }

    setFieldValidation(input, isValid, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // Remove existing validation
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Update input style
        if (isValid) {
            input.style.borderColor = 'var(--accent-color)';
        } else {
            input.style.borderColor = 'var(--danger-color)';
            
            // Add error message
            if (message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.style.color = 'var(--danger-color)';
                errorDiv.style.fontSize = '12px';
                errorDiv.style.marginTop = '4px';
                errorDiv.textContent = message;
                formGroup.appendChild(errorDiv);
            }
        }
    }

    async handleLogin(e) {
        const form = e.target;
        const email = form.querySelector('#login-email').value.trim();
        const password = form.querySelector('#login-password').value;

        // Validate inputs
        if (!this.validateLoginForm(email, password)) {
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.disabled = true;

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if user exists
            const users = this.getStoredUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                // Update last login
                user.lastLogin = new Date().toISOString();
                this.updateStoredUser(user);

                // Login successful
                window.app.login(user);
            } else {
                throw new Error('Email ou senha incorretos');
            }
        } catch (error) {
            window.utils.showToast('error', 'Erro no login', error.message);
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        const form = e.target;
        const name = form.querySelector('#register-name').value.trim();
        const email = form.querySelector('#register-email').value.trim();
        const password = form.querySelector('#register-password').value;
        const confirmPassword = form.querySelector('#register-confirm-password').value;

        // Validate inputs
        if (!this.validateRegisterForm(name, email, password, confirmPassword)) {
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
        submitBtn.disabled = true;

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Check if user already exists
            const users = this.getStoredUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                throw new Error('Este email já está cadastrado');
            }

            // Create new user
            const newUser = {
                id: window.utils.generateId(),
                name: window.utils.sanitizeInput(name),
                email: email.toLowerCase(),
                password: password, // In production, this should be hashed
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                profile: {
                    phone: '',
                    occupation: '',
                    bio: '',
                    avatar: null
                },
                preferences: {
                    darkMode: false,
                    notifications: true,
                    autoSave: true
                },
                stats: {
                    questionsGenerated: 0,
                    questionsAnswered: 0,
                    correctAnswers: 0,
                    documentsProcessed: 0,
                    totalPoints: 0,
                    bestStreak: 0,
                    averageTime: 0
                }
            };

            // Save user
            users.push(newUser);
            localStorage.setItem('questionai_users', JSON.stringify(users));

            // Auto login
            window.app.login(newUser);
            
            window.utils.showToast('success', 'Cadastro realizado!', 'Sua conta foi criada com sucesso.');
        } catch (error) {
            window.utils.showToast('error', 'Erro no cadastro', error.message);
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateLoginForm(email, password) {
        let isValid = true;

        // Validate email
        if (!email) {
            window.utils.showToast('error', 'Campo obrigatório', 'Por favor, insira seu email');
            isValid = false;
        } else if (!window.utils.validateEmail(email)) {
            window.utils.showToast('error', 'Email inválido', 'Por favor, insira um email válido');
            isValid = false;
        }

        // Validate password
        if (!password) {
            window.utils.showToast('error', 'Campo obrigatório', 'Por favor, insira sua senha');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(name, email, password, confirmPassword) {
        let isValid = true;

        // Validate name
        if (!name || name.length < 2) {
            window.utils.showToast('error', 'Nome inválido', 'Nome deve ter pelo menos 2 caracteres');
            isValid = false;
        }

        // Validate email
        if (!email) {
            window.utils.showToast('error', 'Campo obrigatório', 'Por favor, insira seu email');
            isValid = false;
        } else if (!window.utils.validateEmail(email)) {
            window.utils.showToast('error', 'Email inválido', 'Por favor, insira um email válido');
            isValid = false;
        }

        // Validate password
        if (!password) {
            window.utils.showToast('error', 'Campo obrigatório', 'Por favor, insira uma senha');
            isValid = false;
        } else if (!window.utils.validatePassword(password)) {
            window.utils.showToast('error', 'Senha inválida', 'Senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }

        // Validate confirm password
        if (password !== confirmPassword) {
            window.utils.showToast('error', 'Senhas não coincidem', 'Por favor, confirme sua senha corretamente');
            isValid = false;
        }

        return isValid;
    }

    showRegisterPage() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('register-page').classList.add('active');
        
        // Clear forms
        this.clearForms();
    }

    showLoginPage() {
        document.getElementById('register-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
        
        // Clear forms
        this.clearForms();
    }

    clearForms() {
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            form.reset();
            
            // Clear validation styles
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.style.borderColor = '';
                const formGroup = input.closest('.form-group');
                const error = formGroup?.querySelector('.field-error');
                if (error) {
                    error.remove();
                }
            });
        });
    }

    getStoredUsers() {
        try {
            const users = localStorage.getItem('questionai_users');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error getting stored users:', error);
            return [];
        }
    }

    updateStoredUser(updatedUser) {
        try {
            const users = this.getStoredUsers();
            const index = users.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
                users[index] = updatedUser;
                localStorage.setItem('questionai_users', JSON.stringify(users));
                
                // Update current user if it's the same
                if (window.app.currentUser && window.app.currentUser.id === updatedUser.id) {
                    window.app.currentUser = updatedUser;
                    localStorage.setItem('questionai_user', JSON.stringify(updatedUser));
                }
            }
        } catch (error) {
            console.error('Error updating stored user:', error);
        }
    }

    // Password strength indicator
    checkPasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        strength = Object.values(checks).filter(Boolean).length;

        const levels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte'];
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];

        return {
            score: strength,
            level: levels[strength - 1] || levels[0],
            color: colors[strength - 1] || colors[0],
            checks
        };
    }

    // Social login placeholders (for future implementation)
    loginWithGoogle() {
        window.utils.showToast('info', 'Em breve', 'Login com Google será implementado em breve');
    }

    loginWithFacebook() {
        window.utils.showToast('info', 'Em breve', 'Login com Facebook será implementado em breve');
    }

    // Password reset (placeholder)
    resetPassword(email) {
        window.utils.showToast('info', 'Em breve', 'Recuperação de senha será implementada em breve');
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

