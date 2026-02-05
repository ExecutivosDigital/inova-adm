# Documentação específica – inova-adm

## Visão geral

**inova-adm** é o **sistema administrativo web** do Inova. Destinado a gestores (Admin), oferece dashboard, gestão de equipamentos, materiais, pessoas, **planejamento de rotas** e **programação de manutenções**. Consome a inova-api e complementa o inova-app (que faz o cadastro inicial) e o inova-worker-app (que executa as rotas em campo).

| Item | Detalhe |
|------|--------|
| **Stack** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI, React Hook Form, Zod, Axios |
| **Autenticação** | Login Admin (JWT), rotas privadas protegidas |

---

## Estrutura do projeto

```
inova-adm/
├── src/
│   ├── app/
│   │   ├── layout.tsx, globals.css
│   │   ├── (public)/
│   │   │   └── login/
│   │   │       ├── page.tsx      # Página de login
│   │   │       └── layout.tsx
│   │   └── (private)/
│   │       ├── layout.tsx        # Layout com sidebar/topbar e proteção
│   │       └── (dashboard)/
│   │           ├── layout.tsx
│   │           ├── page.tsx      # Dashboard (Painel de Controle)
│   │           ├── configuracoes/   page.tsx
│   │           ├── equipamentos/    page.tsx, [id]/page.tsx
│   │           ├── materiais/       page.tsx, [id]/page.tsx
│   │           ├── pessoas/        page.tsx
│   │           ├── planejamento/   page.tsx
│   │           └── programacao/     page.tsx
│   ├── components/
│   │   ├── auth/                 # login-form, ProtectedRoute
│   │   ├── dashboard/             # kpi-cards, schedule-widget, supply-alerts
│   │   ├── layout/               # sidebar, topbar
│   │   ├── equipment/            # equipment-table, equipment-filters, equipment-header, tabs (overview, structure, parameters, history)
│   │   ├── materials/            # materials-table, stock-kpis, tabs (technical, logistics, traceability)
│   │   ├── people/               # team-table
│   │   ├── planning/             # planning-calendar, planning-filters, planning-kanban, planning-list
│   │   ├── planning-routes/       # PlanningRoutesContent, PlanningRoutesFiltersPanel, RouteFormModal, RouteSelectModal, ServiceDetailsModal
│   │   └── ui/                   # badge, breadcrumb, input, select, tabs, table, tooltip, etc.
│   ├── context/                  # AuthContext (login Admin, signOut)
│   ├── hooks/                    # useAdminProfile, useFilterCatalogs
│   └── lib/                      # utils, jwt, route-types, equipment-types
├── docs/                         # table-standard.md (padrões de tabela)
└── public/
```

---

## Rotas e funcionalidades

### Público

- **/login**: formulário de login (e-mail e senha). Chama API Admin (signin), armazena token e redireciona para o dashboard. Link “Recuperar acesso” (podendo apontar para fluxo de recuperação futuro).

### Área privada (dashboard)

- **/** (Painel de Controle): KPIs no topo, widget de cronograma (ScheduleWidget), widget de alertas de insumos (SupplyAlertsWidget). Seletor de planta e botão “Nova Ordem”.
- **/equipamentos**: listagem com filtros (equipment-table, equipment-filters, equipment-header). Detalhe em **/equipamentos/[id]** com abas: visão geral, estrutura, parâmetros, histórico.
- **/materiais**: listagem (materials-table, stock-kpis). Detalhe em **/materiais/[id]** com abas: técnico, logística, rastreabilidade.
- **/pessoas**: gestão de pessoas/equipe (team-table).
- **/planejamento**: conteúdo de rotas (PlanningRoutesContent) – filtros, lista de rotas, modais de criação/seleção de rota e detalhes de serviço.
- **/programacao**: gestão de programação e execução de manutenções – cards de estatísticas (Esta Semana, Em Andamento, Concluídas), calendário (PlanningCalendar), kanban (PlanningKanban), lista (PlanningList), botão “Nova Ordem de Serviço”.
- **/configuracoes**: página de configurações do sistema/empresa.

No **sidebar**, itens podem estar habilitados ou desabilitados (ex.: Visão Geral desabilitada, Equipamentos e Planejamento habilitados), controlando o que está em uso.

---

## Autenticação e layout

- **AuthContext**: login (Admin), armazenamento de token, signOut, estado de usuário.
- **ProtectedRoute**: garante que rotas privadas só sejam acessadas com token válido; redireciona para /login quando necessário.
- **Sidebar**: exibe menu (Visão Geral, Equipamentos, Materiais, Planejamento, Programação, Pessoas, Configurações), perfil do admin (useAdminProfile: profile, initials, roleLabel) e opção de logout.

