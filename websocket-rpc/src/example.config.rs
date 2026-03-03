use serenity::model::gateway::ActivityType;
use serenity::model::user::OnlineStatus;

pub struct Config {
    pub token: &'static str,
    pub presence_text: &'static str,
    pub presence_type: ActivityType,
    pub status: OnlineStatus,
}

pub const CONFIG: Config = Config {
    token: "",
    presence_text: "Balls!",
    presence_type: ActivityType::Playing,
    status: OnlineStatus::Online,
};