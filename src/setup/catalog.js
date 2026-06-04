const data = require('../data/extensions.json');

function loadCatalog() {
  return data.categories;
}

function getToolsByCategories(categoryIds) {
  const categories = loadCatalog();
  const selected = categories.filter(cat => categoryIds.includes(cat.id));
  return selected.flatMap(cat => cat.tools);
}

module.exports = { loadCatalog, getToolsByCategories };
