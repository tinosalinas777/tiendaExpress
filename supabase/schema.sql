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

-- 5) Lista blanca de administradores
-- No cualquier usuario logueado debe poder administrar el negocio: solo los
-- que están en esta tabla. Ver el paso "Alta del administrador" en el README.
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 6) Reseñas de productos (calificación real de clientes)
create table if not exists product_reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_reviews_product on product_reviews(product_id);

-- 7) Suscripción de esta tienda (servicio pago mensual al desarrollador)
-- Fila única (singleton, siempre id=1): esta instalación es de UNA sola
-- tienda, así que alcanza con una fila que representa "el estado de pago
-- de este cliente". Si replicás el proyecto para otro cliente, esta misma
-- tabla se crea de cero en SU proyecto de Supabase — no se comparte entre
-- tiendas (ver checklist-replicar-tienda.pdf, cada tienda es independiente).
create table if not exists subscription (
  id int primary key default 1,
  plan_name text not null default 'Plan mensual',
  price numeric(10,2) not null default 15000,
  status text not null default 'activa', -- activa | pendiente_verificacion
  current_period_end date not null default (current_date + interval '30 days'),
  payment_method text, -- mercadopago | transferencia
  mp_payment_id text,
  mp_preference_id text,
  last_payment_at timestamptz,
  updated_at timestamptz default now(),
  constraint subscription_singleton check (id = 1)
);

insert into subscription (id) values (1) on conflict (id) do nothing;

-- Función auxiliar que usan las políticas de abajo para saber si hay que
-- bloquear la edición del catálogo. "stable" (no "immutable") porque
-- depende de current_date, que cambia día a día.
create or replace function is_subscription_active()
returns boolean
language sql
stable
as $$
  select coalesce((select current_period_end >= current_date from subscription where id = 1), true);
$$;

-- =========================================================
-- Migración (solo si ya habías corrido este schema.sql antes): estos
-- comandos son seguros de re-ejecutar, no pisan datos existentes.
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
alter table admin_users enable row level security;

-- Si ya habías corrido una versión anterior de este script, esto limpia
-- las políticas viejas (incluida la insegura "cualquiera puede insertar
-- pedidos") para reemplazarlas por las de abajo. Es seguro re-ejecutar
-- todo este archivo las veces que haga falta.
drop policy if exists "Cualquiera puede crear pedidos" on orders;
drop policy if exists "Cualquiera puede agregar items a un pedido" on order_items;
drop policy if exists "Admins pueden gestionar categorías" on categories;
drop policy if exists "Admins pueden gestionar productos" on products;
drop policy if exists "Admins pueden ver y actualizar pedidos" on orders;
drop policy if exists "Admins pueden ver pedidos" on orders;
drop policy if exists "Admins pueden actualizar pedidos" on orders;
drop policy if exists "Admins pueden ver items de pedidos" on order_items;
drop policy if exists "Categorías visibles para todos" on categories;
drop policy if exists "Productos activos visibles para todos" on products;
drop policy if exists "Un usuario puede ver su propio registro en admin_users" on admin_users;

-- Lectura pública de catálogo (categorías y productos activos)
create policy "Categorías visibles para todos"
  on categories for select
  using (true);

create policy "Productos activos visibles para todos"
  on products for select
  using (active = true);

-- admin_users: un usuario solo puede ver si SU PROPIO id está en la lista
-- (no puede ver quiénes son los demás admins). Esta policy es necesaria:
-- sin ella, las políticas de products/orders de abajo (que hacen "exists
-- (select 1 from admin_users ...)") siempre dan falso para todos, porque
-- esa sub-consulta también queda sujeta a RLS de admin_users. Es un caso
-- fácil de pasar por alto — si en algún momento el panel te tira "row-level
-- security policy" al crear/editar/borrar algo estando ya logueado como
-- admin, revisá primero que esta policy exista.
create policy "Un usuario puede ver su propio registro en admin_users"
  on admin_users for select
  using (auth.uid() = user_id);

-- IMPORTANTE: a propósito NO hay policy de INSERT pública en `orders` ni
-- en `order_items`. El checkout ya no inserta filas directamente: llama a
-- la función `create_order` de más abajo, que calcula los precios del
-- lado del servidor (ver sección "Función create_order").

-- =========================================================
-- Panel de administración (solo usuarios en la tabla admin_users)
-- =========================================================
-- A diferencia de "cualquier usuario logueado", esto exige que el usuario
-- además esté dado de alta a mano en `admin_users` (ver README, sección
-- "Alta del administrador"). Así, si alguna vez queda habilitado el
-- registro público en Supabase Auth, un usuario nuevo NO consigue acceso
-- de administrador solo por crear una cuenta.

create policy "Admins pueden gestionar categorías"
  on categories for all
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- Los productos son distintos: el bloqueo por suscripción vencida tiene que
-- ser real, no solo un botón deshabilitado en la interfaz — si no, alguien
-- con conocimientos técnicos podría saltearlo llamando a Supabase directo
-- desde la consola del navegador. Por eso separamos SELECT (siempre
-- permitido, así el panel puede seguir mostrando la lista) de
-- INSERT/UPDATE/DELETE (solo si is_subscription_active() da true).
drop policy if exists "Admins pueden gestionar productos" on products;
drop policy if exists "Admins pueden ver productos (panel)" on products;
drop policy if exists "Admins pueden crear productos si está al día" on products;
drop policy if exists "Admins pueden editar productos si está al día" on products;
drop policy if exists "Admins pueden eliminar productos si está al día" on products;

create policy "Admins pueden ver productos (panel)"
  on products for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden crear productos si está al día"
  on products for insert
  with check (
    exists (select 1 from admin_users a where a.user_id = auth.uid())
    and is_subscription_active()
  );

create policy "Admins pueden editar productos si está al día"
  on products for update
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()))
  with check (
    exists (select 1 from admin_users a where a.user_id = auth.uid())
    and is_subscription_active()
  );

