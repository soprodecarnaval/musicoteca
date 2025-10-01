# Contribuindo

## Política de Idioma
- **Código**: Variáveis, funções, comentários e estrutura do código devem estar em inglês
- **Documentação**: README, CONTRIBUTING, issues, PRs e discussões técnicas em português brasileiro
- **Solicitações de música**: Podem ser em português ou outros idiomas para facilitar que mais pessoas ajudem com issues relacionadas a músicas

## Código de Conduta
- Seja respeitoso e construtivo em todas as interações
- Foque no que é melhor para a comunidade
- Mantenha discussões técnicas e relevantes ao projeto

## Como Contribuir

### 1. Setup Inicial
- Fork o repositório: [musicoteca](https://github.com/SEU-USUARIO/musicoteca)
- Clone seu fork: `git clone https://github.com/SEU-USUARIO/musicoteca.git`
- Instale dependências: `npm install`
- Execute o projeto: `npm run dev`

### 2. Criando Issues
**SEMPRE** crie uma issue antes de codificar. Use os templates apropriados:

- **🐛 Bugs**: [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- **✨ Features**: [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
- **📚 Documentação**: [Documentation Request](.github/ISSUE_TEMPLATE/docs_request.md)
- **🎵 Músicas**: [Song Request](.github/ISSUE_TEMPLATE/song_request.md)

### 3. Desenvolvimento
- **Branches**: `feature/<número-da-issue>-título-curto`, `fix/<número-da-issue>-título-curto`, `song/<número-da-issue>-título-curto` ou `docs/<número-da-issue>-título-curto`
- **Commits**: Use mensagens claras e descritivas
- **PRs**: Mantenha pequenos e focados em uma única issue

### 4. Pull Requests
- Vincule a issue: "Fixes #<número-da-issue>"
- Adicione notas de teste e screenshots se necessário
- Uma aprovação é suficiente

**Convenções de título de PR:**
- `feat:` Resumo curto da feature
- `fix:` Resumo curto da correção  
- `song:` {Adicionar/Atualizar/Remover} "TÍTULO" - nota opcional
- `docs:` Resumo curto das mudanças na documentação

## Projeto GitHub
- Quadro único usando Status: `Sem status` (triagem) → `Backlog` → `Em Progresso` → `Concluído`.
- Novas issues são adicionadas automaticamente ao quadro e ficam em `Sem status` (tratamos isso como "Precisa de triagem").
- Durante a triagem, verifique que:
  - A issue está bem explicada e facilmente compreensível
  - Há recursos suficientes para ser executável por outra pessoa sem ajuda externa do autor
  - Se atende aos requisitos para qualquer versão planejada, aplique o rótulo de versão respectivo; se não, apenas mova para Backlog para uma possível versão futura
- Quando começar o trabalho, mova a issue para `Em Progresso` (ou abra um PR vinculado; automação pode movê-la).
- Quando o PR vinculado for mesclado OU a issue for fechada, a automação define o Status como `Concluído`.
- Sempre referencie a issue no PR (use "Fixes #<número-da-issue>") para que ela feche automaticamente na mesclagem.

## Releases e Rótulos de Versão
- As versões principais por enquanto são baseadas no carnaval (ex: `carnaval-2025`, `carnaval-2024`).
- Aplique o rótulo de versão apropriado se a issue se qualificar para essa release.
- Issues sem rótulos de versão permanecem no Backlog para consideração futura.

## Desenvolvimento Local
- Execute o app e faça uma verificação rápida de sanidade.
- Se possível, execute `npm run lint` e `npm run build` antes de abrir o PR.