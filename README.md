# Toxic Nature

Aplicación web basada en Angular (frontend) con integración para un backend (Java/Gradle o cualquier API REST) orientada a la gestión de catálogos, catálogo de productos, ventas y administración.

## Resumen del proyecto
Toxic Nature es la capa frontend de una tienda/catálogo digital que incluye:
- Visualización de catálogos y PDFs por secciones.
- Catálogo de productos con descuentos y relaciones por categorías.
- Carrito de compra, proceso de pago y creación/gestión de órdenes.
- Panel de administración (admin) para gestionar productos, categorías, descuentos, catálogos, pedidos y usuarios.
- Servicios para autenticación, permisos y consumo de una API REST.

El frontend está desarrollado con Angular (TypeScript) y pensado para integrarse con un backend en Java/Gradle (presente en el repo en la carpeta `android/` y otras), o con cualquier API que exponga los endpoints listados abajo.

## Características principales
- Listado y detalle de productos.
- Gestión de catálogos (PDFs) por sección.
- Carrito de compras persistente (localStorage / backend según configuración).
- Checkout y creación de órdenes (soporta integración con pasarelas de pago desde `payment.service.ts`).
- Panel de administración con roles (al menos `admin` y `user`): gestión de productos, categorías, descuentos, catálogos y órdenes.
- Sistema de autenticación con token (interceptor `auth.interceptor.ts`).
- Notificaciones y diálogos reutilizables (componentes en `shared/components` y `shared/success-dialog`).

## Estructura principal (resumen)
- `package.json` — dependencias y scripts.
- `angular.json`, `tsconfig*.json` — configuración Angular/TypeScript.
- `src/app/` — código de la aplicación:
  - `auth/` — login, registro, manejo de contraseñas y guardas (`auth.guard.ts`).
  - `services/` — servicios HTTP (producto, carrito, órdenes, pagos, descuento, auth, etc.).
  - `models/` — modelos TypeScript que representan entidades (producto, orden, usuario...).
  - `pages/` — vistas públicas, panel admin y páginas del flujo de compra.
  - `shared/` — componentes reutilizables y módulos compartidos.
- `src/assets/` — imágenes, videos y recursos estáticos.
- `environments/` — configuración por entorno (API base, claves de terceros).

