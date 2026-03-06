# Segurança

## Reportar vulnerabilidades

Se encontrar uma vulnerabilidade de segurança, **não** abra uma issue pública. Use uma das opções:

- **GitHub:** [Security Advisories](https://github.com/OWNER/REPO/security/advisories/new) (substitua OWNER/REPO pelo repositório do projeto), ou
- Envie um e-mail ao mantenedor descrevendo o problema de forma objetiva.

O projeto é de uso local e pessoal; mesmo assim, falhas que possam afetar dados ou expor credenciais serão tratadas com prioridade.

## Uso de APIs externas e LLM

O EasyYield pode enviar dados a serviços externos:

- **APIs de mercado (BRAPI, Yahoo Finance):** tickers e requisições de cotações.
- **API de LLM (ex.: OpenAI), quando configurada:** texto colado pelo usuário (importação de ativos por texto) e mensagens do assistente; o backend envia também um resumo agregado do portfólio (valores, totais, sem histórico bruto de preços) para responder perguntas.

Nenhum segredo (API keys, senhas) deve ser commitado; use sempre variáveis de ambiente (`.env`).

## Padrões para fluxos que usam LLM

Todos os fluxos que chamam uma API de LLM (importação de ativos por texto, assistente) devem seguir:

1. **Separação system / user**
   - O conteúdo fornecido pelo usuário (texto colado, pergunta) vai **sempre** no papel de mensagem "user" (ou equivalente).
   - O "system prompt" é fixo no código e **nunca** concatenado ou interpolado com input do usuário, para reduzir risco de prompt injection.

2. **Validação server-side da saída**
   - Definir um schema de saída esperado (ex.: JSON) e validar toda resposta da LLM no backend (ex.: com Zod).
   - Rejeitar respostas que não passem na validação e **não** persistir nem executar nada com base em saída não validada.
   - **Nunca** executar a saída da LLM como código, comando de sistema ou query dinâmica.

3. **Limite de dados enviados**
   - Enviar apenas o estritamente necessário para a função (ex.: para importação por texto, só o texto colado; para o assistente, contexto agregado e a pergunta).
   - Limitar tamanho do payload (ex.: teto para texto colado) para evitar abuso e custo excessivo de tokens.

4. **Boas práticas**
   - Rate limiting nos endpoints que chamam a LLM.
   - API keys apenas em variáveis de ambiente (`.env`), nunca no código-fonte.
