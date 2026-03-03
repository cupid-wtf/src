use axum::{
    Router, routing::{any},
};
use tower_http::cors::{CorsLayer, Any};

use crate::server::rpc::rpc_websocket_handler;

pub async fn start_server(port: u64) {
    println!("REST API started on http://0.0.0.0:{}", port);
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any); 
    let app = Router::new()
        .route("/rpc/{id}", any(rpc_websocket_handler))
        .layer(cors);
    
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    
    axum::serve(listener, app).await.unwrap();
}