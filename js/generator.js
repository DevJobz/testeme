const GEMINI_API_KEY = "AIzaSyBEGZJ48GOhOFeaADHxs0HJH66f569mO0A";

// Question Generator Manager - Enhanced Version
class GeneratorManager {
    constructor() {
        this.currentFile = null;
        this.currentText = '';
        this.isGenerating = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFileUpload();
        this.setupTextInput();
    }

    setupEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.getAttribute('data-tab'));
            });
        });

        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateQuestions();
            });
        }

        // Settings change
        const settingsInputs = document.querySelectorAll('.settings-section select, .settings-section input');
        settingsInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateGenerateButton();
            });
        });
    }

    setupFileUpload() {
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('pdf-input');
        const removeFileBtn = document.getElementById('remove-file');

        // Drag and drop
        if (fileUploadArea) {
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = 'var(--primary-color)';
                fileUploadArea.style.background = 'rgba(99, 102, 241, 0.05)';
            });

            fileUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = '';
                fileUploadArea.style.background = '';
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = '';
                fileUploadArea.style.background = '';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });

            fileUploadArea.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }

        // Remove file
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile();
            });
        }
    }

    setupTextInput() {
        const textInput = document.getElementById('text-input');
        const charCount = document.getElementById('char-count');
        const wordCount = document.getElementById('word-count');

        if (textInput) {
            const updateStats = (window.utils && window.utils.debounce) ? 
                window.utils.debounce(() => {
                    const text = textInput.value;
                    this.currentText = text;
                    const chars = text.length;
                    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

                    if (charCount) charCount.textContent = `${chars} caracteres`;
                    if (wordCount) wordCount.textContent = `${words} palavras`;
                    
                    this.updateGenerateButton();
                }, 300) :
                () => {
                    const text = textInput.value;
                    this.currentText = text;
                    const chars = text.length;
                    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

                    if (charCount) charCount.textContent = `${chars} caracteres`;
                    if (wordCount) wordCount.textContent = `${words} palavras`;
                    
                    this.updateGenerateButton();
                };

            textInput.addEventListener('input', updateStats);
            updateStats();
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        this.updateGenerateButton();
    }

    async handleFileSelect(file) {
        if (!file.type.includes('pdf')) {
            window.utils.showToast('error', 'Arquivo inválido', 'Por favor, selecione um arquivo PDF');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            window.utils.showToast('error', 'Arquivo muito grande', 'O arquivo deve ter no máximo 10MB');
            return;
        }

        this.currentFile = file;
        this.showFileInfo(file);
        this.updateGenerateButton();

        // Extract text from PDF
        try {
            const text = await this.extractTextFromPDF(file);
            this.currentText = text;
            window.utils.showToast('success', 'PDF processado', 'Texto extraído com sucesso');
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            window.utils.showToast('warning', 'Aviso', 'Não foi possível extrair texto do PDF. Você pode usar a aba de texto.');
        }
    }

    showFileInfo(file) {
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');

        if (fileUploadArea) fileUploadArea.style.display = 'none';
        if (fileInfo) fileInfo.style.display = 'block';
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = window.utils.formatFileSize(file.size);
    }

    removeFile() {
        this.currentFile = null;
        this.currentText = '';

        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInfo = document.getElementById('file-info');
        const fileInput = document.getElementById('pdf-input');

        if (fileUploadArea) fileUploadArea.style.display = 'block';
        if (fileInfo) fileInfo.style.display = 'none';
        if (fileInput) fileInput.value = '';

        this.updateGenerateButton();
    }

    async extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async function() {
                try {
                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }

                    resolve(fullText.trim());
                } catch (error) {
                    reject(error);
                }
            };

            fileReader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            fileReader.readAsArrayBuffer(file);
        });
    }

    updateGenerateButton() {
        const generateBtn = document.getElementById('generate-btn');
        if (!generateBtn) return;

        const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
        let hasContent = false;

        if (activeTab === 'pdf') {
            hasContent = this.currentFile !== null && this.currentText.length > 50;
        } else if (activeTab === 'text') {
            hasContent = this.currentText.trim().length > 50;
        }

        generateBtn.disabled = !hasContent || this.isGenerating;
        
        if (!hasContent) {
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Adicione conteúdo primeiro';
        } else if (this.isGenerating) {
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        } else {
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Gerar Questões';
        }
    }

    async generateQuestions() {
        if (this.isGenerating) return;

        const content = this.currentText.trim();
        if (!content || content.length < 50) {
            window.utils.showToast('error', 'Conteúdo insuficiente', 'Adicione mais conteúdo para gerar questões');
            return;
        }

        this.isGenerating = true;
        this.updateGenerateButton();
        this.showGenerationProgress();

        try {
            const settings = this.getGenerationSettings();
            const questions = await this.callQuestionGenerationAPI(content, settings);
            
            if (questions && questions.length > 0) {
                await this.saveGeneratedQuestions(questions, settings);
                window.utils.showToast('success', 'Questões geradas!', `${questions.length} questões foram criadas com sucesso`);
                
                // Navigate to questions page
                setTimeout(() => {
                    window.app.navigateTo('questions');
                }, 1500);
            } else {
                throw new Error('Nenhuma questão foi gerada');
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            window.utils.showToast('error', 'Erro na geração', error.message || 'Não foi possível gerar as questões');
        } finally {
            this.isGenerating = false;
            this.updateGenerateButton();
            this.hideGenerationProgress();
        }
    }

    getGenerationSettings() {
        return {
            count: parseInt(document.getElementById('question-count')?.value || '10'),
            difficulty: document.getElementById('difficulty-level')?.value || 'medio',
            type: document.getElementById('question-type')?.value || 'multipla-escolha',
            focus: document.getElementById('focus-area')?.value || 'geral',
            alternatives: parseInt(document.getElementById('alternatives-count')?.value || '4'),
            complexity: document.getElementById('complexity-level')?.value || 'standard',
            contextual: document.getElementById('contextual-questions')?.checked || false
        };
    }

    async callQuestionGenerationAPI(content, settings) {
        const prompt = this.buildEnhancedPrompt(content, settings);
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {text: prompt}
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro da API Gemini: ${errorData.error?.message || 'Erro desconhecido'}`);
            }

            const data = await response.json();
            const generatedText = data.candidates[0].content.parts[0].text;
            
            // Clean and parse JSON response
            const cleanedText = generatedText.replace(/^```json\n|\n```$/g, "").trim();
            let generatedQuestions;
            
            try {
                const parsedData = JSON.parse(cleanedText);
                generatedQuestions = parsedData.questions || parsedData;
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                throw new Error('Resposta da IA em formato inválido');
            }

            // Add metadata to generated questions
            return generatedQuestions.map(q => ({
                id: window.utils.generateId(),
                type: q.type || settings.type,
                difficulty: settings.difficulty,
                createdAt: new Date().toISOString(),
                answered: false,
                correct: null,
                userAnswer: null,
                timeSpent: 0,
                source: this.currentFile ? this.currentFile.name : 'Texto inserido',
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                complexity: settings.complexity,
                contextual: settings.contextual,
                alternativesCount: settings.alternatives
            }));

        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);
            throw new Error("Não foi possível gerar as questões. Verifique sua conexão ou tente novamente mais tarde.");
        }
    }



    async saveGeneratedQuestions(questions, settings) {
        try {
            // Use storageManager instead of direct localStorage
            if (window.storageManager && window.storageManager.isUserSet()) {
                // Save questions using storageManager
                const success = window.storageManager.saveQuestions(questions);
                if (!success) {
                    throw new Error('Falha ao salvar questões no armazenamento');
                }

                // Update user stats
                if (window.app.currentUser) {
                    const user = window.app.currentUser;
                    user.stats.questionsGenerated += questions.length;
                    if (this.currentFile) {
                        user.stats.documentsProcessed += 1;
                    }
                    
                    window.authManager.updateStoredUser(user);
                }

                // Save generation session
                const session = {
                    id: window.utils.generateId(),
                    timestamp: new Date().toISOString(),
                    source: this.currentFile ? this.currentFile.name : 'Texto inserido',
                    settings: settings,
                    questionCount: questions.length,
                    questionIds: questions.map(q => q.id)
                };

                window.storageManager.saveSession(session);
            } else {
                throw new Error('Sistema de armazenamento não disponível ou usuário não logado');
            }

        } catch (error) {
            console.error('Error saving questions:', error);
            throw new Error('Erro ao salvar questões');
        }
    }

    showGenerationProgress() {
        const progressDiv = document.getElementById('generation-progress');
        if (progressDiv) {
            progressDiv.style.display = 'flex';
        }
    }

    hideGenerationProgress() {
        const progressDiv = document.getElementById('generation-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
    }



    buildEnhancedPrompt(content, settings) {
        const difficultyMap = {
            'facil': 'fácil',
            'medio': 'médio',
            'dificil': 'difícil'
        };

        const typeMap = {
            'multipla-escolha': `múltipla escolha com ${settings.alternatives} alternativas`,
            'verdadeiro-falso': 'verdadeiro ou falso',
            'dissertativa': 'dissertativa',
            'misto': 'tipos variados (múltipla escolha, verdadeiro/falso e dissertativa)'
        };

        const complexityInstructions = {
            'standard': 'questões diretas e objetivas',
            'complex': 'questões mais elaboradas com cenários contextuais',
            'contextual': 'questões com situações práticas e casos reais'
        };

        let contextualInstruction = '';
        if (settings.contextual || settings.complexity === 'contextual') {
            contextualInstruction = `
            
IMPORTANTE: Para questões contextuais, crie cenários realistas e situações práticas que conectem o conteúdo com aplicações do mundo real. Use narrativas envolventes, casos práticos, exemplos profissionais ou situações cotidianas que tornem as questões mais interessantes e desafiadoras.

Exemplos de abordagem contextual:
- Para Direito: "João, empresário do ramo alimentício, precisa..."
- Para Medicina: "Uma paciente de 45 anos apresenta sintomas..."
- Para Administração: "A empresa XYZ enfrenta o seguinte desafio..."
- Para História: "Durante o período colonial, um comerciante..."`;
        }

        const focusInstructions = {
            'geral': 'aborde diversos aspectos do conteúdo',
            'conceitos': 'foque nos conceitos e definições principais',
            'detalhes': 'explore detalhes específicos e nuances',
            'aplicacao': 'enfatize aplicações práticas e casos de uso'
        };

        return `Você é um especialista em criação de questões educacionais. Crie ${settings.count} questões de nível ${difficultyMap[settings.difficulty]} do tipo ${typeMap[settings.type]} com base no seguinte conteúdo.

INSTRUÇÕES ESPECÍFICAS:
- Nível de complexidade: ${complexityInstructions[settings.complexity]}
- Foco: ${focusInstructions[settings.focus]}
- Para múltipla escolha: forneça exatamente ${settings.alternatives} alternativas com apenas uma correta
- Para verdadeiro/falso: crie afirmações claras e precisas
- Para dissertativas: peça análise, explicação ou desenvolvimento de conceitos
- Inclua sempre a resposta correta e uma explicação detalhada
- As questões devem ser baseadas exclusivamente no texto fornecido
- Varie o estilo e a abordagem das questões para manter o interesse${contextualInstruction}

FORMATO DE RESPOSTA (JSON):
{
  "questions": [
    {
      "question": "Texto da questão aqui",
      "type": "multipla-escolha|verdadeiro-falso|dissertativa",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"] (apenas para múltipla escolha),
      "correctAnswer": 0 (índice da resposta correta para múltipla escolha, true/false para V/F),
      "explanation": "Explicação detalhada da resposta correta"
    }
  ]
}

CONTEÚDO PARA ANÁLISE:
${content}

Gere as questões seguindo rigorosamente o formato JSON especificado:`;
    }

    // Enhanced methods for better question analysis
    analyzeContentContext(content) {
        const keywords = {
            'direito': ['lei', 'código', 'jurisprudência', 'tribunal', 'processo', 'crime', 'civil', 'penal'],
            'medicina': ['paciente', 'sintoma', 'diagnóstico', 'tratamento', 'doença', 'medicamento'],
            'administração': ['empresa', 'gestão', 'estratégia', 'marketing', 'recursos humanos', 'financeiro'],
            'história': ['século', 'período', 'guerra', 'revolução', 'império', 'república'],
            'ciências': ['experimento', 'hipótese', 'teoria', 'método', 'análise', 'resultado']
        };

        const contentLower = content.toLowerCase();
        let detectedArea = 'geral';
        let maxMatches = 0;

        Object.entries(keywords).forEach(([area, words]) => {
            const matches = words.filter(word => contentLower.includes(word)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedArea = area;
            }
        });

        return detectedArea;
    }

    getContextualPromptEnhancement(area, difficulty) {
        const enhancements = {
            'direito': {
                'facil': 'situações jurídicas básicas do cotidiano',
                'medio': 'casos práticos com aplicação de normas',
                'dificil': 'casos complexos com múltiplas interpretações jurídicas'
            },
            'medicina': {
                'facil': 'situações clínicas básicas',
                'medio': 'casos clínicos com diagnóstico diferencial',
                'dificil': 'casos complexos multissistêmicos'
            },
            'administração': {
                'facil': 'situações empresariais básicas',
                'medio': 'desafios de gestão e tomada de decisão',
                'dificil': 'cenários estratégicos complexos'
            }
        };

        return enhancements[area]?.[difficulty] || 'situações práticas relevantes';
    }


}

// Initialize generator manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.generatorManager = new GeneratorManager();
});

