# Calendário da tela de planejamento

Este documento descreve o **calendário da aba "Planejamento"** na tela de Planejamento do **inova-adm**: estrutura, dados, interações e integração com a API. Serve como contexto para desenvolvimento, manutenção e uso em outros chats.

---

## 1. Onde fica e o que é

- **Página:** `(private)/(dashboard)/planejamento` → rota `/planejamento`.
- **Aba:** A página tem duas abas: **Organização de Rotas** e **Planejamento**. O calendário é exibido na aba **Planejamento**.
- **Componente:** `PlanningRoutesCalendar` em `src/components/planning-routes/PlanningRoutesCalendar.tsx`.

O calendário é uma **grade semanal** (segunda a domingo) por **slots de 30 minutos**, usada para **agendar rotas** em dias e horários. Os agendamentos vêm da API como **RouteSchedule** (rota + data/hora de início); a duração exibida no card é a **soma dos tempos de execução** dos serviços da rota (via `RouteCipService` + `executionTime.minutes`).

---

## 2. Estrutura da grade

### 2.1 Layout

- **Colunas:** 1 célula para rótulos de horário + **7 colunas** (dias da semana). A semana começa na **segunda-feira** (`getWeekStart`).
- **Linhas:** 1 linha de cabeçalho (dias) + **N linhas de slots**, onde N depende do horário de expediente da empresa.
- **Slot:** 30 minutos (`SLOT_MINUTES = 30`), altura fixa `SLOT_HEIGHT_PX = 32`.

### 2.2 Horário de trabalho e almoço

- **Fonte:** `GET /company/:companyId` retorna a empresa com:
  - `workDays`: JSON array de dias da semana (0 = domingo … 6 = sábado) em que há expediente.
  - `businessHoursStart` / `businessHoursEnd`: ex.: `"08:00"`, `"18:00"`.
  - `lunchBreakStart` / `lunchBreakEnd`: ex.: `"12:00"`, `"13:00"`.

- **Comportamento:**
  - Dias que **não** estão em `workDays` aparecem com fundo cinza e **não** aceitam drop nem botão "Adicionar".
  - O intervalo de almoço é desenhado com fundo `bg-slate-100` e **não** aceita drop (não é horário útil).
  - Slots úteis (dentro do expediente e fora do almoço) são brancos, aceitam drop e exibem botão "+" no hover para abrir o modal de agendar.

- **Fallback:** Se a empresa não tiver horários configurados, a grade usa 08:00–18:00 para definir os slots.

### 2.3 Navegação de semana

- Botões **anterior** / **próxima** semana alteram `weekStart` (segunda-feira da semana exibida).
- O título exibe o intervalo da semana (ex.: "Semana 10/2 – 16/2 2025").

---

## 3. Dados e API

### 3.1 Dados carregados (por empresa)

| Dado | Endpoint | Uso |
|------|----------|-----|
| Empresa (horários) | `GET /company/:effectiveCompanyId` | `workDays`, `businessHoursStart/End`, `lunchBreakStart/End` |
| Rotas | `GET /route` ou `GET /route?companyId=...` | Lista de rotas (exclui `isTemporary`) |
| Vínculos rota–serviço | `GET /route/company/:id/route-services` | Calcular duração por rota (`totalExecutionMinutes`) |
| Agendamentos | `GET /route/company/:id/schedules` | Lista de `routeSchedules` para desenhar os cards |

Tudo é carregado em paralelo no `fetchData` quando há `effectiveCompanyId` (empresa selecionada no header).

### 3.2 Formato de agendamento (API / front)

- **API:** `RouteSchedule` tem `id`, `routeId`, `scheduledStartAt` (ISO). A resposta de `GET .../schedules` vem como `{ routeSchedules: RouteScheduleItem[] }`.
- **Front (route-types):** `RouteScheduleItem` inclui `route?: { id, name, code, companyId }`.
- **Data/hora:** O front trata tudo em **Brasil (UTC-3)**. Ao enviar para a API, o horário é montado como `YYYY-MM-DDTHH:mm:00.000-03:00`. Ao ler, se a API não enviar "Z" ou offset, o front concatena "Z" e interpreta como UTC, depois converte para Brasil para exibir e calcular segmentos.

### 3.3 Segmentos e duração

- Cada agendamento tem **início** (`scheduledStartAt`) e **duração** (soma dos `executionTime.minutes` dos serviços da rota).
- A função `computeScheduleSegments` quebra esse intervalo em **segmentos por dia**, respeitando:
  - apenas dias úteis (`workDays`),
  - horário de expediente e
  - exclusão do intervalo de almoço.
