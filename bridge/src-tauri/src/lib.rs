use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

const RAW_EXTENSIONS: &[&str] = &["arw", "cr2", "cr3", "nef", "orf", "rw2", "dng"];
const JPEG_EXTENSIONS: &[&str] = &["jpg", "jpeg"];

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ProjectSelection {
    project_name: String,
    client_name: String,
    selected_count: usize,
    filenames: Vec<String>,
}

#[derive(serde::Serialize, Clone)]
struct CopyProgressPayload {
    current: usize,
    total: usize,
    filename: String,
}

#[derive(serde::Serialize)]
pub struct CopyResult {
    copied: Vec<String>,
    not_found: Vec<String>,
    output_folder: String,
    total_requested: usize,
}

fn basename_without_extension(path: &Path) -> String {
    path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase()
}

fn extension_lower(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
}

fn line_to_basename(line: &str) -> String {
    basename_without_extension(Path::new(line.trim()))
}

fn matches_file_type(ext: &str, file_type: &str) -> bool {
    match file_type {
        "raw" => RAW_EXTENSIONS.contains(&ext),
        "jpeg" => JPEG_EXTENSIONS.contains(&ext),
        "both" => RAW_EXTENSIONS.contains(&ext) || JPEG_EXTENSIONS.contains(&ext),
        _ => false,
    }
}

fn build_source_index(folder: &str) -> Result<HashMap<String, Vec<PathBuf>>, String> {
    let entries = fs::read_dir(folder).map_err(|e| format!("Could not read source folder: {e}"))?;
    let mut map: HashMap<String, Vec<PathBuf>> = HashMap::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        if !file_type.is_file() {
            continue;
        }
        let path = entry.path();
        let base = basename_without_extension(&path);
        map.entry(base).or_default().push(path);
    }

    Ok(map)
}

fn count_files_to_copy(
    selected_basenames: &[String],
    index: &HashMap<String, Vec<PathBuf>>,
    file_type: &str,
) -> usize {
    let mut total = 0;
    for basename in selected_basenames {
        let key = basename.to_lowercase();
        let Some(paths) = index.get(&key) else {
            continue;
        };
        total += paths
            .iter()
            .filter(|p| {
                extension_lower(p)
                    .map(|ext| matches_file_type(&ext, file_type))
                    .unwrap_or(false)
            })
            .count();
    }
    total
}

#[tauri::command]
fn parse_txt_file(path: String) -> Result<Vec<String>, String> {
    let content =
        fs::read_to_string(&path).map_err(|e| format!("Could not read selection file: {e}"))?;

    let mut basenames = Vec::new();
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let base = line_to_basename(trimmed);
        if !base.is_empty() {
            basenames.push(base);
        }
    }

    Ok(basenames)
}

#[tauri::command]
fn scan_source_folder(folder: String) -> Result<Vec<String>, String> {
    let entries =
        fs::read_dir(&folder).map_err(|e| format!("Could not scan source folder: {e}"))?;
    let mut paths = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().map_err(|e| e.to_string())?.is_file() {
            paths.push(entry.path().to_string_lossy().into_owned());
        }
    }

    paths.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    Ok(paths)
}

#[tauri::command]
fn get_default_output_folder(source_folder: String) -> String {
    PathBuf::from(source_folder)
        .join("to-edit")
        .to_string_lossy()
        .into_owned()
}

#[tauri::command]
fn copy_selected_files(
    app: tauri::AppHandle,
    source_folder: String,
    selected_basenames: Vec<String>,
    file_type: String,
    output_folder: String,
) -> Result<CopyResult, String> {
    if selected_basenames.is_empty() {
        return Err("No photos in selection".into());
    }

    if !["raw", "jpeg", "both"].contains(&file_type.as_str()) {
        return Err(format!("Invalid file type: {file_type}"));
    }

    fs::create_dir_all(&output_folder)
        .map_err(|e| format!("Could not create output folder: {e}"))?;

    let index = build_source_index(&source_folder)?;
    let total_files = count_files_to_copy(&selected_basenames, &index, &file_type);
    let mut copied = Vec::new();
    let mut not_found = Vec::new();
    let mut progress_index = 0usize;

    for basename in &selected_basenames {
        let key = basename.to_lowercase();
        let Some(paths) = index.get(&key) else {
            not_found.push(basename.clone());
            continue;
        };

        let matching: Vec<PathBuf> = paths
            .iter()
            .filter(|p| {
                extension_lower(p)
                    .map(|ext| matches_file_type(&ext, &file_type))
                    .unwrap_or(false)
            })
            .cloned()
            .collect();

        if matching.is_empty() {
            not_found.push(basename.clone());
            continue;
        }

        for src in matching {
            let file_name = src
                .file_name()
                .ok_or_else(|| format!("Invalid file name in source folder: {}", src.display()))?;
            let dest = PathBuf::from(&output_folder).join(file_name);
            let name_str = file_name.to_string_lossy().into_owned();

            progress_index += 1;
            let _ = app.emit(
                "copy-progress",
                CopyProgressPayload {
                    current: progress_index,
                    total: total_files.max(progress_index),
                    filename: name_str.clone(),
                },
            );

            fs::copy(&src, &dest)
                .map_err(|e| format!("Could not copy {}: {e}", name_str))?;
            copied.push(name_str);
        }
    }

    Ok(CopyResult {
        copied,
        not_found,
        output_folder,
        total_requested: selected_basenames.len(),
    })
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    if !Path::new(&path).exists() {
        return Err(format!("Folder does not exist: {path}"));
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Could not open folder: {e}"))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Could not open folder: {e}"))?;
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Could not open folder: {e}"))?;
    }

    Ok(())
}

fn focus_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn emit_deep_link(app: &tauri::AppHandle, url: &str) {
    if !url.starts_with("aphogato://") {
        return;
    }
    focus_main_window(app);
    let _ = app.emit("deep-link-received", url.to_string());
}

fn api_base_url(host: &str) -> String {
    let trimmed = host.trim().trim_end_matches('/');
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else if trimmed.starts_with("localhost") || trimmed.starts_with("127.0.0.1") {
        format!("http://{trimmed}")
    } else {
        format!("https://{trimmed}")
    }
}

#[tauri::command]
async fn fetch_project_selection(
    host: String,
    project_id: String,
    token: String,
) -> Result<ProjectSelection, String> {
    let base = api_base_url(&host);
    let url = format!("{base}/api/bridge/selection");

    let response = reqwest::Client::new()
        .get(url)
        .query(&[("project_id", project_id.as_str()), ("token", token.as_str())])
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
            if let Some(err) = json.get("error").and_then(|value| value.as_str()) {
                return Err(err.to_string());
            }
        }
        let message = if body.is_empty() {
            format!("Request failed ({status})")
        } else {
            body
        };
        return Err(message);
    }

    response
        .json::<ProjectSelection>()
        .await
        .map_err(|e| format!("Invalid response from server: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            for arg in argv {
                emit_deep_link(app, &arg);
            }
        }));
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.deep_link().register("aphogato")?;

                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    for url in event.urls() {
                        emit_deep_link(&handle, url.as_ref());
                    }
                });

                for arg in std::env::args().skip(1) {
                    emit_deep_link(app.handle(), &arg);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            parse_txt_file,
            scan_source_folder,
            get_default_output_folder,
            copy_selected_files,
            open_folder,
            fetch_project_selection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aphogato Bridge");
}
