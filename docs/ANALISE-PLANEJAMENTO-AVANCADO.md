# Análise e Plano de Implementação: Planejamento Avançado

## 📋 Sumário Executivo

Este documento apresenta uma análise completa da tela de Planejamento atual e um plano detalhado para implementar funcionalidades avançadas de planejamento automático, incluindo:
- Agendamento de serviços individuais além de rotas
- Distribuição automática baseada em periodicidade
- Suporte a múltiplos serviços simultâneos (múltiplos colaboradores)
- Visão mensal com indicadores de carga de trabalho
- Cálculo de horas disponíveis de mão de obra

---

## 1. 📊 Estado Atual do Sistema

### 1.1 Estrutura da Tela de Planejamento

**Localização:** `inova-adm/src/app/(private)/(dashboard)/planejamento/page.tsx`

A tela possui **duas abas**:
- **Organização de Rotas** (`PlanningRoutesContent`): Gerencia rotas e seus serviços
- **Planejamento** (`PlanningRoutesCalendar`): Calendário semanal para agendamento

### 1.2 Funcionalidades Atuais do Calendário

#### 1.2.1 Estrutura Visual
- **Layout:** Grade semanal (segunda a domingo)
- **Slots:** Intervalos de 30 minutos (`SLOT_MINUTES = 30`)
- **Altura:** 32px por slot (`SLOT_HEIGHT_PX = 32`)
- **Navegação:** Botões anterior/próxima semana

#### 1.2.2 Dados e Integração
- **Empresa:** `GET /company/:companyId` - Horários de trabalho, dias úteis, almoço
- **Rotas:** `GET /route` ou `GET /route?companyId=...` - Lista de rotas (exclui temporárias)
- **Vínculos:** `GET /route/company/:id/route-services` - Rotas e seus serviços (CipService)
- **Agendamentos:** `GET /route/company/:id/schedules` - Lista de RouteSchedule

#### 1.2.3 Modelo de Dados Atual

**RouteSchedule** (Tabela: `route_schedules`)
```prisma
model RouteSchedule {
  id                String   @id @default(uuid())
  routeId           String   @db.Uuid
  scheduledStartAt  DateTime
  createdAt         DateTime @default(now())
  route             Route    @relation(...)
  
  @@unique([routeId, scheduledStartAt])
}
```

**RouteCipService** (Tabela: `route_cip_services`)
```prisma
model RouteCipService {
  id          String     @id @default(uuid())
  routeId     String     @db.Uuid
  cipServiceId String    @db.Uuid
  createdAt   DateTime   @default(now())
  route       Route      @relation(...)
  cipService  CipService @relation(...)
  
  @@unique([routeId, cipServiceId])
}
```

#### 1.2.4 Cálculo de Duração
- A duração de uma rota é calculada pela **soma dos `executionTime.minutes`** de todos os `CipService` vinculados à rota
- Função: `totalExecutionMinutes()` em `route-types.ts`

#### 1.2.5 Validações Atuais
- ✅ Verifica se a rota existe e pertence à empresa
- ✅ Impede agendamento de rotas temporárias
- ✅ Verifica duplicidade: `@@unique([routeId, scheduledStartAt])`
- ❌ **NÃO há validação de conflito de horário** - permite múltiplas rotas no mesmo horário
- ❌ **NÃO há validação de capacidade** de mão de obra

#### 1.2.6 Interações do Usuário
1. **Adicionar agendamento:**
   - Botão "Adicionar agendamento" no header
   - Clique no "+" em um slot útil
   - Modal: Seleciona rota, data e horário de início
   - Endpoint: `POST /route/schedule`

2. **Remover agendamento:**
   - Botão de lixeira em cada card
   - Endpoint: `DELETE /route/schedule/:scheduleId`

3. **Mover agendamento:**
   - Drag and drop usando `@dnd-kit/core`
   - Operação: DELETE + CREATE (move para novo horário)

#### 1.2.7 Limitações Identificadas
1. ❌ **Apenas rotas podem ser agendadas** - não há suporte para serviços individuais
2. ❌ **Não há distribuição automática** - tudo é manual
3. ❌ **Não considera periodicidade** - não há cálculo automático baseado em intervalos
4. ❌ **Não há visão mensal** - apenas semanal
5. ❌ **Não há indicadores de carga** - não mostra sobrecarga/subcarga
6. ❌ **Não calcula horas de mão de obra** - não considera workers disponíveis
7. ⚠️ **Permite conflitos** - múltiplas rotas no mesmo horário (mas não há controle de capacidade)

