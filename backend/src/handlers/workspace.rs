use axum::{
    extract::{Path, State},
    Extension, Json,
};
use chrono::Utc;

use crate::db::generate_id;
use crate::errors::AppError;
use crate::models::{Claims, CreateWorkspaceRequest, UpdateWorkspaceRequest, Workspace};
use crate::state::AppState;

pub async fn list_workspaces(
    State(state): State<AppState>,
    claims: Extension<Claims>,
) -> Result<Json<Vec<Workspace>>, AppError> {
    let user_id = claims.sub;
    let workspaces = sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar espacios de trabajo: {e}")))?;

    Ok(Json(workspaces))
}

pub async fn create_workspace(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Json(body): Json<CreateWorkspaceRequest>,
) -> Result<Json<Workspace>, AppError> {
    if body.name.trim().is_empty() {
        return Err(AppError::BadRequest(
            "El nombre del espacio de trabajo es obligatorio".into(),
        ));
    }

    let id = generate_id("wsp");
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO workspaces (id, name, description, user_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
    )
    .bind(&id)
    .bind(body.name.trim())
    .bind(&body.description)
    .bind(claims.sub)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al crear espacio de trabajo: {e}")))?;

    let workspace = sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE id = $1",
    )
    .bind(&id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener espacio de trabajo: {e}")))?;

    Ok(Json(workspace))
}

pub async fn get_workspace(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<Workspace>, AppError> {
    let workspace = sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)",
    )
    .bind(&id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener espacio de trabajo: {e}")))?;

    match workspace {
        Some(w) => Ok(Json(w)),
        None => Err(AppError::BadRequest("Espacio de trabajo no encontrado".into())),
    }
}

pub async fn update_workspace(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<String>,
    Json(body): Json<UpdateWorkspaceRequest>,
) -> Result<Json<Workspace>, AppError> {
    let existing = sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)",
    )
    .bind(&id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener espacio de trabajo: {e}")))?;

    let existing = match existing {
        Some(w) => w,
        None => return Err(AppError::BadRequest("Espacio de trabajo no encontrado".into())),
    };

    let name = body.name.unwrap_or(existing.name);
    let description = body.description.or(existing.description);
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE workspaces SET name = $1, description = $2, updated_at = $3
        WHERE id = $4
        "#,
    )
    .bind(&name)
    .bind(&description)
    .bind(now)
    .bind(&id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al actualizar espacio de trabajo: {e}")))?;

    let workspace = sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE id = $1",
    )
    .bind(&id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener espacio de trabajo: {e}")))?;

    Ok(Json(workspace))
}

pub async fn delete_workspace(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM workspaces WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)")
        .bind(&id)
        .bind(claims.sub)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al eliminar espacio de trabajo: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Espacio de trabajo no encontrado".into()));
    }

    Ok(Json(serde_json::json!({"message": "Espacio de trabajo eliminado correctamente"})))
}
