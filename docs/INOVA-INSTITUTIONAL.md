# Documentação específica – inova-institutional

## Visão geral

**inova-institutional** é o **site institucional** (landing page) da marca Inova. Apresenta a empresa, equipe, projetos, resultados e depoimentos, com páginas estáticas (home, política de privacidade, termos de uso). Não consome a inova-api nem integra com o restante do ecossistema; é apenas presença de marca e informação para visitantes.

| Item | Detalhe |
|------|--------|
| **Stack** | Next.js (App Router), React, Tailwind CSS, DM Sans (Google Fonts) |
| **Conteúdo** | Estático / marketing |
| **Integração** | Nenhuma com inova-api ou outros apps |

---

## Estrutura do projeto

```
inova-institutional/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root: DM Sans, metadata "Inova Lubrificantes", icon
│   │   ├── globals.css
│   │   ├── page.tsx          # Home (Header, Hero, CTA, Results, Team, Projects, Testimonials, Footer)
│   │   ├── politica-de-privacidade/
│   │   │   └── page.tsx
│   │   └── termos-de-uso/
│   │       └── page.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── CTA.tsx           # Call to action
│   │   ├── Results.tsx
│   │   ├── Team.tsx
│   │   ├── Projects.tsx
│   │   ├── Testimonials.tsx
│   │   └── Footer.tsx
│   └── utils/
│       ├── cn.tsx
│       └── IsOnScreen.tsx   # Utilitário de visibilidade (scroll)
├── public/                   # Imagens (logo, ícones, placeholders, redes sociais)
└── package.json
```

---

## Páginas

### Home (`/`)

- **Header**: navegação e logo.
- **Hero**: seção principal de impacto (título, subtítulo, imagem de fundo).
- **CTA**: call to action (convite à ação – contato, trial, etc.).
- **Results**: resultados/benefícios (números, cases).
- **Team**: equipe (fotos e nomes).
- **Projects**: projetos ou cases.
- **Testimonials**: depoimentos de clientes.
- **Footer**: links, contato, redes sociais.

Ordem de exibição no `page.tsx`: Header → Hero → CTA → Results → Team → Projects → Testimonials → Footer.

### Política de privacidade

- **/politica-de-privacidade**: página com texto legal de política de privacidade.

### Termos de uso

- **/termos-de-uso**: página com termos de uso do site/serviço.

---

## Componentes

- **Header**: barra superior com logo e menu de navegação.
- **Hero**: bloco de destaque com título, texto e possível imagem (heroBg, etc.).
- **CTA**: botão ou bloco de convite à ação.
- **Results**: métricas ou benefícios (ícones, números, textos).
- **Team**: grid ou lista de membros da equipe.
- **Projects**: apresentação de projetos ou portfólio.
- **Testimonials**: carrossel ou lista de depoimentos.
- **Footer**: links institucionais (privacidade, termos), contato, ícones de redes (Facebook, YouTube, Pinterest, Google).

Utilitários: **cn** (classnames), **IsOnScreen** (detecção de elemento na viewport para animações ou lazy behavior).

---

## Assets (public)

- Logos: fullLogo02, logoWhite, logoIcon, standingLogo.
- Imagens de seções: heroBg, heroBg02, about, about01–03, computer, factory, partners.
- Redes sociais: facebook, youtube, pinterest, google.
- Placeholders e ícones diversos.

---

## Estilo e marca

- **Fonte**: DM Sans (Google Fonts) aplicada no body.
- **Metadata**: título “Inova Lubrificantes”, ícone /icon2.png.
- Layout: full width, overflow-x-hidden; estrutura em coluna (flex flex-col).

---

## Comunicação com o backend

**inova-institutional não se comunica com nenhum backend.**

- Não consome inova-api nem qualquer outro serviço do ecossistema Inova.
- Todas as páginas e componentes são **estáticos**: conteúdo fixo ou importado; **nenhuma** chamada `fetch`, `axios` ou uso de API.

### Onde as rotas seriam usadas – não há nenhuma

- Não existe no projeto nenhum uso de `fetch`, `axios`, `getApi` ou similar. Nenhuma rota HTTP é chamada.

### Telas e funcionalidades – nenhuma chama o backend

| Tela / componente | Arquivo | O que faz | Integração com backend |
|-------------------|---------|-----------|-------------------------|
| Home | `src/app/page.tsx` | Renderiza Header, Hero, CTA, Results, Team, Projects, Testimonials, Footer. | **Nenhuma.** Conteúdo estático. |
| Política de privacidade | `src/app/politica-de-privacidade/page.tsx` | Página de texto legal. | **Nenhuma.** |
| Termos de uso | `src/app/termos-de-uso/page.tsx` | Página de termos. | **Nenhuma.** |
| Header | `src/components/Header.tsx` | Navegação e logo. | **Nenhuma.** |
| Hero, CTA, Results, Team, Projects, Testimonials, Footer | `src/components/*.tsx` | Blocos de conteúdo da home. | **Nenhuma.** |

**Resumo:** O site é **100% estático** e informativo. Nenhuma tela ou funcionalidade está implementada com backend; não há formulários que enviem dados para servidor nem listagens que dependam de API.

---

## Relacionamento com outros repositórios

- **Nenhuma integração** com inova-api, inova-app, inova-adm, inova-worker-app ou inova-diagnosis.
- Pode **divulgar** links para: app de cadastro, painel administrativo, app do operador ou página do diagnóstico (inova-diagnosis), sem compartilhar dados entre sistemas.