---

## Comunicação com o backend (inova-api)

### Como se comunica

- **Base URL**: `process.env.NEXT_PUBLIC_API_URL` (definida em `.env` ou ambiente).
- **Cliente HTTP**: Axios em `src/context/ApiContext.tsx` com `baseURL`; header `Authorization: Bearer <token>` quando `auth: true`; header `ngrok-skip-browser-warning: any`. Token vem de `useAuth()`.
- **Métodos**: `PostAPI`, `GetAPI`, `PutAPI`, `DeleteAPI`.

---

### Onde e como cada rota é usada

#### Autenticação e perfil

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `POST /admin/signin` | `src/components/auth/login-form.tsx` | No **submit** do formulário de login. Envia email e senha; recebe accessToken; armazena token e redireciona para o dashboard. |
| `GET /admin/me` | `src/hooks/useAdminProfile.ts` | No **useEffect** quando há token. Busca perfil do admin (nome, email, companyId, etc.) para exibir no sidebar (iniciais, role). |

#### Empresas (Super Admin)

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /company/fetch` | `src/context/CompanyContext.tsx` | No **useEffect** quando o usuário é Super Admin e há token. Carrega lista de empresas para o dropdown do header (Topbar). Só é chamada para Super Admin; admin de empresa não usa essa lista. |

#### Equipamentos

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /equipment` ou `GET /equipment?companyId=...` | `src/app/(private)/(dashboard)/equipamentos/page.tsx` | No **useEffect** quando há empresa selecionada (Super Admin) ou ao montar (admin de empresa). `fetchEquipments` monta a URL com ou sem companyId. Lista todos os equipamentos para a tabela. |
| `GET /equipment/single/:id` | `src/app/(private)/(dashboard)/equipamentos/[id]/page.tsx` | No **useEffect** quando o parâmetro `id` existe. Carrega um equipamento para exibir nas abas (overview, structure, parameters, history). |

#### Planejamento de rotas

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /route` ou `GET /route?companyId=...` | `src/components/planning-routes/PlanningRoutesContent.tsx` | No **useEffect** quando há `effectiveCompanyId`. Função `fetchRoutes`. Lista rotas da empresa. |
| `GET /route/company/:effectiveCompanyId/route-services` | `src/components/planning-routes/PlanningRoutesContent.tsx` | No **useEffect** quando há empresa. Função `fetchRouteCipServices`. Carrega serviços já vinculados a cada rota. |
| `POST /filter-services` | `src/components/planning-routes/PlanningRoutesContent.tsx` | Na função **fetchCipServices** (ao aplicar filtros no painel). Body: filtros + companyId. Retorna CIP services disponíveis para vincular a rotas. |
| `POST /route/single/:routeId/services` | `src/components/planning-routes/PlanningRoutesContent.tsx` | Ao **confirmar** adição de serviços à rota (botão na UI). Body: `{ cipServiceIds }`. Em seguida recarrega rotas e route-services. |
| `POST /route/single/:id/services/remove` | `src/components/planning-routes/PlanningRoutesContent.tsx` | Ao **remover** serviços da rota. Body: `{ cipServiceIds }`. Depois recarrega lista. |
| `DELETE /route/single/:id` | `src/components/planning-routes/PlanningRoutesContent.tsx` | Ao **excluir** uma rota (ação na UI). Em seguida chama fetchRoutes e fetchRouteCipServices. |
| `POST /route/single` | `src/components/planning-routes/RouteFormModal.tsx` | No **submit** ao **criar** nova rota. Body: name, description, etc. Depois chama POST `/route/single/:routeId/services` para vincular serviços. |
| `PUT /route/single/:id` | `src/components/planning-routes/RouteFormModal.tsx` | No **submit** ao **editar** rota existente. Body: name, description, etc. |
| `POST /route/single/:routeId/services` | `src/components/planning-routes/RouteFormModal.tsx` | Após criar rota, para **vincular** os CIP services selecionados. Também usa POST `/filter-services` para buscar serviços ao abrir filtros. |

Os modais **RouteSelectModal** e **ServiceDetailsModal** não chamam a API; usam dados já carregados no estado (rotas, routeCipServices, cipServices).

#### Filtros do planejamento (tabelas auxiliares)

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /period`, `/priority`, `/team`, `/service-condition`, `/job-system`, `/execution-time`, `/extra-team`, `/estimated-extra-team-time`, `/service-model` | `src/hooks/useFilterCatalogs.ts` | No **useEffect** quando há `effectiveCompanyId`. Carrega todas as tabelas de uma vez para popular filtros do **PlanningRoutesFiltersPanel** (período, prioridade, time, etc.). |
| `GET /epi` ou `GET /epi?companyId=...`, `GET /toolkit` ou `GET /toolkit?companyId=...` | `src/hooks/useFilterCatalogs.ts` | No mesmo **useEffect**. Super Admin passa companyId; admin de empresa chama sem query. |

