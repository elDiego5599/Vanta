use serde_json::{json, Value};

#[tauri::command]
async fn ingestar_archivo_evidencia(ruta: String) -> Result<Value, String> {
    let nombre = ruta
        .rsplit('/')
        .next()
        .unwrap_or("archivo desconocido")
        .to_string();

    Ok(json!({
        "id": "ev-001",
        "nombre": nombre,
        "ruta": ruta,
        "estado": "transcribiendo con CPU...",
        "progreso": 12,
        "timestamp": "2024-03-16T14:30:00Z"
    }))
}

#[tauri::command]
async fn ejecutar_busqueda_semantica(consulta: String) -> Result<Value, String> {
    Ok(json!({
        "consulta": consulta,
        "total_resultados": 3,
        "resultados": [
            {
                "timestamp": "00:12:14",
                "fragmento": "Por favor, indique su nombre completo para el registro.",
                "similitud": 95,
                "hablante": "Agente",
                "archivo": "interrogatorio_0041.wav"
            },
            {
                "timestamp": "00:08:33",
                "fragmento": "El dinero en efectivo fue entregado en la oficina principal.",
                "similitud": 87,
                "hablante": "Testigo",
                "archivo": "interrogatorio_0041.wav"
            },
            {
                "timestamp": "00:22:05",
                "fragmento": "Confirmo que la fecha indicada coincide con los registros.",
                "similitud": 72,
                "hablante": "Testigo",
                "archivo": "interrogatorio_0041.wav"
            }
        ]
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ingestar_archivo_evidencia,
            ejecutar_busqueda_semantica
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
