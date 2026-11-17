# Banco de dados — Neon, Supabase ou PostgreSQL local

## Uma única aplicação, três destinos

A API usa o driver oficial `pg` e uma connection string PostgreSQL. Configure `DB_PROVIDER` e `DATABASE_URL`; as consultas, páginas e rotas permanecem iguais.

| Ambiente | DB_PROVIDER | DATABASE_SSL |
|---|---|---|
| Vercel + Neon | `neon` | `verify-full` |
| Supabase PostgreSQL | `supabase` | `verify-full` |
| PostgreSQL na máquina/servidor local | `local` | `disable` apenas em localhost/rede privada confiável |
| Outro PostgreSQL compatível | `postgres` | conforme TLS do servidor |

No Supabase, use a connection string PostgreSQL do projeto (preferencialmente pooler em modo compatível com o runtime serverless). A chave `service_role` não é necessária para esta arquitetura e nunca deve ir ao navegador. O acesso ao banco ocorre somente pela API do servidor.

## Instalação local

1. Instale PostgreSQL 15 ou superior.
2. Crie um banco `papagaio_verde` e um usuário próprio da aplicação; não use o superusuário `postgres` no dia a dia.
3. Execute `database/schema.sql`.
4. Copie `.env.example` para `.env.local`, ajuste a connection string e use `DB_PROVIDER=local`.
5. Execute `npm install` e `npm start`.

## Alternar

Altere somente as variáveis do ambiente em que a API será executada e reinicie/reimplante. A troca de connection string não transfere dados. Para migrar dados, faça backup e restauração controlados, valide contagens e teste o destino antes de apontar o site para ele.

## Vercel e banco local

A Vercel não pode conectar-se ao `127.0.0.1` do computador da loja. Para banco local, execute também a API no servidor local, ou crie uma conexão privada segura entre a Vercel e a rede da loja. Não exponha a porta 5432 publicamente.

## Segurança e produção

- Use TLS validado em conexões remotas.
- Mantenha a connection string apenas em variáveis secretas do servidor.
- Faça backup antes de migrações e mantenha cópia fora do servidor.
- Restrinja o usuário PostgreSQL da aplicação às permissões necessárias.
- O SQL de estrutura não contém credenciais e não cria uma conta administrativa.
