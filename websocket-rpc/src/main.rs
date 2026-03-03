use serenity::async_trait;
use serenity::model::prelude::*;
use serenity::prelude::*;
use websocket_rpc_rs::config::CONFIG;
use websocket_rpc_rs::server::server::start_server;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, ctx: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
        ctx.set_activity(Some(CONFIG.activity.clone()));
        ctx.shard.set_status(OnlineStatus::DoNotDisturb);
    }
}

#[tokio::main]
async fn main() {
    let token = CONFIG.token;
    let intents = GatewayIntents::all();

    let mut client = Client::builder(&token, intents)
        .event_handler(Handler)
        .await
        .expect("Err creating client");

    tokio::spawn(async {
        start_server(5000).await;
    });

    if let Err(why) = client.start().await {
        println!("Client error: {why:?}");
    }
}
