# Como Rodar o GoldsPay - Guia Simples

## O que você precisa instalar

1. **Node.js** (versão 18 ou maior)
   - Baixe em: https://nodejs.org/
   - Durante instalação, marque a opção "Add to PATH"

2. **VSCode**
   - Baixe em: https://code.visualstudio.com/

## Passo a Passo para Rodar

### 1. Abrir o Projeto no VSCode

1. Abra o VSCode
2. Clique em "File" → "Open Folder"
3. Selecione a pasta do projeto GoldsPay
4. Clique em "Select Folder"

### 2. Abrir o Terminal no VSCode

1. No VSCode, pressione `Ctrl + '` (Control + aspas simples)
2. Ou vá em "Terminal" → "New Terminal" no menu superior

### 3. Instalar as Dependências

No terminal que abriu, digite:

```bash
npm install
```

Aguarde terminar (pode demorar alguns minutos na primeira vez).

### 4. Rodar o Projeto

Depois que o `npm install` terminar, digite:

```bash
npm run dev
```

### 5. Abrir no Navegador

1. Você verá uma mensagem tipo: `Local: http://localhost:5173/`
2. Abra seu navegador (Chrome, Firefox, etc)
3. Digite na barra de endereço: `http://localhost:5173`
4. Pronto! O sistema está rodando!

## Para Parar o Servidor

- No terminal do VSCode, pressione `Ctrl + C`

## Se Der Erro

### Erro: "npm não é reconhecido"
- O Node.js não foi instalado ou não está no PATH
- Feche o VSCode, reinstale o Node.js e reabra

### Erro: "Port 5173 already in use"
- A porta já está sendo usada
- Pare outros servidores rodando ou mude a porta no arquivo `vite.config.ts`

### Erro de dependências
- Delete a pasta `node_modules`
- Delete o arquivo `package-lock.json`
- Rode `npm install` novamente

## Informações Importantes

- **Frontend**: React + TypeScript (roda na porta 5173)
- **Backend**: Supabase (já configurado em nuvem)
- **Banco de Dados**: Supabase PostgreSQL (já configurado)

Não precisa instalar PHP, Laravel, MySQL ou configurar servidor web. Tudo funciona com apenas o `npm run dev`!

## Primeiro Acesso

Quando abrir o sistema pela primeira vez:

1. Clique em "Registrar" ou "Sign Up"
2. Crie uma conta com email e senha
3. Você será redirecionado para o dashboard

## Estrutura do Projeto (para referência)

```
GoldsPay/
├── src/               → Código React (frontend)
├── supabase/          → Configurações do banco de dados
├── public/            → Imagens e arquivos estáticos
├── node_modules/      → Dependências (criado após npm install)
├── package.json       → Configuração do projeto
└── .env              → Variáveis de ambiente (Supabase)
```

## Comandos Úteis

```bash
npm run dev       → Roda o servidor de desenvolvimento
npm run build     → Cria versão de produção
npm run preview   → Testa a versão de produção
npm run lint      → Verifica erros no código
```

## Suporte

Se precisar de ajuda, verifique:
- Se o Node.js está instalado: `node --version`
- Se o npm está instalado: `npm --version`
- Os logs de erro no terminal do VSCode
