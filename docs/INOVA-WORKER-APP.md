# Documentação específica – inova-worker-app

## Visão geral

**inova-worker-app** é o aplicativo móvel para **operadores de campo (Workers)**. Permite login com CPF e senha, listar rotas disponíveis, **iniciar uma rota** e **executar cada serviço/equipamento** da rota, marcando conclusão ou problema. Fecha o ciclo operacional: cadastro (inova-app) → planejamento (inova-adm) → **execução (worker-app)**.

| Item | Detalhe |
|------|--------|
| **Stack** | Expo (React Native), Expo Router, NativeWind, Axios (para API) |
| **Plataformas** | iOS, Android |
| **Público** | Workers (técnicos/operadores de manutenção) |

---

## Estrutura do projeto

```
inova-worker-app/
├── app/
│   ├── _layout.tsx         # Providers (Auth, Route, Modal)
│   ├── index.tsx           # Redirecionamento (login ou home)
│   ├── loading.tsx
│   ├── first-access.tsx    # Primeiro acesso – criar senha
│   ├── home.tsx             # Home após login (header, AiBanner, RoutesView, InovaUniversity)
│   ├── routes.tsx          # Lista de itens da rota (ao iniciar rota)
│   ├── startedRoute.tsx    # Tela da rota iniciada (lista de serviços)
│   ├── routeEquipment.tsx  # Detalhe do item de serviço (ferramentas, materiais, execução)
│   └── +not-found.tsx
├── components/
│   ├── headers/            # loginHeader, routesHeader, userHeader
│   ├── modals/              # itemModal, lessonModal
│   ├── aiBanner.tsx
│   ├── inovaUniversity.tsx
│   ├── linearGradient*.tsx
│   ├── PoppinsText.tsx
│   ├── routesCard.tsx
│   └── routesView.tsx
├── context/
│   ├── AuthContext.tsx     # signIn (CPF, senha), estado de autenticação Worker
│   ├── RouteContext.tsx    # routes, selectedRoute, isRouteStarted, setRoutes, setSelectedRoute, setIsRouteStarted
│   ├── modalContext.tsx    # itemModal, lessonModal (abrir/fechar, dados)
│   └── contextProvider.tsx # Agrupa providers
├── constants/               # Colors
├── hooks/                   # useColorScheme, useThemeColor
└── utils/                   # cn
```

---

## Fluxo de telas

1. **index**: redireciona para tela de login ou para home conforme autenticação.
2. **Login (home.tsx como entrada inicial ou tela dedicada)**: CPF e senha; “Primeiro Acesso? Crie sua senha” leva a **first-access**.
3. **first-access**: definição de senha no primeiro acesso (chama `POST /auth/worker/first-access` quando integrado).
4. **home**: após login – UserHeader, AiBanner, **RoutesView** (lista de rotas em cards), InovaUniversity. Ao tocar em uma rota, navega para **routes** (lista de itens da rota) ou para **startedRoute** conforme fluxo.
5. **startedRoute**: rota “iniciada” – lista de serviços (ex.: “Calibrar Equipamento”, “Inspecionar Máquina”) com local, ordem de serviço, data, tipo. Permite abrir **routeEquipment** para cada item.
6. **routeEquipment**: detalhe do serviço/equipamento – ferramentas, materiais, ações para marcar como concluído ou com problema (status: finished, issue).
7. **routes**: lista de itens da rota com status (finished, issue, in progress); bloqueio de conclusão da rota se houver pendências; alerta se tentar concluir com tarefas pendentes.

---

## Autenticação

- **AuthContext**: `signIn(cpf, password)` – envia para `POST /auth/worker/login`; armazena token e estado do Worker. Logout limpa sessão.
- **first-access**: envia dados para `POST /auth/worker/first-access` (token/código + nova senha) para ativar conta e definir senha.

---

## Rotas e execução

- **RouteContext**: mantém lista de **routes** (serviceName, local, startTime, endTime, status, serviceOrder, date, tag, equipmentName, tools, materials). Estado **isRouteStarted** indica se uma rota foi iniciada; **selectedRoute** para rota atual.
- Parte dos dados ainda está em **mock** (array fixo no provider); a estrutura está preparada para substituir por chamadas à inova-api (rotas da empresa do Worker, work orders, CIP services).
- **routeEquipment**: recebe `id` do item; exibe ferramentas e materiais; permite marcar conclusão ou problema. Atualização de status (finished/issue) pode ser enviada à API (work order status) quando integrado.

---

## Componentes principais

- **RoutesView**: exibe cards de rotas (routesCard); ao selecionar, navega para startedRoute ou routes conforme fluxo.
- **routes.tsx**: FlatList de itens da rota; cada item mostra local, nome do serviço, horário, status (ícone CheckCheck/X/LogIn); toque leva a routeEquipment. Botão para concluir rota (com validação de pendências).
- **startedRoute**: lista de serviços da rota com modais (ItemModal) para detalhes; navegação para routeEquipment por item.
- **routeEquipment**: detalhe do equipamento/serviço, lista de ferramentas e materiais, ações de conclusão.
- **ItemModal**, **LessonModal**: modais de item e de “lição” (Inova University), controlados por modalContext.

