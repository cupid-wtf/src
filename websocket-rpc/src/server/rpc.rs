use axum::{
    extract::ws::{Message, WebSocket},
    extract::{Path, WebSocketUpgrade},
    response::Response,
};

use crate::{format::badges, format::emoji, format::format, format::presence, format::title};

#[axum::debug_handler]
pub async fn rpc_websocket_handler(Path(id): Path<String>, ws: WebSocketUpgrade) -> Response {
    println!("WebSocket connection for ID: {}", id);
    ws.on_upgrade(move |socket| handle_websocket(socket, id))
}

async fn handle_websocket(mut socket: WebSocket, id: String) {
    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Close(_) => {
                    println!("WebSocket connection closed for ID: {}", id);
                    break;
                }
                _ => {}
            }
        } else {
            break;
        }
    }
}