---

## 2. 🎯 Requisitos da Nova Funcionalidade

### 2.1 Agendamento de Serviços Individuais

**Objetivo:** Permitir agendar serviços de equipamentos diretamente no calendário, sem precisar criar uma rota.

**Requisitos:**
- Criar modelo `PlanningService` para transformar `CipService` em serviço de planejamento
- Permitir seleção de serviço individual no modal de agendamento
- Exibir serviços individuais no calendário de forma diferenciada (ex: cor diferente)

### 2.2 Múltiplos Serviços no Mesmo Horário

**Objetivo:** Permitir que múltiplos serviços/rotas sejam executados simultaneamente, considerando que a empresa pode ter múltiplos colaboradores.

**Requisitos:**
- Remover restrição de conflito de horário (já não existe, mas precisa ser explícito)
- Permitir empilhamento visual de cards no mesmo slot
- Considerar capacidade de mão de obra disponível

### 2.3 Distribuição Automática Baseada em Periodicidade

**Objetivo:** Gerar automaticamente agendamentos baseados em periodicidade, tempo de execução e última data de execução.

**Exemplo:** Troca de óleo a cada 3 meses
- Última execução: 01/12/2024
- Próxima: 01/03/2025
- Seguinte: 01/06/2025
- E assim por diante até preencher o período selecionado

**Requisitos:**
- Ler `periodId` e `period.days` do `CipService`
- Buscar última data de execução (via `WorkOrder.completedAt` ou histórico)
- Calcular próximas datas baseado em `period.days`
- Gerar agendamentos automaticamente
- Permitir ajustes manuais após geração

### 2.4 Visão Mensal com Indicadores de Carga

**Objetivo:** Fornecer visão mensal do calendário com indicadores visuais de carga de trabalho.

**Requisitos:**
- Nova aba ou toggle para alternar entre visão semanal e mensal
- Calcular horas de trabalho agendadas por dia
- Comparar com horas disponíveis de mão de obra
- Indicadores visuais:
  - 🟢 **Verde:** Carga adequada (< 80% da capacidade)
  - 🟡 **Amarelo:** Carga moderada (80-95% da capacidade)
  - 🔴 **Vermelho:** Sobrecarga (> 95% da capacidade)

### 2.5 Cálculo de Horas Disponíveis de Mão de Obra

**Objetivo:** Calcular capacidade de trabalho baseada em workers disponíveis.

**Requisitos:**
- Considerar número de `Worker` ativos da empresa
- Considerar horário de trabalho da empresa (`workDays`, `businessHoursStart/End`, `lunchBreakStart/End`)
- Calcular horas disponíveis por dia = `workersCount × horasÚteisDoDia`
- Considerar férias/ausências (futuro)

---

## 3. 🏗️ Arquitetura Proposta

### 3.1 Modelos de Dados

#### 3.1.1 Novo Modelo: `PlanningService`

**Objetivo:** Representar um serviço individual agendado no planejamento, separado de rotas.

```prisma
model PlanningService {
  id                String   @id @default(uuid()) @db.Uuid
  cipServiceId      String   @db.Uuid
  scheduledStartAt  DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  companyId         String   @db.Uuid
  cipService        CipService @relation(fields: [cipServiceId], references: [id], onDelete: Cascade)
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@unique([cipServiceId, scheduledStartAt])
  @@map("planning_services")
}
```

**Relações:**
- `CipService` → Serviço original do equipamento
- `Company` → Empresa (para filtros e segurança)

**Diferenças em relação a RouteSchedule:**
- Agendamento direto de `CipService`, sem passar por `Route`
- Permite múltiplos agendamentos do mesmo serviço em horários diferentes
- Mantém histórico de agendamentos individuais

#### 3.1.2 Atualização: `RouteSchedule` (sem mudanças estruturais)

Manter `RouteSchedule` como está, mas:
- Remover restrição implícita de conflito de horário
- Permitir múltiplas rotas no mesmo horário

#### 3.1.3 Novo Modelo: `PlanningAutoGeneration` (Opcional - para histórico)

```prisma
model PlanningAutoGeneration {
  id                String   @id @default(uuid()) @db.Uuid
  companyId         String   @db.Uuid
  startDate         DateTime
  endDate           DateTime
  generatedAt       DateTime @default(now())
  generatedBy       String?  // userId
  company           Company  @relation(...)
  
  @@map("planning_auto_generations")
}
```

