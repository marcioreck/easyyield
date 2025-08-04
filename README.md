# EasyYield

Aplicação web para gerenciamento de investimentos no Brasil e nos EUA, permitindo o acompanhamento de diversos tipos de ativos através de importação de cotações de APIs gratuitas e cálculos de Dividend Yield (DY).

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

# APIs
ALPHA_VANTAGE_API_KEY=your_key_here
BRAPI_API_KEY=your_key_here

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
- [ ] Gráficos de rentabilidade por tipo de ativo
- [ ] Comparação com benchmarks (IBOV, S&P500)
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

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request