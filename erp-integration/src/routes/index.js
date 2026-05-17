const { Router } = require('express');
const { getAdapter } = require('../adapters');

const router = Router();

// Estoque
router.get('/inventory', async (req, res, next) => {
  try { res.json(await getAdapter().getInventory()); } catch (e) { next(e); }
});

router.patch('/inventory/:productId', async (req, res, next) => {
  try { res.json(await getAdapter().updateStock(req.params.productId, req.body.quantity)); } catch (e) { next(e); }
});

// Compras
router.get('/orders', async (req, res, next) => {
  try { res.json(await getAdapter().getOrders()); } catch (e) { next(e); }
});

router.get('/orders/:id', async (req, res, next) => {
  try { res.json(await getAdapter().getOrderById(req.params.id)); } catch (e) { next(e); }
});

router.post('/orders', async (req, res, next) => {
  try { res.status(201).json(await getAdapter().createOrder(req.body)); } catch (e) { next(e); }
});

// Financeiro
router.get('/finance/accounts', async (req, res, next) => {
  try { res.json(await getAdapter().getAccounts()); } catch (e) { next(e); }
});

router.get('/finance/balance', async (req, res, next) => {
  try { res.json(await getAdapter().getBalance()); } catch (e) { next(e); }
});

router.post('/finance/transactions', async (req, res, next) => {
  try { res.status(201).json(await getAdapter().createTransaction(req.body)); } catch (e) { next(e); }
});

module.exports = router;
