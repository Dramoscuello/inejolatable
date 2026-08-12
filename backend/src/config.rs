use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration: i64,
    pub admin_email: String,
    pub admin_password: String,
    pub admin_name: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "900".into())
                .parse()
                .expect("JWT_EXPIRATION must be a number"),
            admin_email: env::var("ADMIN_EMAIL")
                .expect("ADMIN_EMAIL must be set"),
            admin_password: env::var("ADMIN_PASSWORD")
                .expect("ADMIN_PASSWORD must be set"),
            admin_name: env::var("ADMIN_NAME")
                .unwrap_or_else(|_| "Admin User".into()),
        }
    }
}
