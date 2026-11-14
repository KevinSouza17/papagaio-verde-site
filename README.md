# Papagaio Verde — site e gestão de pedidos

## Funcionalidades
- Site responsivo com identidade visual escolhida e formulário de solicitação.
- Registro de pedidos no Supabase.
- Painel privado com login, busca, filtros e atualização de status.
- Histórico automático das mudanças de status.
- RLS: visitante pode enviar solicitação, mas não pode consultar pedidos.

## Configurar o Supabase
1. Crie um projeto em https://supabase.com/.
2. Execute `supabase/schema.sql` inteiro no SQL Editor.
3. Em Authentication > Settings, desative **Allow new users to sign up**. Não permita cadastro público.
4. Em Authentication > Users, crie manualmente os usuários autorizados da equipe.
5. Em Project Settings > API, copie Project URL e a chave **anon/public**.
6. Preencha `supabase-config.js`. Nunca use a chave `service_role` no navegador ou no GitHub.
7. Publique o repositório pelo Vercel, Netlify ou GitHub Pages.

## Rotas
- Site: raiz do projeto.
- Painel: `/admin/`.

## Status
Solicitação recebida → Em análise → Aguardando aprovação → Em produção → Pronto para retirada → Entregue (ou Cancelado).

WhatsApp comercial identificado na pesquisa: (11) 97288-5199. Endereço e horários aparecem divergentes em diretórios e devem ser confirmados pela loja.