**Objetivo:** Registrar quando foi feita uma geração automática, para auditoria e possível rollback.

### 3.2 Estrutura de Dados para Cálculo de Carga

#### 3.2.1 Interface: `WorkloadIndicator`

```typescript
interface WorkloadIndicator {
  date: string; // YYYY-MM-DD
  scheduledHours: number; // Horas agendadas no dia
  availableHours: number; // Horas disponíveis (workers × horas úteis)
  utilization: number; // Percentual (0-100)
  status: 'low' | 'medium' | 'high'; // Verde, Amarelo, Vermelho
}
```

#### 3.2.2 Cálculo de Horas Disponíveis

```typescript
function calculateAvailableHours(
  company: Company,
  date: Date,
  workersCount: number
): number {
  // 1. Verificar se é dia útil
  const workDays = parseWorkDays(company.workDays);
  if (!workDays.includes(date.getDay())) return 0;
  
  // 2. Calcular horas úteis (descontando almoço)
  const start = parseTimeToMinutes(company.businessHoursStart);
  const end = parseTimeToMinutes(company.businessHoursEnd);
  const lunchStart = parseTimeToMinutes(company.lunchBreakStart);
  const lunchEnd = parseTimeToMinutes(company.lunchBreakEnd);
  
  let hoursPerWorker = (end - start) / 60;
  if (lunchStart && lunchEnd) {
    hoursPerWorker -= (lunchEnd - lunchStart) / 60;
  }
  
  // 3. Multiplicar pelo número de workers
  return hoursPerWorker * workersCount;
}
```

### 3.3 Endpoints da API

#### 3.3.1 Serviços de Planejamento

```
POST   /planning/service              - Criar agendamento de serviço individual
GET    /planning/company/:id/services - Listar agendamentos de serviços
DELETE /planning/service/:id          - Remover agendamento
PUT    /planning/service/:id          - Atualizar agendamento
```

#### 3.3.2 Geração Automática

```
POST   /planning/auto-generate        - Gerar agendamentos automaticamente
GET    /planning/company/:id/workload - Obter indicadores de carga
```

**Payload de geração automática:**
```typescript
interface AutoGenerateDto {
  companyId: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  serviceIds?: string[]; // Opcional: filtrar serviços específicos
  routeIds?: string[];   // Opcional: filtrar rotas específicas
}
```

#### 3.3.3 Indicadores de Carga

```
GET /planning/company/:id/workload?startDate=...&endDate=...
```

**Resposta:**
```typescript
{
  indicators: WorkloadIndicator[];
  summary: {
    totalScheduledHours: number;
    totalAvailableHours: number;
    averageUtilization: number;
  };
}
```

---

## 4. 🔄 Fluxos de Funcionamento

### 4.1 Fluxo: Agendamento Manual de Serviço Individual

```
1. Usuário clica em "Adicionar agendamento" ou "+" no slot
2. Modal abre com opção de selecionar:
   - Tipo: "Rota" ou "Serviço Individual"
   - Se "Serviço Individual":
     - Select de CipService (filtrado por empresa)
     - Data e horário
3. Ao submeter:
   - POST /planning/service
   - Backend cria PlanningService
   - Frontend atualiza calendário
```

### 4.2 Fluxo: Geração Automática

```
1. Usuário clica em "Gerar Planejamento Automático"
2. Modal solicita:
   - Período (data início e fim)
   - Opcional: Filtrar serviços/rotas específicos
3. Backend processa:
   Para cada CipService com periodicidade:
     a. Busca última execução (WorkOrder.completedAt mais recente)
     b. Se não houver, usa data atual como base
     c. Calcula próximas datas: dataBase + period.days
     d. Gera PlanningService ou RouteSchedule para cada data
     e. Respeita dias úteis e horário de trabalho
4. Frontend exibe preview ou aplica diretamente
5. Usuário pode ajustar manualmente após geração
```

### 4.3 Fluxo: Cálculo de Indicadores de Carga

```
1. Usuário alterna para visão mensal
2. Frontend solicita:
   GET /planning/company/:id/workload?startDate=...&endDate=...
3. Backend calcula:
   Para cada dia no período:
     a. Busca todos os agendamentos (RouteSchedule + PlanningService)
     b. Soma duração (executionTime)
     c. Calcula horas disponíveis (workers × horas úteis)
     d. Calcula utilização percentual
     e. Classifica status (low/medium/high)
4. Frontend renderiza calendário mensal com cores
```

---

