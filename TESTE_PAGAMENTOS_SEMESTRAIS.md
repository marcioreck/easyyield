# Guia de Teste: Títulos com Pagamentos Semestrais

## 📋 Resumo da Funcionalidade

Implementamos a capacidade do sistema lidar corretamente com títulos do Tesouro Direto que fazem pagamentos de juros semestralmente (Janeiro e Julho). 

### ✨ O que foi implementado:

1. **Novo campo no banco de dados**: `pagaJurosSemestrais` (boolean)
2. **Checkbox no formulário**: Permite marcar se o título paga juros semestralmente 
3. **Cálculo ajustado de DY**: Considera apenas pagamentos restantes no ano
4. **APIs atualizadas**: Salvam e carregam o novo campo

## 🧪 Teste Manual - Passo a Passo

### 1. Teste da Interface (Formulário de Criação)

1. Acesse: http://localhost:3000/assets/new
2. Preencha os campos:
   - **Ticker**: `TESOURO-IPCA-2035`
   - **Nome**: `Tesouro IPCA+ 2035`
   - **Tipo**: `Tesouro Direto`
   - **Moeda**: `BRL`
   - **Indexador**: `IPCA`
   - **Taxa**: `6.10`
   - **Vencimento**: `2035-05-15`
   - **✅ Marque**: "Paga juros semestrais (Janeiro e Julho)"

3. **Verificar**: Checkbox aparece apenas para tipos de Renda Fixa
4. **Salvar** o ativo

### 2. Teste da Edição

1. Vá para a lista de ativos: http://localhost:3000/assets
2. Clique no ativo criado
3. Clique em "Editar"
4. **Verificar**: Checkbox está marcado (salvo corretamente)
5. Desmaque e marque novamente para testar
6. Salve e verifique se mantém o estado

### 3. Teste do Cálculo de DY

1. Acesse a página de detalhes do ativo
2. Adicione um preço atual (ex: R$ 2.800,00)
3. **Verificar**: DY é calculado considerando pagamentos semestrais

### 4. Teste com Diferentes Épocas do Ano

Para testar a lógica de pagamentos:

**Cenário A (Janeiro-Junho)**:
- Sistema deve considerar 2 pagamentos restantes (se antes de Janeiro)
- Sistema deve considerar 1 pagamento restante (se entre Janeiro-Julho)

**Cenário B (Julho-Dezembro)**:
- Sistema deve considerar 0 pagamentos no ano atual
- Sistema deve projetar 2 pagamentos para o próximo ano

## 📊 Exemplo de Cálculo

### Título Sem Pagamento Semestral
- Taxa Total: 10.60% (6.10% + 4.50% IPCA)
- DY = 10.60% a.a.

### Título Com Pagamento Semestral (em Março)
- Taxa Semestral: 5.30% (10.60% ÷ 2)
- Pagamentos restantes: 1 (apenas Julho)
- DY = 5.30% para o resto do ano

## ✅ Checklist de Validação

- [ ] Checkbox aparece apenas para Renda Fixa
- [ ] Campo é salvo corretamente no banco
- [ ] Campo é carregado corretamente na edição  
- [ ] Cálculo DY considera pagamentos semestrais
- [ ] Interface mostra informação sobre pagamentos
- [ ] Sistema funciona para títulos sem pagamento semestral

## 🔧 Troubleshooting

Se algo não funcionar:

1. **Checkbox não aparece**: Verificar se tipo é Renda Fixa
2. **Erro ao salvar**: Verificar se schema foi aplicado (`npx prisma db push`)
3. **Cálculo incorreto**: Verificar lógica em `treasuryCalculations.ts`
4. **Tipos não reconhecidos**: Executar `npx prisma generate`

## 📝 Notas Técnicas

- Campo é opcional (`boolean?`) com default `false`
- Função `calculateSemiannualDividendYield` implementa a lógica específica
- Considera pagamentos em Janeiro (mês 1) e Julho (mês 7)
- Se não há pagamentos restantes no ano, projeta para o próximo ano
