// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_docker_containers() -> Result<String, String> {
    let output = Command::new("docker")
        .args(&["ps", "-a", "--format", "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}"])
        .output()
        .map_err(|e| format!("Failed to execute docker ps: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8(output.stdout)
            .map_err(|e| format!("Failed to parse output: {}", e))?;
        Ok(stdout)
    } else {
        let stderr = String::from_utf8(output.stderr)
            .map_err(|e| format!("Failed to parse error: {}", e))?;
        Err(format!("Docker command failed: {}", stderr))
    }
}

#[tauri::command]
fn stop_docker_container(id: &str) -> Result<String, String> {
    let output = Command::new("docker")
        .args(&["stop", id])
        .output()
        .map_err(|e| format!("Failed to execute docker stop: {}", e))?;

    if output.status.success() {
        Ok(String::from("Container stopped"))
    } else {
        let stderr = String::from_utf8(output.stderr)
            .map_err(|e| format!("Failed to parse error: {}", e))?;
        Err(format!("Docker command failed: {}", stderr))
    }
}

#[tauri::command]
fn remove_docker_container(id: &str) -> Result<String, String> {
    let output = Command::new("docker")
        .args(&["rm", id])
        .output()
        .map_err(|e| format!("Failed to execute docker rm: {}", e))?;

    if output.status.success() {
        Ok(String::from("Container removed"))
    } else {
        let stderr = String::from_utf8(output.stderr)
            .map_err(|e| format!("Failed to parse error: {}", e))?;
        Err(format!("Docker command failed: {}", stderr))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_docker_containers, stop_docker_container, remove_docker_container])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
