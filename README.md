# Almacén Express — Tienda online del supermercado

Tienda online hecha en **React + Vite + Tailwind**, con **Supabase** como base de datos
y pensada para desplegar en **Vercel**. Incluye catálogo por categorías, carrito de
compras, checkout con envío del pedido por WhatsApp, y guarda los pedidos en Supabase
para que puedas verlos y gestionarlos.

Como el negocio reparte con una moto propia, el checkout no calcula envíos por
distancia: usa un costo fijo de envío (o gratis a partir de un monto) que podés
ajustar fácilmente.

## 1. Instalación local

```bash
npm install
cp .env.example .env
```

Completá `.env` con los datos de tu proyecto de Supabase (ver paso 2). Si dejás el
`.env` vacío, la tienda igual funciona con un catálogo de ejemplo (`src/data/mockData.js`)
para que puedas ver el diseño sin conectar nada todavía.

```bash
npm run dev
```

Abrí `http://localhost:5173`.

## 2. Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Andá a **SQL Editor** → **New query**, pegá el contenido de `supabase/schema.sql`
   y ejecutalo. Esto crea las tablas `categories`, `products`, `orders`, `order_items`,
   configura los permisos (RLS) y carga algunos productos de ejemplo.
3. Andá a **Project Settings → API** y copiá:
   - `Project URL` → pegalo en `VITE_SUPABASE_URL`
   - `anon public key` → pegalo en `VITE_SUPABASE_ANON_KEY`
4. Cargá tu catálogo real: podés hacerlo a mano desde el **Table Editor** de Supabase,
   o importar un CSV con tus productos (Table Editor → products → Insert → Import data
   from CSV).

### Permisos (RLS)

Las políticas ya incluidas dejan:
- Cualquiera puede **leer** categorías y productos activos (para que la tienda cargue el catálogo).
- Cualquiera puede **crear** pedidos y sus ítems (para que el checkout funcione sin login).
- Nadie puede leer ni editar pedidos ajenos desde el navegador — para ver y actualizar
  pedidos usá el Table Editor de Supabase con tu usuario admin, o armá más adelante un
  panel interno con Supabase Auth.

## 3. Números y datos a personalizar

- `src/pages/Checkout.jsx` y `src/pages/Contact.jsx`: reemplazá `WHATSAPP_NUMBER`
  por el número real del negocio (formato `54911XXXXXXXX`, sin espacios ni el "+").
- `src/context/CartContext.jsx`: ajustá `FREE_SHIPPING_THRESHOLD` (monto para envío
  gratis) y `DELIVERY_FEE` (costo fijo del envío en moto) según tu negocio.
- `src/components/Header.jsx`: cambiá el nombre "Almacén Express" y la inicial del
  logo por el nombre real del negocio.

## 4. Deploy en Vercel

1. Subí este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. Framework preset: **Vite** (Vercel lo detecta solo).
4. En **Environment Variables** agregá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. El archivo `vercel.json` ya incluido asegura que las rutas de React Router
   (por ej. `/tienda`, `/producto/1`) funcionen bien al recargar la página.

## Estructura del proyecto

```
src/
  components/       Header, TopBar, Hero, ProductCard, CategoryChips, Footer, Benefits, StoreLayout
  components/admin/ AdminLayout, ProtectedRoute
  pages/            Home, Shop, ProductDetail, Cart, Checkout, Contact
  pages/admin/      Login, Dashboard, Orders, Products (panel del dueño)
  context/          CartContext (carrito con localStorage), AuthContext (sesión admin)
  lib/              supabaseClient.js, catalog.js (lee de Supabase o del mock)
  data/             mockData.js (catálogo de ejemplo)
supabase/
  schema.sql        Tablas, políticas RLS y datos de ejemplo
```

## 5. Integrar Mercado Pago

El checkout deja elegir entre **efectivo/transferencia** (se confirma por WhatsApp,
como antes) o **Mercado Pago** (Checkout Pro: el cliente paga con tarjeta, débito o
dinero en cuenta y vuelve a la tienda). El cobro se procesa con dos funciones
serverless en `/api`, así el access token nunca queda expuesto en el navegador.

### 6.1 Conseguir las credenciales

1. Entrá a [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel) con la cuenta del negocio.
2. Creá una aplicación (o usá una existente) y copiá el **Access Token**:
   - Usá las credenciales de **prueba** mientras testeás (podés pagar con
     [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards)).
   - Cuando esté todo probado, cambiá a las credenciales de **producción**.