## 5. 🎨 Interface do Usuário

### 5.1 Modal de Agendamento (Atualizado)

```
┌─────────────────────────────────────┐
│ Agendar no Planejamento            │
├─────────────────────────────────────┤
│ Tipo:                               │
│ ○ Rota                              │
│ ● Serviço Individual                │
│                                     │
│ Serviço: [Select CipService ▼]     │
│                                     │
│ Data: [2025-03-01]                 │
│ Horário: [08:00]                    │
│                                     │
│ Duração estimada: 2h 30min          │
│                                     │
│ [Cancelar]  [Agendar]              │
└─────────────────────────────────────┘
```

### 5.2 Botão de Geração Automática

Adicionar no header do calendário:
```
[◀ Semana] [Gerar Planejamento Automático] [Semana ▶]
```

### 5.3 Visão Mensal

**Toggle de visualização:**
```
[Semanal] [Mensal]
```

**Calendário mensal:**
```
┌─────────────────────────────────────────────────┐
│  Março 2025                                     │
├─────────────────────────────────────────────────┤
│ Dom  Seg  Ter  Qua  Qui  Sex  Sáb              │
│                                                  │
│  1    2    3    4    5    6    7                │
│ 🟢   🟢   🟡   🟢   🟢   🔴   ⚪              │
│                                                  │
│  8    9   10   11   12   13   14                │
│ 🟢   🟡   🟢   🟢   🟢   🟢   ⚪              │
│ ...                                              │
└─────────────────────────────────────────────────┘
```

**Legenda:**
- 🟢 Verde: Carga adequada (< 80%)
- 🟡 Amarelo: Carga moderada (80-95%)
- 🔴 Vermelho: Sobrecarga (> 95%)
- ⚪ Cinza: Dia não útil

**Tooltip ao passar mouse:**
```
15/03/2025
Agendado: 7.5h
Disponível: 8h
Utilização: 93.75%
```

### 5.4 Cards no Calendário Semanal

**Diferenciação visual:**
- **Rotas:** Cor primária (azul)
- **Serviços Individuais:** Cor secundária (verde)
- **Empilhamento:** Quando múltiplos no mesmo horário, cards menores lado a lado ou empilhados

---

## 6. 📝 Plano de Implementação

### Fase 1: Estrutura Base (Semana 1-2)

#### Backend
1. ✅ Criar migration para `PlanningService`
2. ✅ Criar `PlanningServiceService` e `PlanningServiceController`
3. ✅ Implementar CRUD básico
4. ✅ Criar endpoints de geração automática (estrutura)

#### Frontend
1. ✅ Atualizar modal de agendamento para suportar serviços individuais
2. ✅ Criar componente para exibir serviços no calendário
3. ✅ Atualizar tipos TypeScript

### Fase 2: Geração Automática (Semana 3-4)

#### Backend
1. ✅ Implementar lógica de busca de última execução
2. ✅ Implementar cálculo de próximas datas baseado em `period.days`
3. ✅ Implementar geração em lote respeitando dias úteis
4. ✅ Adicionar validações e tratamento de erros

#### Frontend
1. ✅ Criar modal de geração automática
2. ✅ Implementar preview (opcional)
3. ✅ Adicionar feedback de sucesso/erro

### Fase 3: Indicadores de Carga (Semana 5-6)

#### Backend
1. ✅ Implementar cálculo de horas disponíveis
2. ✅ Implementar cálculo de horas agendadas por dia
3. ✅ Criar endpoint `/planning/company/:id/workload`
4. ✅ Implementar classificação de status (low/medium/high)

#### Frontend
1. ✅ Criar componente de calendário mensal
2. ✅ Implementar toggle semanal/mensal
3. ✅ Adicionar cores e tooltips
4. ✅ Implementar navegação de mês

### Fase 4: Refinamentos (Semana 7-8)

1. ✅ Testes end-to-end
2. ✅ Ajustes de UX/UI
3. ✅ Documentação de usuário
4. ✅ Performance (otimizações se necessário)

---

## 7. 🔍 Considerações Técnicas

### 7.1 Performance

**Desafio:** Calcular indicadores de carga para um mês inteiro pode ser custoso.

**Soluções:**
- Cachear resultados por dia (invalidar ao criar/remover agendamento)
- Paginar ou limitar período de consulta
- Calcular apenas dias visíveis na tela (lazy loading)

### 7.2 Consistência de Dados

**Desafio:** Geração automática pode criar muitos registros.

