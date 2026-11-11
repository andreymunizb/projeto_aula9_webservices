# Sistema Distribuído de Pedidos e Catálogo com Persistência (Prisma & PostgreSQL)

Este projeto consiste numa arquitetura de microsserviços desenvolvida em TypeScript e Node.js para uma aplicação de comércio eletrônico. O sistema é dividido em serviços independentes que se comunicam via HTTP e utilizam **PostgreSQL** com **Prisma ORM (v7)** para persistência de dados.

## Arquitetura do Projeto
O sistema é composto por três microsserviços e uma base de dados containerizada:

1. Catalogo-service (Porta: 3001)
   - Responsabilidade: Gerenciar o catálogo de produtos, controlar o estoque e realizar reservas de produtos na base de dados (`catalogo_db`).
2. Pedidos-service (Porta: 3000)
   - Responsabilidade:Orquestrar a criação de pedidos, comunicar-se com o catálogo, persistir os pedidos (`pedidos_db`) e acionar as notificações.
3. Notificacoes-service (Porta: 3002)
   - Responsabilidade: Registrar as solicitações de notificação realizadas pelo sistema.
4. PostgreSQL (Porta: 5432)
   - Responsabilidade: Servidor de base de dados executado via Docker.

---

## Pré-requisitos
- Node.js instalado.
- Docker e Docker Compose instalados e em execução.

---

## Como Rodar o Projeto

### 1. Subir a Base de Dados (Docker)
Na raiz do projeto, execute o Docker Compose para iniciar o PostgreSQL:
```bash
docker compose up -d
(Certifique-se de que as bases de dados catalogo_db e pedidos_db foram criadas no servidor Postgres).2. Configurar as Variáveis de Ambiente (.env)Em cada diretório de serviço (catalogo-service e pedidos-service), certifique-se de que o arquivo .env está configurado corretamente com as credenciais do banco:Exemplo para o Catálogo (catalogo-service/.env):Snippet de códigoPORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/catalogo_db?schema=public"
Exemplo para os Pedidos (pedidos-service/.env):Snippet de códigoPORT=3000
CATALOG_URL=[http://127.0.0.1:3001](http://127.0.0.1:3001)
NOTIFICATION_URL=[http://127.0.0.1:3002](http://127.0.0.1:3002)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pedidos_db?schema=public"
3. Instalar Dependências e Executar Migrações do PrismaEm cada microsserviço (catalogo-service, pedidos-service e notificacoes-service), execute:Bashnpm install
Nos serviços que usam Prisma (catalogo-service e pedidos-service), gere o cliente e aplique as migrações:Bashnpx prisma migrate dev
npx prisma generate
4. Iniciar os MicrosserviçosAbra três terminais separados, um para cada diretório de serviço, e execute em cada um deles:Bashnpm run dev
Como Efetuar os TestesOs testes podem ser realizados utilizando clientes HTTP, como o Thunder Client. Como agora utilizamos uma base de dados real, primeiro é necessário cadastrar um produto no catálogo antes de efetuar os pedidos.   Passo Prévio: Cadastrar um ProdutoMétodo: POSTURL: http://127.0.0.1:3001/produtosHeaders: Content-Type: application/jsonBody (JSON):JSON{
  "nome": "Teclado Mecânico",
  "preco": 250.00,
  "estoque": 15
}
1. Teste de Sucesso (Caminho Feliz)Método: POST   URL: http://127.0.0.1:3000/pedidos   Headers: Content-Type: application/json   Body (JSON):   JSON{
  "produtoId": 1,
  "quantidade": 2,
  "clienteEmail": "aluno@estudante.ifms.edu.br"
}
Resultado esperado: Status 201 Created com a confirmação e gravação real do pedido na base de dados.2. Consultar Pedidos GravadosMétodo: GETURL: http://127.0.0.1:3000/pedidosResultado esperado: Status 200 OK listando todos os pedidos salvos no PostgreSQL.Tecnologias UtilizadasTypeScript   Node.js   ExpressPrisma ORM (v7) com Adaptador PostgreSQL (@prisma/adapter-pg)PostgreSQL & DockerMicrosserviços via HTTP   Thunder Client   