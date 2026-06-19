# Vanta

App de escritorio para análisis forense de audio y video. Transcripción local con Whisper, cadena de custodia SHA-256 y cifrado AES-256. 100% offline.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Desktop**: Tauri v2 (Rust)
- **IA**: Whisper (transcripción local on-demand)

## Estructura

```
src/
├── components/         # UI components
│   ├── landing/        # Landing page modulares
│   └── *.jsx           # App shell, módulos
├── lib/                # Servicios (whisper, etc.)
├── App.jsx             # Router principal
└── main-landing.jsx    # Entry point landing
src-tauri/
└── src/lib.rs          # Comandos nativos Rust
```

## Desarrollo

```bash
npm install
npm run dev          # Landing en localhost:5173
npm run dev:app      # App en localhost:1420
```

## Build

```bash
npm run build
cargo tauri build
```
