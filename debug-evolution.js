// Debug script to check evolution API
const fetch = require('node-fetch');

async function debugEvolution() {
  try {
    console.log('🔍 Testando API de evolução...');
    
    // Test assets
    const assetsResponse = await fetch('http://localhost:3000/api/assets');
    const assets = await assetsResponse.json();
    console.log('📊 Ativos encontrados:', assets.length);
    
    if (assets.length > 0) {
      console.log('🎯 Primeiro ativo:', assets[0].ticker, assets[0].id);
      
      // Test transactions
      const transactionsResponse = await fetch(`http://localhost:3000/api/assets/${assets[0].id}/transactions`);
      const transactions = await transactionsResponse.json();
      console.log('💰 Transações:', transactions.length);
      
      // Test prices
      const pricesResponse = await fetch(`http://localhost:3000/api/assets/${assets[0].id}/prices`);
      const prices = await pricesResponse.json();
      console.log('💲 Preços:', prices.length);
      
      // Test evolution
      const evolutionResponse = await fetch('http://localhost:3000/api/portfolio/evolution?period=all');
      const evolution = await evolutionResponse.json();
      console.log('📈 Evolução:', evolution);
      
      if (evolution.success && evolution.data) {
        console.log('✅ Dados de evolução encontrados:', evolution.data.length, 'pontos');
        if (evolution.data.length > 0) {
          console.log('🔢 Primeiro ponto:', evolution.data[0]);
          console.log('🔢 Último ponto:', evolution.data[evolution.data.length - 1]);
        }
      } else {
        console.log('❌ Problema na API de evolução:', evolution);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugEvolution();
