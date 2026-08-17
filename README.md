# Cadastro de Notas

Aplicação para cadastro e consulta de notas, com API em ASP.NET Core e frontend em TypeScript/Vite.

## Pré-requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) `20.19+` ou `22.12+`
- npm

## Como executar

Após clonar o repositório, abra um terminal na raiz do projeto e inicie a API:

```bash
cd api
dotnet run
```

A API ficará disponível em `http://localhost:5118`.

Em outro terminal, também na raiz do projeto, instale as dependências e inicie o frontend:

```bash
cd frontend
npm ci
npm run dev
```

Depois, acesse `http://localhost:5173` no navegador.
