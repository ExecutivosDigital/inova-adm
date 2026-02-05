# Relacionamento entre os sistemas do ecossistema Inova

Este documento descreve **como os sistemas do Inova se relacionam** entre si: quem consome quem, fluxo de dados e papel de cada repositório. Ele foi pensado para ser **copiado junto com a pasta `docs/` em cada repositório**, permitindo que a equipe entenda o ecossistema a partir de qualquer projeto.

---

## 1. Visão geral do ecossistema

O **Inova** é um ecossistema de software para **gestão industrial**, com foco em **manutenção, lubrificação e operação de serviços** (CIP – Controle, Inspeção e Prevenção).

| Sistema | Papel | Consome API? | Tipo de usuário |
|--------|--------|--------------|------------------|
| **inova-api** | Backend único (dados e regras) | — (é a API) | — |
| **inova-app** | Cadastro e configuração | Sim | User (gestor/cadastrante) |
| **inova-adm** | Administrativo e planejamento | Sim | Admin |
| **inova-worker-app** | Execução em campo | Sim | Worker (operador) |
| **inova-diagnosis** | Diagnóstico de maturidade | Não | Público/Cliente |
| **inova-institutional** | Site institucional | Não | Visitante |

**Núcleo operacional:** inova-api + inova-app + inova-adm + inova-worker-app (cadastro → planejamento → execução).  
**Complementares:** inova-diagnosis e inova-institutional (consultoria/marketing, sem integração com a API).

---

## 2. Diagrama de relacionamento

```
                         ┌─────────────────────────────────────────┐
                         │              inova-api                   │
                         │   (Backend único – NestJS, PostgreSQL)   │
                         │   User · Admin · Worker · Empresas       │
                         │   Equipamentos · Rotas · Work Orders     │
                         └─────────────────────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
   ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
   │     inova-app        │    │     inova-adm       │    │  inova-worker-app   │
   │  (App cadastro)      │    │  (Painel admin)     │    │  (App operação)     │
   │  User                │    │  Admin              │    │  Worker             │
   │  Empresas, layout,   │    │  Dashboard,         │    │  Login, rotas,      │
   │  equipamentos,       │    │  equipamentos,     │    │  iniciar rota,      │
   │  serviços, rotas,    │    │  planejamento,      │    │  executar serviços  │
   │  workers             │    │  programação        │    │  e concluir itens   │
   └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
              │                            │                            │
              └────────────────────────────┼────────────────────────────┘
                                           │
                         Fluxo de valor: Cadastro → Planejamento → Execução
                                           │
              ┌────────────────────────────┴────────────────────────────┐
              │                                                           │
              ▼                                                           ▼
   ┌─────────────────────┐                                  ┌─────────────────────┐
   │  inova-diagnosis     │                                  │ inova-institutional │
   │  Diagnóstico         │                                  │ Site institucional  │
   │  maturidade (CIP)    │                                  │ Landing, estático   │
   │  Sem integração API  │                                  │ Sem integração API  │
   └─────────────────────┘                                  └─────────────────────┘
```

---

## 3. Quem consome a inova-api

| Cliente | Autenticação | Principais dados usados |
|---------|--------------|--------------------------|
| **inova-app** | User (signin) / Admin (signin) | Empresas, áreas, setores, equipamentos, modelos, serviços, materiais, rotas, route-services, workers, tabelas auxiliares |
| **inova-adm** | Admin (signin) | Empresas (Super Admin), equipamentos, rotas, route-services, filter-services, tabelas de filtro (period, priority, team, epi, toolkit, etc.) |
| **inova-worker-app** | Worker (auth/worker/login, first-access) | Login e primeiro acesso hoje; previsto: rotas, work orders, atualização de status |
| **inova-diagnosis** | — | Não consome |
| **inova-institutional** | — | Não consome |

---

## 4. Fluxo de dados (cadastro → planejamento → execução)

1. **Cadastro (inova-app)**  
   O **User** (ou Admin) cadastra no app: empresas, estrutura (áreas/setores), equipamentos, modelos de equipamento, serviços, materiais e **organiza rotas** (quais CIP services compõem cada rota). Também cadastra **workers**. Tudo é persistido na **inova-api**.

2. **Planejamento e programação (inova-adm)**  
   O **Admin** usa o painel para: ver dashboard, equipamentos, materiais, pessoas; **planejar rotas** (listar, criar, editar, vincular serviços); e **programar manutenções** (ordens de serviço, calendário, kanban, status). Os dados vêm da mesma API que o inova-app alimentou.

3. **Execução (inova-worker-app)**  
   O **Worker** faz login no app, vê as **rotas** disponíveis (quando integrado à API), **inicia uma rota** e **executa cada serviço/equipamento**, marcando conclusão ou problema. As atualizações de status (work order, rota) serão persistidas na inova-api quando a integração estiver completa.

**Resumo:** inova-app **prepara** os dados; inova-adm **planeja e programa**; inova-worker-app **executa** em campo. A **inova-api** é a única fonte de verdade para todos eles.

---

## 5. Relacionamento direto entre sistemas (sem passar pela API)

- **inova-app**, **inova-adm** e **inova-worker-app** **não se comunicam entre si**. Toda a integração é via **inova-api**.
- **inova-diagnosis** e **inova-institutional** não trocam dados com a API nem com os outros apps. Podem ser divulgados no site (links para diagnóstico, app, painel, etc.).

---

## 6. Documentação específica por sistema

Cada sistema tem um documento próprio nesta pasta `docs/`, com detalhes de estrutura, rotas, componentes e integração com a API:

| Documento | Conteúdo |
|-----------|----------|
| [INOVA-API.md](INOVA-API.md) | Módulos, endpoints, autenticação, modelo de dados |
| [INOVA-APP.md](INOVA-APP.md) | Rotas, componentes, cadastros, organização de rotas |
| [INOVA-ADM.md](INOVA-ADM.md) | Páginas, dashboard, planejamento, programação |
| [INOVA-WORKER-APP.md](INOVA-WORKER-APP.md) | Login Worker, rotas, execução em campo |
| [INOVA-DIAGNOSIS.md](INOVA-DIAGNOSIS.md) | Questionário de diagnóstico de maturidade |
| [INOVA-INSTITUTIONAL.md](INOVA-INSTITUTIONAL.md) | Site institucional, páginas e componentes |

Para entender **este** repositório em profundidade, use o documento correspondente ao nome do projeto (ex.: no repositório **inova-adm**, consulte [INOVA-ADM.md](INOVA-ADM.md)).

---

## 7. Uso desta pasta em cada repositório

- A pasta **`docs/`** foi pensada para ser **replicada em cada repositório** do ecossistema Inova (inova-api, inova-app, inova-adm, inova-worker-app, inova-diagnosis, inova-institutional).
- Ao copiar esta pasta para um repositório e subir para o Git, toda a equipe passa a ter acesso:
  - ao **relacionamento entre sistemas** (este arquivo);
  - à **documentação específica** de cada sistema (incluindo a do repositório em que estão).
- Assim, em qualquer repo, o time consegue:
  1. Ver como o sistema em que trabalha se encaixa no ecossistema (este documento).
  2. Consultar o doc específico daquele projeto (ex.: INOVA-ADM.md no repo inova-adm).
  3. Consultar os outros docs para entender dependências e integrações (ex.: quais endpoints da API o app usa).

**Sugestão:** manter a mesma estrutura de arquivos em todos os repositórios (mesmos nomes e pasta `docs/`), atualizando os documentos no repositório principal e, quando necessário, copiando a pasta `docs/` atualizada para os demais repositórios.
