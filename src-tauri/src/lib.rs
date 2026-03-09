#![allow(unexpected_cfgs)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                let window = app.get_webview_window("main").unwrap();
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
                    .expect("Failed to apply vibrancy");

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
