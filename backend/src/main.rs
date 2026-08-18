mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod state;

use axum::{
    extract::DefaultBodyLimit,
    routing::{get, patch, post},
    Router,
};
use handlers::workspace::{
    create_workspace, delete_workspace, get_workspace, list_workspaces, update_workspace,
};
use handlers::base::{
    create_base, delete_base, get_base, list_bases, list_workspace_bases, update_base,
};
use handlers::data::{
    create_field, create_record, create_table, delete_field, delete_record, delete_table,
    get_table, list_fields, list_records, list_records_picker, list_tables, update_field,
    update_record, update_table,
};
use handlers::forms::{
    create_form, delete_form, form_submit, get_form, get_form_by_hash,
    list_forms_by_base, publish_form, update_form,
};
use handlers::admin::{delete_user, list_users, update_user};
use state::AppState;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    dotenvy::dotenv().ok();
    let config = config::Config::from_env();

    tracing::info!("Conectando a PostgreSQL...");
    let pool = db::create_pool(&config.database_url).await;

    tracing::info!("Ejecutando migraciones...");
    db::run_migrations(&pool).await;

    tracing::info!("Verificando seed de admin...");
    db::seed_admin(&pool, &config.admin_email, &config.admin_password, &config.admin_name).await;

    tracing::info!("Verificando seed de workspace por defecto...");
    db::seed_default_workspace(&pool).await;

    tracing::info!("Verificando seed de base por defecto...");
    db::seed_default_base(&pool).await;

    let state = AppState {
        pool,
        config: config.clone(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let public_routes = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/api/v1/auth/register", post(handlers::auth::register))
        .route("/api/v1/auth/login", post(handlers::auth::login))
        .route("/api/v1/auth/refresh", post(handlers::auth::refresh))
        .route("/api/v1/f/{hash}", get(get_form_by_hash).post(form_submit))
        .route("/api/v1/f/picker/{table_id}", get(list_records_picker));

    let protected_routes = Router::new()
        .route("/api/v1/bases", get(list_bases))
        .route(
            "/api/v1/workspaces/{id}/bases",
            get(list_workspace_bases).post(create_base),
        )
        .route(
            "/api/v1/bases/{id}",
            get(get_base).patch(update_base).delete(delete_base),
        )
        .route(
            "/api/v1/bases/{base_id}/tables",
            get(list_tables).post(create_table),
        )
        .route(
            "/api/v1/tables/{table_id}",
            get(get_table).patch(update_table).delete(delete_table),
        )
        .route(
            "/api/v1/tables/{table_id}/fields",
            get(list_fields).post(create_field),
        )
        .route(
            "/api/v1/fields/{field_id}",
            patch(update_field).delete(delete_field),
        )
        .route(
            "/api/v1/tables/{table_id}/records",
            get(list_records).post(create_record),
        )
        .route(
            "/api/v1/tables/{table_id}/records/picker",
            get(list_records_picker),
        )
        .route(
            "/api/v1/records/{record_id}",
            patch(update_record).delete(delete_record),
        )
        .route("/api/v1/workspaces", get(list_workspaces).post(create_workspace))
        .route(
            "/api/v1/workspaces/{id}",
            get(get_workspace)
                .patch(update_workspace)
                .delete(delete_workspace),
        )
        .route("/api/v1/forms", post(create_form))
        .route(
            "/api/v1/forms/{id}",
            get(get_form).patch(update_form).delete(delete_form),
        )
        .route("/api/v1/forms/{id}/publish", post(publish_form))
        .route("/api/v1/bases/{base_id}/forms", get(list_forms_by_base))
        .route("/api/v1/admin/users", get(list_users))
        .route(
            "/api/v1/admin/users/{id}",
            patch(update_user).delete(delete_user),
        )
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            middleware::auth::jwt_auth,
        ));

    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(DefaultBodyLimit::max(20 * 1024 * 1024))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    tracing::info!("Servidor iniciado en http://{addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
