# Banco de dados: nuvem e local

## Compatibilidade

O site usa PostgreSQL nos dois cenários. A API acessa o banco por uma única camada (api/_lib.js) usando o driver pg. As consultas da aplicação não dependem de recursos exclusivos do Neon; a conexão muda por variáveis de ambiente.

- Nuvem/Neon: DATABASE_SSL=verify-full.
- PostgreSQL local: DATABASE_SSL=disable somente em localhost ou rede privada confiável.
- DATABASE_POOL_MAX controla o tamanho do pool.

## Preparar um PostgreSQL local

1. Instale PostgreSQL 15 ou superior no computador/servidor.
2. Crie um banco papagaio_verde e um usuário próprio para a aplicação (não use o superusuário postgres na aplicação).
3. Execute database/schema.sql no banco vazio.
4. Copie .env.example para .env.local e configure DATABASE_URL, DATABASE_SSL=disable, SESSION_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD.
5. Inicie a API no ambiente local com Node.js 20+.

## Alternar entre os bancos

Não altere arquivos de código para alternar. Mude apenas DATABASE_URL e DATABASE_SSL no ambiente em que a API estiver rodando e reinicie/reimplante a aplicação. Cada ambiente tem seu próprio conjunto de variáveis:

- Vercel apontando para Neon: URL do Neon e verify-full.
- Aplicação e API executadas na rede da loja: endereço privado do PostgreSQL local e disable (ou TLS validado, se configurado).

**Limite importante:** uma função serverless hospedada na Vercel não consegue acessar 127.0.0.1 do computador da loja. Para usar o banco local mantendo o site hospedado na Vercel, será necessário disponibilizar uma API na loja por uma conexão privada segura (VPN/túnel com autenticação e firewall), ou hospedar também a API no servidor local. Não exponha a porta 5432 diretamente à internet.

## Migração de dados

O schema.sql cria apenas a estrutura e não apaga nem copia dados. Para copiar dados reais entre bancos PostgreSQL, faça backup e restauração com pg_dump/pg_restore, preferencialmente com a aplicação em manutenção e após validar espaço, versões e permissões. Exemplo:

```bash
pg_dump "$SOURCE_DATABASE_URL" --format=custom --no-owner --no-acl --file=papagaio-backup.dump
pg_restore --dbname="$TARGET_DATABASE_URL" --no-owner --no-acl --clean --if-exists papagaio-backup.dump
```

A opção --clean remove objetos existentes no destino. Use somente em um banco de destino preparado e após confirmar o backup; nunca execute contra a base de produção por engano. Para uma primeira migração, prefira um banco vazio.

## Observações sobre autenticação

Este pacote cobre a portabilidade do PostgreSQL usado por pedidos, clientes e equipe. Login Google, verificação de e-mail e recuperação de senha são serviços separados de autenticação e não migram automaticamente junto com o banco de negócio. A integração com Neon Auth ainda precisa ser concluída; antes de alternar a autenticação para um ambiente local, será necessário escolher e configurar um provedor compatível.
