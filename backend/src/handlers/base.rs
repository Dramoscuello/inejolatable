use axum::{
    extract::{Path, State},
    Extension, Json,
};
use chrono::Utc;

use crate::db::generate_id;
use crate::errors::AppError;
use crate::models::{Base, BaseWithWorkspace, Claims, CreateBaseRequest, UpdateBaseRequest};
use crate::state::AppState;

pub async fn list_bases(
    State(state): State<AppState>,
    claims: Extension<Claims>,
) -> Result<Json<Vec<BaseWithWorkspace>>, AppError> {
    let user_id = claims.sub;
    let bases = sqlx::query_as::<_, BaseWithWorkspace>(
        r#"
        SELECT b.id, b.workspace_id, w.name as workspace_name,
               b.name, b.icon, b.color, b.description,
               b.created_at, b.updated_at
        FROM bases b
        JOIN workspaces w ON w.id = b.workspace_id
        WHERE b.user_id = $1 OR b.user_id IS NULL
        ORDER BY b.created_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar bases: {e}")))?;

    Ok(Json(bases))
}

pub async fn list_workspace_bases(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(workspace_id): Path<String>,
) -> Result<Json<Vec<Base>>, AppError> {
    let user_id = claims.sub;
    let bases = sqlx::query_as::<_, Base>(
        "SELECT * FROM bases WHERE workspace_id = $1 AND (user_id = $2 OR user_id IS NULL) ORDER BY created_at DESC",
    )
    .bind(&workspace_id)
    .bind(user_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar bases: {e}")))?;

    Ok(Json(bases))
}

pub async fn create_base(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(workspace_id): Path<String>,
    Json(body): Json<CreateBaseRequest>,
) -> Result<Json<Base>, AppError> {
    if body.name.trim().is_empty() {
        return Err(AppError::BadRequest("El nombre de la base es obligatorio".into()));
    }

    let workspace_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM workspaces WHERE id = $1)",
    )
    .bind(&workspace_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(false);

    if !workspace_exists {
        return Err(AppError::BadRequest("El espacio de trabajo no existe".into()));
    }

    let id = generate_id("app");
    let now = Utc::now();
    let icon = body.icon.unwrap_or_else(|| "📋".into());
    let color = body.color.unwrap_or_else(|| "blue".into());

    sqlx::query(
        r#"
        INSERT INTO bases (id, workspace_id, name, icon, color, description, user_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        "#,
    )
    .bind(&id)
    .bind(&workspace_id)
    .bind(body.name.trim())
    .bind(&icon)
    .bind(&color)
    .bind(&body.description)
    .bind(claims.sub)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al crear base: {e}")))?;

    let base = sqlx::query_as::<_, Base>("SELECT * FROM bases WHERE id = $1")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener base: {e}")))?;

    Ok(Json(base))
}

pub async fn get_base(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<Base>, AppError> {
    let base = sqlx::query_as::<_, Base>(
        "SELECT * FROM bases WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)",
    )
    .bind(&id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener base: {e}")))?;

    match base {
        Some(b) => Ok(Json(b)),
        None => Err(AppError::BadRequest("Base no encontrada".into())),
    }
}

pub async fn update_base(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<String>,
    Json(body): Json<UpdateBaseRequest>,
) -> Result<Json<Base>, AppError> {
    let existing = sqlx::query_as::<_, Base>(
        "SELECT * FROM bases WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)",
    )
    .bind(&id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener base: {e}")))?;

    let existing = match existing {
        Some(b) => b,
        None => return Err(AppError::BadRequest("Base no encontrada".into())),
    };

    let name = body.name.unwrap_or(existing.name);
    let icon = body.icon.unwrap_or(existing.icon);
    let color = body.color.unwrap_or(existing.color);
    let description = body.description.or(existing.description);
    let now = Utc::now();

    sqlx::query(
        r#"UPDATE bases SET name = $1, icon = $2, color = $3, description = $4, updated_at = $5 WHERE id = $6"#,
    )
    .bind(&name)
    .bind(&icon)
    .bind(&color)
    .bind(&description)
    .bind(now)
    .bind(&id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al actualizar base: {e}")))?;

    let base = sqlx::query_as::<_, Base>("SELECT * FROM bases WHERE id = $1")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener base: {e}")))?;

    Ok(Json(base))
}

pub async fn delete_base(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query(
        "DELETE FROM bases WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)",
    )
    .bind(&id)
    .bind(claims.sub)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al eliminar base: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Base no encontrada".into()));
    }

    Ok(Json(serde_json::json!({"message": "Base eliminada correctamente"})))
}
