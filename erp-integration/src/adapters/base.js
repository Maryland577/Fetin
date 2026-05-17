// Interface base — todos os adaptadores devem implementar estes métodos
class BaseERPAdapter {
  // Estoque
  async getInventory() { throw new Error('Not implemented') }
  async updateStock(productId, quantity) { throw new Error('Not implemented') }

  // Compras
  async getOrders() { throw new Error('Not implemented') }
  async createOrder(orderData) { throw new Error('Not implemented') }
  async getOrderById(orderId) { throw new Error('Not implemented') }

  // Financeiro
  async getAccounts() { throw new Error('Not implemented') }
  async createTransaction(transactionData) { throw new Error('Not implemented') }
  async getBalance() { throw new Error('Not implemented') }
}

module.exports = BaseERPAdapter;
