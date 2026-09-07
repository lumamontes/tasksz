# tarefitas

Um site simples para organizar rotinas e tarefas, com foco em usuários neurodivergentes (TDAH, autismo). Local-first por padrão — tudo funciona 100% offline no navegador — com sincronização opcional entre dispositivos via Supabase.

## Screenshots

| | |
|:--:|:--:|
| <img src="public/screenshots/landing.png" alt="Landing page" width="420"/> | <img src="public/screenshots/tasks-view.png" alt="Lista de tarefas com painel de detalhes" width="420"/> |
| <img src="public/screenshots/sync-view.png" alt="Conta e sincronização" width="420"/> | <img src="public/screenshots/settings-view.png" alt="Configurações" width="420"/> |

## Arquitetura

**Local-first storage:** os dados vivem em [RxDB](https://rxdb.info/) sobre [IndexedDB](https://rxdb.info/rx-storage-indexeddb.html) (via [Dexie](https://rxdb.info/rx-storage-dexie.html)), o que dá dezenas a centenas de MB de espaço local — muito além dos ~5MB do `localStorage`.

- `src/lib/rxdb/database.ts` — factory do banco RxDB + coleções (`tasks`, `subtasks`, `settings`, `profile`).
- `src/lib/rxdb/bridge.ts` — ponte entre RxDB e os atoms de Nanostores; é o único lugar que mapeia domínio ↔ documento.
- `src/stores/*` — continuam sendo a fachada reativa para os componentes (nenhum componente foi alterado); as mutações gravam via ponte no RxDB.
- `src/lib/rxdb/replication.ts` — inicia/para a replicação com o Supabase conforme o login/logout.

**Sync com Supabase (opcional):** quando `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY` estão configuradas e o usuário faz login, o plugin oficial [`replicateSupabase`](https://rxdb.info/replication-supabase.html) faz a mágica:

- Pull/push incremental com checkpoints.
- Conflitos resolvidos por last-write-wins com guardas de concorrência otimista.
- Soft-delete via tombstones (`_deleted`).
- Realtime (Postgres WAL → WebSocket) para atualizações ao vivo entre dispositivos.

Não há lógica de sincronização customizada para manter — o plugin cuida de tudo e os componentes nem sabem que o Supabase existe.

## Como ativar a sincronização (passo a passo)

Sem nenhum desses passos, o app roda 100% local (sem login, sem sync) — o default.

1. **Crie um projeto no [Supabase](https://supabase.com/dashboard)** (plano gratuito basta). Copie a `Project URL` e a `anon public key` (Project Settings → API).

2. **Crie as tabelas.** Abra o **SQL Editor** do projeto e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) uma única vez. Isso cria `tasks`, `subtasks`, `settings`, `profile` com RLS por `accountId` (= `auth.uid()`), trigger que atualiza `_modified`, e inclui as tabelas na publicação de realtime.

3. **Configure o `.env`.** O repositório já tem um `.env` (ignorado pelo git) com os campos vazios — basta preencher:
   - `PUBLIC_SUPABASE_URL` = a URL do projeto, **sem barra final** (o cliente já faz o append).
   - `PUBLIC_SUPABASE_ANON_KEY` = a chave `anon` pública.

4. **(Opcional) ative contas imediatas.** Por padrão o Supabase exige confirmação por e-mail — o app mostra "Confirme seu e-mail" e o login só completa após o link. Para ativar na hora, desligue **Authentication → Sign In / Up → Confirm e-mail** no dashboard.

5. **`pnpm dev`.** Abra **Configurações → Conta & Sincronização** e crie a conta. Os dados locais existentes são recarregados (re-keyed) para o seu `accountId` e enviados; a partir daí qualquer outro dispositivo logado na mesma conta recebe tudo via realtime.

> **Segurança:** as chaves usadas no cliente são a URL + chave *anon* (pública). A segurança real vem do RLS — cada usuário só enxerga o próprio `accountId` (= `auth.uid()`). Nunca exponha a chave `service_role`.

> **Sem Supabase / sem login:** o app segue 100% funcional; os dados ficam apenas no dispositivo.

## Comandos

| Comando            | Ação                                                    |
| :----------------- | :------------------------------------------------------ |
| `pnpm install`     | Instala dependências                                    |
| `pnpm dev`         | Servidor de desenvolvimento em `localhost:4321`         |
| `pnpm build`       | Build de produção em `./dist/`                          |
| `pnpm preview`     | Pré-visualiza o build                                    |
| `astro check`      | Typecheck do projeto                                    |

## Stack

[Astro](https://astro.build/) + [React](https://react.dev/) (ilhas) + [Nanostores](https://github.com/nanostores/nanostores) + [Tailwind CSS v4](https://tailwindcss.com/) + [RxDB](https://rxdb.info/) + [Supabase](https://supabase.com/).

## Documentos

- [Política de Privacidade](/privacidade) — como o app trata seus dados (local-first)
- [Contribuindo](CONTRIBUTING.md)
- [Licença MIT](LICENSE)