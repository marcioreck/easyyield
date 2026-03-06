# EasyYield

Aplicação web para gerenciamento de investimentos no Brasil e nos EUA, permitindo o acompanhamento de diversos tipos de ativos através de importação de cotações de APIs gratuitas e cálculos de Dividend Yield (DY).

**Uso local e pessoal.** O projeto é aberto no GitHub para críticas, sugestões e contribuições (veja [Contribuição](#contribuição) e [Patrocínio](#patrocínio)).

## Funcionalidades

### Tipos de Ativos Suportados

#### Renda Fixa
- Tesouro Direto
- Poupança
- CDB
- Debêntures
- CRI (Certificados de Recebíveis Imobiliários)
- Renda Fixa Digital

#### Fundos
- FII (Fundos de Investimento Imobiliário)
- REIT (Real Estate Investment Trust)
- FI-Infra (Fundo de Investimento em Infraestrutura)

#### Ações
- Ações Brasil (Buy and Hold)
- Ações EUA (Buy and Hold)

#### Outros
- Staking Crypto
- Outros tipos de investimento

### Características Principais
- Interface web responsiva e multiplataforma
- Consolidação de preço médio por ativo
- Análise fundamentalista
- Gráficos de cotação (curto, médio e longo prazos)
- Filtros por tipo de ativo e período
- Persistência local de dados históricos
- Backup local em JSON e CSV
- **Atualização de cotações:** ao abrir o app e uma vez por dia (BRAPI / Yahoo Finance)
- **Assistente (opcional):** perguntas sobre o portfólio via API de IA (ex.: OpenAI); configure `OPENAI_API_KEY`
- **Importar ativos por texto:** cole uma tabela ou texto e a IA interpreta e cadastra os ativos
- **Dividend Yield comparativo:** DY mensal, acumulado e anual por ativo no dashboard

## Tecnologias Utilizadas

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** MySQL com Prisma ORM
- **Gráficos:** Chart.js, React-Chartjs-2
- **Formulários:** React Hook Form, Zod
- **APIs de Mercado:**
  - BRAPI (mercado brasileiro)
  - Yahoo Finance (fallback e mercado americano)

## Configuração

### Pré-requisitos
- Node.js
- MySQL

### Configuração do Banco de Dados

```sql
CREATE DATABASE IF NOT EXISTS easyyield;
CREATE USER IF NOT EXISTS 'easyyield_user'@'localhost' IDENTIFIED BY 'easyyield_password';
GRANT ALL PRIVILEGES ON easyyield.* TO 'easyyield_user'@'localhost';
FLUSH PRIVILEGES;
```

### Variáveis de Ambiente
Crie um arquivo `.env` com:

```env
# Database
DATABASE_URL="mysql://easyyield_user:easyyield_password@localhost:3306/easyyield"

# APIs de mercado
ALPHA_VANTAGE_API_KEY=your_key_here
BRAPI_API_KEY=your_key_here

# API de IA (opcional: Assistente e Importar ativos por texto)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

### Instalação

```bash
# Instalar dependências
npm install

# Criar/atualizar banco de dados
npx prisma db push

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## Funcionalidades Implementadas

- [x] Cadastro e edição de ativos
- [x] Cadastro e edição de operações
- [x] Cálculo de preço médio
- [x] Importação de cotações via APIs
- [x] Persistência de dados históricos
- [x] Gráficos de evolução patrimonial
- [x] Gráficos de distribuição por tipo
- [x] Filtros por tipo de ativo
- [x] Filtros por período
- [x] Relatórios de rentabilidade
- [x] Importação de operações via CSV
- [x] Backup local (JSON)
- [x] Exportação CSV
- [x] Validações de formulários
- [x] Formatação BR (moeda, datas)
- [x] Suporte a CRI e FI-Infra
- [x] **Cálculos específicos para Tesouro IPCA+**
- [x] **Pagamentos semestrais do Tesouro Direto**
- [x] **Evolução patrimonial com eventos de pagamento**
- [x] **Comparação com benchmarks (IPCA, CDI, SELIC)**
- [x] **Integração real com APIs do Banco Central**
- [x] **Gráficos corrigidos com valores não-zero**
- [x] **Sistema auditável e reconciliável**
- [x] **Atualização de cotações** ao abrir o app e 1x/dia (endpoint `refresh-all`)
- [x] **Assistente** com API de IA (OpenAI) para perguntas sobre o portfólio
- [x] **Importar ativos por texto** (cola de tabela/dados; IA interpreta e cadastra)
- [x] **Dividend Yield comparativo** (mensal, acumulado, anual) no dashboard
- [x] **Modelo de dividendos** e importação via BRAPI (ativos BRL)
- [ ] Comparar os gráficos do título do tesouro direto IPCA+ com os do site oficial do Tesouro Direto, verificando a forma correta de calcular a evolução do valor do ativo ao longo do tempo.
- [ ] Testar com FI-Infra (Classificar as operações como REAL ou SIMULADA e incluir isso nos filtros para facilitar as análises e planejamentos)

## 🔧 Correções Recentes

### ✅ Sistema de Pagamentos Semestrais
- ✅ **CRUD Completo**: Interface para gerenciar pagamentos semestrais
- ✅ **Cálculos Auditáveis**: Lógica transparente baseada em dados reais
- ✅ **Histórico de Pagamentos**: Exibição detalhada no dashboard e na visualização de ativos
- ✅ **Próximos Pagamentos**: Dashboard mostra status e datas dos próximos pagamentos

### ✅ Gráficos de Evolução Patrimonial
- ✅ **Valores Corretos**: Corrigido problema de zeros nos gráficos
- ✅ **Três Séries**: Valor dos ativos, pagamentos recebidos e total
- ✅ **Eventos de Pagamento**: Marcadores visuais nos gráficos para pagamentos
- ✅ **Interpolação Realista**: Crescimento suave baseado em dados reais

### ✅ Integração com APIs Oficiais
- ✅ **Banco Central do Brasil**: Integração real com APIs gratuitas
- ✅ **IPCA, CDI, SELIC**: Dados oficiais para comparação de performance
- ✅ **Fallback Inteligente**: Sistema robusto com dados simulados em caso de falha
- ✅ **Gráfico de Benchmarks**: Comparação visual entre portfolio e índices

### ✅ Dashboard Auditável
- ✅ **Transparência Total**: Todos os cálculos são rastreáveis
- ✅ **Reconciliação**: Interface permite conferir com extratos oficiais
- ✅ **Status em Tempo Real**: Informações atualizadas do portfolio
- ✅ **Múltiplos Períodos**: Visualização flexível (1m, 3m, 6m, 1a, tudo)
- [ ] Testar com CRI
- [ ] Testar com Renda Fixa Digital
- [ ] Testar com Fundos
- [ ] Testar com Ações
- [ ] Testar com Staking Crypto
- [ ] Testar com Outros tipos de investimento
- [ ] Gráficos de rentabilidade por tipo de ativo
- [ ] Exportação de relatórios em PDF
- [ ] Otimização de consultas e performance

## Estrutura do Projeto

```
easyyield/
├── prisma/
│   └── schema.prisma      # Schema do banco de dados
├── public/               # Arquivos estáticos
├── src/
│   ├── app/             # Páginas e rotas
│   ├── components/      # Componentes React
│   ├── config/         # Configurações
│   ├── services/       # Serviços e lógica de negócio
│   │   ├── calculations.ts      # Cálculos gerais de posição e DY
│   │   ├── treasuryCalculations.ts  # Cálculos específicos para Tesouro IPCA+
│   │   ├── marketData.ts        # APIs de cotações
│   │   └── ...
│   └── utils/          # Utilitários
├── .env.example        # Exemplo de variáveis de ambiente
├── next.config.mjs     # Configuração Next.js
└── package.json        # Dependências e scripts
```

## APIs e Integrações

### BRAPI (Mercado Brasileiro)
- Cotações com delay de 15 minutos
- Dados fundamentalistas
- Gratuito com limites de requisição

### Yahoo Finance (Fallback e Mercado Americano)
- Cotações históricas
- Dados fundamentalistas básicos
- Sem necessidade de API key

## Cálculos Específicos

### Tesouro IPCA+
Para títulos do Tesouro Direto atrelados ao IPCA, o sistema implementa cálculos específicos:

#### Dividend Yield (DY)
- **Fórmula**: Taxa Real + IPCA estimado
- **Exemplo**: Título com taxa real 5,83% + IPCA 4,5% = DY ~10,33% a.a.
- **Rendimento mensal**: DY/12 (~0,86% ao mês no exemplo)

#### Retorno Acumulado
- **Retorno Real**: Baseado na taxa fixa do papel
- **Retorno Inflacionário**: Baseado no IPCA acumulado do período
- **Retorno Total**: (1 + retorno real) × (1 + inflação) - 1

#### Características Implementadas
- Cálculo automático do DY baseado no tipo de indexador
- Análise de sensibilidade para diferentes cenários de IPCA
- Preço teórico baseado na curva de juros
- Histórico de rentabilidade real vs. nominal
- **Pagamentos Semestrais**: Rastreamento histórico de pagamentos de juros
- **Evolução Patrimonial Detalhada**: Visualização dos "saltos" de pagamentos
- **Reconciliação com Extratos**: Comparação com extratos do Tesouro Direto

#### API de Teste
- **Endpoint**: `/api/test-treasury`
- **GET**: Lista todos os títulos IPCA+ e seus cálculos
- **POST**: Cria título de teste com dados reais

### Comparação com Benchmarks

#### Funcionalidades
- **Gráfico de Performance**: Comparação visual do portfólio vs. índices oficiais
- **Índices Suportados**: IPCA, CDI, SELIC
- **Performance Relativa**: Cálculo automático de sobre/sub-performance
- **Dados Históricos**: Desde o início do investimento até a data atual

#### APIs de Benchmarks
- **Endpoint**: `/api/portfolio/benchmarks`
- **Fonte**: Dados simulados baseados em médias históricas
- **Produção**: Preparado para integração com API oficial do Banco Central
- **Parâmetros**: Período configurável (1m, 3m, 6m, 1y, all)

#### Métricas Calculadas
- **vs. IPCA**: Performance acima/abaixo da inflação
- **vs. CDI**: Comparação com renda fixa padrão
- **vs. SELIC**: Comparação com taxa básica de juros
- **Valor Acumulado**: Simulação de R$ 10.000 investidos nos índices

### Evolução Patrimonial Avançada

#### Eventos de Timeline
- **Transações**: Compras e vendas com impacto no patrimônio
- **Pagamentos Semestrais**: Juros recebidos do Tesouro IPCA+
- **Valorização**: Variação do valor dos ativos ao longo do tempo

#### Visualizações
- **Múltiplas Séries**: Valor dos ativos, pagamentos acumulados, total
- **Marcadores de Eventos**: Destaque para datas de pagamento
- **Tooltips Informativos**: Detalhes sobre eventos do período
- **Interpolação Inteligente**: Preenchimento de períodos sem dados

## Backup e Exportação

### JSON (Backup Completo)
- Exporta todos os dados do banco
- Permite restauração completa
- Mantém relacionamentos entre entidades

### CSV (Exportação)
- Exporta ativos
- Exporta operações
- Exporta histórico de preços
- Formato adequado para análise externa

## Validações

### Ativos
- Ticker único
- Formato de ticker válido
- Tipo de ativo válido
- Moeda válida
- Campos específicos por tipo de ativo:
  - Renda Fixa: indexador, taxa, vencimento
  - Fundos: valor da cota
  - Ações: dados fundamentalistas

### Operações
- Data não futura
- Quantidade positiva
- Preço positivo
- Quantidade suficiente para vendas
- Validação de ativo existente

## Formatação

### Moedas
- Real (BRL): R$ 1.234,56
- Dólar (USD): $ 1,234.56

### Datas
- Formato brasileiro: DD/MM/YYYY
- Timezone local

### Números
- Percentuais com 2 casas decimais
- Quantidades com até 6 casas decimais
- Separador de milhares

## Contribuição

Críticas e sugestões são bem-vindas. Para contribuir com código:

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Patrocínio

Se o EasyYield for útil para você, considere apoiar o projeto. Veja [.github/FUNDING.yml](.github/FUNDING.yml) para opções (ex.: GitHub Sponsors).

## Segurança

Veja [SECURITY.md](SECURITY.md) para como reportar vulnerabilidades e para os padrões de uso de APIs externas (incluindo LLM).