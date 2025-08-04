import axios from 'axios';
import { API_CONFIG } from '@/config/api';

export interface AssetQuote {
  symbol: string;
  price: number;
  currency: string;
  timestamp: Date;
  change: number;
  changePercent: number;
}

export class AssetService {
  static async getUSStockQuote(symbol: string): Promise<AssetQuote> {
    try {
      const response = await axios.get(`${API_CONFIG.ALPHA_VANTAGE_BASE_URL}`, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: API_CONFIG.ALPHA_VANTAGE_API_KEY,
        },
      });

      const data = response.data['Global Quote'];
      return {
        symbol,
        price: parseFloat(data['05. price']),
        currency: 'USD',
        timestamp: new Date(data['07. latest trading day']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')),
      };
    } catch (error) {
      console.error(`Error fetching US stock quote for ${symbol}:`, error);
      throw error;
    }
  }

  static async getBrazilianStockQuote(symbol: string): Promise<AssetQuote> {
    try {
      const response = await axios.get(`${API_CONFIG.BRAPI_BASE_URL}/quote/${symbol}`, {
        params: {
          token: API_CONFIG.BRAPI_API_KEY,
        },
      });

      const data = response.data.results[0];
      return {
        symbol,
        price: data.regularMarketPrice,
        currency: 'BRL',
        timestamp: new Date(data.regularMarketTime * 1000),
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
      };
    } catch (error) {
      console.error(`Error fetching Brazilian stock quote for ${symbol}:`, error);
      throw error;
    }
  }

  static async getCryptoQuote(symbol: string): Promise<AssetQuote> {
    try {
      const response = await axios.get(
        `${API_CONFIG.COINGECKO_BASE_URL}/simple/price`,
        {
          params: {
            ids: symbol.toLowerCase(),
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
        }
      );

      const data = response.data[symbol.toLowerCase()];
      return {
        symbol,
        price: data.usd,
        currency: 'USD',
        timestamp: new Date(),
        change: data.usd_24h_change,
        changePercent: data.usd_24h_change,
      };
    } catch (error) {
      console.error(`Error fetching crypto quote for ${symbol}:`, error);
      throw error;
    }
  }

  static async getFundamentals(symbol: string, isBrazilian: boolean) {
    if (isBrazilian) {
      try {
        const response = await axios.get(`${API_CONFIG.BRAPI_BASE_URL}/fundamentals/${symbol}`, {
          params: {
            token: API_CONFIG.BRAPI_API_KEY,
          },
        });

        return response.data.results[0];
      } catch (error) {
        console.error(`Error fetching Brazilian fundamentals for ${symbol}:`, error);
        throw error;
      }
    } else {
      try {
        const response = await axios.get(`${API_CONFIG.ALPHA_VANTAGE_BASE_URL}`, {
          params: {
            function: 'OVERVIEW',
            symbol,
            apikey: API_CONFIG.ALPHA_VANTAGE_API_KEY,
          },
        });

        return response.data;
      } catch (error) {
        console.error(`Error fetching US fundamentals for ${symbol}:`, error);
        throw error;
      }
    }
  }
}