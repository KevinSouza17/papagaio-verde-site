# Supabase — configuração do banco

Este projeto usa o Supabase como **PostgreSQL gerenciado**, acessado exclusivamente pelo backend Node.js com o driver `pg`. Não usa o SDK Supabase no navegador nem depende da autenticação Supabase para a conta administrativa.

## Preparação

1. Abra o projeto Supabase e entre no SQL Editor.
2. Execute o conteúdo de `supabase/schema.sql`.
3. Copie a connection string PostgreSQL do Supabase. Para execução serverless, prefira o pooler em modo Session quando aplicável à sua região/runtime; confira as instruções exibidas pelo próprio Supabase.
4. Na Vercel (ou no servidor Node), configure:
   - `DB_PROVIDER=supabase`
   - `DATABASE_URL=` connection string privada do Supabase
   - `DATABASE_SSL=verify-full`
   - `DATABASE_POOL_MAX=5`
   - `ADMIN_LOGIN=` identificação exclusiva da conta Papagaio Verde
   - `ADMIN_PASSWORD=` senha forte da conta
   - `SESSION_SECRET=` segredo aleatório longo
5. Faça o deploy/reinicie a API.

## Segurança

- Nunca coloque a connection string PostgreSQL, `service_role` ou qualquer segredo em HTML, JavaScript público, repositório ou variável `NEXT_PUBLIC_*`.
- Não use a chave anon para acessar tabelas pelo navegador. O frontend conversa com as rotas `/api`.
- O SQL ativa RLS e remove policies anteriores de `customers`, `orders` e `order_status_history`; acesso direto por anon/authenticated fica bloqueado. O backend usa a credencial privada do PostgreSQL.
- O painel não cria administradores. A única identidade administrativa é Papagaio Verde, configurada por variáveis secretas.
- O script não apaga os pedidos existentes. Ele adiciona a ligação opcional de pedidos com clientes e adapta `changed_by` do schema anterior.

## Migração e retorno

Antes de executar em uma base que já contém dados, faça um backup. Depois do script, confira a quantidade de pedidos, clientes e histórico. A troca de banco não copia registros automaticamente; use `pg_dump`/ `pg_restore` para migração planejada.
