VigíaForense
Plataforma de escritorio nativa (Desktop App) de e-Discovery, transcripción de evidencias local y búsqueda semántica de documentos judiciales de forma totalmente offline y segura.
Este archivo sirve como contexto principal para los agentes de desarrollo de Inteligencia Artificial que operan en este repositorio.
1. Visión y Propósito del Proyecto
VigíaForense es una herramienta diseñada para firmas de abogados, periodistas de investigación e investigadores independientes que manejan información altamente confidencial (audios, videos, documentos de casos judiciales) y exigen privacidad absoluta de los datos.
La plataforma resuelve el problema de la dependencia de la nube y los costos de APIs externas de procesamiento de datos mediante una arquitectura local-first, ejecutando modelos de transcripción (Whisper) e indexación semántica (Embeddings) de forma local utilizando el hardware del usuario.
2. Guía de Estilo y Sistema de Diseño (UX/UI)
El diseño de la aplicación rompe con las interfaces corporativas tradicionales y se inclina hacia una estética de terminal de ciberseguridad avanzada y clínica forense.
Especificaciones de la Paleta de Colores:
Fondo Principal: Negro absoluto (#030303 o #09090b).
Fondo de Contenedores: Escala de grises oscuros profundos (bg-zinc-950, bg-neutral-900).
Bordes y Detalles: Aspecto cromado, metálico y cristalino (utilizando clases de zinc/slate con gradientes metálicos sutiles).
Tipografía: Sans-serif institucional de alta visibilidad en color blanco puro (text-white) y grises apagados (text-zinc-400).
Restricción Estricta: No utilizar ningún tipo de emoji en el diseño visual de la interfaz.
Secciones Visuales Clave:
La Landing Page (Página de Inicio Promocional): Presenta un diseño de alto impacto visual con una onda de "vidrio líquido" (Liquid Glass) animada en constante movimiento de onda sinusoidal en el fondo, con gradientes cromados de color morado y blanco reflectivo.
El Dashboard Forense (Interfaz del Ejecutable): Un diseño de doble columna adaptado como aplicación de escritorio nativa de Tauri. Cuenta con un sidebar lateral de navegación e interfaces dedicadas de ingesta (Drag and Drop cromado), línea de tiempo de transcripción sincronizada, y panel de búsqueda semántica.
3. Arquitectura de Software y Stack Tecnológico
El proyecto está diseñado bajo un esquema desacoplado de alto rendimiento:
Frontend: React + Vite (HTML5, CSS3, JavaScript/JSX) estructurado de forma modular y responsiva.
Estilos: Tailwind CSS con componentes primitivos de Shadcn/ui.
Animaciones: Framer Motion y animaciones matemáticas nativas en HTML5 Canvas (para el efecto Liquid Glass).
Backend de Escritorio (Ejecutable): Tauri (Rust/C++) que empaqueta la aplicación de forma nativa en un instalador liviano para Windows y macOS sin dependencias de navegadores externos.
Inferencia de IA Local: Motor de whisper.cpp integrado en el backend de Tauri para transcripción asíncrona acelerada por CPU/VRAM, y bases de datos vectoriales locales (como SQLite con soporte para embeddings o ChromaDB local).
4. Estructura de Directorios del Proyecto
El agente de programación debe mantener y respetar el orden de carpetas establecido para evitar conflictos de importación:
code
Text
VigiaForense/
├── src/                  # Código fuente del Frontend (React + Vite)
│   ├── assets/           # Imágenes y recursos estáticos
│   ├── components/       # Componentes de UI reutilizables (Sidebar, Ingesta, Waveform)
│   │   └── LandingLiquidGlass.jsx # Componente con la onda de vidrio líquido
│   ├── data/             # Archivos de datos estructurados (Mock de evidencia)
│   ├── App.jsx           # Enrutador e integrador principal
│   ├── index.css         # Configuración global de Tailwind CSS
│   └── main.jsx          # Punto de entrada de React
├── src-tauri/            # Código fuente del Backend Nativo (Rust)
│   ├── src/
│   │   └── main.rs       # Registro de comandos nativos de comunicación con React
│   ├── Cargo.toml        # Dependencias de Rust y Tauri
│   └── tauri.conf.json   # Configuración del empaquetado del ejecutable
├── package.json          # Dependencias de Node (React, Tailwind, Framer Motion)
├── tailwind.config.js    # Configuración de los temas y colores del proyecto
└── README.md             # Instrucciones y contexto para la IA y desarrolladores
5. Instrucciones para el Agente de Programación (IA)
Cuando se te asigne una tarea de modificación de código en este repositorio, debes cumplir con las siguientes reglas:
Escritura Directa de Archivos: Utiliza tus herramientas de edición del sistema de archivos para aplicar los cambios de manera directa sobre los archivos correspondientes, en lugar de limitarte a dar respuestas explicativas de código en el chat.
Manejo de Transparencia y Bordes: Asegúrate de que las ilustraciones y contenedores tengan transparencia total respecto a la paleta de fondo negra absoluta de la aplicación.
Optimización de Animaciones: Al modificar la lógica del Canvas de Liquid Glass, optimiza el bucle de renderizado matemático y limpia los listeners del ratón al desmontar el componente para prevenir fugas de memoria.
Sin Comentarios Incompletos: No dejes bloques de código truncados con etiquetas "TODO" o "el código del mapa va aquí". Toda entrega en el sistema de archivos debe estar lista para compilación sin dependencias rotas.