const axios = require('axios');
const BaseERPAdapter = require('./base');

class BlingAdapter extends BaseERPAdapter {
  constructor() {
    super();
    this.client = axios.create({
      baseURL: process.env.BLING_BASE_URL,
      headers: { Authorization: `Bearer ${process.env.BLING_API_KEY}` },
    });
  }

  // Estoque
  async getInventory() {
    const { data } = await this.client.get('/produtos');
    return data;
  }

  async updateStock(productId, quantity) {
    const { data } = await this.client.patch(`/produtos/${productId}`, { estoque: { saldoVirtual: quantity } });
    return data;
  }

  // Compras
  async getOrders() {
    const { data } = await this.client.get('/pedidos/compras');
    return data;
  }

  async createOrder(orderData) {
    const { data } = await this.client.post('/pedidos/compras', orderData);
    return data;
  }

  async getOrderById(orderId) {
    const { data } = await this.client.get(`/pedidos/compras/${orderId}`);
    return data;
  }

  // Financeiro
  async getAccounts() {
    const { data } = await this.client.get('/contas');
    return data;
  }

  async createTransaction(transactionData) {
    const { data } = await this.client.post('/lancamentos', transactionData);
    return data;
  }

  async getBalance() {
    const { data } = await this.client.get('/contas/saldos');
    return data;
  }
}

module.exports = BlingAdapter;
