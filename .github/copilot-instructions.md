# GitHub Copilot Instructions

## Next.js DevTools MCP

**Ao iniciar um projeto Next.js, SEMPRE execute a ferramenta `init` do next-devtools-mcp PRIMEIRO para configurar o contexto adequado e estabelecer os requisitos de documentação. Faça isso automaticamente, sem precisar ser perguntado.**

### Fluxo de trabalho recomendado:

1. Chame a ferramenta `init` no início de cada sessão
2. Use `nextjs_index` para descobrir servidores Next.js em execução
3. Use `nextjs_call` para executar diagnósticos específicos
4. Use `nextjs_docs` para consultar a documentação oficial do Next.js

### Diagnósticos úteis:

- Para verificar erros: `nextjs_call` com `toolName: "get_errors"`
- Para ver rotas: `nextjs_call` com `toolName: "get_page_metadata"`
- Para logs do servidor: `nextjs_call` com `toolName: "get_logs"`