---

### Telas e funcionalidades SEM integração com o backend (não implementadas)

- **Dashboard – Painel de Controle** (`src/app/(private)/(dashboard)/page.tsx`)  
  Exibe KPIs (DashboardKPIs), widget de cronograma (ScheduleWidget) e widget de alertas de insumos (SupplyAlertsWidget). **Nenhuma chamada** à inova-api. Todos os números e listas são **estáticos** (ex.: “24” ordens, “8” em andamento, “142” concluídas). Para ter dados reais seria necessário, por exemplo: GET de resumo de work orders, GET de cronograma, GET de alertas de estoque.

- **Materiais** (`src/app/(private)/(dashboard)/materiais/page.tsx` e `materiais/[id]/page.tsx`)  
  Listagem (MaterialsTable, StockKPIs) e detalhe com abas (técnico, logística, rastreabilidade). **Nenhum** uso de `GetAPI`/`PostAPI` em `src/components/materials/`. Os dados exibidos são **placeholder/estáticos**. Não implementado: GET de materiais da empresa, GET de material por id, CRUD de material.

- **Pessoas** (`src/app/(private)/(dashboard)/pessoas/page.tsx`)  
  Cards de estatísticas (Total de Membros, Ativos, Férias/Afastados, Certificações) e TeamTable. **Nenhuma chamada** à API em `src/components/people/`. Valores são **fixos** (ex.: “24” membros, “5 departamentos”). Não implementado: GET de workers/users da empresa, listagem e gestão de pessoas.

- **Programação** (`src/app/(private)/(dashboard)/programacao/page.tsx`)  
  Cards (Esta Semana, Em Andamento, Concluídas), PlanningCalendar, PlanningKanban e PlanningList. **Nenhum** `useApiContext` em `src/components/planning/`. Números e itens são **mock**. Não implementado: GET de work orders, GET de cronograma por período, PATCH/PUT de status de ordem de serviço.

- **Configurações** (`src/app/(private)/(dashboard)/configuracoes/page.tsx`)  
  Página apenas com **UI** de configurações (campos, seções). **Nenhuma chamada** à API; nada é salvo no backend.

- **Componentes que só recebem dados por props**  
  **EquipmentTable** e **EquipmentFilters** (`src/components/equipment/`) não chamam a API; recebem `equipments` e callbacks da página de equipamentos, que é quem chama GET `/equipment`. **Sidebar** e **Topbar** usam CompanyContext (GET /company/fetch só para Super Admin) e useAdminProfile (GET /admin/me); não fazem outras chamadas.

---

### Resumo: o que está integrado x o que não está

| Integrado com o backend | Não integrado (mock/estático) |
|-------------------------|-------------------------------|
| Login (`/admin/signin`), perfil (`/admin/me`) | Dashboard (KPIs, cronograma, alertas) |
| Lista de empresas para Super Admin (`/company/fetch`) | Materiais (listagem e detalhe) |
| Equipamentos (listagem e detalhe por id) | Pessoas (equipe e estatísticas) |
| Planejamento de rotas (listar, criar, editar, excluir, adicionar/remover serviços, filter-services) | Programação (calendário, kanban, lista, ordens de serviço) |
| useFilterCatalogs (tabelas auxiliares, EPI, toolkit) para filtros do planejamento | Configurações (página só UI) |

---

## Componentes principais

- **Dashboard**: DashboardKPIs, ScheduleWidget, SupplyAlertsWidget.
- **Equipamentos**: tabela com filtros, abas de detalhe (overview, structure, parameters, history).
- **Materiais**: tabela, KPIs de estoque, abas técnico/logística/rastreabilidade.
- **Planejamento**: PlanningRoutesContent (lista de rotas, filtros, modais de rota e serviço).
- **Programação**: PlanningCalendar, PlanningKanban, PlanningList, stats (programadas, em andamento, concluídas).

---

## Relacionamento com outros repositórios

- **inova-api**: autenticação Admin e todos os dados (empresas, equipamentos, materiais, rotas, work orders).
- **inova-app**: fornece a base cadastral (empresas, equipamentos, serviços, rotas) que o adm visualiza e planeja.
- **inova-worker-app**: executa as rotas e ordens planejadas no adm.
