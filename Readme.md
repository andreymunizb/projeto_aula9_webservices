# Sistema Distribuído de Pedidos e Catálogo

Este projeto consiste em uma arquitetura de microsserviços desenvolvida em **TypeScript e Node.js** para uma aplicação de comércio eletrônico. O sistema é dividido em três serviços independentes que se comunicam via HTTP.

---

## Arquitetura do Projeto

O sistema é composto por três microsserviços:

### 1. Catalogo-service

- **Porta:** 3001
- **Responsabilidade:** Gerenciar o estoque e realizar reservas de produtos.

### 2. Pedidos-service

- **Porta:** 3000
- **Responsabilidade:** Orquestrar a criação de pedidos, comunicar-se com o catálogo e acionar as notificações.

### 3. Notificacoes-service

- **Porta:** 3002
- **Responsabilidade:** Registrar as solicitações de notificação realizadas pelo sistema.

---

## Por que usamos 127.0.0.1 em vez de localhost?

O uso de `127.0.0.1` em vez de `localhost` evita possíveis incompatibilidades de rede no Node.js moderno.
O endereço `localhost` pode tentar utilizar o protocolo IPv6, enquanto os servidores estão configurados para funcionar com IPv4.
Utilizar `127.0.0.1` garante uma comunicação direta via IPv4, proporcionando maior estabilidade na comunicação entre os microsserviços durante a execução local.

---

## Como Rodar o Projeto

Para executar a aplicação localmente, abra **três terminais separados**, um para cada diretório de serviço:

- `catalogo-service`
- `pedidos-service`
- `notificacoes-service`

### 1. Instalar as dependências

Em cada terminal, navegue até o diretório correspondente ao serviço e execute:

```bash
npm install
```

### 2. Configurar as portas

Certifique-se de que os arquivos de ambiente estejam configurados corretamente com as portas designadas:

| Serviço | Porta |
| Catalogo-service | 3001 |
| Pedidos-service | 3000 |
| Notificacoes-service | 3002 |

### 3. Iniciar os microsserviços

Em cada terminal, execute:

```bash
npm run dev
```

Após iniciar os três serviços, a aplicação estará pronta para receber requisições HTTP.

---

## Como Efetuar os Testes

Os testes podem ser realizados utilizando clientes HTTP, como o **Thunder Client**, disponível como extensão do Visual Studio Code.
Os cenários abaixo verificam o funcionamento da criação de pedidos, a validação de estoque e a comunicação entre os microsserviços.

---

### 1. Teste de Sucesso (Caminho Feliz)

**Objetivo:** Verificar se um pedido válido é criado corretamente.

**Método:** `POST`

**URL:**

```text
http://127.0.0.1:3000/pedidos
```

**Headers:**

```text
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "produtoId": 1,
  "quantidade": 1,
  "clienteEmail": "aluno@estudante.ifms.edu.br"
}
```

**Resultado esperado:**

- Status: `201 Created`
- Confirmação do pedido gerado.

---

### 2. Teste de Estoque Insuficiente

**Objetivo:** Verificar se o sistema impede a criação de pedidos quando a quantidade solicitada ultrapassa o estoque disponível.

**Método:** `POST`

**URL:**

```text
http://127.0.0.1:3000/pedidos
```

**Headers:**

```text
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "produtoId": 1,
  "quantidade": 50,
  "clienteEmail": "aluno@estudante.ifms.edu.br"
}
```

**Resultado esperado:**

- Status: `409 Conflict`
- Mensagem informando que não há estoque suficiente.

---

### 3. Teste de Produto Inexistente

**Objetivo:** Verificar se o sistema identifica produtos que não existem no catálogo.

**Método:** `POST`

**URL:**

```text
http://127.0.0.1:3000/pedidos
```

**Headers:**

```text
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "produtoId": 999,
  "quantidade": 1,
  "clienteEmail": "aluno@estudante.ifms.edu.br"
}
```

**Resultado esperado:**

- Status: `404 Not Found`
- Mensagem informando que o produto não foi encontrado.

---

### 4. Teste com o Catálogo Indisponível

**Objetivo:** Verificar o comportamento do sistema quando o serviço de catálogo está indisponível.

**Procedimento:**

1. Encerre a execução do serviço `catalogo-service`.
2. Mantenha os serviços `pedidos-service` e `notificacoes-service` em execução.
3. Envie um pedido válido para a porta 3000.

**Resultado esperado:**

- Status: `502 Bad Gateway`
- Mensagem informando que o catálogo está indisponível.

---

### 5. Teste com as Notificações Indisponíveis

**Objetivo:** Verificar a resiliência do sistema quando o serviço de notificações apresenta falhas.

**Procedimento:**

1. Encerre a execução do serviço `notificacoes-service`.
2. Mantenha os serviços `catalogo-service` e `pedidos-service` em execução.
3. Envie um pedido válido para a porta 3000.

**Resultado esperado:**

- Status: `201 Created`
- O pedido é gerado com sucesso.
- A operação principal continua funcionando mesmo com a falha do serviço secundário de notificações.

---

## Considerações Finais

O projeto demonstra a utilização de uma arquitetura distribuída baseada em microsserviços, permitindo a separação de responsabilidades entre catálogo, pedidos e notificações.
A comunicação via HTTP possibilita a integração entre os serviços, enquanto os testes apresentados verificam o comportamento esperado em situações de sucesso e falha.
A aplicação também demonstra um conceito importante de **resiliência**, garantindo que a indisponibilidade do serviço secundário de notificações não impeça a criação de pedidos.

- Link para visualizar os testes realizados no ThunderClient (link acadêmico):
https://drive.google.com/drive/folders/1x2ieB99nIr0rJNB4JvaFa4YulLHTc7S4?usp=sharing

---

## Tecnologias Utilizadas

- TypeScript
- Node.js
- HTTP
- Microsserviços
- Thunder Client