### 6.2 Variables de entorno en Vercel

En **Project Settings → Environment Variables** de Vercel agregá (además de las de
Supabase del paso 4):

| Variable | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | Access token de Mercado Pago |
| `SUPABASE_URL` | La misma URL que `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase (Project Settings → API → `service_role`, **secreta**, nunca la pongas con prefijo `VITE_`) |

La service role key es necesaria porque las funciones de `/api` necesitan poder
actualizar el pedido (estado del pago) sin depender de que el usuario esté logueado.

### 6.3 Correr las columnas nuevas en Supabase

Si ya habías corrido `supabase/schema.sql` antes de esta integración, volvé a
abrir el archivo: al final tiene un bloque de migración (`alter table orders add
column if not exists ...`) que agrega `payment_status`, `mp_payment_id` y
`mp_preference_id` sin borrar nada. Ejecutalo una vez en el SQL Editor.

### 6.4 Cómo funciona el flujo

1. El cliente completa el checkout y elige "Mercado Pago".
2. Se guarda el pedido en Supabase con `payment_status = 'pendiente'`.
3. El frontend llama a `/api/create-preference`, que crea la preferencia de pago
   en Mercado Pago y devuelve la URL de pago (`init_point`).
4. El cliente paga en Mercado Pago y vuelve a `/pago-exitoso`, `/pago-fallido` o
   `/pago-pendiente` según el resultado.
5. En paralelo, Mercado Pago le avisa a `/api/mercadopago-webhook` el resultado
   real del pago (esto es lo confiable — las páginas de vuelta son solo para
   mostrarle algo al cliente). El webhook actualiza `payment_status` y guarda el
   `mp_payment_id` del pedido en Supabase.
6. Desde `/admin/pedidos` vas a poder ver el estado del pago de cada pedido.

### 6.5 Probar en local

Las funciones de `/api` no corren con `npm run dev` (eso solo levanta el
frontend). Para probarlas en tu máquina necesitás la CLI de Vercel:

```bash
npm install -g vercel
vercel dev
```

Como Mercado Pago necesita una URL pública para mandar el webhook, para probar el
webhook en local hace falta exponer tu `vercel dev` con algo como
[ngrok](https://ngrok.com) y configurar esa URL. Para probar el flujo de pago en
sí (sin depender del webhook), alcanza con tener el proyecto ya deployado en
Vercel con las variables de entorno cargadas.

## 6. Panel de administración

La tienda incluye un panel en `/admin` para que el dueño del negocio pueda:
- Ver un resumen (pedidos pendientes, ventas del día, productos con poco stock)
- Ver el listado de pedidos, abrir el detalle y cambiar el estado (pendiente → en
  camino → entregado, o cancelarlo)
- Agregar, editar, ocultar o eliminar productos del catálogo

### Crear el usuario del dueño

1. En Supabase, andá a **Authentication → Users → Add user**.
2. Cargá el email y una contraseña (podés tildar "Auto Confirm User" para no
   depender del mail de confirmación).
3. Entrá a `https://tu-tienda.vercel.app/admin` (o `localhost:5173/admin` en local)
   e iniciá sesión con ese usuario.

Por ahora cualquier usuario autenticado tiene acceso completo al panel — pensado
para que lo use el dueño o un encargado. Si en el futuro necesitás distinguir
roles (por ejemplo, que el repartidor solo vea pedidos y no pueda tocar precios),
se puede agregar una tabla `admin_users` con roles y ajustar las políticas RLS en
`supabase/schema.sql`.

También hay un enlace discreto "Acceso administrador" al pie de la tienda que
lleva directo a `/admin`.

## Próximos pasos sugeridos

- **Fotos reales de productos**: subilas a Supabase Storage y guardá la URL en la
  columna `image_url` de `products`; el componente `ProductCard` se puede adaptar
  fácilmente para mostrar `image_url` en vez del ícono.
- **Panel de administración**: una pantalla protegida con Supabase Auth para que
  el dueño actualice stock, precios y vea el estado de los pedidos.
- **Notificación al repartidor**: conectar el evento de "nuevo pedido" con
  Supabase Realtime o un webhook a WhatsApp Business para avisar automáticamente
  cuando entra un pedido nuevo.
"# tiendaExpress" 
