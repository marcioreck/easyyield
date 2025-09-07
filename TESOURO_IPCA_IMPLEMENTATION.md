# Tesouro IPCA+ - Exemplo de Uso

## Resumo da Implementação

Foi implementado o cálculo específico de Dividend Yield (DY) para títulos do Tesouro Direto atrelados ao IPCA. 

### Funcionalidades Implementadas

1. **Cálculo de DY específico**: Considera taxa real + IPCA
2. **Retorno acumulado**: Separa ganho real vs. inflacionário  
3. **Análise de sensibilidade**: Diferentes cenários de IPCA
4. **API de teste**: Para validar cálculos

### Como Testar

1. **Via API**:
```bash
# Criar título de teste
curl -X POST http://localhost:3000/api/test-treasury

# Listar títulos e cálculos
curl -X GET http://localhost:3000/api/test-treasury
```

2. **Via Interface Web**:
- Acesse: http://localhost:3000/assets/new
- Selecione tipo: "TESOURO_DIRETO"
- Preencha indexador: "IPCA" 
- Defina taxa real e vencimento
- O DY será calculado automaticamente

3. **Via Script de Teste**:
```bash
npm run test-treasury
```

### Exemplo de Resultado

Para um Tesouro IPCA+ 2029 com:
- Taxa real: 5,83% a.a.
- IPCA estimado: 4,5% a.a.
- Preço atual: R$ 2.800,50

**Cálculo do DY:**
- Taxa total: 10,33% a.a.
- Rendimento mensal: ~0,86%
- Rendimento em R$: ~R$ 24,11/mês

### Melhorias Futuras

1. **Integração com APIs oficiais** (BACEN/IBGE) para IPCA real
2. **Curva de juros** para pricing mais preciso
3. **Histórico de marcação** para análise temporal
4. **Comparação com outros indexadores** (CDI, Prefixado)

### Arquivos Criados/Modificados

- `src/services/treasuryCalculations.ts` - Lógica de cálculos
- `src/app/api/test-treasury/route.ts` - API de teste
- `src/test-treasury.ts` - Script de validação
- `prisma/schema.prisma` - Campo dividendYield em Price
- `src/services/calculations.ts` - Integração dos cálculos

✅ **Implementação concluída e testada!**
