-- Esquema de base de datos para Almacén Express
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

-- 1) Categorías
create table if not exists categories (
  id text primary key,
  name text not null,
  icon text,
  created_at timestamptz default now()
);

-- 2) Productos
create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  category_id text references categories(id) on delete set null,
  price numeric(10,2) not null,
  unit text not null default 'un',        -- 'un', 'kg', 'lt', etc.
  stock integer not null default 0,
  icon text,                              -- emoji o url de imagen
  image_url text,                         -- si suben foto real a Supabase Storage
  badge text,                             -- ej: 'Oferta', '2x1'
  rating numeric(2,1) default 0,
  reviews integer default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active on products(active);

-- 3) Pedidos
create table if not exists orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  notes text,
  payment_method text not null default 'efectivo', -- efectivo | transferencia | mercadopago
  payment_status text not null default 'no_aplica', -- no_aplica | pendiente | aprobado | rechazado
  mp_payment_id text,
  mp_preference_id text,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pendiente', -- pendiente | en_camino | entregado | cancelado
  created_at timestamptz default now()
);

-- 4) Ítems de cada pedido
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(10,2) not null
);

-- =========================================================
-- Migración (solo si ya habías corrido este schema.sql antes de sumar
-- Mercado Pago): ejecutá este bloque una sola vez para agregar las
-- columnas nuevas sin perder los datos existentes. Si es un proyecto
-- nuevo, no hace falta: el create table de arriba ya las incluye.
-- =========================================================
alter table orders add column if not exists payment_status text not null default 'no_aplica';
alter table orders add column if not exists mp_payment_id text;
alter table orders add column if not exists mp_preference_id text;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Lectura pública de catálogo (categorías y productos activos)
create policy "Categorías visibles para todos"
  on categories for select
  using (true);

create policy "Productos activos visibles para todos"
  on products for select
  using (active = true);

-- Cualquiera puede crear un pedido (checkout público, sin login)
create policy "Cualquiera puede crear pedidos"
  on orders for insert
  with check (true);

create policy "Cualquiera puede agregar items a un pedido"
  on order_items for insert
  with check (true);

-- =========================================================
-- Panel de administración (usuarios autenticados con Supabase Auth)
-- =========================================================
-- Cualquier usuario logueado (creado en Authentication > Users) puede
-- gestionar catálogo y pedidos desde /admin. Si más adelante necesitás
-- roles distintos (ej. repartidor vs. dueño), se puede refinar agregando
-- una tabla `admin_users` y chequeando pertenencia en estas policies.

create policy "Admins pueden gestionar categorías"
  on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admins pueden gestionar productos"
  on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admins pueden ver y actualizar pedidos"
  on orders for select
  using (auth.role() = 'authenticated');

create policy "Admins pueden actualizar pedidos"
  on orders for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admins pueden ver items de pedidos"
  on order_items for select
  using (auth.role() = 'authenticated');

-- =========================================================
-- Datos de ejemplo (opcional, podés borrar esta sección)
-- =========================================================
insert into categories (id, name, icon) values
  ('almacen', 'Almacén', '🥫'),
  ('frescos', 'Frutas y Verduras', '🥬'),
  ('lacteos', 'Lácteos', '🧀'),
  ('carnes', 'Carnicería', '🥩'),
  ('bebidas', 'Bebidas', '🥤'),
  ('limpieza', 'Limpieza', '🧴'),
  ('perfumeria', 'Perfumería', '🧼'),
  ('congelados', 'Congelados', '🧊')
on conflict (id) do nothing;

insert into products (name, category_id, price, unit, stock, icon, badge, rating, reviews) values
  ('Pan lactal integral 500g', 'almacen', 1890, 'un', 40, '🍞', '2x1', 4.6, 58),
  ('Arroz largo fino 1kg', 'almacen', 1450, 'un', 80, '🍚', null, 4.7, 112),
  ('Leche entera 1L', 'lacteos', 1190, 'un', 100, '🥛', 'Oferta', 4.8, 203),
  ('Banana', 'frescos', 1690, 'kg', 60, '🍌', null, 4.4, 41),
  ('Agua mineral sin gas 2L', 'bebidas', 990, 'un', 120, '💧', null, 4.6, 95),
  ('Papel higiénico x12', 'limpieza', 4990, 'un', 30, '🧻', null, 4.6, 61)
on conflict do nothing;
