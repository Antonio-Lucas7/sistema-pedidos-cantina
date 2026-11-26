# Sistema de Pedidos da Cantina

**Grupo 04 — Tambaqui**

## 1. Apresentação

O Sistema de Pedidos da Cantina é uma aplicação desenvolvida com o objetivo de organizar e facilitar o gerenciamento dos pedidos realizados no balcão de uma cantina.

A solução permite consultar os produtos disponíveis, registrar pedidos, calcular valores, acompanhar o andamento dos atendimentos e atualizar os preços dos itens do cardápio.

A aplicação foi projetada para atender a uma rotina simples de atendimento, proporcionando maior organização das informações e controle sobre os pedidos realizados.

## 2. Objetivo do projeto

Desenvolver uma aplicação que auxilie no gerenciamento das operações de uma cantina, permitindo o controle dos produtos comercializados e o acompanhamento dos pedidos desde o recebimento até a conclusão do preparo.

O projeto também tem como finalidade aplicar conceitos de desenvolvimento de software, organização de dados, componentes de interface, gerenciamento de estados e implementação de regras de negócio.

## 3. Funcionalidades

A aplicação contempla as seguintes funcionalidades:

- **Consulta do cardápio:** visualização dos produtos disponíveis e seus respectivos preços.
- **Registro de pedidos:** seleção de um produto e definição da quantidade desejada.
- **Cálculo automático:** determinação do valor total do pedido com base na quantidade e no preço unitário.
- **Listagem de pedidos:** visualização dos pedidos registrados e de suas informações.
- **Filtro por situação:** consulta dos pedidos conforme seu estágio de atendimento.
- **Acompanhamento do preparo:** atualização da situação dos pedidos durante o processo de atendimento.
- **Atualização de preços:** alteração dos valores dos produtos disponíveis no cardápio.

## 4. Regras de negócio

O funcionamento da aplicação respeita as seguintes regras:

1. Cada pedido deve conter apenas um item do cardápio, podendo possuir várias unidades desse produto.
2. A quantidade solicitada deve ser um número inteiro maior que zero.
3. Os preços unitários são armazenados em centavos para garantir a precisão dos cálculos financeiros.
4. O valor total do pedido corresponde à multiplicação da quantidade pelo preço unitário registrado.
5. Cada pedido mantém o preço unitário vigente no momento de sua criação.
6. Alterações nos preços do cardápio são aplicadas somente aos novos pedidos.
7. A situação dos pedidos segue uma sequência definida: recebido, em preparo e pronto.

## 5. Tecnologias utilizadas

O projeto utiliza tecnologias voltadas ao desenvolvimento de aplicações web:

- **React:** construção e organização da interface por meio de componentes.
- **TypeScript:** implementação da lógica com tipagem estática.
- **Vite:** configuração do ambiente de desenvolvimento e compilação da aplicação.
- **CSS:** estruturação visual, estilização e apresentação dos elementos da interface.
- **ESLint:** identificação de possíveis problemas e padronização do código.

## 6. Estrutura do projeto

A organização do código busca separar os componentes da interface, os modelos de dados e as funções auxiliares, facilitando a manutenção e a evolução da aplicação.

```text
sistema-pedidos-cantina/
├── public/
├── src/
│   ├── components/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## 7. Cenários de validação

Para verificar o cumprimento das regras de negócio, serão considerados os seguintes cenários:

- Tentativa de registrar um pedido com quantidade igual a zero, verificando o bloqueio do cadastro.
- Registro de três unidades de um sanduíche com preço unitário de R$ 8,50, verificando o cálculo do total de R$ 25,50.
- Alteração do preço do sanduíche após a criação do pedido, verificando se o valor registrado anteriormente permanece inalterado.

## 8. Execução do projeto

### Pré-requisitos

- Node.js instalado.
- npm disponível no ambiente.
- Git instalado para obter o código-fonte.

### Instalação

Clone o repositório:

```bash
git clone https://github.com/Antonio-Lucas7/sistema-pedidos-cantina.git
```

Acesse o diretório do projeto:

```bash
cd sistema-pedidos-cantina
```

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Após a inicialização, acesse o endereço disponibilizado no terminal, normalmente:

```text
http://localhost:5173/
```

### Compilação

Para verificar a compilação da aplicação, execute:

```bash
npm run build
```

## 9. Equipe

**Grupo 04 — Tambaqui**

Projeto acadêmico desenvolvido como atividade prática de desenvolvimento de software.

## 10. Considerações finais

O Sistema de Pedidos da Cantina busca oferecer uma solução objetiva para o gerenciamento de pedidos e produtos, centralizando informações essenciais do atendimento em uma única aplicação.

O desenvolvimento prioriza a aplicação correta das regras de negócio, a organização do código e a construção de uma interface funcional, permitindo demonstrar na prática os conhecimentos adquiridos durante a disciplina.