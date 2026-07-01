# ARROW - Red Social

Una plataforma web de interacción social moderna y optimizada, desarrollada bajo una arquitectura robusta de desacoplamiento completo (Backend en NestJS + MongoDB y Frontend en Angular). El proyecto implementa un diseño Premium Dark responsivo, control estricto de sesiones y un módulo analítico avanzado para la administración de la comunidad.

---
## 🚀 Deploy
* **Frontend:** https://leandro-marecos-tp-2-prog-4-2026-c1.vercel.app/
* **Backend:** https://arrow-backend-giuo.onrender.com
---

## 🛠️ Tecnologías Utilizadas

### Backend (Core API)
* **Framework:** NestJS (TypeScript)
* **Base de Datos:** MongoDB (Mongoose)
* **Autenticación:** JWT (JSON Web Tokens, 15m de expiración) & Bcrypt para hashing de contraseñas
* **Almacenamiento Multimedia:** Cloudinary API (Gestión de imágenes de perfil y posteos)

### Frontend (User Interface)
* **Framework:** Angular (Componentes Standalone & Arquitectura Reactiva con Signals)
* **Estilos:** Tailwind CSS (Diseño adaptativo y Mobile-First)
* **Gráficos:** Chart.js (Visualización de métricas en tiempo real)
* **Componentes Visuales:** SweetAlert2 (Modales interactivos de sistema)

---

## 🚀 Hoja de Ruta: Ciclo de Desarrollo por Sprints

### 🔹 Sprint 1: Cimiento Arquitectónico y Estructura Base
* **Backend (NestJS):** Inicialización del entorno del servidor y configuración de la conexión principal a la base de datos MongoDB utilizando el ODM Mongoose. Modelado inicial de esquemas primitivos de datos.
* **Frontend (Angular):** Estructuración de la arquitectura base del proyecto mediante componentes Standalone. Implementación integral de la interfaz de usuario con Tailwind CSS, garantizando un diseño adaptativo, responsivo y bajo la filosofía Mobile-First.

### 🔹 Sprint 2: Autenticación de Usuarios y Flujo CRUD de Publicaciones
* **Backend (NestJS):** Implementación de la lógica del módulo de usuarios y autenticación segura mediante el uso de JSON Web Tokens (JWT) y encriptación de contraseñas con Bcrypt. Integración de la API de Cloudinary para la subida asíncrona y almacenamiento en la nube de imágenes de perfil y archivos multimedia para los posteos.
* **Frontend (Angular):** Creación y validación estricta de formularios reactivos para los flujos de Registro e Inicio de Sesión (Login). Desarrollo del feed o muro principal de la plataforma, permitiendo la creación, listado completo y la baja lógica de las publicaciones propias de cada usuario autenticado.

### 🔹 Sprint 3: Jerarquía RESTful de Comentarios y Seguridad Avanzada
* **Backend (NestJS):** Refactorización arquitectónica para el manejo cohesivo de sub-entidades. Se re-estructuraron los endpoints del controlador de comentarios bajo una jerarquía RESTful anidada, subordinada de manera absoluta al recurso del cual dependen (`/publicaciones/:publicacionId/comentarios`).
* **Frontend (Angular):** Desarrollo del panel de detalle expandido para las publicaciones. Implementación de un sistema automatizado de control de estado de sesión (timers de inactividad sincronizados) que alerta preventivamente al usuario mediante modales interactivos de SweetAlert2 a los 10 minutos para renovar de forma asíncrona su token de sesión (`/refrescar`), o ejecuta un cierre forzado definitivo a los 15 minutos por motivos de seguridad.

### 🔹 Sprint 4: Panel de Control del Administrador, Métricas y Extensibilidad
* **Página Dashboard/Usuarios (ABM de Moderación):** Interfaz exclusiva para el rol de administrador protegido por Guards de rutas. Permite auditar el listado de la comunidad, registrar nuevas cuentas forzando perfiles mediante botones radiales ("usuario" o "administrador") e implementar acciones directas de alta y baja lógica (habilitar/deshabilitar). Un usuario deshabilitado ve denegado su ingreso y es notificado mediante el flujo de login en el backend.
* **Baja Lógica de Publicaciones:** Modificación de las vistas de publicaciones y detalle para que, al detectar una sesión con perfil de administrador, se habiliten de forma dinámica los botones de borrado masivo, permitiendo dar de baja cualquier publicación del sitio (lo que arrastra y oculta de forma automática tanto la publicación como todos sus comentarios asociados).
* **Página Dashboard/Estadísticas (Métricas Temporales):** Creación de un `EstadisticasController` en el backend que procesa datos de MongoDB mediante agregaciones complejas (`$match`, `$group`, `$lookup`). En el frontend se exponen tres variables de gráficos dinámicos e interactivos (Barras, Líneas y Torta) utilizando Chart.js, los cuales representan la cantidad de publicaciones por usuario, comentarios totales en la app y comentarios recibidos por cada posteo, permitiendo al administrador elegir y filtrar el lapso de tiempo exacto a evaluar.
* **Extensibilidad a Nivel Aplicación:** Optimización global del ecosistema mediante la configuración y despliegue manual de componentes PWA (Progressive Web App) para permitir la instalación nativa del sitio en dispositivos móviles y de escritorio. Implementación obligatoria de **3 Pipes Propios** (transformación, abreviación y censura de datos) y **3 Directivas Propias** (manipulación y escucha del comportamiento directo sobre elementos del DOM) diseñadas de forma Standalone.---

## ⚙️ Configuración del Entorno Local

### Requisitos Previos
* Node.js (Versión LTS recomendada)
* Instancia local o remota de MongoDB Atlas

### Configuración del Servidor (.env)
Crear un archivo `.env` en la raíz de la carpeta del backend con las siguientes variables:
```env
MONGO_URI=tu_cadena_de_conexion_de_mongo
JWT_SECRET=tu_clave_secreta_super_segura
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
