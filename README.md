# Antes do Dashboard

Aplicacao web 100% client-side para diagnostico de qualidade de dados (CSV, XLSX, XLS) antes da etapa de dashboard.

## Visao do projeto

- Upload e processamento local no navegador (sem backend).
- Diagnostico de qualidade com score, problemas e prioridades.
- Sugestoes de tratamento em Python, Power Query e SQL.
- Checklist tecnica acionavel e exportacoes simples do relatorio.

## Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS
- Papa Parse (CSV) e SheetJS/XLSX (planilhas)
- LocalStorage para persistencia de ultimo diagnostico e preferencias de UI

## Rodar localmente

1. Instale Node.js 20+ (recomendado).
2. Instale dependencias:
   ```bash
   npm install
   ```
3. Rode em desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse a URL exibida pelo Vite (geralmente `http://localhost:5173`).

## Gerar build de producao

```bash
npm run build
```

Saida gerada em `dist/`.

## Publicar no Netlify

### Opcao 1: Deploy via Git (recomendado)

1. Suba este projeto para um repositorio Git.
2. No Netlify, clique em **Add new site** > **Import an existing project**.
3. Selecione o repositorio.
4. Confirme as configuracoes (ja definidas em `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Clique em **Deploy site**.

### Opcao 2: Deploy manual

1. Gere o build com `npm run build`.
2. No Netlify, use **Deploy manually** e arraste a pasta `dist`.

## Observacoes de deploy

- O projeto usa roteamento estatico com fallback para `index.html` via `netlify.toml`.
- O favicon placeholder esta em `public/favicon.svg`.
- Nao existe dependencia de backend para funcionamento.
