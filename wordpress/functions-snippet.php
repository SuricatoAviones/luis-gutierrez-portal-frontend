<?php
/**
 * Custom Post Types & ACF Fields para el portafolio de Luis Angel Gutierrez.
 *
 * INSTRUCCIONES:
 * Pega todo este código al final del functions.php de tu tema activo en WordPress.
 * Requiere ACF Pro instalado y activo.
 */

// ─────────────────────────────────────────────
// 1. REGISTRAR CUSTOM POST TYPES
// ─────────────────────────────────────────────

add_action('init', function () {

    // ── Portfolio (Proyectos) ──
    register_post_type('portfolio', [
        'labels' => [
            'name'               => 'Proyectos',
            'singular_name'      => 'Proyecto',
            'add_new'            => 'Agregar proyecto',
            'add_new_item'       => 'Agregar nuevo proyecto',
            'edit_item'          => 'Editar proyecto',
            'new_item'           => 'Nuevo proyecto',
            'view_item'          => 'Ver proyecto',
            'search_items'       => 'Buscar proyectos',
            'not_found'          => 'No se encontraron proyectos',
            'not_found_in_trash' => 'No hay proyectos en la papelera',
            'all_items'          => 'Todos los proyectos',
            'menu_name'          => 'Portafolio',
        ],
        'public'       => true,
        'has_archive'  => false,
        'show_in_rest' => true,      // Requerido para la REST API
        'rest_base'    => 'portfolio',
        'menu_icon'    => 'dashicons-portfolio',
        'supports'     => ['title', 'thumbnail'],
        'rewrite'      => ['slug' => 'proyectos'],
    ]);

    // ── Skill (Habilidades) ──
    register_post_type('skill', [
        'labels' => [
            'name'               => 'Habilidades',
            'singular_name'      => 'Habilidad',
            'add_new'            => 'Agregar habilidad',
            'add_new_item'       => 'Agregar nueva habilidad',
            'edit_item'          => 'Editar habilidad',
            'new_item'           => 'Nueva habilidad',
            'view_item'          => 'Ver habilidad',
            'search_items'       => 'Buscar habilidades',
            'not_found'          => 'No se encontraron habilidades',
            'not_found_in_trash' => 'No hay habilidades en la papelera',
            'all_items'          => 'Todas las habilidades',
            'menu_name'          => 'Habilidades',
        ],
        'public'       => true,
        'has_archive'  => false,
        'show_in_rest' => true,
        'rest_base'    => 'skill',
        'menu_icon'    => 'dashicons-star-filled',
        'supports'     => ['title'],
        'rewrite'      => ['slug' => 'habilidades'],
    ]);

    // ── Experience (Experiencia laboral) ──
    register_post_type('experience', [
        'labels' => [
            'name'               => 'Experiencia',
            'singular_name'      => 'Experiencia',
            'add_new'            => 'Agregar experiencia',
            'add_new_item'       => 'Agregar nueva experiencia',
            'edit_item'          => 'Editar experiencia',
            'new_item'           => 'Nueva experiencia',
            'view_item'          => 'Ver experiencia',
            'search_items'       => 'Buscar experiencia',
            'not_found'          => 'No se encontró experiencia',
            'not_found_in_trash' => 'No hay experiencia en la papelera',
            'all_items'          => 'Toda la experiencia',
            'menu_name'          => 'Experiencia',
        ],
        'public'       => true,
        'has_archive'  => false,
        'show_in_rest' => true,
        'rest_base'    => 'experience',
        'menu_icon'    => 'dashicons-businessman',
        'supports'     => ['title'],
        'rewrite'      => ['slug' => 'experiencia'],
    ]);
});

// ─────────────────────────────────────────────
// 2. REGISTRAR CAMPOS ACF
// ─────────────────────────────────────────────

