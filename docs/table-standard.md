# Padrão de Tabelas (Table Standards)

Este documento define o padrão visual e estrutural para todas as tabelas do sistema Inova ADM. O objetivo é manter a consistência, legibilidade e uma estética moderna e leve.

## Estrutura Geral

Todas as tabelas devem ser envolvidas por um container com borda suave e arredondada.

```tsx
<div className="rounded-lg border border-slate-100 bg-white shadow-sm">
  <Table>{/* ... */}</Table>
</div>
```

## Estilos

### Container

- **Classe:** `rounded-lg border border-slate-100 bg-white shadow-sm`
- **Motivo:** Cria um card limpo com bordas sutis (slate-100) para não pesar na interface.

### Cabeçalho (TableHeader)

- **TableRow:** `className="border-slate-100 hover:bg-transparent"`
- **TableHead:** Padrão do componente `TableHead` (texto slate-500, font-medium).

### Corpo (TableBody)

- **TableRow:** `className="border-slate-100 hover:bg-slate-50/50"`
- **Motivo:** Linhas divisórias muito sutis (`border-slate-100`) para separar conteúdo sem criar "grades" pesadas. O hover é leve.

### Células (TableCell)

- **Texto Principal (ex: TAG):** `font-medium text-slate-700`
- **Texto Secundário (ex: Nome):** `text-sm text-slate-500`
- **Texto Geral:** `text-sm text-slate-500`
- **Imagens:**
  - Container: `h-10 w-10 rounded-lg bg-slate-100` (40x40px)
  - Ícone/Placeholder: `text-xs text-slate-400`

### Ações

- **Botões:**
  - `group rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600`
- **Ícones:** Tamanho padrão `h-4 w-4`.

## Exemplo de Implementação

```tsx
<div className="rounded-lg border border-slate-100 bg-white shadow-sm">
  <Table>
    <TableHeader>
      <TableRow className="border-slate-100 hover:bg-transparent">
        <TableHead>Coluna 1</TableHead>
        <TableHead>Coluna 2</TableHead>
        <TableHead className="w-24">Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow
          key={item.id}
          className="border-slate-100 hover:bg-slate-50/50"
        >
          <TableCell className="font-medium text-slate-700">
            {item.col1}
          </TableCell>
          <TableCell className="text-slate-500">{item.col2}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">{/* Actions */}</div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```
