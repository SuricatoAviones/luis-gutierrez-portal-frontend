# Luis Angel Gutierrez - Portafolio

Sitio personal y blog técnico construido con Astro, Tailwind CSS y WordPress como CMS desacoplado.

## Stack

- Astro 7 con salida estática
- Tailwind CSS 4
- WordPress REST API y campos ACF para proyectos, habilidades, experiencia y artículos
- Contact Form 7 (WordPress) opcional para el formulario de contacto

## Configuración

Instala las dependencias con pnpm:

```sh
pnpm install
```

Crea un archivo `.env` a partir de `.env.example` y completa las variables necesarias:

```dotenv
WP_API_URL=https://tu-dominio.com/wp-json
CF7_FORM_ID=123
```

Ambas variables son públicas (están declaradas en `env.schema` de `astro.config.mjs` con `context: "client"`): se incrustan en el JS durante el build. No pongas secretos en ellas.

El contenido de WordPress (artículos, proyectos, habilidades y experiencia) se consulta **desde el navegador** con `fetch` en cada visita (`src/lib/wordpress.ts`). Por eso los cambios publicados en WordPress se ven sin volver a compilar ni desplegar; solo hace falta redesplegar al cambiar código o variables de entorno. La API de WordPress debe permitir CORS desde el dominio del sitio (WordPress lo hace por defecto en su REST API).

## Comandos

| Comando        | Descripción                                 |
| -------------- | ------------------------------------------- |
| `pnpm dev`     | Inicia el servidor de desarrollo.           |
| `pnpm check`   | Ejecuta diagnósticos de Astro y TypeScript. |
| `pnpm build`   | Genera el sitio estático en `dist/`.        |
| `pnpm preview` | Sirve localmente el build de producción.    |

## Rutas de contenido

- `/` - Portafolio y vista previa de artículos.
- `/blog` - Índice de artículos; las páginas siguientes usan `/blog/?page={n}` (nueve artículos por página).
- `/blog/{slug}` - Artículo. Todas estas URLs usan la plantilla estática `/blog/post/`, que lee el slug de la URL y consulta el artículo a WordPress.
- `/contacto` - Página de contacto.

En cPanel, `public/.htaccess` reescribe `/blog/{slug}` hacia `/blog/post/index.html` (la URL visible no cambia) y redirige con 301 las URLs antiguas `/blog/page/{n}`. En `pnpm dev` la misma reescritura la hace una integración de `astro.config.mjs`; `pnpm preview` no la aplica, así que ahí usa `/blog/post/?slug={slug}`.
