# Documentação específica – inova-app

## Visão geral

**inova-app** é o aplicativo móvel (e web) de **cadastro e configuração** do ecossistema Inova. Permite que usuários (User/Admin) cadastrem empresas, estrutura física, equipamentos, modelos, serviços, materiais e organizem rotas. É a ferramenta que “prepara” os dados usados pelo inova-adm (planejamento) e pelo inova-worker-app (operação).

| Item | Detalhe |
|------|--------|
| **Stack** | Expo (React Native), Expo Router, NativeWind (Tailwind), React Hook Form, Zod, Axios |
| **Plataformas** | iOS, Android, Web |
| **API** | `EXPO_PUBLIC_API_URL` (ex.: https://inova.dominiodev.shop) |

---

## Estrutura do projeto

```
inova-app/
├── app/                    # Rotas (Expo Router)
│   ├── _layout.tsx         # Layout raiz, providers
│   ├── index.tsx           # Redirecionamento inicial
│   ├── (auth)/             # Login, cadastro, recuperar senha
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── (home)/             # Dashboard e cadastros
│   │   ├── home.tsx        # Dashboard (Cadastros, Planejamento, Operação, Relatórios)
│   │   ├── routes-organization.tsx
│   │   └── select-company-routes.tsx
│   ├── (equipment)/        # Equipamentos e modelos
│   │   ├── equipment-create.tsx, equipment-edit.tsx
│   │   ├── model-create.tsx, model-edit.tsx
│   │   ├── layout.tsx, _layout.tsx
│   ├── (worker)/           # Listagem de workers
│   │   ├── list.tsx
│   │   └── _layout.tsx
│   ├── (category-dashboard)/ category-dashboard.tsx
│   ├── startmodel.tsx
│   └── +not-found.tsx
├── components/
│   ├── equipment/          # Accordions de equipamento (identificação, localização, fluidos, CIP, etc.)
│   ├── model/              # Accordions de modelo (espelho do equipment)
│   ├── home/               # Tabelas e modais do dashboard
│   │   ├── CompanyRegistrationSideSheet.tsx
│   │   ├── enterprise-table.tsx, equipament-model-table.tsx, layout-model-table.tsx
│   │   ├── LookupTablesTable.tsx, ProductRegistrationSheet.tsx, ServiceModelRegistrationSheet.tsx
│   │   ├── ServiceRegistrationSheet.tsx, EditServiceRegistrationSheet.tsx
│   │   └── supplier/
│   ├── routes/             # Organização de rotas
│   │   ├── RoutesOrganizationContent.tsx, RouteFormModal.tsx, ServiceFilters.tsx
│   ├── worker/             # WorkerRegistrationSheet.tsx, worker-table.tsx
│   ├── form/               # CompanyFormFields, SelectField, sharedComponents
│   ├── modals/             # catalog-registration-modal, CategoryModal
│   └── remover-password/   # recoverStep, recoverStep2, recoverStep3
├── context/
│   ├── auth.tsx            # Session (token, user, signIn, signOut) – pode usar /client/profile ou /admin/signin
│   ├── ApiContext.tsx      # PostAPI, GetAPI, PutAPI, DeleteAPI, token, downloadModelTemplate, downloadEquipmentTemplate
│   ├── GeneralContext.tsx  # companies, selectedCompany
│   ├── EquipmentContext.tsx, ModelsContext.tsx, LookupTablesContext.tsx
│   ├── ActionSheetContext.tsx, ModalsContext.tsx, BaseEquipmentFieldsContext.tsx
│   └── WorkerContext.tsx
├── lib/
│   ├── brasilApiService.ts, viaCepService.ts
│   ├── equipmentExcelImport.ts, modelExcelImport.ts
│   ├── openAiService.ts
│   └── utils.ts
├── schemas/                # companySchema (Zod)
├── @types/                 # company, equipmentStructure, models, route, worker
└── app.json, eas.json      # Configuração Expo / EAS
```

---

## Fluxo de autenticação

- **Login** (`(auth)/login.tsx`): envia credenciais para a API (no código atual pode usar `/admin/signin`).
- **Cadastro** (`(auth)/signup.tsx`): `POST /user/single` para criar User (nome, email, senha, etc.).
- **Recuperar senha** (`forgot-password.tsx`): fluxo com códigos (RecoverPasswordCode).
- **Session** (`context/auth.tsx`): armazena token em SecureStore; pode buscar perfil em `/client/profile` (ou equivalente). Redirecionamento para home quando autenticado.

---

## Dashboard (Home)

- **home.tsx**: quatro blocos principais – **Cadastros**, **Planejamento**, **Operação** (desabilitado), **Relatórios** (desabilitado).
- **Cadastros**: abas/seções para:
  - Empresas (CompanyRegistrationSideSheet, enterprise-table).
  - Layout (áreas/setores) – layout-model-table, create-layout-sheet, create-area-modal, create-sector-modal.
  - Modelos de equipamento (equipament-model-table), equipamentos (equipament-table).
  - Tabelas auxiliares (LookupTablesTable, LookupTablesModal).
  - Modelos de serviço (ServiceModelRegistrationSheet), serviços (ServiceRegistrationSheet), materiais (ProductRegistrationSheet), fornecedores (create-supplier-sheet).
- **Planejamento**: navegação para seleção de empresa e organização de rotas.

---

## Equipamentos e modelos

- **(equipment)/**: criar/editar equipamento e criar/editar modelo.
- Accordions por categoria: identificação, localização, especificações, dinâmica, fluidos, produtos (materiais), serviços, CIP, conjuntos/subconjuntos, estrutura em árvore, etc.
- Importação por Excel (equipmentExcelImport, modelExcelImport) e uso de OpenAI (openAiService) em partes do fluxo.
- Download de templates (downloadEquipmentTemplate, downloadModelTemplate) via ApiContext.

---

## Organização de rotas

- **select-company-routes**: seleção de empresa para contexto de rotas.
- **routes-organization**: tela principal com lista de rotas e filtros (RoutesOrganizationContent, ServiceFilters, RouteFormModal).
- Dados enviados/consultados na API (route, routeCipService) para criar e organizar rotas por empresa.

---

## Workers

- **(worker)/list**: listagem de workers (worker-table, WorkerRegistrationSheet).
- CRUD de operadores vinculados à empresa, usado antes da operação no inova-worker-app.

---

## Comunicação com o backend (inova-api)

### Como se comunica

- **Base URL**: `process.env.EXPO_PUBLIC_API_URL` (ex.: `https://inova.dominiodev.shop`).
- **Cliente HTTP**: Axios em `context/ApiContext.tsx` com `baseURL`, timeout 15s, header `Content-Type: application/json`.
- **Autenticação**: chamadas com `auth: true` enviam `Authorization: Bearer <token>`; token vem de `useSession()` (SecureStore).
- **Métodos**: `PostAPI`, `GetAPI`, `PutAPI`, `DeleteAPI`, `GetExternalAPI`; downloads: `downloadModelTemplate()` e `downloadEquipmentTemplate()` (FileSystem.downloadAsync na API).

---

### Onde e como cada rota é usada

#### Autenticação

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `POST /admin/signin` | `app/(auth)/login.tsx` | No **submit** do formulário de login (`handleLogin`). Envia email e senha; recebe `accessToken`; chama `signIn(accessToken)` e redireciona para `/home`. |
| `POST /user/single` | `app/(auth)/signup.tsx` | No **submit** do cadastro de usuário. Cria User (nome, email, senha, etc.) na API. |
| `POST /password-code` | `app/(auth)/forgot-password.tsx` | No **submit** do passo 1 (e-mail). Função `sendEmailForCode`. Envia e-mail para receber código de recuperação. |
| `GET /password-code/:code` | `app/(auth)/forgot-password.tsx` | Na **validação do código** (passo 2). Função `validateCode`. Usada ao abrir o link com código ou ao clicar em continuar. |
| `PUT /password-code/:code` | `app/(auth)/forgot-password.tsx` | No **submit** do passo 3 (nova senha). Função `resetPassword`. Redefine a senha do usuário. |
| `GET /client/profile` | `context/auth.tsx` | No **fetch de perfil** após login (`fetchProfile`), quando há token. **Atenção**: este endpoint pode não existir na inova-api (a API tem `/admin/me` para Admin). |

#### Empresas e estrutura (layout)

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /company/fetch` | `context/GeneralContext.tsx` | No **useEffect** quando há token. Carrega lista de empresas e define a primeira como selecionada. |
| `GET /company/fetch?page=&pageSize=&q=` | `components/home/enterprise-table.tsx` | Na **listagem paginada** e na **busca**. Chamada ao carregar/mudar página ou ao digitar no campo de busca. |
| `POST /company`, `PUT /company/:id` | `components/home/CompanyRegistrationSideSheet.tsx` | No **submit** do formulário: POST ao criar, PUT ao editar. Logo em separado: `POST ${baseURL}/company/:companyId/logo` (FormData via axios direto). |
| `GET /area?companyId=`, `GET /sector?companyId=` | `context/GeneralContext.tsx` | No **useEffect** quando há token e empresa selecionada. Atualiza áreas e setores. |
| `POST /area/multi` | `components/create-area-modal.tsx`, `components/create-layout-sheet.tsx` | No **submit** da criação de áreas (modal ou sheet). Cria áreas em lote. |
| `POST /sector/multi`, `PUT /sector/multi` | `components/create-sector-modal.tsx`, `components/create-layout-sheet.tsx` | No **submit** da criação/edição de setores. Create-layout-sheet também usa `PUT /area/multi` e GET `/area?companyId=` após criar áreas. |

#### Equipamentos e modelos

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /equipment/single/:id` | `app/(equipment)/equipment-edit.tsx` | No **useEffect** quando existe `equipmentId`. Carrega dados do equipamento para edição. |
| `PUT /equipment/single/:id` | `app/(equipment)/equipment-edit.tsx` | No **submit** do formulário de edição. Persiste alterações. |
| `POST /equipment/multi` | `app/(equipment)/equipment-create.tsx`, `app/(equipment)/layout.tsx` | No **submit** do formulário de criação (create) ou do fluxo de layout; envia payload com equipamentos em lote. |
| `POST /equipment-model/multi` | `app/(equipment)/model-create.tsx` | No **submit** do formulário de criação de modelos. Cria modelos em lote. |
| `PUT /equipment-model/single/:id` | `app/(equipment)/model-edit.tsx` | No **submit** do formulário de edição de modelo. |
| `GET /equipment-model/template`, `GET /equipment/template` | `context/ApiContext.tsx` | Nas funções **downloadModelTemplate** e **downloadEquipmentTemplate** (invocadas por botões nas telas de modelo e equipamento). Download via FileSystem.downloadAsync. |

#### Rotas (planejamento)

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /route?companyId=` | `components/routes/RoutesOrganizationContent.tsx` | No **useEffect** quando há empresa selecionada. Lista rotas da empresa. |
| `GET /route/company/:companyId/route-services` | `components/routes/RoutesOrganizationContent.tsx` | No **useEffect** quando há empresa. Carrega serviços já vinculados às rotas. |
| `POST /filter-services` | `components/routes/RoutesOrganizationContent.tsx`, `components/routes/RouteFormModal.tsx` | Ao **aplicar filtros** (RouteFormModal ao abrir/selecionar filtros; RoutesOrganizationContent ao buscar CIP services disponíveis). Body com companyId e critérios. |
| `POST /route/single` | `components/routes/RouteFormModal.tsx` | No **submit** ao criar nova rota. Depois chama POST `/route/single/:routeId/services` para vincular serviços. |
| `PUT /route/single/:id` | `components/routes/RouteFormModal.tsx` | No **submit** ao editar rota existente. |
| `POST /route/single/:routeId/services` | `components/routes/RoutesOrganizationContent.tsx`, `components/routes/RouteFormModal.tsx` | Ao **adicionar serviços** à rota (botão em RoutesOrganizationContent ou após criar rota em RouteFormModal). Body: `{ cipServiceIds }`. |
| `POST /route/single/:routeId/services/remove` | `components/routes/RoutesOrganizationContent.tsx` | Ao **remover serviços** da rota (ação na UI). Body: `{ cipServiceIds }`. |
| `DELETE /route/single/:id` | `components/routes/RoutesOrganizationContent.tsx` | Ao **excluir** uma rota (ação na UI). Chama DeleteAPI e em seguida recarrega lista de rotas e route-services. |

#### Workers

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /access-level` | `context/WorkerContext.tsx` | No **useEffect** (handleGetAccessLevels). Carrega níveis de acesso para o select no formulário de worker. |
| `GET /workers?companyId=` | `context/WorkerContext.tsx` | No **useEffect** quando há empresa selecionada e ao **recarregar** após criar/editar/deletar. Lista workers da empresa. |
| `POST /workers` | `context/WorkerContext.tsx` | Na função **createWorker** (submit do WorkerRegistrationSheet). Body inclui companyId. |
| `PUT /workers/:id?companyId=` | `context/WorkerContext.tsx` | Na função **updateWorker** (edição no WorkerRegistrationSheet). |
| `DELETE /workers/:id?companyId=` | `context/WorkerContext.tsx` | Na função **deleteWorker** (exclusão na lista). |

A tela **app/(worker)/list.tsx** apenas renderiza `WorkerTable` e `WorkerRegistrationSheet`; todas as chamadas acima são feitas pelo **WorkerContext** (ao montar e nas ações de CRUD).

#### Materiais, serviços, catálogo e tabelas auxiliares

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `GET /catalog/company/:id`, `GET /manufacturer`, `GET /material-type` | `components/home/ProductRegistrationSheet.tsx` | No **carregamento** do sheet (useEffect ou ao abrir). Preenchem selects. |
| `POST /material/single`, `PUT /material/single/:id` | `components/home/ProductRegistrationSheet.tsx` | No **submit** do formulário de material (criar ou editar). |
| `POST /supplier/single` | `components/home/ProductRegistrationSheet.tsx`, `components/home/create-supplier-sheet.tsx` | Ao **criar** novo fornecedor (modal/sheet). create-supplier-sheet também usa PUT `/supplier/:id` ao editar. |
| `GET /service-type`, `POST|PUT /service/single` | `components/home/ServiceRegistrationSheet.tsx` | GET ao **abrir** o sheet; POST/PUT no **submit** (criar/editar serviço). |
| `GET /service-type`, `POST|PUT /service-model/single` | `components/home/ServiceModelRegistrationSheet.tsx` | GET ao **abrir**; POST/PUT no **submit** (criar/editar modelo de serviço). |
| `POST ${baseURL}/file`, `POST /catalog` | `components/modals/catalog-registration-modal.tsx` | Primeiro **upload** do arquivo (FormData); depois **POST /catalog** para registrar o catálogo. |
| Várias GET (period, priority, team, …) | `context/LookupTablesContext.tsx` | No **useEffect** quando há token (e empresa para catalog). Carrega todas as tabelas auxiliares de uma vez (fetchAll). |
| `POST/PUT ${apiRoute}/single`, `.../multi` | `components/home/LookupTableModal.tsx` | No **submit** do modal: criar (POST) ou editar (PUT) item da tabela; apiRoute varia (period, priority, team, unit, etc.). Também batch (POST .../multi). |
| Várias GET (area, manufacturer, material, …) | `context/BaseEquipmentFieldsContext.tsx` | No **useEffect** quando há empresa selecionada. Preenchem selects dos formulários de equipamento e modelo. |
| `GET /toolkit?companyId=` | `components/equipment/accordions/EquipmentStructureTreeAccordion.tsx`, `components/model/accordions/EquipmentStructureTreeAccordion.tsx` | No **useEffect** quando há empresa. Lista toolkits para o accordion de estrutura. |
| `GET /service-model`, `/area-model`, `/sector-model`, `/equipment-model` | `context/ModelsContext.tsx` | No **carregamento** do contexto. Usados nas telas de equipamento e modelo. |
| `createApiRoute` (ex. `/material/single`) | `components/form/SelectField.tsx` | Ao **criar novo item** no select (opção “criar e selecionar”). POST no createApiRoute passado por prop. |

---

### Telas e funcionalidades SEM integração com o backend (não implementadas ou sem chamada direta)

- **app/index.tsx**  
  Apenas redirecionamento: lê token no storage e redireciona para login ou para `/home`. **Nenhuma chamada** à inova-api.

- **app/(home)/home.tsx**  
  Tela do dashboard (abas Cadastros, Planejamento, Operação, Relatórios). **Não dispara chamadas diretas**; os dados vêm dos contextos (GeneralContext, WorkerContext, etc.) que já fazem as chamadas. As tabelas e modais (enterprise-table, CompanyRegistrationSideSheet, etc.) é que usam a API quando o usuário interage.

- **app/(category-dashboard)/category-dashboard.tsx**  
  Tela de dashboard por categoria. **Nenhuma chamada** à API encontrada no componente; pode depender só de contexto ou estar em construção.

- **app/startmodel.tsx**  
  Fluxo de “início de modelo”. **Nenhuma chamada** à inova-api no arquivo.

- **app/(worker)/list.tsx**  
  Apenas renderiza `WorkerTable` e `WorkerRegistrationSheet`. As chamadas à API são feitas pelo **WorkerContext** (listagem e CRUD); a página em si não chama a API diretamente.

- **app/(home)/select-company-routes.tsx** e **app/(home)/routes-organization.tsx**  
  Telas de seleção de empresa e de organização de rotas. **Não fazem chamadas** elas mesmas; quem chama são os componentes de conteúdo (RoutesOrganizationContent, RouteFormModal) que estão dentro de routes-organization.

- **APIs externas (não inova-api)**  
  `lib/brasilApiService.ts`, `lib/viaCepService.ts` e `lib/openAiService.ts` chamam **Brasil API, ViaCEP e OpenAI**. Não são integração com o backend Inova.

---

### Resumo: o que está integrado x o que não está

| Integrado com o backend | Não integrado / sem chamada direta |
|-------------------------|-------------------------------------|
| Login, cadastro de usuário, recuperar senha, perfil (auth) | index (redirect), home (container), category-dashboard, startmodel |
| Empresas (listagem, criar, editar, logo) | Rotas select-company-routes e routes-organization são containers; as chamadas estão nos filhos |
| Áreas e setores (criar/editar em lote) | Uso de Brasil API, ViaCEP, OpenAI (APIs externas) |
| Equipamentos e modelos (CRUD, templates) | — |
| Rotas (listar, criar, editar, adicionar/remover serviços, filter-services) | — |
| Workers (listar, criar, editar, excluir, níveis de acesso) | — |
| Materiais, serviços, modelos de serviço, fornecedores, catálogo | — |
| Tabelas auxiliares (LookupTables, BaseEquipmentFields, SelectField, toolkits, ModelsContext) | — |

---

## Integração com a API (resumo)

- **ApiContext**: axios com baseURL em `EXPO_PUBLIC_API_URL`; interceptors com Bearer token; métodos PostAPI, GetAPI, PutAPI, DeleteAPI, GetExternalAPI.
- Token obtido do contexto de sessão (auth). Chamadas autenticadas usam header Authorization.
- Ver tabela acima para lista completa de rotas chamadas por funcionalidade.

---

## Variáveis de ambiente

- `EXPO_PUBLIC_API_URL`: URL base da inova-api.
- `EXPO_PUBLIC_OPENAI_API_KEY`: usado pelo openAiService (opcional, para funcionalidades com IA).

---

## Relacionamento com outros repositórios

- **inova-api**: única fonte de dados; todas as operações de cadastro e organização de rotas passam pela API.
- **inova-adm**: consome os mesmos dados (empresas, equipamentos, materiais, rotas) para gestão e planejamento.
- **inova-worker-app**: usa as rotas e serviços cadastrados (via API) para execução em campo.
