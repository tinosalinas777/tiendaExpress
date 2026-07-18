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

## 5. Seguridad — pasos obligatorios

Este proyecto pasó por una auditoría de seguridad. El código ya tiene los arreglos
(los precios se calculan en el servidor, no en el navegador), pero hay **tres pasos
manuales que tenés que hacer vos** en el panel de Supabase para que la protección
quede completa:

### 6.1 Correr el `schema.sql` actualizado

Si ya habías corrido una versión anterior de `supabase/schema.sql`, volvé a
ejecutar el archivo completo en el SQL Editor. Es seguro: borra y vuelve a crear
solo las *políticas* (no toca tus datos), y agrega la función `create_order` que
ahora calcula los precios del lado del servidor en vez de confiar en lo que
mande el navegador.

### 6.2 Dar de alta al administrador en `admin_users`

Antes, cualquier usuario logueado tenía acceso total al panel `/admin`. Ahora
además de crear el usuario en **Authentication → Users**, tenés que agregarlo a
la lista blanca:

1. Copiá el UUID del usuario desde Authentication → Users (columna "UID").
2. En el SQL Editor, corré:
   ```sql
   insert into admin_users (user_id) values ('PEGÁ-EL-UUID-ACÁ');
   ```
Sin este paso, ese usuario puede loguearse pero no va a poder ver ni editar
nada en `/admin` (las políticas RLS lo bloquean).

### 6.3 Desactivar el alta pública de usuarios

Por las dudas — aunque ya no depende de esto para la seguridad del panel — andá a
**Authentication → Providers → Email** y desactivá "Allow new users to sign up".
Así nadie puede crearse una cuenta por su cuenta desde la API pública.

### 6.4 Configurar el secreto del webhook de Mercado Pago (opcional pero recomendado)

En el panel de Mercado Pago Developers → tu aplicación → Webhooks, copiá la
"Clave secreta" y cargala como `MP_WEBHOOK_SECRET` en las variables de entorno
de Vercel. Con eso, `/api/mercadopago-webhook` verifica que la notificación
realmente vino de Mercado Pago antes de procesarla. Si no la configurás, el
webhook igual funciona (vuelve a consultar el pago a la API de Mercado Pago
antes de confiar en cualquier dato), pero queda un poco más expuesto a
notificaciones falsas que sólo generan trabajo de más al servidor.

### Qué cambió por dentro (para referencia)

- El checkout ya no hace `insert` directo en `orders`/`order_items` desde el
  navegador. Llama a una función de Supabase (`create_order`) que recibe
  únicamente `product_id` + cantidad, busca el precio real en la tabla
  `products` y calcula ella misma el subtotal/envío/total. Así nadie puede
  pagar un pedido a un precio inventado editando el carrito en el navegador.
- Las políticas de administrador ahora chequean pertenencia a la tabla
  `admin_users`, no solo "está logueado".
- El webhook de Mercado Pago valida la firma de la notificación (si
  configuraste `MP_WEBHOOK_SECRET`) y compara el monto pagado contra el total
  del pedido antes de marcarlo como aprobado.

## 6. Fotos de productos

Desde `/admin/productos` podés subir una foto real para cada producto (además
del emoji, que queda como respaldo si el producto no tiene foto todavía). Las
imágenes se guardan en **Supabase Storage**, en un bucket público de solo
lectura llamado `product-images`.

Ese bucket y sus permisos ya se crean solos al correr `supabase/schema.sql`
(sección "Storage: fotos de productos"). Si por algún motivo no se creó
(por ejemplo, corriste una versión vieja del script), podés armarlo a mano:

1. **Storage** → **New bucket** → nombre `product-images`, marcalo como **Public**.
2. Volvé a correr `supabase/schema.sql` completo para que se apliquen las
   políticas (solo los admins pueden subir/borrar, cualquiera puede ver).

Formatos aceptados: jpg, jfif, png, webp, heic y otros formatos de imagen
comunes. Tamaño máximo del archivo original: 8MB.

**Optimización automática:** antes de subir la foto, el navegador la
redimensiona (máximo 1400x1400px) y la convierte a WebP con calidad 82%
—así una foto de varios MB sacada con el celular termina pesando algunos
cientos de KB, sin que tengas que convertir nada a mano. Si el navegador
no soporta WebP, se guarda como JPEG optimizado igual. Se puede ajustar
tocando las constantes `MAX_WIDTH`, `MAX_HEIGHT` y `WEBP_QUALITY` en
`src/pages/admin/Products.jsx`.

## 7. Integrar Mercado Pago

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
| `MP_WEBHOOK_SECRET` | Clave secreta de webhooks de Mercado Pago (ver sección 5.4) |
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

## 8. Panel de administración

La tienda incluye un panel en `/admin` para que el dueño del negocio pueda:
- Ver un resumen (pedidos pendientes, ventas del día, productos con poco stock)
- Ver el listado de pedidos, abrir el detalle y cambiar el estado (pendiente → en
  camino → entregado, o cancelarlo)
- Agregar, editar, ocultar o eliminar productos del catálogo

### Crear el usuario del dueño

1. En Supabase, andá a **Authentication → Users → Add user**.
2. Cargá el email y una contraseña (podés tildar "Auto Confirm User" para no
   depender del mail de confirmación).
3. Copiá el UUID de ese usuario y agregalo a la tabla `admin_users` (ver
   sección 5.2 más arriba) — sin este paso el login funciona pero el panel no
   deja ver ni editar nada.
4. Entrá a `https://tu-tienda.vercel.app/admin` (o `localhost:5173/admin` en local)
   e iniciá sesión con ese usuario.

Solo los usuarios dados de alta en `admin_users` tienen acceso al panel — no
alcanza con estar logueado. Si necesitás sumar un encargado más adelante,
repetís el mismo paso 3 con su UUID.

También hay un enlace discreto "Acceso administrador" al pie de la tienda que
lleva directo a `/admin`.

## Próximos pasos sugeridos

- **Panel de administración**: una pantalla protegida con Supabase Auth para que
  el dueño actualice stock, precios y vea el estado de los pedidos.
- **Notificación al repartidor**: conectar el evento de "nuevo pedido" con
  Supabase Realtime o un webhook a WhatsApp Business para avisar automáticamente
  cuando entra un pedido nuevo.
