# Documentação específica – inova-diagnosis

## Visão geral

**inova-diagnosis** é uma aplicação web de **diagnóstico de maturidade** em gestão de lubrificação. O usuário responde a um questionário com múltiplas perguntas (escala de alternativas); as respostas podem ser usadas para gerar um diagnóstico ou score de maturidade. É um produto **standalone**: não consome a inova-api e não faz parte do fluxo cadastro/planejamento/operação.

| Item | Detalhe |
|------|--------|
| **Stack** | Next.js 15 (App Router), React 18, Tailwind CSS, TypeScript |
| **Uso** | Público / clientes (diagnóstico com IA no título) |
| **Integração** | Nenhuma com inova-api |

---

## Estrutura do projeto

```
inova-diagnosis/
├── src/
│   ├── @staticData/
│   │   └── questions.ts       # Lista de perguntas (id, text, choices[5])
│   ├── @types/
│   │   └── forms.ts          # Tipagens (Question, ProposalType, etc.)
│   ├── app/
│   │   ├── layout.tsx        # Root layout, FormProvider, font Poppins, metadata "Inova Form"
│   │   ├── globals.css, favicon.ico, icon.png
│   │   └── (public)/
│   │       └── page.tsx      # Página única: fundo #ED6842, StartView
│   │   └── components/
│   │       ├── StartView.tsx   # Tela inicial: logo, texto "Faça seu diagnostico com IA", botão COMEÇAR
│   │       ├── FormSheet.tsx    # Sheet (drawer) com o questionário em etapas
│   │       ├── QuestionStep.tsx # Uma pergunta + 5 alternativas (0-4)
│   │       └── sheet.tsx        # Componente Sheet (drawer bottom)
│   ├── context/
│   │   └── FormProvider.tsx   # answers, setAnswer, objective, setObjective, reset
│   └── lib/
│       └── utils.ts           # Utilitários (cn, etc.)
├── public/
│   └── images/
│       └── new-logo-2.png
├── .env.example
└── package.json
```

---

## Fluxo do usuário

1. **Página inicial** (`(public)/page.tsx`): fundo laranja (#ED6842/90), centralizado; exibe **StartView**.
2. **StartView**: logo Inova, texto “Faça seu diagnostico com IA” e “Preencha os dados abaixo para obter um diagnostico”; botão **COMEÇAR** abre o **FormSheet**.
3. **FormSheet**: drawer (Sheet) que sobe da parte inferior; exibe o questionário em **etapas** (uma pergunta por vez). Total de etapas = `questions.length` (ex.: 51).
4. **QuestionStep**: para cada pergunta, mostra o enunciado e 5 alternativas (choices); o usuário escolhe uma (índice 0–4). A resposta é salva no **FormProvider** (`setAnswer(questionId, choiceIdx)`).
5. Navegação: **Voltar** / **Próximo** entre etapas; na última etapa, **Submit** (handleSubmit). O submit atual é um placeholder (comentado); pode ser conectado a um backend ou geração de relatório.

---

## Dados do questionário

- **questions.ts**: array de objetos `{ id, text, choices }`. Cada `choices` tem 5 strings (escala de maturidade, por exemplo de “Não” a “Sim; centro de lucro…”). Temas típicos: estratégia de lubrificação, liderança, gestão de risco, parcerias com fornecedores, estrutura dedicada, etc.
- **FormProvider**: estado global `answers` (objeto `questionId -> choiceIdx`), `objective` (ProposalType selecionado em um step 3, se houver), e `reset()` para limpar o formulário.

---

## Componentes principais

- **StartView**: tela de boas-vindas e botão para abrir o diagnóstico.
- **FormSheet**: controla o step atual (currentStep), exibe QuestionStep para a pergunta atual, barra de progresso/navegação e submit no final.
- **QuestionStep**: pergunta + 5 opções clicáveis; grava no contexto com `setAnswer(question.id, choiceIdx)`.
- **sheet.tsx**: implementação do drawer (Sheet) usado pelo FormSheet.

---

## Estilo e marca

- Cor principal: **#ED6842** (laranja Inova). Usado em fundo da página, botão, bordas e destaques das respostas.
- Fonte: **Poppins** (Google Fonts). Layout responsivo com largura máxima centralizada (ex.: lg:w-[500px]) no Sheet.

---

## Variáveis de ambiente

- **.env.example**: pode conter variáveis para URL de API ou envio do formulário, se no futuro o diagnóstico for enviado a um backend.

---

## Comunicação com o backend

**inova-diagnosis não se comunica com nenhum backend.**

- Não usa inova-api nem qualquer outra API interna do ecossistema Inova.
- O formulário (perguntas e respostas) é controlado apenas por estado local (`FormProvider`). O `handleSubmit` em `FormSheet` está **comentado/preparado** para um futuro `api.post(...)`; **nenhuma chamada HTTP está ativa** no código atual.

### Onde as “rotas” seriam usadas (hoje não são)

- Não há nenhum arquivo que chame `fetch`, `axios` ou equivalente para a inova-api ou outro backend. As únicas chamadas seriam no **submit final** do diagnóstico, que **não está implementado** (apenas fecha o sheet e poderia, no futuro, enviar `answers` e `objective`).

### Telas e funcionalidades – nenhuma chama o backend

| Tela / componente | Arquivo | O que faz | Integração com backend |
|-------------------|---------|-----------|-------------------------|
| Página inicial (landing do diagnóstico) | `src/app/(public)/page.tsx` | Renderiza StartView em fundo laranja. | **Nenhuma.** |
| StartView | `src/app/components/StartView.tsx` | Exibe logo, texto “Faça seu diagnostico com IA” e botão COMEÇAR; abre FormSheet. | **Nenhuma.** |
| FormSheet | `src/app/components/FormSheet.tsx` | Drawer com o questionário em etapas; navegação Voltar/Próximo; na última etapa chama `handleSubmit`. | **Nenhuma.** O `handleSubmit` não faz request; apenas `setOpen(false)` e poderia no futuro enviar para API. |
| QuestionStep | `src/app/components/QuestionStep.tsx` | Exibe uma pergunta e 5 alternativas; grava no FormProvider com `setAnswer(questionId, choiceIdx)`. | **Nenhuma.** Apenas estado local. |
| FormProvider | `src/context/FormProvider.tsx` | Mantém `answers` e `objective` em estado. | **Nenhuma.** |

**Resumo:** Todas as telas e funcionalidades operam **somente com dados em memória**. Nenhuma rota HTTP é chamada; o diagnóstico **não está implementado com backend**.

---

## Relacionamento com outros repositórios

- **Nenhuma integração** com inova-api, inova-app, inova-adm ou inova-worker-app.
- Produto complementar à oferta Inova (consultoria/diagnóstico de maturidade em lubrificação). Pode ser divulgado no **inova-institutional** como ferramenta de diagnóstico.
