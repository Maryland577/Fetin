const axios = require('axios');
const BaseERPAdapter = require('./base');

class OmieAdapter extends BaseERPAdapter {
  constructor() {
    super();
    this.client = axios.create({ baseURL: process.env.OMIE_BASE_URL });
    this.credentials = {
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
    };
  }

  async call(endpoint, call, param = [{}]) {
    const { data } = await this.client.post(endpoint, {
      ...this.credentials,
      call,
      param,
    });
    return data;
  }

  // Estoque
  async getInventory() {
    return this.call('/produtos/', 'ListarProdutos', [{ pagina: 1, registros_por_pagina: 50 }]);
  }

  async updateStock(productId, quantity) {
    return this.call('/produtos/', 'AlterarProduto', [{ codigo_produto: productId, estoque: quantity }]);
  }

  // Compras
  async getOrders() {
    return this.call('/pedidos/', 'ListarPedidos', [{ pagina: 1, registros_por_pagina: 50 }]);
  }

  async createOrder(orderData) {
    return this.call('/pedidos/', 'IncluirPedido', [orderData]);
  }

  async getOrderById(orderId) {
    return this.call('/pedidos/', 'ConsultarPedido', [{ numero_pedido: orderId }]);
  }

  // Financeiro
  async getAccounts() {
    return this.call('/financas/contacorrente/', 'ListarContasCorrentes', [{}]);
  }

  async createTransaction(transactionData) {
    return this.call('/financas/contapagar/', 'IncluirContaPagar', [transactionData]);
  }

  async getBalance() {
    return this.call('/financas/contacorrente/', 'PesquisarLancamentos', [{}]);
  }
}

module.exports = OmieAdapter;