- Um agendamento que cruza vários dias ou o almoço gera vários segmentos; cada um vira um **card** no calendário (ou um trecho contínuo quando no mesmo dia).
- Os cards são posicionados em uma **grid absoluta** sobre a grade, com `gridColumn`, `gridRow`, `marginTop` e `height` em pixels calculados a partir dos segmentos e dos slots.

---

## 4. Interações do usuário

### 4.1 Adicionar agendamento

- **Onde:** Botão "Adicionar agendamento" no header (abre modal com data padrão = hoje, horário = início do expediente) ou **clique no "+"** em um slot útil (abre modal com data e horário daquele slot).
- **Modal (AddScheduleModal):** Rota (select), Data (date), Horário de início (time). Ao submeter: `POST /route/schedule` com `{ routeId, scheduledStartAt }` (e `companyId` se super admin). Em seguida `fetchData()` e fechamento do modal.

### 4.2 Remover agendamento

- Cada card tem um botão de **lixeira**. Ação: `DELETE /route/schedule/:scheduleId` (com `?companyId=...` se super admin), depois `fetchData()`.

### 4.3 Mover agendamento (drag and drop)

- **Biblioteca:** `@dnd-kit/core` (DndContext, useDraggable, useDroppable, DragOverlay).
- **Draggable:** cada card de agendamento (por segmento).
- **Droppable:** cada célula de slot (`DroppableSlot`), apenas em dias úteis e fora do almoço.
- **Ao soltar:** o front chama `handleMoveSchedule`: **DELETE** do agendamento atual e **POST /route/schedule** com o mesmo `routeId` e o novo `scheduledStartAt` (data/hora do slot onde caiu). Ou seja, "mover" = deletar + criar no novo horário.

---

## 5. Constantes e helpers importantes

- `WEEKDAYS`: `["Dom", "Seg", …]`.
- `SLOT_MINUTES = 30`, `SLOT_HEIGHT_PX = 32`.
- `BRAZIL_OFFSET_MS`: UTC-3 para conversão de datas.
- `dateToKey(d: Date)`: `"YYYY-MM-DD"`.
- `getWeekStart(d)`: retorna a segunda-feira da semana do dia `d`.
- `getWorkingRangesForDay(company, dayOfWeek)`: retorna intervalos [start, end] em minutos desde 00:00, excluindo almoço.
- `computeScheduleSegments(scheduledStartAtUtc, durationMinutes, company)`: retorna `ScheduleSegment[]` (dateKey, dayIndex, startMin, endMin).

---

## 6. Tipos (frontend)

- **CompanySchedule** (`route-types`): `workDays`, `businessHoursStart/End`, `lunchBreakStart/End`, etc.
- **RouteScheduleItem**: `id`, `routeId`, `scheduledStartAt`, `route?`.
- **ScheduleSegment** (exportado): `dateKey`, `dayIndex`, `startMin`, `endMin`.

---

## 7. API de agendamento (resumo)

| Método | Rota | Uso |
|--------|------|-----|
| GET | `/route/company/:companyId/schedules` | Listar agendamentos da empresa (para o calendário). |
| POST | `/route/schedule` | Criar agendamento. Body: `routeId`, `scheduledStartAt`; Super Admin pode enviar `companyId`. |
| DELETE | `/route/schedule/:scheduleId` | Remover agendamento. Super Admin pode passar `?companyId=...`. |

- **Modelo (Prisma):** `RouteSchedule`: `id`, `routeId`, `scheduledStartAt`, relação com `Route`. Constraint único `(routeId, scheduledStartAt)`.

---

## 8. Observações para manutenção ou novos chats

- O calendário **depende da empresa selecionada** (`CompanyContext`). Sem empresa, exibe mensagem para selecionar uma no dropdown do header.
- Duração dos cards vem dos **serviços da rota** (`RouteCipService` + `executionTime.minutes`); não há duração armazenada no `RouteSchedule`.
- Semana sempre inicia na **segunda-feira**.
- Fuso Brasil (UTC-3) é fixo no front para exibição e para montar o `scheduledStartAt` enviado à API.
- Para estender (ex.: filtro por período, mais de uma semana), os pontos de entrada são `weekStart`, `slotLabels`, `scheduleSegmentsMap` e os endpoints de listagem de schedules (hoje não filtram por data; trazem todos da empresa).