---

## Comunicação com o backend (inova-api)

### Como se comunica

- **Base URL**: `process.env.EXPO_PUBLIC_API_URL` (fallback `http://localhost:3333`), em `context/AuthContext.tsx`.
- **Cliente HTTP**: Axios usado **diretamente** no AuthContext (não há ApiContext como no app/adm). Após login, o token é salvo em SecureStore e em `axios.defaults.headers.common["Authorization"] = "Bearer <token>"` para futuras requisições (ainda não usadas no restante do app).

---

### Onde e como cada rota é usada (apenas autenticação)

| Rota | Arquivo(s) | Como é usada |
|------|------------|--------------|
| `POST /auth/worker/login` | `context/AuthContext.tsx` | Na função **signIn(cpf, password)**. Chamada quando o usuário submete o formulário de login na tela inicial (`app/index.tsx` exibe a tela de login que chama `signIn`). Body: `{ cpf, password }`. Resposta: `{ access_token, worker }`. O token e os dados do worker são salvos em SecureStore e no estado; em seguida redireciona para `/home`. |
| `POST /auth/worker/first-access` | `context/AuthContext.tsx` | Na função **firstAccess(cpf, password, confirmPassword)**. Chamada na tela **app/first-access.tsx** quando o usuário define a senha no primeiro acesso. Body: `{ cpf, password, confirmPassword }`. Não armazena token na resposta atual; a tela é para cadastrar a senha. |

A **tela de login** em si é a `app/index.tsx` (que pode renderizar um formulário) ou uma tela dedicada que chama `useAuth().signIn`. A **tela app/first-access.tsx** chama `useAuth().firstAccess` no submit.

---

### Telas e funcionalidades SEM integração com o backend (não implementadas)

- **app/index.tsx**  
  Faz **redirecionamento**: se há token no SecureStore, envia para `/home`; senão, exibe a tela de login. A única chamada à API ocorre quando o usuário submete o formulário (signIn), não na carga da tela.

- **app/home.tsx**  
  Exibe UserHeader, AiBanner, **RoutesView** (lista de rotas em cards) e InovaUniversity. **Nenhuma chamada** à inova-api. A lista de rotas vem do **RouteContext**, que usa **dados mock** (array fixo definido no estado inicial do provider). Não há GET de rotas por worker/empresa.

- **app/routes.tsx**  
  Lista os **itens da rota** (serviços/equipamentos) com status (finished, issue, in progress) e botão para concluir a rota. **Nenhuma** chamada à API. Dados vêm do RouteContext (mock). Ações como “concluir item” ou “concluir rota” **não** persistem no backend (não há PUT/PATCH de work order ou rota).

- **app/startedRoute.tsx**  
  Lista de serviços da rota “iniciada” (ex.: “Calibrar Equipamento”, “Inspecionar Máquina”) com local, ordem de serviço, data. **Nenhuma chamada** à API. Dados são locais/mock. Navegação para routeEquipment não dispara nenhum fetch.

- **app/routeEquipment.tsx**  
  Detalhe do item de serviço: ferramentas, materiais, ações para marcar como concluído ou com problema (status finished/issue). **Nenhuma chamada** à inova-api. Alterações de status ficam **apenas no estado local** (RouteContext); não há PUT/PATCH de work order.

- **context/RouteContext.tsx**  
  Mantém `routes`, `selectedRoute`, `isRouteStarted`. O array **routes** é inicializado com valores **hardcoded** (ex.: “Troca de Óleo”, “Setor A”, etc.). Não existe: GET de rotas por companyId/workerId, GET de work orders ou route-cip-services, PUT/PATCH para atualizar status de work order ou rota. Toda a “operação” é simulada em memória.

- **Componentes de UI (headers, modais, cards)**  
  **RoutesView**, **routesCard**, **UserHeader**, **ItemModal**, **LessonModal**, etc. apenas exibem ou alteram estado local; **nenhum** chama a API.

---

### Resumo: o que está integrado x o que não está

| Integrado com o backend | Não integrado (mock/local) |
|-------------------------|----------------------------|
| Login (`POST /auth/worker/login`) – tela de login chama signIn | Home – lista de rotas (RouteContext mock) |
| Primeiro acesso (`POST /auth/worker/first-access`) – tela first-access chama firstAccess | routes – itens da rota e conclusão (dados locais) |
| — | startedRoute – lista de serviços da rota (mock) |
| — | routeEquipment – detalhe e status do item (estado local, não persiste) |
| — | Início/conclusão de rota e atualização de status de serviço (sem API) |

Para operação real seria necessário: **GET** rotas do worker (ex.: por companyId ou workerId), **GET** itens da rota (work orders / route-cip-services), **PUT/PATCH** status de work order (pending → in_progress → completed) e possivelmente status da rota (in_progress, completed).

---

## Relacionamento com outros repositórios

- **inova-api**: autenticação Worker e endpoints de rotas/work orders para listagem e atualização de status.
- **inova-adm**: planeja e programa as rotas e ordens que o worker executa.
- **inova-app**: cadastra empresas, equipamentos e serviços que compõem as rotas exibidas no worker-app.