**Soluções:**
- Usar transações para garantir atomicidade
- Implementar rollback em caso de erro parcial
- Adicionar limite de período (ex: máximo 1 ano)

### 7.3 Última Data de Execução

**Desafio:** Determinar última execução de um serviço.

**Soluções:**
- Buscar `WorkOrder.completedAt` mais recente para o `CipService`
- Se não houver, usar `createdAt` do `CipService`
- Permitir configuração manual de "última execução" (futuro)

### 7.4 Múltiplos Serviços no Mesmo Horário

**Desafio:** Visualização de múltiplos cards no mesmo slot.

**Soluções:**
- Empilhar cards verticalmente (com scroll se necessário)
- Mostrar contador: "+3 mais" quando houver muitos
- Agrupar por tipo (rotas vs serviços)

---

## 8. 📚 Referências e Dependências

### 8.1 Modelos Relacionados

- `CipService`: Serviço de equipamento (tem `periodId`, `executionTimeId`)
- `Period`: Periodicidade (`days`: número de dias)
- `ExecutionTime`: Tempo de execução (`minutes`)
- `WorkOrder`: Ordem de serviço executada (`completedAt`)
- `Worker`: Colaborador da empresa
- `Company`: Empresa (horários de trabalho)

### 8.2 Endpoints Existentes Utilizados

- `GET /company/:id` - Horários de trabalho
- `GET /route/company/:id/schedules` - Agendamentos de rotas
- `GET /route/company/:id/route-services` - Serviços das rotas
- `GET /workers?companyId=...` - Lista de workers

### 8.3 Bibliotecas Frontend

- `@dnd-kit/core` - Drag and drop (já em uso)
- Componentes UI existentes (Tabs, Modal, etc.)

---

## 9. ✅ Checklist de Implementação

### Backend
- [ ] Migration: Criar tabela `planning_services`
- [ ] Model: Adicionar `PlanningService` no Prisma schema
- [ ] Service: Criar `PlanningServiceService`
- [ ] Controller: Criar `PlanningServiceController`
- [ ] DTOs: Criar DTOs para criação/atualização
- [ ] Endpoint: `POST /planning/service`
- [ ] Endpoint: `GET /planning/company/:id/services`
- [ ] Endpoint: `DELETE /planning/service/:id`
- [ ] Endpoint: `PUT /planning/service/:id`
- [ ] Service: Criar `PlanningAutoGenerationService`
- [ ] Endpoint: `POST /planning/auto-generate`
- [ ] Service: Criar `PlanningWorkloadService`
- [ ] Endpoint: `GET /planning/company/:id/workload`
- [ ] Testes unitários

### Frontend
- [ ] Tipos: Adicionar `PlanningService` em `route-types.ts`
- [ ] Componente: Atualizar `AddScheduleModal` para suportar serviços
- [ ] Componente: Criar card diferenciado para serviços individuais
- [ ] Componente: Atualizar `PlanningRoutesCalendar` para exibir serviços
- [ ] Componente: Criar `PlanningAutoGenerateModal`
- [ ] Componente: Criar `PlanningMonthlyCalendar`
- [ ] Página: Adicionar toggle semanal/mensal
- [ ] Hooks: Criar hooks para API de planejamento
- [ ] Estilos: Adicionar cores para indicadores de carga

### Documentação
- [ ] Atualizar `CALENDARIO-PLANEJAMENTO.md`
- [ ] Documentar novos endpoints na API
- [ ] Criar guia de uso para usuários

---

## 10. 🚀 Próximos Passos

1. **Revisar e aprovar** este documento com o cliente
2. **Priorizar fases** conforme necessidade do negócio
3. **Iniciar Fase 1** - Estrutura base
4. **Testes incrementais** após cada fase
5. **Feedback contínuo** do cliente durante desenvolvimento

---

## 11. 📞 Dúvidas e Decisões Pendentes

### Decisões a serem tomadas:

1. **Última execução:** Como determinar se não houver `WorkOrder`? Usar `createdAt` do `CipService`?
2. **Geração automática:** Aplicar diretamente ou mostrar preview primeiro?
3. **Capacidade de workers:** Considerar férias/ausências na Fase 1 ou deixar para depois?
4. **Visão mensal:** Mostrar detalhes dos agendamentos ou apenas indicadores?
5. **Rollback:** Permitir desfazer geração automática? Como implementar?

---

**Documento criado em:** 2025-02-XX  
**Última atualização:** 2025-02-XX  
**Versão:** 1.0