## Sistema de ventas (flujo)
1. Usuario navega el catálogo o busca productos.
2. Añade productos al carrito (`car.service.ts`).
3. Desde el carrito, inicia checkout: dirección, método de envío (si aplica) y método de pago.
4. `payment.service.ts` gestiona la integración con la pasarela (puede ser redirección a un gateway o integración directa con token).
5. Al confirmar, se crea una orden (`orderservice.service.ts` / `adminorder.service.ts`) con estado inicial `CREATED` o `PENDING_PAYMENT`.
6. Webhook o confirmación de pago actualiza el estado de la orden (`PAID`, `FAILED`).
7. En el panel admin, se puede: ver órdenes, cambiar estado (`PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), y emitir reembolsos según integración de pago.

Estados típicos de orden: `CREATED` -> `PENDING_PAYMENT` -> `PAID` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED` (o `CANCELLED` / `REFUNDED`).

## Panel de administración (admin)
El panel de administrador permite:
- Autenticación / autorización con roles.
- Gestión de productos: crear/editar/eliminar, imágenes y atributos.
- Gestión de categorías y asignación de productos.
- Gestión de catálogos (uploads de PDFs, asociación por sección/colección).
- Gestión de descuentos por producto o categoría (`CategoryDiscountRequest.model.ts`, `ProductDiscountRequest.model.ts`).
- Gestión de órdenes: filtrado por estado, búsqueda por usuario/ID, detalle y actualización de estado.
- Gestión de usuarios: ver, editar perfil, cambiar roles y estado.
- Panel de analytics básico (número de órdenes, ventas por periodo) — puede ser extendido según backend.

Rutas de ejemplo (frontend):
- `/admin/products` — listado productos.
- `/admin/orders` — listado y detalle de órdenes.
- `/admin/catalogs` — manejo de PDFs y secciones.
- `/admin/users` — gestión de usuarios y roles.

## Modelos y entidades (resumen)
Los archivos en `src/app/models/` reflejan las entidades esperadas:
- `product.model.ts` — id, nombre, descripción, precio, imágenes, stock, categorías.
- `orderitem.model.ts` — producto, cantidad, precio unitario.
- `savecart.model.ts` — representación persistente del carrito.
- `user.model.ts` / `login.model.ts` / `loginResponse.model.ts` — autenticación y perfil.
- `catalog.model.ts` / `caritem.model.ts` — catálogos y relaciones.
- `CategoryDiscountRequest.model.ts` / `ProductDiscountRequest.model.ts` — peticiones para aplicar descuentos.

Asegúrate de alinear el backend con estas formas para evitar mapeos manuales.

## Endpoints esperados (ejemplos)
Nota: los nombres y rutas pueden variar; adapta según tu backend real.
- GET /api/products
- GET /api/products/:id
- POST /api/auth/login
- POST /api/auth/register
- GET /api/catalogs
- POST /api/cart
- GET /api/orders/:id
- POST /api/orders
- POST /api/payments/authorize
- GET /api/admin/orders
- POST /api/admin/products

## Variables de entorno (ejemplos)
- `environment.ts` / `environment.prod.ts` deben contener al menos:
  - apiBaseUrl: URL base de la API
  - paymentGatewayKey: clave pública para la pasarela (si aplica)
  - other feature flags

## Cómo ejecutar en desarrollo
1. Instalar dependencias:

```bash
npm install
```

2. Levantar frontend (dev server):

```bash
ng serve --open
```

3. Si tienes backend local, ejecútalo y asegúrate que `apiBaseUrl` apunte a su URL. Para Java/Gradle:

```bash
cd android && gradlew bootRun
```

Nota: en Windows usa `gradlew.bat` si lo necesitas.

## Build y despliegue
- Build producción frontend:

```bash
ng build --configuration production
```

- Backend Java/Gradle (si aplica):

```bash
cd android && gradlew build
```

Artefactos frontend se generarán en `dist/`.

## Tests
- Tests unitarios frontend (Karma/Jasmine):

```bash
ng test
```

- Tests e2e (si están configurados):

```bash
ng e2e
```

- Tests backend (si existe proyecto Java):

```bash
cd android && gradlew test
```

## Buenas prácticas y recomendaciones técnicas
- Evita forzar tipos con `as any` en templates; usa el operador seguro `?.` y comprobaciones con `*ngIf` para prevenir errores de referencia nula.
  - Ejemplo correcto en plantilla:

```html
<small *ngIf="section?.catalog_pdf">catalog_pdf: {{ (section.catalog_pdf | slice:0:24) + '...' }}</small>
```

- Centraliza las llamadas HTTP en servicios y maneja errores globalmente con interceptores (`auth.interceptor.ts`).
- Mantén DTOs/Modelos sincronizados con el backend para minimizar conversiones.
- Guarda el carrito en `localStorage` y sincroniza con backend al iniciar sesión para persistencia multi-dispositivo.
- Implementa paginación y filtros en endpoints que retornan grandes listados (productos, órdenes).

## Troubleshooting (problemas comunes)
- "No hay catálogos disponibles":
  - Verifica la respuesta de la API con las herramientas de red del navegador (Network).
  - Comprueba que `catalog_pdf` exista y sea una URL o nombre esperado.
  - Revisa CORS y permisos de acceso al recurso (si los PDFs están en otro dominio).
- Errores en templates por propiedades nulas: añadir `?` seguro y `*ngIf`.
- Problemas de autenticación: asegúrate que `auth.interceptor.ts` adjunte correctamente el token y que el backend valide rutas de `admin`.

## Extensiones recomendadas
- Integrar una pasarela de pago (Stripe, PayPal, MercadoPago) con webhooks para confirmar pagos.
- Panel de analytics con gráficas (ventas por día, productos más vendidos).
- Soporte multi-idioma (i18n) si necesitas internacionalizar.
- Tests E2E con Playwright o Cypress para flujos críticos (checkout, login, admin).

## Contribución
- Fork y pull requests bien documentadas.
- Mantener estilo de código del repo y añadir tests para nuevas funcionalidades.

## Licencia y contacto
Añadir licencia y contacto del equipo aquí (email, slack o enlace al repositorio principal).

## Contrato API — ejemplos JSON
A continuación hay ejemplos de payloads y respuestas esperadas por los endpoints más críticos. Ajusta nombres de campos según tu backend real.

- Autenticación (login)
  - Request (POST /api/auth/login)

```json
{
  "username": "usuario@example.com",
  "password": "MiPassword123"
}
```

  - Response (200 OK)

```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 123,
    "email": "usuario@example.com",
    "roles": ["user"]
  }
}
```

- Listado de productos (GET /api/products)
  - Response (200 OK)

```json
[
  {
    "id": 1,
    "name": "Perfume A",
    "slug": "perfume-a",
    "price": 49.99,
    "currency": "USD",
    "images": ["/assets/perfume.jpg"],
    "stock": 20,
    "categories": ["Fragancias"]
  }
]
```

- Detalle de producto (GET /api/products/:id)
  - Response (200 OK)

```json
{
  "id": 1,
  "name": "Perfume A",
  "description": "Aromatic notes...",
  "price": 49.99,
  "images": ["/assets/perfume.jpg"],
  "stock": 20,
  "categories": ["Fragancias"],
  "discount": null
}
```

- Crear orden (POST /api/orders)
  - Request

```json
{
  "userId": 123,
  "items": [
    { "productId": 1, "quantity": 2, "unitPrice": 49.99 }
  ],
  "shippingAddress": {
    "street": "Calle Falsa 123",
    "city": "Ciudad",
    "postalCode": "12345",
    "country": "Chile"
  },
  "paymentMethod": "gateway_xyz",
  "total": 99.98
}
```

  - Response (201 Created)

```json
{
  "orderId": 9876,
  "status": "PENDING_PAYMENT",
  "createdAt": "2026-02-04T12:34:56Z"
}
```

- Crear/editar producto (ADMIN — POST /api/admin/products)
  - Request (multipart/form-data, ejemplo resumido)

Fields:
- `product` (JSON string con objeto product)
- `images[]` (archivos de imagen)

- Subir catálogo (ADMIN — POST /api/admin/catalogs)
  - Request (multipart/form-data)
    - `sectionId`: id de la sección
    - `file`: archivo PDF

- Respuesta de errores (ejemplo)

```json
{
  "timestamp": "2026-02-04T12:35:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Stock must be greater than 0",
  "path": "/api/admin/products"
}
```

## Modelos de ejemplo (JSON)
Estos modelos ayudan a diseñar los DTOs en el backend para evitar inconsistencias.

- Product

```json
{
  "id": 1,
  "name": "Perfume A",
  "slug": "perfume-a",
  "description": "Descripción corta",
  "price": 49.99,
  "currency": "USD",
  "images": ["/assets/perfume.jpg"],
  "stock": 20,
  "categories": [1, 2],
  "createdAt": "2026-01-01T00:00:00Z"
}
```

- OrderItem

```json
{
  "productId": 1,
  "name": "Perfume A",
  "quantity": 2,
  "unitPrice": 49.99
}
```

- Order

```json
{
  "orderId": 9876,
  "userId": 123,
  "items": [/* OrderItem[] */],
  "subtotal": 99.98,
  "shipping": 5.00,
  "total": 104.98,
  "status": "PENDING_PAYMENT",
  "createdAt": "2026-02-04T12:34:56Z"
}
```

## Archivo de entorno (ejemplo `src/environments/environment.ts`)
Copia este ejemplo y añade las claves reales en `environment.prod.ts` para producción.

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  paymentGatewayKey: 'pk_test_xxx',
  featureFlags: {
    enableCatalogUpload: true,
    enableAdminAnalytics: false
  }
};
```

## Guía rápida del panel admin (acciones y endpoints)
Esta guía rápida mapea las vistas del admin a acciones y endpoints backend.

- Productos
  - Lista: GET `/api/admin/products` (paginado)
  - Crear: POST `/api/admin/products` (multipart/form-data)
  - Editar: PUT `/api/admin/products/:id`
  - Eliminar: DELETE `/api/admin/products/:id`
  - Subir imágenes: POST `/api/admin/products/:id/images`

- Categorías
  - Lista: GET `/api/admin/categories`
  - Crear/Editar/Eliminar: POST/PUT/DELETE `/api/admin/categories`

- Catálogos (PDFs)
  - Lista por sección: GET `/api/admin/catalogs?sectionId=...`
  - Subir PDF: POST `/api/admin/catalogs` (multipart/form-data)
  - Eliminar: DELETE `/api/admin/catalogs/:id`

- Órdenes
  - Lista: GET `/api/admin/orders` (filtros por estado/fecha/usuario)
  - Detalle: GET `/api/admin/orders/:id`
  - Actualizar estado: PATCH `/api/admin/orders/:id/status` `{ "status": "PROCESSING" }`

- Usuarios
  - Lista: GET `/api/admin/users`
  - Detalle/Editar: GET/PUT `/api/admin/users/:id`
  - Cambiar roles: PATCH `/api/admin/users/:id/roles`

Recomendaciones de seguridad para admin:
- Todas las rutas deben requerir un token JWT con rol `admin`.
- Validar permisos en el backend (no confiar solo en el frontend).
- Llevar un log de auditoría para cambios críticos (precios, estados de órdenes, roles de usuario).

## Operaciones críticas y consideraciones
- Pagos: usar un workflow con eventos (CREATED -> PENDING_PAYMENT -> PAID). Soporta reintentos y reconciliación con webhooks.
- Reembolsos: exponer endpoints que permitan reembolsar parcial o totalmente y registrar la razón.
- Sincronización de stock: operaciones que afectan stock deben ser transaccionales para evitar overselling.
- Backups y datos sensibles: no guardar datos de tarjeta en tu base de datos si estás usando pasarelas; guarda tokens/refs seguros.

---

He añadido ejemplos de contrato API, modelos y una guía rápida del admin; el archivo fue validado y no presentó errores sintácticos en el repositorio local. Si quieres, puedo:
- Generar una colección Postman/Insomnia con los endpoints de ejemplo.
- Añadir diagramas (README en formato ASCII o vincular imagen en `docs/`).
- Crear un `environment.prod.ts` y un archivo `.env.example` para desarrolladores.

Dime cuál de estas opciones prefieres y lo implemento.
