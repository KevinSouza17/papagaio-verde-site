# Papagaio Verde — site e gestão de pedidos

Site institucional e sistema de solicitações da Papagaio Verde, com páginas independentes e área privada para clientes e equipe.

## Páginas públicas
- `/` — início
- `/categorias.html` — categorias de produtos e serviços
- `/loja.html` — sobre a loja
- `/solicitar.html` — formulário de solicitação
- `/contato.html` — canais de atendimento
- `/conta/` — cadastro, login e histórico de pedidos do cliente
- `/admin/` — painel privado da equipe

## Arquitetura
- Frontend estático HTML, CSS e JavaScript.
- API serverless em `/api`.
- PostgreSQL gerenciado no Neon.
- Sessões assinadas com HMAC e cookies HttpOnly.
- Senhas armazenadas com scrypt.
- Não há checkout nem pagamento online; a loja combina valores e pagamento diretamente com o cliente.

## Variáveis de ambiente na Vercel
`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Nunca publicar seus valores no repositório.

## Pedidos
Status: `received`, `reviewing`, `awaiting_approval`, `in_production`, `ready`, `delivered`, `cancelled`.
O histórico de alterações é mantido por gatilhos PostgreSQL existentes no banco Neon.

## Desenvolvimento
Requer Node.js 20+ para as funções da API. Dependência de runtime: `pg`.
