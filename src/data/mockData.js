// Catálogo de ejemplo. Se usa como respaldo mientras conectás Supabase,
// o si las tablas todavía están vacías. La estructura coincide 1 a 1
// con las tablas `categories` y `products` del esquema SQL (ver supabase/schema.sql).

export const mockCategories = [
  { id: 'almacen', name: 'Almacén', icon: '🥫' },
  { id: 'frescos', name: 'Frutas y Verduras', icon: '🥬' },
  { id: 'lacteos', name: 'Lácteos', icon: '🧀' },
  { id: 'carnes', name: 'Carnicería', icon: '🥩' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'limpieza', name: 'Limpieza', icon: '🧴' },
  { id: 'perfumeria', name: 'Perfumería', icon: '🧼' },
  { id: 'congelados', name: 'Congelados', icon: '🧊' },
]

export const mockProducts = [
  { id: 1, name: 'Pan lactal integral 500g', category_id: 'almacen', price: 1890, unit: 'un', stock: 40, rating: 4.6, reviews: 58, icon: '🍞', badge: '2x1' },
  { id: 2, name: 'Arroz largo fino 1kg', category_id: 'almacen', price: 1450, unit: 'un', stock: 80, rating: 4.7, reviews: 112, icon: '🍚' },
  { id: 3, name: 'Aceite de girasol 1.5L', category_id: 'almacen', price: 3290, unit: 'un', stock: 35, rating: 4.5, reviews: 74, icon: '🫙' },
  { id: 4, name: 'Banana', category_id: 'frescos', price: 1690, unit: 'kg', stock: 60, rating: 4.4, reviews: 41, icon: '🍌' },
  { id: 5, name: 'Tomate redondo', category_id: 'frescos', price: 2190, unit: 'kg', stock: 45, rating: 4.3, reviews: 29, icon: '🍅' },
  { id: 6, name: 'Papa', category_id: 'frescos', price: 1290, unit: 'kg', stock: 90, rating: 4.5, reviews: 66, icon: '🥔' },
  { id: 7, name: 'Leche entera 1L', category_id: 'lacteos', price: 1190, unit: 'un', stock: 100, rating: 4.8, reviews: 203, icon: '🥛', badge: 'Oferta' },
  { id: 8, name: 'Queso cremoso 300g', category_id: 'lacteos', price: 3690, unit: 'un', stock: 25, rating: 4.6, reviews: 88, icon: '🧀' },
  { id: 9, name: 'Yogur bebible frutilla 1L', category_id: 'lacteos', price: 1990, unit: 'un', stock: 50, rating: 4.4, reviews: 37, icon: '🍶' },
  { id: 10, name: 'Milanesa de nalga x kg', category_id: 'carnes', price: 8990, unit: 'kg', stock: 20, rating: 4.7, reviews: 54, icon: '🥩' },
  { id: 11, name: 'Pollo entero', category_id: 'carnes', price: 4290, unit: 'kg', stock: 18, rating: 4.5, reviews: 33, icon: '🍗' },
  { id: 12, name: 'Agua mineral sin gas 2L', category_id: 'bebidas', price: 990, unit: 'un', stock: 120, rating: 4.6, reviews: 95, icon: '💧' },
  { id: 13, name: 'Gaseosa cola 2.25L', category_id: 'bebidas', price: 2390, unit: 'un', stock: 70, rating: 4.7, reviews: 141, icon: '🥤', badge: '2x1' },
  { id: 14, name: 'Cerveza rubia lata 473ml', category_id: 'bebidas', price: 1090, unit: 'un', stock: 90, rating: 4.5, reviews: 77, icon: '🍺' },
  { id: 15, name: 'Detergente concentrado 750ml', category_id: 'limpieza', price: 2490, unit: 'un', stock: 40, rating: 4.4, reviews: 22, icon: '🧴' },
  { id: 16, name: 'Papel higiénico x12', category_id: 'limpieza', price: 4990, unit: 'un', stock: 30, rating: 4.6, reviews: 61, icon: '🧻' },
  { id: 17, name: 'Shampoo 400ml', category_id: 'perfumeria', price: 3190, unit: 'un', stock: 28, rating: 4.5, reviews: 34, icon: '🧴' },
  { id: 18, name: 'Jabón de tocador x3', category_id: 'perfumeria', price: 1590, unit: 'un', stock: 55, rating: 4.3, reviews: 19, icon: '🧼' },
  { id: 19, name: 'Hamburguesas congeladas x4', category_id: 'congelados', price: 2890, unit: 'un', stock: 33, rating: 4.4, reviews: 27, icon: '🍔' },
  { id: 20, name: 'Papas fritas congeladas 1kg', category_id: 'congelados', price: 2190, unit: 'un', stock: 44, rating: 4.6, reviews: 48, icon: '🍟' },
]