create policy "Admins pueden eliminar productos si está al día"
  on products for delete
  using (
    exists (select 1 from admin_users a where a.user_id = auth.uid())
    and is_subscription_active()
  );

create policy "Admins pueden ver pedidos"
  on orders for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden actualizar pedidos"
  on orders for update
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden ver items de pedidos"
  on order_items for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- =========================================================
-- Suscripción: solo lectura para admins, nunca escritura directa
-- =========================================================
-- A propósito NO hay policy de UPDATE pública en `subscription`. Si la
-- hubiera, el propio dueño de la tienda podría "aprobarse" su pago editando
-- el estado desde el navegador. Los únicos que pueden cambiar el estado a
-- "activa" son: (a) el webhook de Mercado Pago (usa la service role key,
-- que se salta RLS), o (b) vos a mano desde el SQL Editor cuando confirmás
-- una transferencia. Lo único que el propio admin puede hacer por su cuenta
-- es avisar "ya transferí" (ver función request_subscription_verification).
alter table subscription enable row level security;

drop policy if exists "Admins pueden ver el estado de la suscripción" on subscription;
create policy "Admins pueden ver el estado de la suscripción"
  on subscription for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create or replace function request_subscription_verification(p_payment_method text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admin_users where user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_payment_method not in ('mercadopago', 'transferencia') then
    raise exception 'Método de pago inválido';
  end if;

  update subscription
    set status = 'pendiente_verificacion',
        payment_method = p_payment_method,
        updated_at = now()
    where id = 1;
end;
$$;

grant execute on function request_subscription_verification(text) to authenticated;

-- =========================================================
-- Función create_order: el checkout llama a esta función en vez de
-- insertar directamente. Recalcula los precios leyendo la tabla
-- `products` (nunca confía en lo que mande el navegador), así nadie
-- puede pagar un pedido a un precio inventado.
-- =========================================================
create or replace function create_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb  -- [{"product_id": 1, "quantity": 2}, ...]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product products%rowtype;
  v_qty integer;
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_order_id bigint;
  -- Mismas reglas de envío que en el frontend (CartContext), pero acá
  -- son la fuente de verdad real: si las cambiás, cambialas en los dos
  -- lugares para que la UI muestre lo mismo que se termina cobrando.
  v_free_shipping_threshold numeric(10,2) := 15000;
  v_delivery_fee numeric(10,2) := 1200;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  if p_payment_method not in ('efectivo', 'transferencia', 'mercadopago') then
    raise exception 'Método de pago inválido';
  end if;

  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = ''
     or coalesce(trim(p_delivery_address), '') = '' then
    raise exception 'Faltan datos del cliente';
  end if;

  insert into orders (
    customer_name, customer_phone, delivery_address, notes, payment_method,
    subtotal, shipping, total, status, payment_status
  )
  values (
    p_customer_name, p_customer_phone, p_delivery_address, p_notes, p_payment_method,
    0, 0, 0, 'pendiente',
    case when p_payment_method = 'mercadopago' then 'pendiente' else 'no_aplica' end
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 or v_qty > 100 then
      raise exception 'Cantidad inválida para un producto';
    end if;

    select * into v_product from products
      where id = (v_item->>'product_id')::bigint and active = true;

    if not found then
      raise exception 'Un producto del pedido ya no está disponible';
    end if;

    insert into order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_qty, v_product.price);

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  v_shipping := case when v_subtotal >= v_free_shipping_threshold then 0 else v_delivery_fee end;
  v_total := v_subtotal + v_shipping;

  update orders set subtotal = v_subtotal, shipping = v_shipping, total = v_total
    where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_total
  );
