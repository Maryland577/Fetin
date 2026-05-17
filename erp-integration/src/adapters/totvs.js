const axios = require('axios');
const BaseERPAdapter = require('./base');

class TOTVSAdapter extends BaseERPAdapter {
  constructor() {
    super();
    const token = Buffer.from(
      `${process.env.TOTVS_USER}:${process.env.TOTVS_PASSWORD}`
    ).toString('base64');

    this.client = axios.create({
      baseURL: process.env.TOTVS_BASE_URL,
      headers: { Authorization: `Basic ${token}` },
    });
  }

  // Estoque
  async getInventory() {
    const { data } = await this.client.get('/ESTOQUE/PRODUTOS');
    return data;
  }

  async updateStock(productId, quantity) {
    const { data } = await this.client.put(`/ESTOQUE/PRODUTOS/${productId}`, { QUANTIDADE: quantity });
    return data;
  }

  // Compras
  async getOrders() {
    const { data } = await this.client.get('/COMPRAS/PEDIDOS');
    return data;
  }

  async createOrder(orderData) {
    const { data } = await this.client.post('/COMPRAS/PEDIDOS', orderData);
    return data;
  }

  async getOrderById(orderId) {
    const { data } = await this.client.get(`/COMPRAS/PEDIDOS/${orderId}`);
    return data;
  }

  // Financeiro
  async getAccounts() {
    const { data } = await this.client.get('/FINANCEIRO/CONTAS');
    return data;
  }

  async createTransaction(transactionData) {
    const { data } = await this.client.post('/FINANCEIRO/LANCAMENTOS', transactionData);
    return data;
  }

  async getBalance() {
    const { data } = await this.client.get('/FINANCEIRO/SALDO');
    return data;
  }
}

module.exports = TOTVSAdapter;
