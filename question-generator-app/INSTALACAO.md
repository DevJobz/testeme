# 🚀 Instruções de Instalação e Uso - QuestionAI

## 📋 Requisitos do Sistema

### Navegador Web
- **Chrome/Chromium** (recomendado)
- **Firefox** 
- **Safari**
- **Microsoft Edge**

### Conexão com Internet
- Necessária apenas para:
  - Carregamento inicial das bibliotecas (Chart.js, PDF.js)
  - Geração de questões via API OpenAI (se configurada)

## 💻 Instalação Local

### Opção 1: Servidor HTTP Simples (Recomendado)

1. **Baixe os arquivos**
   ```bash
   # Clone ou baixe todos os arquivos do projeto
   # Certifique-se de manter a estrutura de pastas
   ```

2. **Navegue até a pasta do projeto**
   ```bash
   cd question-generator-app
   ```

3. **Inicie um servidor HTTP local**
   
   **Python 3:**
   ```bash
   python3 -m http.server 8000
   ```
   
   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```
   
   **Node.js (se instalado):**
   ```bash
   npx http-server -p 8000
   ```

4. **Acesse no navegador**
   ```
   http://localhost:8000
   ```

### Opção 2: Servidor Web (Apache/Nginx)

1. **Copie os arquivos** para o diretório do servidor web
   - Apache: `/var/www/html/questionai/`
   - Nginx: `/usr/share/nginx/html/questionai/`

2. **Configure permissões** (se necessário)
   ```bash
   chmod -R 755 /caminho/para/questionai/
   ```

3. **Acesse via navegador**
   ```
   http://localhost/questionai/
   ```

## 🔧 Configuração da API OpenAI (Opcional)

Para usar a geração automática de questões:

1. **Obtenha uma chave da API OpenAI**
   - Acesse: https://platform.openai.com/api-keys
   - Crie uma nova chave de API

2. **Configure no aplicativo**
   - Abra o arquivo `js/generator.js`
   - Localize a linha com `OPENAI_API_KEY`
   - Substitua pela sua chave:
   ```javascript
   const OPENAI_API_KEY = 'sua-chave-aqui';
   ```

⚠️ **Importante**: Nunca compartilhe sua chave de API publicamente!

## 📱 Primeiro Uso

### 1. Acesso Inicial
1. Abra o aplicativo no navegador
2. Você verá a tela de login
3. Clique em "Cadastre-se" para criar uma conta

### 2. Criando sua Conta
1. Preencha os campos obrigatórios:
   - Nome completo
   - Email válido
   - Senha (mínimo 6 caracteres)
   - Confirmação da senha
2. Clique em "Cadastrar"
3. Você será automaticamente logado

### 3. Configurando seu Perfil
1. Vá para "Perfil" no menu superior
2. Complete suas informações:
   - Telefone
   - Profissão
   - Biografia
3. Ajuste suas preferências:
   - Modo escuro/claro
   - Notificações
   - Salvamento automático

## 📚 Usando o Aplicativo

### Gerando Questões

#### Via Upload de PDF
1. Vá para "Gerar Questões"
2. Clique na aba "Upload PDF"
3. Arraste e solte ou clique para selecionar um arquivo PDF
4. Configure as opções de geração
5. Clique em "Gerar Questões"

#### Via Texto Manual
1. Vá para "Gerar Questões"
2. Clique na aba "Inserir Texto"
3. Cole ou digite o conteúdo no campo de texto
4. Configure as opções de geração
5. Clique em "Gerar Questões"

### Respondendo Questões
1. Acesse "Minhas Questões"
2. Use os filtros para encontrar questões específicas
3. Clique em uma questão para abrir
4. Selecione sua resposta
5. Clique em "Confirmar Resposta"
6. Veja o feedback imediato

### Acompanhando Progresso
1. **Dashboard**: Visão geral das estatísticas
2. **Relatórios**: Análises detalhadas e gráficos
3. **Filtros**: Organize questões por status, dificuldade, tipo

## 🔍 Funcionalidades Avançadas

### Busca Global
- Pressione `Ctrl/Cmd + K` para abrir a busca
- Digite para encontrar questões, páginas ou configurações
- Use `Escape` para fechar

### Atalhos de Teclado
- `Ctrl/Cmd + N`: Nova geração de questões
- `Ctrl/Cmd + D`: Ir para dashboard
- `Ctrl/Cmd + /`: Mostrar todos os atalhos

### Backup de Dados
1. Vá para "Perfil"
2. Role até "Gerenciamento de Dados"
3. Clique em "Exportar Dados"
4. Salve o arquivo JSON em local seguro

### Restaurar Dados
1. Vá para "Perfil"
2. Clique em "Importar Dados"
3. Selecione o arquivo JSON de backup
4. Confirme a importação

## 🛠️ Solução de Problemas

### Aplicativo não carrega
1. Verifique se está usando um servidor HTTP
2. Abra as ferramentas de desenvolvedor (F12)
3. Verifique erros no console
4. Limpe o cache do navegador

### PDF não é processado
1. Verifique se o arquivo não está corrompido
2. Tente com um PDF diferente
3. Certifique-se de que o arquivo não está protegido por senha

### Dados perdidos
1. Verifique se o localStorage não foi limpo
2. Restaure do backup se disponível
3. Os dados são salvos automaticamente a cada ação

### Performance lenta
1. Feche outras abas do navegador
2. Verifique se há muitas questões armazenadas
3. Use os filtros para reduzir a quantidade exibida

## 📊 Estrutura de Arquivos

```
question-generator-app/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos do aplicativo
├── js/
│   ├── app.js             # Lógica principal
│   ├── auth.js            # Sistema de autenticação
│   ├── generator.js       # Geração de questões
│   ├── questions.js       # Gerenciamento de questões
│   ├── reports.js         # Relatórios e análises
│   ├── profile.js         # Perfil do usuário
│   ├── storage.js         # Armazenamento local
│   └── extras.js          # Funcionalidades extras
├── assets/                # Recursos (se houver)
├── README.md              # Documentação principal
└── INSTALACAO.md          # Este arquivo
```

## 🔒 Segurança e Privacidade

- **Dados locais**: Tudo é armazenado no seu navegador
- **Sem rastreamento**: Nenhum dado é enviado para terceiros
- **Backup seguro**: Você controla seus backups
- **API opcional**: A chave OpenAI é usada apenas se configurada

## 📞 Suporte

Para problemas técnicos:
1. Verifique este guia de instalação
2. Consulte o README.md para mais detalhes
3. Abra as ferramentas de desenvolvedor para diagnosticar erros

---

**Aproveite o QuestionAI para potencializar seus estudos! 🎓**

