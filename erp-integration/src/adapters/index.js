const adapters = {
  sap: () => new (require('./sap'))(),
  totvs: () => new (require('./totvs'))(),
  omie: () => new (require('./omie'))(),
  bling: () => new (require('./bling'))(),
};

function getAdapter() {
  const erp = (process.env.ACTIVE_ERP || 'omie').toLowerCase();
  const factory = adapters[erp];
  if (!factory) throw new Error(`ERP "${erp}" not supported. Options: ${Object.keys(adapters).join(', ')}`);
  return factory();
}

module.exports = { getAdapter };
