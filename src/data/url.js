// Base-aware internal link: u('brands/staron') -> /staron-egypt/brands/staron/
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (path = '', suffix = '') => `${base}/${path.replace(/^\/|\/$/g, '')}${path ? '/' : ''}${suffix}`;
export const asset = (p) => `${base}/${p.replace(/^\//, '')}`;
export const routes = {
  material: (s) => u(`materials/${s}`),
  brand: (s) => u(`brands/${s}`),
  product: (p) => u(`brands/${p.brand}/${p.slug}`),
  colors: (p) => u(`brands/${p.brand}/${p.slug}/colors`),
  sector: (s) => u(`solutions/sectors/${s}`),
  space: (s) => u(`solutions/spaces/${s}`),
  application: (s) => u(`solutions/applications/${s}`),
  post: (s) => u(`blog/${s}`),
};
