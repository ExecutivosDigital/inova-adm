# Documentação específica – inova-api

## Visão geral

**inova-api** é o backend central do ecossistema Inova. Expõe uma API REST (NestJS) com documentação Swagger/Scalar, persiste dados em PostgreSQL via Prisma e é consumido por inova-app, inova-adm e inova-worker-app.

| Item | Detalhe |
|------|--------|
| **Stack** | NestJS 10, Prisma 6, PostgreSQL, JWT, class-validator, class-transformer |
| **Porta** | 3333 |
| **Documentação** | `/api` (Swagger), `/reference` (Scalar API Reference) |
| **Autenticação** | JWT por tipo de ator (User, Admin, Worker) |

---

## Estrutura do projeto

```
inova-api/
├── prisma/
│   ├── schema.prisma    # Modelo de dados completo
│   └── migrations/      # Migrações SQL
├── src/
│   ├── main.ts         # Bootstrap, CORS, ValidationPipe, Swagger, Scalar
│   ├── app.module.ts   # Módulos globais + AuthGuard
│   ├── modules/        # Módulos de negócio
│   │   ├── account/    # User, Admin, AccessLevel, RecoverPasswordCode
│   │   ├── catalog/    # Catálogos (arquivos)
│   │   ├── company/    # Empresas
│   │   ├── file/       # Upload (S3/R2)
│   │   ├── layout/     # Áreas, setores, equipamentos, materiais, serviços, CIPs, rotas, work orders, etc.
│   │   ├── model/     # Modelos (área, setor, equipamento, conjunto, subconjunto, CIP, serviço, CIP Service)
│   │   ├── safety-condition/
│   │   ├── scripts/
│   │   └── worker/     # Workers + auth Worker (login, first-access)
│   ├── shared/
│   │   ├── auth/       # AuthGuard, JwtModule
│   │   ├── cryptography/ # bcrypt, JWT
│   │   ├── database/   # PrismaService
│   │   ├── decorators/ # CurrentCompanyId, CurrentUserId, IsPublic, documentação
│   │   ├── email/      # Brevo (envio de e-mail)
│   │   ├── env/        # Validação de variáveis de ambiente
│   │   └── storage/    # R2 (upload)
│   └── utils/
└── test/               # E2E (Vitest)
```

---

## Módulos e responsabilidades

### AccountModule (`/user`, `/admin`, `/recover-password-code`, `/access-level`)

- **User**: `POST /user/signin`, `POST /user/single`, listagem/edição/perfil, recuperação de senha.
- **Admin**: `POST /admin/signin`, `POST /admin/signup`, `GET /admin/me`, `PATCH /admin/token`, edição de perfil.
- **AccessLevel**: CRUD níveis de acesso (permissões: createMaterial, createEquipment, createServices, createRoutes, createServiceOrders, executeServiceOrders, requestService, reportAccess).
- **RecoverPasswordCode**: geração e uso de códigos para recuperação de senha (User).

### CompanyModule (`/company`)

- CRUD de empresas (Company): dados cadastrais, logo, CNAE, endereço, responsável, etc.

### LayoutModule (entidades “de planta”)

Controladores principais (prefixos por recurso):

- **Estrutura física**: `area`, `sector`, `equipment`, `set`, `subset`, `cip`, `equipmentType`, `manufacturer`, `costCenter`.
- **Materiais e suprimentos**: `material`, `materialFamily`, `materialType`, `supplier`, `unit`, `catalog`.
- **Serviços e CIP**: `service`, `serviceType`, `cipService`, `cipType`, `epi`, `toolkit`.
- **Parâmetros de CIP Service**: `period`, `priority`, `team`, `serviceCondition`, `serviceReason`, `serviceProcedure`, `meter`, `jobSystem`, `executionTime`, `extraTeam`, `estimatedExtraTeamTime`.
- **Filtros/fluidos**: `filterOil`, `filterPressure`, `filterSuction`, `filterReturn`.
- **Outros**: `powerUnit`, `mainComponent`, `lubricationSystem`, `setType`, `subsetType`.
- **Rotas e execução**: `route`, `workOrder`, `filterServices` (filtros para serviços em rotas).

Cada recurso segue padrão REST (CRUD) com DTOs em `controllers/dto/`. Rotas e work orders têm lógica específica (criação em lote, vínculo route ↔ cipService, status).

### ModelModule (`/model/...`)

- Modelos reutilizáveis: `areaModel`, `sectorModel`, `equipmentModel`, `setModel`, `subsetModel`, `cipModel`, `serviceModel`, `cipModelService`.
- Usados como “templates” para criar entidades reais no layout da empresa.

### WorkerModule (`/auth/worker`, `/worker`)

- **Auth**: `POST /auth/worker/login` (CPF + senha), `POST /auth/worker/first-access` (definir senha no primeiro acesso).
- **Worker**: CRUD de operadores (vinculados a Company e AccessLevel).

### FileModule

- Upload de arquivos (ex.: imagens, catálogos), integração com storage (ex.: R2/S3).

### CatalogModule

- Gestão de catálogos (arquivos associados à empresa).

### SafetyConditionModule

- CRUD de condições de segurança (usadas em equipamentos e CIP services).

### ScriptsModule

- Endpoints utilitários/scripts (uso interno ou migração).

---

## Autenticação e autorização

- **AuthGuard** global: protege todas as rotas exceto as marcadas com `@IsPublic()`.
- **JWT**: emissão em `/user/signin`, `/admin/signin`, `/auth/worker/login`; renovação em `/admin/token` (Admin).
- **CompanyId**: decorator `@CurrentCompanyId()` obtém companyId do token (ou 'admin' para super admin). Admin de empresa usa apenas companyId do JWT; super admin pode receber `companyId` no body/query.
- **UserId**: `@CurrentUserId()` para rotas que precisam do id do usuário/admin autenticado.

