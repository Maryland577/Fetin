const axios = require('axios');
const BaseERPAdapter = require('./base');

class SAPAdapter extends BaseERPAdapter {
  constructor() {
    super();
    this.client = axios.create({ baseURL: process.env.SAP_BASE_URL });
    this.token = null;
  }

  async authenticate() {
    if (this.token) return;
    const { data } = await this.client.post('/oauth/token', {
      grant_type: 'client_credentials',
      client_id: process.env.SAP_CLIENT_ID,
      client_secret: process.env.SAP_CLIENT_SECRET,
    });
    this.token = data.access_token;
    this.client.defaults.headers.Authorization = `Bearer ${this.token}`;
  }

  // Estoque
  async getInventory() {
    await this.authenticate();
    const { data } = await this.client.get('/MaterialStock');
    return data;
  }

  async updateStock(productId, quantity) {
    await this.authenticate();
    const { data } = await this.client.patch(`/MaterialStock('${productId}')`, { Quantity: quantity });
    return data;
  }

  // Compras
  async getOrders() {
    await this.authenticate();
    const { data } = await this.client.get('/PurchaseOrder');
    return data;
  }

  async createOrder(orderData) {
    await this.authenticate();
    const { data } = await this.client.post('/PurchaseOrder', orderData);
    return data;
  }

  async getOrderById(orderId) {
    await this.authenticate();
    const { data } = await this.client.get(`/PurchaseOrder('${orderId}')`);
    return data;
  }

  // Financeiro
  async getAccounts() {
    await this.authenticate();
    const { data } = await this.client.get('/GLAccount');
    return data;
  }

  async createTransaction(transactionData) {
    await this.authenticate();
    const { data } = await this.client.post('/JournalEntry', transactionData);
    return data;
  }

  async getBalance() {
    await this.authenticate();
    const { data } = await this.client.get('/GLAccountBalance');
    return data;
  }
}

module.exports = SAPAdapter;
