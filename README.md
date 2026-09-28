# Frontend — Gestión de empleados (Angular)

Interfaz web para administrar empleados mediante operaciones CRUD, conectada al backend
Express del proyecto (`http://localhost:3000/api/v1`).

## Requisitos

- Node.js 18+ y npm.
- Backend Express corriendo en `http://localhost:3000` con las rutas `/api/v1/empleados`.

## Instalación y ejecución

```bash
npm install
ng serve
```

La aplicación queda disponible en `http://localhost:4200/`. Las peticiones a `/api/v1/...`
se redirigen automáticamente al backend en `http://localhost:3000` gracias al proxy de
desarrollo definido en `proxy.conf.json` (configurado en `angular.json` → `serve.options`).
No es necesario configurar CORS en el backend para desarrollo local.

Para generar una build de producción:

```bash
ng build
```

## Estructura

```
src/app/
  core/
    models/employee.model.ts        # Employee, DTOs de creación/actualización, ApiResponse, OperationStatus
    services/employee.service.ts    # EmployeeService: único punto de acceso HTTP a /empleados
    utils/api-error.util.ts         # Normaliza los distintos formatos de "errors" del backend
    validators/greater-than-zero.validator.ts
  features/employees/
    employee-manager/   # Smart component: orquesta EmployeeService y el estado, usa async pipe
    employee-form/       # Dumb component: formulario de alta/edición (@Input/@Output)
    employee-list/       # Dumb component: tabla de empleados (@Input/@Output)
```

### EmployeeService

- Mantiene el estado en `BehaviorSubject` privados (`employees$`, `loading$`, `status$`) y
  expone únicamente los `Observable` de solo lectura correspondientes.
- Cada operación (`loadEmployees`, `createEmployee`, `updateEmployee`, `deleteEmployee`)
  actualiza la colección de empleados de forma inmutable (`[...actual, nuevo]`, `.map(...)`,
  `.filter(...)`), nunca mutando el arreglo existente.
- Los errores del backend (`{ success: false, message, errors }`) se normalizan a un mapa
  `{ campo: mensaje }` para poder asociarlos a los controles del formulario.

### Componentes

- `EmployeeManagerComponent` (contenedor/orquestador): inyecta `EmployeeService`, combina sus
  observables en un único `vm$` y lo consume en la plantilla con el pipe `async` (sin
  suscripciones manuales para leer estado). Las suscripciones explícitas se usan solo para
  disparar comandos (crear/actualizar/eliminar) y reaccionar una vez (`take(1)`).
- `EmployeeFormComponent` (presentacional): formulario reactivo con validaciones de
  `nombre`, `cargo`, `departamento` (obligatorios) y `sueldo` (obligatorio y mayor que cero).
  Recibe el empleado a editar por `@Input()` y emite `create` / `update` / `cancelEdit`.
- `EmployeeListComponent` (presentacional): tabla de empleados con formato de moneda
  (`CurrencyPipe`, manteniendo el valor numérico enviado a la API) y confirmación en línea
  antes de eliminar. Emite `edit` / `delete`.

## Contrato con el backend

- Base URL: `/api/v1/empleados` (vía proxy hacia `http://localhost:3000`).
- `GET /empleados`, `POST /empleados`, `PUT /empleados/:id`, `DELETE /empleados/:id`.
- Identificador: `_id`.
- Respuestas: `{ success, message, data }` en éxito; `{ success: false, message, data: null, errors? }` en error.