add_action('acf/include_fields', function () {

    if (!function_exists('acf_add_local_field_group')) return;

    // ── Campos de Portfolio ──
    acf_add_local_field_group([
        'key'      => 'group_portfolio_fields',
        'title'    => 'Datos del Proyecto',
        'fields'   => [
            [
                'key'          => 'field_project_url',
                'label'        => 'URL del Proyecto',
                'name'         => 'project_url',
                'type'         => 'url',
                'instructions' => 'Link al sitio en vivo.',
                'placeholder'  => 'https://ejemplo.com',
            ],
            [
                'key'          => 'field_github_url',
                'label'        => 'Repositorio GitHub',
                'name'         => 'github_url',
                'type'         => 'url',
                'instructions' => 'Link al repositorio.',
                'placeholder'  => 'https://github.com/usuario/repo',
            ],
            [
                'key'          => 'field_project_description',
                'label'        => 'Descripción',
                'name'         => 'description',
                'type'         => 'textarea',
                'rows'         => 4,
                'instructions' => 'Descripción breve del proyecto.',
            ],
            [
                'key'          => 'field_project_technologies',
                'label'        => 'Tecnologías',
                'name'         => 'technologies',
                'type'         => 'text',
                'instructions' => 'Separadas por coma. Ej: React, Node.js, PostgreSQL',
            ],
            [
                'key'           => 'field_project_featured_image',
                'label'         => 'Imagen del Proyecto',
                'name'          => 'featured_image',
                'type'          => 'image',
                'return_format' => 'url',
                'preview_size'  => 'medium',
                'instructions'  => 'Captura o mockup del proyecto.',
            ],
            [
                'key'          => 'field_project_year',
                'label'        => 'Año',
                'name'         => 'year',
                'type'         => 'text',
                'placeholder'  => '2024',
                'maxlength'    => 4,
            ],
            [
                'key'           => 'field_project_category',
                'label'         => 'Categoría',
                'name'          => 'category',
                'type'          => 'select',
                'choices'       => [
                    'Web App'    => 'Web App',
                    'Mobile'     => 'Mobile',
                    'API'        => 'API',
                    'E-Commerce' => 'E-Commerce',
                    'Landing'    => 'Landing',
                    'Otro'       => 'Otro',
                ],
                'default_value' => 'Web App',
                'allow_null'    => false,
            ],
        ],
        'location' => [
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'portfolio'],
            ],
        ],
        'show_in_rest' => true,
        'position'     => 'normal',
        'style'        => 'seamless',
    ]);

    // ── Campos de Skill ──
    acf_add_local_field_group([
        'key'      => 'group_skill_fields',
        'title'    => 'Datos de la Habilidad',
        'fields'   => [
            [
                'key'           => 'field_skill_level',
                'label'         => 'Nivel de Dominio',
                'name'          => 'level',
                'type'          => 'number',
                'min'           => 0,
                'max'           => 100,
                'step'          => 5,
                'default_value' => 50,
                'append'        => '%',
                'instructions'  => 'Porcentaje de dominio (0-100).',
            ],
            [
                'key'           => 'field_skill_category',
                'label'         => 'Categoría',
                'name'          => 'category',
                'type'          => 'select',
                'choices'       => [
                    'Frontend' => 'Frontend',
                    'Backend'  => 'Backend',
                    'DevOps'   => 'DevOps',
                    'Tools'    => 'Tools',
                ],
                'default_value' => 'Frontend',
                'allow_null'    => false,
                'instructions'  => 'Grupo al que pertenece la habilidad.',
            ],
            [
                'key'          => 'field_skill_icon',
                'label'        => 'Ícono',
                'name'         => 'icon',
                'type'         => 'text',
                'instructions' => 'Nombre del ícono (ej: "react", "docker") o URL de un SVG.',
                'placeholder'  => 'react',
            ],
        ],
        'location' => [
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'skill'],
            ],
        ],
        'show_in_rest' => true,
        'position'     => 'normal',
        'style'        => 'seamless',
    ]);

    // ── Campos de Experience ──
    acf_add_local_field_group([
        'key'      => 'group_experience_fields',
        'title'    => 'Datos de la Experiencia',
        'fields'   => [
            [
                'key'          => 'field_exp_company',
                'label'        => 'Empresa',
                'name'         => 'company',
                'type'         => 'text',
                'required'     => true,
                'instructions' => 'Nombre de la empresa.',
            ],
            [
                'key'          => 'field_exp_position',
                'label'        => 'Puesto',
                'name'         => 'position',
                'type'         => 'text',
                'required'     => true,
                'instructions' => 'Título del puesto. Ej: Senior Software Engineer',
            ],
            [
                'key'          => 'field_exp_start_date',
                'label'        => 'Fecha de Inicio',
                'name'         => 'start_date',
                'type'         => 'text',
                'required'     => true,
                'placeholder'  => '2022-06',
                'instructions' => 'Formato YYYY-MM. Ej: 2022-06',
                'maxlength'    => 7,
            ],
            [
                'key'          => 'field_exp_end_date',
                'label'        => 'Fecha de Fin',
                'name'         => 'end_date',
                'type'         => 'text',
                'placeholder'  => 'presente',
                'instructions' => 'Formato YYYY-MM o escribe "presente" si es el puesto actual.',
                'maxlength'    => 8,
            ],
            [
                'key'          => 'field_exp_description',
                'label'        => 'Descripción',
                'name'         => 'description',
                'type'         => 'textarea',
                'rows'         => 4,
                'instructions' => 'Resumen de responsabilidades y logros.',
            ],
            [
                'key'          => 'field_exp_technologies',
                'label'        => 'Tecnologías',
                'name'         => 'technologies',
                'type'         => 'text',
                'instructions' => 'Separadas por coma. Ej: React, TypeScript, AWS',
            ],
            [
                'key'          => 'field_exp_company_url',
                'label'        => 'URL de la Empresa',
                'name'         => 'company_url',
                'type'         => 'url',
                'placeholder'  => 'https://empresa.com',
            ],
        ],
        'location' => [
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'experience'],
            ],
        ],
        'show_in_rest' => true,
        'position'     => 'normal',
        'style'        => 'seamless',
    ]);
});
