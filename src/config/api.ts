import axios from 'axios';
import yahooFinance from 'yahoo-finance2';

// Tipos de APIs disponíveis
export enum ApiProvider {
  BRAPI = 'brapi',
  ALPHA_VANTAGE = 'alpha_vantage',
  YAHOO_FINANCE = 'yahoo_finance'
}

// Interface para padronizar os dados de cotação
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  provider: ApiProvider;
}

// Classe base para APIs
abstract class BaseApi {
  abstract getQuote(symbol: string): Promise<StockQuote>;
  abstract searchAssets(query: string): Promise<any>;
  abstract getHistoricalData(symbol: string, from: Date, to: Date): Promise<any>;
}

// Implementação da API BRAPI
class BrapiApi extends BaseApi {
  private api = axios.create({
    baseURL: 'https://brapi.dev/api',
    params: {
      token: process.env.BRAPI_API_KEY
    }
  });

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await this.api.get(`/quote/${symbol}`);
      const data = response.data.results[0];
      
      return {
        symbol: data.symbol,
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        volume: data.regularMarketVolume,
        timestamp: new Date(data.regularMarketTime),
        provider: ApiProvider.BRAPI
      };
    } catch (error) {
      throw new Error(`BRAPI error: ${error.message}`);
    }
  }

  // Implementar outros métodos...
  async searchAssets(query: string): Promise<any> {
    // TODO
    throw new Error('Method not implemented.');
  }

  async getHistoricalData(symbol: string, from: Date, to: Date): Promise<any> {
    // TODO
    throw new Error('Method not implemented.');
  }
}

// Implementação da API Yahoo Finance
class YahooFinanceApi extends BaseApi {
  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const quote = await yahooFinance.quote(symbol);
      
      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        timestamp: new Date(quote.regularMarketTime),
        provider: ApiProvider.YAHOO_FINANCE
      };
    } catch (error) {
      throw new Error(`Yahoo Finance error: ${error.message}`);
    }
  }

  // Implementar outros métodos...
  async searchAssets(query: string): Promise<any> {
    // TODO
    throw new Error('Method not implemented.');
  }

  async getHistoricalData(symbol: string, from: Date, to: Date): Promise<any> {
    // TODO
    throw new Error('Method not implemented.');
  }
}

// Classe principal que gerencia as APIs e fallbacks
export class MarketDataService {
  private apis: BaseApi[];
  
  constructor() {
    // Ordem de prioridade das APIs
    this.apis = [
      new BrapiApi(),
      new YahooFinanceApi()
    ];
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    let lastError = null;
    
    // Tenta cada API em ordem até conseguir os dados
    for (const api of this.apis) {
      try {
        return await api.getQuote(symbol);
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    // Se nenhuma API funcionou, lança o último erro
    throw lastError;
  }

  async searchAssets(query: string): Promise<any> {
    let lastError = null;
    
    for (const api of this.apis) {
      try {
        return await api.searchAssets(query);
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    throw lastError;
  }

  async getHistoricalData(symbol: string, from: Date, to: Date): Promise<any> {
    let lastError = null;
    
    for (const api of this.apis) {
      try {
        return await api.getHistoricalData(symbol, from, to);
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    throw lastError;
  }
}