# Cadern.in - Musicoteca

> Ser o ponto de encontro open source de fanfarras: arranjos e partituras testados pela comunidade, de músicos para músicos, para democratizar a música de rua.

## Sobre o Projeto

O Cadern.in é uma plataforma open source que conecta fanfarras e blocos de rua com metais de todo o mundo. A plataforma permite que músicos compartilhem arranjos testados pela comunidade e acessem um acervo crescente de partituras.

### Características Principais

- **Geração de caderninhos** personalizados por instrumento
- **Busca e descoberta** de músicas por projeto, instrumento e estilo
- **Reprodução MIDI** para facilitar compreensão do arranjo
- **Download de partituras** em formato MuseScore (.mscz)
- **Sistema de contribuição** via GitHub Issues e Pull Requests

## Público-Alvo

### Primário: Band Leaders
**Por quê:** Eles definem repertório, adicionam novas músicas, garantem qualidade "testada pela comunidade" e precisam exportar caderninhos rápido.

### Secundários:

**Fanfarrões novatos**
- Precisam onboarding rápido: encontrar a parte certa e praticar (PDF/MIDI).

**Fanfarrões experientes**
- Precisam achar e tocar suas partes com facilidade.

**Arranjadores**
- Enviam, atualizam e testam os arranjos e mantêm o acervo vivo.

**Organizadores de Blocos**
- Curam o acervo do grupo e solicitam novas músicas que façam sentido para rua.

## Métricas de Sucesso

### Por Persona

**Band Leaders:**
- **Métrica:** % de band leaders que conseguem exportar um caderninho completo
- **Meta:** > 90% conseguem exportar sem ajuda

**Novos Fanfarrões:**
- **Métrica:** % de novos usuários que conseguem tocar uma música na primeira sessão
- **Meta:** > 80% conseguem reproduzir MIDI na primeira tentativa

**Fanfarrões (músicos de seção):**
- **Métrica:** % de downloads de .mscz que são bem-sucedidos
- **Meta:** > 95% dos downloads funcionam

**Arranjadores:**
- **Métrica:** % de issues songs que são aceitas (PRs aprovados)
- **Meta:** > 70% das contribuições são aceitas

**Organizadores de Blocos:**
- **Métrica:** % de song issues que são processadas (movidas para Backlog)
- **Meta:** > 90% das issues são processadas

### Métricas Gerais

- **Crescimento:** Número de músicas no acervo (mês a mês)
- **Engajamento:** Número de downloads por mês
- **Qualidade:** % de músicas com todas as partes por instrumento

## Tecnologias

- **Frontend:** React + TypeScript + Vite
- **UI:** Bootstrap + React Bootstrap
- **Busca:** Fuse.js
- **PDF:** PDFKit
- **MIDI:** midi-player-js + soundfont-player
- **Arquivos:** MuseScore (.mscz), MIDI, SVG

## Como Contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para instruções detalhadas sobre como contribuir com o projeto.

### Contribuindo com Músicas

1. Abra uma [Issue de Solicitação de Música](.github/ISSUE_TEMPLATE/song_request.md)
2. Preencha todas as informações solicitadas
3. Se você tem os arquivos: anexe-os na issue
4. Aguarde a revisão e aprovação da issue
5. Crie uma Pull Request com os arquivos necessários (você ou outro contribuidor)
6. Aguarde a validação e aprovação da PR por outro contribuidor
7. Após merge, a música estará disponível na plataforma

## Estrutura do Projeto

```
musicoteca/
├── public/collection/     # Acervo de músicas organizadas por projeto
├── src/                  # Código fonte da aplicação
├── scripts/              # Scripts de manutenção e migração
└── dist/                 # Build de produção
```

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.
