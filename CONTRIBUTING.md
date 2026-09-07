# Contribuindo para o Tarefitas

Obrigado pelo interesse em contribuir! 🎉 O Tarefitas é um projeto de código aberto com foco em ser
simples, acessível e amigável para pessoas neurodivergentes — e a colaboração da comunidade é o que
mantém isso possível.

## Começando

1. Faça um fork do repositório e clone para a sua máquina.
2. Instale as dependências: `pnpm install`
3. Rode o ambiente de desenvolvimento: `pnpm dev`
4. Faça suas alterações em um branch descritivo: `git checkout -b feat/minha-melhoria`

## Stack

- **Astro** para estrutura de páginas e ilhas
- **React** para componentes interativos
- **Nanostores** para estado reativo
- **Tailwind CSS v4** para estilos
- **RxDB (IndexedDB via Dexie)** para armazenamento local-first
- **Supabase** para sincronização opcional entre dispositivos

## Convenções

- **Código em português (pt-BR):** texto visível para o usuário, comentários e nomes de seções
  devem estar em português. Nomes de variáveis/funções em inglês são aceitos (padrão do projeto).
- **Sem mudanças quebradoras no fluxo local-first:** o app — e as vidas de quem o usa — depende de
  que os dados continuem funcionando offline. Novos recursos devem respeitar a arquitetura atual
  (mutações via `src/stores/*`, persistência via `src/lib/rxdb/bridge.ts` — ver README).
- **Acessibilidade em primeiro lugar:** novos componentes devem considerar navegação por teclado,
  foco visível e a preferência de "reduzir movimento".
- **Sem comentários desnecessários:** este projeto não usa comentários em código a menos que
  expliquem por que algo é feito (não o que é feito).

## Verificações antes de abrir um PR

```sh
pnpm install
npx astro check   # typecheck — deve terminar com 0 erros
pnpm build        # build deve completar com sucesso
```

- Depois poderemos adicionar testes automatizados; hoje a validação é o typecheck + build +
  revisão manual.
- Atualize o README se mudar o fluxo de configuração do projeto.

## Estrutura de pastas (resumo)

```
src/
  components/   # UI (React / Astro)
  lib/rxdb/     # banco de dados + ponte entre RxDB e atoms (single source of truth)
  stores/       # atoms Nanostores (fachada reativa para componentes)
  pages/        # rotas Astro
  types/        # tipos de domínio
supabase/       # schema.sql (tabelas + RLS para sincronização)
```

## Boas práticas para PRs

- Um PR por assunto; cheque se o problema não já está sendo resolvido em alguma issue.
- Descreva claramente o que muda e por quê.
- Seja gentil no feedback e nas discussões — este projeto é um espaço acolhedor para pessoas de
  todos os níveis de experiência.

## Código de conduta

Ninguém deve ser assediado ou constrangido por contribuir. Seja respeitoso. Qualquer situação
desconfortável pode ser reportada para <lumagoesmontes@gmail.com>.

## Licença

Ao contribuir, você concorda que suas contribuições ficarão sob a mesma licença do projeto (MIT).