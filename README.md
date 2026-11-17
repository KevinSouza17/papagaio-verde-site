# Papagaio Verde — site e gestão de pedidos

Site institucional e sistema de solicitações da Papagaio Verde, com páginas independentes e área privada para clientes e equipe.

## Páginas públicas
- / — início
- /categorias.html — categorias de produtos e serviços
- /loja.html — sobre a loja
- /solicitar.html — formulário de solicitação
- /contato.html — canais de atendimento
- /conta/ — cadastro, login e histórico de pedidos do cliente
- /admin/ — painel privado da equipe

## Arquitetura
- Frontend estático HTML, CSS e JavaScript.
- API em /api.
- PostgreSQL como banco de dados, compatível com Neon ou instalação própria.
- Uma única camada de conexão em api/_lib.js, configurada por variáveis de ambiente.
- Sessões assinadas com HMAC e cookies HttpOnly (autenticação atual; integração Neon Auth ainda em preparação).
- Senhas de contas locais armazenadas com scrypt.
- Não há checkout nem pagamento online; a loja combina valores e pagamento diretamente com o cliente.

## Banco de dados: nuvem ou local

A aplicação usa o driver PostgreSQL pg nos dois ambientes. Para alternar, configure:

- DATABASE_URL: endereço do PostgreSQL escolhido.
- DATABASE_SSL=verify-full: recomendado para Neon e bancos remotos com certificado válido.
- DATABASE_SSL=disable: somente para PostgreSQL em localhost/rede privada confiável.
- DATABASE_POOL_MAX: limite de conexões (padrão 5).

Consulte database/README.md e database/schema.sql para instalação e migração. Uma API hospedada na Vercel não acessa diretamente o localhost de um computador da loja; o banco local exige que a API também rode no servidor local ou que exista uma conexão privada segura entre os ambientes.

## Variáveis de ambiente

Consulte .env.example. Configure os valores reais na Vercel ou no ambiente local. Nunca publique credenciais no repositório.

## Pedidos
Status: received, reviewing, awaiting_approval, in_production, ready, delivered, cancelled.
O histórico de alterações é mantido por gatilhos PostgreSQL.

## Desenvolvimento
Requer Node.js 20+ para as funções da API. Dependência de runtime: pg.