---

## Modelo de dados (resumo)

- **Empresa e pessoas**: Company, User, Admin, Worker, AccessLevel, UserUnit (user ↔ área/setor), RecoverPasswordCode.
- **Estrutura**: Area, Sector, Equipment, Set, Subset, Cip (tipos: SetType, SubsetType, CipType, EquipmentType).
- **Serviços**: Service, ServiceType, ServiceModel, CipService, CipModelService (período, prioridade, time, procedimento, EPI, toolkit, etc.).
- **Planejamento/execução**: Route (status: pending, in_progress, completed, cancelled, archived), RouteCipService, WorkOrder (status: pending, scheduled, in_progress, completed, cancelled).
- **Materiais**: Material, Catalog, MaterialEquipment, MaterialType, MaterialFamily, Supplier, Unit, filtros (FilterOil, FilterPressure, etc.).
- **Outros**: Epi, ToolKit, CostCenter, Manufacturer, SafetyCondition, EquipmentPhoto, etc.

---

## Variáveis de ambiente

- `DATABASE_URL`: conexão PostgreSQL.
- Configurações de JWT, e-mail (Brevo), storage (R2), etc. validadas via `envSchema` no `ConfigModule`.

---

## Scripts

- `yarn start` / `start:dev` / `start:prod`: subir API.
- `yarn test` / `test:e2e`: testes (Vitest).
- Prisma: `prisma generate`, `prisma migrate`, seed via `worker_seed.ts`.

---

## Comunicação com o backend

**inova-api é o próprio backend.** Ela **não chama** outro backend; **expõe** a API REST consumida pelos outros repositórios.

### Onde as rotas são expostas (controllers)

As rotas são definidas nos **controllers** de cada módulo; o front chama essas rotas.

| Prefixo / recurso | Arquivo(s) no repositório | Como são usadas pelo front |
|-------------------|---------------------------|----------------------------|
| `POST/GET/PUT /user/*`, `PUT /user/password` | `src/modules/account/controllers/user.controller.ts` | inova-app: signin, criar user, recuperar senha. |
| `POST/GET/PUT/PATCH /admin/*` | `src/modules/account/controllers/admin.controller.ts` | inova-app e inova-adm: signin, perfil (adm usa GET /admin/me). |
| `POST/GET /password-code/*` | `src/modules/account/controllers/recoverPasswordCode.controller.ts` | inova-app: enviar código, validar código (PUT senha pode ser em user). |
| `GET /access-level` | `src/modules/account/controllers/accessLevel.controller.ts` | inova-app: listar níveis de acesso (formulário de worker). |
| `GET/POST/PUT/DELETE /company/*` | `src/modules/company/controllers/company.controller.ts` | inova-app e inova-adm: fetch, criar, editar, logo. |
| `GET/POST/PUT/DELETE /route/*`, `GET /route/company/:id/route-services` | `src/modules/layout/controllers/route.controller.ts` + routeCipService | inova-app e inova-adm: listar rotas, criar/editar/excluir, adicionar/remover serviços. |
| `POST /filter-services` | `src/modules/layout/controllers/filterServices.controller.ts` | inova-app e inova-adm: listar CIP services com filtros. |
| `GET/POST/PUT/DELETE /equipment/*`, template | `src/modules/layout/controllers/equipment.controller.ts` + services | inova-app e inova-adm: listagem, single, multi, template. |
| Demais recursos de layout (area, sector, material, service, cip, workOrder, etc.) | `src/modules/layout/controllers/*.ts` | inova-app: CRUD e listagens conforme tabelas no INOVA-APP.md. |
| `GET/POST/PUT/DELETE /model/*` (area-model, equipment-model, …) | `src/modules/model/controllers/*.ts` | inova-app: modelos para equipamento e estrutura. |
| `POST /auth/worker/login`, `POST /auth/worker/first-access` | `src/modules/worker/controllers/worker-auth.controller.ts` | inova-worker-app: login e primeiro acesso. |
| `GET/POST/PUT/DELETE /workers/*` | `src/modules/worker/controllers/worker.controller.ts` | inova-app: CRUD de workers. |
| `POST /file`, catalog | `src/modules/file/`, `src/modules/catalog/` | inova-app: upload de arquivo e catálogo. |

Não há “telas” na API; todas as rotas são **endpoints** chamados pelos frontends. Nenhuma funcionalidade da inova-api deixa de usar “backend” (ela é o backend).

### Quem consome quais rotas (visão geral)

- **inova-app**: admin signin, user single, password-code, company (fetch, CRUD, logo), área/setor/equipamento/material/serviço/rota/workers (CRUD), model/*, filter-services, tabelas auxiliares, catalog, file, templates.
- **inova-adm**: admin signin, admin/me, company/fetch, equipment (listagem e single), route e route-services, filter-services, route single (CRUD e serviços), useFilterCatalogs (period, priority, team, …, epi, toolkit).
- **inova-worker-app**: apenas **auth/worker/login** e **auth/worker/first-access**. Rotas e work orders ainda **não** são chamadas pelo app.
- **inova-diagnosis** e **inova-institutional**: **não** consomem inova-api.

---

## Relacionamento com outros repositórios

- **inova-app**: chama User/Admin (signin/signup), Company, layout e model para cadastro e organização de rotas.
- **inova-adm**: chama Admin (signin), Company, layout (equipamentos, materiais, rotas, work orders) e planejamento/programação.
- **inova-worker-app**: chama auth/worker (login, first-access) e, quando integrado, rotas e work orders para execução em campo.
