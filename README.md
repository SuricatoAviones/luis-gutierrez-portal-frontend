# Luis Angel Gutierrez - Portafolio

Sitio personal y blog técnico construido con Astro, Tailwind CSS y WordPress como CMS desacoplado.

## Stack

- Astro 7 con salida estática
- Tailwind CSS 4
- WordPress REST API y campos ACF para proyectos, habilidades, experiencia y artículos
- Formspree opcional para el formulario de contacto

## Configuración

Instala las dependencias con pnpm:

```sh
pnpm install
```

Crea un archivo `.env` a partir de `.env.example` y completa las variables necesarias:

```dotenv
WP_API_URL=https://tu-dominio.com/wp-json
PUBLIC_FORMSPREE_FORM_ID=tu_id_de_formspree
```

`WP_API_URL` se usa únicamente durante el renderizado de Astro. `PUBLIC_FORMSPREE_FORM_ID` se expone en el navegador porque Formspree requiere un identificador público; no incluyas claves privadas en variables con el prefijo `PUBLIC_`.

El contenido de WordPress se consulta durante el build. Tras publicar o editar artículos, proyectos, habilidades o experiencia, vuelve a desplegar el sitio para reflejar los cambios.

## Comandos

| Comando        | Descripción                                 |
| -------------- | ------------------------------------------- |
| `pnpm dev`     | Inicia el servidor de desarrollo.           |
| `pnpm check`   | Ejecuta diagnósticos de Astro y TypeScript. |
| `pnpm build`   | Genera el sitio estático en `dist/`.        |
| `pnpm preview` | Sirve localmente el build de producción.    |

## Rutas de contenido

- `/` - Portafolio y vista previa de artículos.
- `/blog` - Índice de artículos.
- `/blog/{slug}` - Artículos generados desde WordPress.
- `/blog/page/{n}` - Páginas posteriores del índice cuando hay más de nueve artículos.
- `/contacto` - Página de contacto.

La ruta `/blog/post` se conserva con `noindex` como respaldo de cliente para artículos que se publiquen entre dos despliegues.
