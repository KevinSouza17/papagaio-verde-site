# Papagaio Verde — site e gestão de pedidos

Site institucional e sistema de solicitações da Papagaio Verde, com páginas públicas, área de clientes e painel administrativo.

## Infraestrutura intercambiável

O mesmo código pode funcionar em três cenários, sem reescrever as páginas:

1. **Vercel + Neon:** hospedagem Vercel e banco PostgreSQL Neon.
2. **Supabase:** hospedagem Vercel ou própria e banco PostgreSQL do Supabase.
3. **Servidor próprio + PostgreSQL local:** site e API executados no servidor da loja.

A aplicação usa Node.js 20+ e o driver PostgreSQL `pg`. Neon, Supabase e PostgreSQL local falam o mesmo protocolo PostgreSQL; a troca é feita por variáveis de ambiente. O Supabase é usado como banco PostgreSQL nesta arquitetura, não como autenticação direta no navegador.

## Segurança administrativa

- Existe uma única identidade administrativa: **Papagaio Verde**.
- O acesso é configurado por `ADMIN_LOGIN` (ou `ADMIN_EMAIL` legado), `ADMIN_PASSWORD` e `SESSION_SECRET`.
- O login administrativo não consulta a tabela de equipe nem aceita cadastro público.
- `/api/admin/register` permanece apenas como rota de compatibilidade e responde 410 (cadastro desativado).
- Nunca coloque senhas, connection strings ou chaves privadas no frontend ou no Git.
- Contas de clientes são independentes e continuam podendo ser criadas.

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Escolha `DB_PROVIDER=neon`, `supabase` ou `local`.
3. Configure `DATABASE_URL`, `DATABASE_SSL`, `ADMIN_LOGIN`, `ADMIN_PASSWORD` e `SESSION_SECRET`.
4. Instale dependências com `npm install`.
5. Execute `npm start` para rodar localmente em `http://localhost:3000`.

Na Vercel, cadastre as mesmas variáveis em Project Settings → Environment Variables e faça novo deploy. Não envie `.env.local` ao GitHub.

## Páginas

- `/` — início
- `/categorias.html` — categorias
- `/loja.html` — sobre a loja
- `/solicitar.html` — formulário de solicitação
- `/contato.html` — contato
- `/conta/` — cadastro, login e histórico do cliente
- `/admin/` — painel administrativo

## Banco e migrações

Consulte `database/README.md`, `database/schema.sql` e `supabase/README.md`. Faça backup antes de qualquer migração. A aplicação não copia dados automaticamente ao alternar o banco.

## Limite do banco local

Uma função serverless na Vercel não acessa o `localhost` de um computador da loja. Para manter o site na Vercel e o banco na loja, será necessária uma API local exposta por VPN/túnel privado autenticado e firewall. Não exponha a porta PostgreSQL 5432 diretamente à internet.
