# Documentação do ecossistema Inova

Esta pasta contém a documentação dos sistemas do **Inova**. Ela pode ser **copiada para cada repositório** (inova-api, inova-app, inova-adm, inova-worker-app, inova-diagnosis, inova-institutional) e versionada no Git, para que toda a equipe tenha acesso aos mesmos documentos.

---

## Começar por aqui

- **[RELACIONAMENTO-SISTEMAS-INOVA.md](RELACIONAMENTO-SISTEMAS-INOVA.md)** – Explica o **relacionamento entre todos os sistemas**: quem consome a API, fluxo de dados (cadastro → planejamento → execução) e como cada repositório se encaixa no ecossistema. **Leia este documento primeiro** para entender o todo.

---

## Documentação por sistema

| Documento | Sistema | Conteúdo resumido |
|-----------|---------|-------------------|
| [INOVA-API.md](INOVA-API.md) | inova-api | Backend (NestJS, Prisma, PostgreSQL): módulos, endpoints, autenticação, modelo de dados |
| [INOVA-APP.md](INOVA-APP.md) | inova-app | App de cadastro (Expo): rotas, componentes, cadastros, organização de rotas, integração com a API |
| [INOVA-ADM.md](INOVA-ADM.md) | inova-adm | Painel administrativo (Next.js): dashboard, equipamentos, planejamento, programação |
| [CALENDARIO-PLANEJAMENTO.md](CALENDARIO-PLANEJAMENTO.md) | inova-adm | Calendário da aba Planejamento: grade semanal, agendamento de rotas, drag-and-drop, API |
| [INOVA-WORKER-APP.md](INOVA-WORKER-APP.md) | inova-worker-app | App do operador (Expo): login Worker, rotas, execução em campo |
| [INOVA-DIAGNOSIS.md](INOVA-DIAGNOSIS.md) | inova-diagnosis | Diagnóstico de maturidade (Next.js): questionário, sem integração com a API |
| [INOVA-INSTITUTIONAL.md](INOVA-INSTITUTIONAL.md) | inova-institutional | Site institucional (Next.js): landing, páginas estáticas, sem integração com a API |

---

## Uso em cada repositório

- No repositório em que você está, use o documento **do próprio sistema** para detalhes de estrutura, rotas e integração.
- Use **RELACIONAMENTO-SISTEMAS-INOVA.md** para ver como esse sistema se relaciona com os demais e com a inova-api.
