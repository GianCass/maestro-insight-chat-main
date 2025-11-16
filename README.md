### Frontend-service

Aplicación frontend del proyecto Pricing Inteligente. Provee:
- Un chatbot para consultar información de productos, variables macro y resultados LASSO persistidos en Milvus.
- Vistas de dashboard dinámicos renderizados a partir de respuestas del LLM y visualizaciones generadas (vía BackendVisual).

Este servicio consume:
- Milvus (vía servicios intermedios) para búsqueda semántica de productos, macro y resultados LASSO.
- BackendVisual-service para recuperar JSON de Plotly de figuras persistidas.
- Supabase para autenticación de usuarios y, opcionalmente, persistencia de metadatos.

Aplicación frontend de Pricing_Inteligente construida con Vite, React y TypeScript. Incluye Tailwind CSS, shadcn-ui, React Router, TanStack Query y autenticación con Supabase.

### Contexto dentro del proyecto
Pricing Inteligente analiza precios de productos de consumo en ~10 países y múltiples retailers/marcas. Los datos se scrapean, limpian y se indexan en Milvus con embeddings. LASSO calcula correlaciones entre precios y variables macro para feature engineering. El Frontend expone un chatbot que responde preguntas con soporte de Milvus y puede mostrar gráficos dinámicos (Plotly) consumidos desde BackendVisual.

### Tecnologías
- Vite 5
- React 18 + TypeScript
- Tailwind CSS (+ tailwindcss-animate)
- shadcn-ui (Radix UI)
- React Router v6
- TanStack Query
- Supabase (Auth/API)

### Requisitos previos
- Node.js 18+ y npm
- Opcional: Bun instalado (existe `bun.lockb`, pero el flujo usa npm)

### Variables de entorno
Crear `.env.local` en `Frontend-service`:
```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=ey...

# Opcional: endpoints backend
VITE_BACKENDVISUAL_URL=http://localhost:8007
```

### Instalación
```bash
cd Frontend-service
npm install
```

### Scripts
- `npm run dev`: inicia Vite en modo desarrollo en el puerto 8080
- `npm run build`: construye la app para producción
- `npm run build:dev`: build usando modo development
- `npm run preview`: sirve el build localmente
- `npm run lint`: ejecuta ESLint

El servidor de desarrollo está configurado para:
- Host: `::` (accesible desde la red local/WSL2)
- Puerto: `8080`

### Configuración del proyecto
- Alias de importación: `@` apunta a `src` (ver `vite.config.ts`)
- Tailwind configurado en `tailwind.config.ts` y estilos base en `src/index.css`
- Shadcn-ui configurado via `components.json`
- Tipos y configuración TS: `tsconfig.json`, `tsconfig.app.json`

### Rutas principales
Definidas en `src/App.tsx` con React Router:
- `/` → `Landing`
- `/chatbot` → `Chatbot`
- `/dashboard` → `Dashboard`
- `/settings` → `Settings`
- `/login` → `Login`
- `/register` → `Register`
- `/support` → `Support`
- `*` → `NotFound`

### Autenticación y Supabase
- Cliente Supabase: `src/integrations/supabase/client.ts`
- Contexto de auth: `src/hooks/useAuth.tsx` (expone `user`, `session`, `loading`)

Actualizar `src/integrations/supabase/client.ts` para leer desde `import.meta.env`.

Nota: Existe `supabase/config.toml` con `project_id` y una carpeta `supabase/functions` para potenciales edge functions.

### Estructura (resumen)
```
Frontend-service/
  src/
    pages/               # Landing, Chatbot, Dashboard, etc.
    components/          # Componentes UI (shadcn) y propios
    hooks/               # useAuth, otros hooks
    integrations/        # supabase (client, types)
    lib/, services/, api/, types/
    main.tsx, App.tsx, index.css
  public/
  vite.config.ts
  tailwind.config.ts
  eslint.config.js
  tsconfig*.json
  package.json
```

### Desarrollo
```bash
npm run dev
# abre http://localhost:8080
```

### Build y preview
```bash
npm run build
npm run preview
```

### Dockerización
Este servicio no incluye un `Dockerfile` en este repositorio. Opciones:
- Desplegar como app estática (build de Vite) sirviendo el contenido de `dist/` en un Nginx/CDN.
- Crear un `Dockerfile` multi-stage (Node para build + Nginx para servir) si se requiere contenedor.

Ejemplo orientativo (no incluido en repo):
```dockerfile
# stage build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# stage serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Integraciones con otros servicios
- Extraction-service: prepara colecciones limpias que luego se indexan.
- Embedding-service: migra productos, macro y resultados LASSO a Milvus.
- BackendVisual-service: genera y sirve JSON de figuras Plotly (`/api/figures/:id`) que este frontend renderiza.

### Calidad de código
- ESLint configurado (React, hooks, TypeScript). Ejecuta: `npm run lint`

### Notas
- En WSL2, el host `::` permite acceder desde el navegador de Windows a `http://localhost:8080`.
- Se utiliza el alias `@` para imports desde `src` (p. ej. `@/hooks/useAuth`).
