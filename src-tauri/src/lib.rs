#![allow(unexpected_cfgs)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

#[cfg(target_os = "macos")]
use tauri::Manager;

#[derive(serde::Serialize)]
struct PlatformInfo {
    is_macos: bool,
    is_macos_tahoe_or_newer: bool,
}

#[cfg(target_os = "macos")]
fn macos_major_version() -> Option<u32> {
    let output = std::process::Command::new("sw_vers")
        .arg("-productVersion")
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let version = String::from_utf8(output.stdout).ok()?;
    version
        .trim()
        .split('.')
        .next()
        .and_then(|major| major.parse::<u32>().ok())
}

#[cfg(not(target_os = "macos"))]
fn macos_major_version() -> Option<u32> {
    None
}

#[tauri::command]
fn get_platform_info() -> PlatformInfo {
    let macos_major = macos_major_version();

    PlatformInfo {
        is_macos: cfg!(target_os = "macos"),
        is_macos_tahoe_or_newer: matches!(macos_major, Some(26..)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![get_platform_info])
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            {
                if matches!(macos_major_version(), Some(26..)) {
                    let window = _app.get_webview_window("main").unwrap();
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
                        .expect("Failed to apply vibrancy");
                }

                #[allow(deprecated)]
                unsafe {
                    use cocoa::base::id;

                    let icon_data = include_bytes!("../icons/icon.png");
                    let ns_data: id = msg_send![
                        class!(NSData),
                        dataWithBytes: icon_data.as_ptr()
                        length: icon_data.len()
                    ];
                    let ns_image: id = msg_send![class!(NSImage), alloc];
                    let ns_image: id = msg_send![ns_image, initWithData: ns_data];
                    let ns_app: id =
                        msg_send![class!(NSApplication), sharedApplication];
                    let _: () =
                        msg_send![ns_app, setApplicationIconImage: ns_image];
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