end;
$$;

-- El público (anon) y usuarios logueados pueden ejecutar la función, pero
-- NO pueden insertar directamente en las tablas (no hay policy de insert
-- para ellos). security definer hace que la función corra con permisos
-- para escribir igual, ya validados los datos adentro.
grant execute on function create_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- =========================================================
-- Storage: fotos de productos
-- Bucket público de solo-lectura (cualquiera puede VER las fotos, como
-- corresponde a una tienda), pero solo los admins pueden subir/borrar.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Fotos de productos son públicas" on storage.objects;
drop policy if exists "Admins pueden subir fotos de productos" on storage.objects;
drop policy if exists "Admins pueden actualizar fotos de productos" on storage.objects;
drop policy if exists "Admins pueden borrar fotos de productos" on storage.objects;

create policy "Fotos de productos son públicas"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins pueden subir fotos de productos"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

create policy "Admins pueden actualizar fotos de productos"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

create policy "Admins pueden borrar fotos de productos"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

-- =========================================================
-- Reseñas de productos
-- =========================================================
alter table product_reviews enable row level security;

drop policy if exists "Reseñas visibles para todos" on product_reviews;
drop policy if exists "Cualquiera puede dejar una reseña" on product_reviews;
drop policy if exists "Admins pueden borrar reseñas" on product_reviews;

-- Cualquiera puede leer las reseñas (se muestran en la página del producto).
create policy "Reseñas visibles para todos"
  on product_reviews for select
  using (true);

-- Cualquiera puede dejar una reseña (no exigimos login para no complicar
-- la compra), pero validamos que traiga nombre y que el comentario no sea
-- gigante. No hay policy de update/delete pública: una vez publicada, un
-- cliente no puede editar ni borrar reseñas ajenas ni propias.
create policy "Cualquiera puede dejar una reseña"
  on product_reviews for insert
  with check (
    char_length(trim(customer_name)) > 0
    and char_length(coalesce(comment, '')) <= 500
  );

-- Los admins sí pueden borrar una reseña (por ejemplo, si es spam o
-- contenido inapropiado) desde el SQL Editor o, más adelante, desde un
-- panel de moderación.
create policy "Admins pueden borrar reseñas"
  on product_reviews for delete
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- Trigger: cada vez que se agrega, edita o borra una reseña, recalculamos
-- el promedio (`rating`) y el total (`reviews`) del producto. Así el
-- listado de la tienda (que lee esas dos columnas directo de `products`
-- para no tener que sumar reseñas en cada carga) siempre está al día.
create or replace function update_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id bigint;
begin
  v_product_id := coalesce(new.product_id, old.product_id);

  update products
    set rating = coalesce(
          (select round(avg(rating)::numeric, 1) from product_reviews where product_id = v_product_id),
          0
        ),
        reviews = (select count(*) from product_reviews where product_id = v_product_id)
    where id = v_product_id;

  return null;
end;
$$;

drop trigger if exists trg_update_product_rating on product_reviews;
create trigger trg_update_product_rating
  after insert or update or delete on product_reviews
  for each row execute function update_product_rating();

-- =========================================================
-- Datos de ejemplo (opcional, podés borrar esta sección)
-- Están armados para no duplicarse si volvés a correr este script.
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

insert into products (name, category_id, price, unit, stock, icon, badge, rating, reviews)
select * from (values
  ('Pan lactal integral 500g', 'almacen', 1890, 'un', 40, '🍞', '2x1', 4.6, 58),
  ('Arroz largo fino 1kg', 'almacen', 1450, 'un', 80, '🍚', null, 4.7, 112),
  ('Leche entera 1L', 'lacteos', 1190, 'un', 100, '🥛', 'Oferta', 4.8, 203),
  ('Banana', 'frescos', 1690, 'kg', 60, '🍌', null, 4.4, 41),
  ('Agua mineral sin gas 2L', 'bebidas', 990, 'un', 120, '💧', null, 4.6, 95),
  ('Papel higiénico x12', 'limpieza', 4990, 'un', 30, '🧻', null, 4.6, 61)
) as seed(name, category_id, price, unit, stock, icon, badge, rating, reviews)
where not exists (
  select 1 from products p where p.name = seed.name
);
