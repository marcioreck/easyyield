/**
 * Regras de segurança para fluxos que usam LLM (ver SECURITY.md).
 * - System prompt: sempre fixo no código; nunca interpolar input do usuário.
 * - User message: único lugar onde entra conteúdo do usuário (texto colado, pergunta).
 * - Saída da LLM: sempre validar com Zod (ou schema definido) no backend; nunca executar como código.
 */

/** Limite máximo (bytes) para texto colado na importação de ativos por texto. */
export const MAX_IMPORT_RAW_TEXT_BYTES = 50 * 1024 // 50 KB
