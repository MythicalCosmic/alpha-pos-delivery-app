/* Catalog availability helpers kept separate from the Vue store so the stale
   cart/favorites rules can be exercised without a browser runtime. */

const idKey = (value) => String(value ?? "");

export function isFullCatalogQuery(query = {}) {
  return !query.category_id && !query.categoryId && !query.tag && !query.q;
}

export function reconcileCatalogAvailability(products, cart, favorites, productCache) {
  const liveById = new Map((products || []).map((product) => [idKey(product.id), product]));

  for (const line of cart || []) {
    const live = liveById.get(idKey(line.productId));
    line.unavailable = !live;
    if (line.snapshot) line.snapshot.available = !!live;
  }

  for (const favorite of favorites || []) {
    const live = liveById.get(idKey(favorite.id));
    favorite.available = !!live;
    if (live) {
      // Keep saved favorites current with live catalog text/price/art while
      // preserving the lightweight snapshot shape used by the screen.
      Object.assign(favorite, {
        names: live.names,
        name: live.name,
        price: live.price,
        kind: live.kind,
        hue: live.hue,
        image_url: live.image_url,
        tag: live.tag,
        kcal: live.kcal,
        categoryId: live.categoryId,
      });
    }
  }

  for (const key of Object.keys(productCache || {})) {
    if (!liveById.has(idKey(key))) delete productCache[key];
  }

  return {
    availableProductIds: [...liveById.keys()],
    unavailableCartCount: (cart || []).filter((line) => line.unavailable).length,
  };
}

export function productCanBeOrdered(product, availableProductIds, catalogReady) {
  if (!product || product.available === false) return false;
  if (!catalogReady) return true;
  const id = idKey(product.id);
  return (availableProductIds || []).some((candidate) => idKey(candidate) === id);
}

export function cartHasUnavailableItems(cart) {
  return (cart || []).some((line) => line.unavailable === true);
}
