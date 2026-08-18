use axum::{
    extract::{Path, State},
    Extension, Json,
};
use chrono::Utc;

use crate::errors::AppError;
use crate::handlers::auth::validate_password;
use crate::models::{Claims, UpdateUserRequest, User, UserResponse};
use crate::state::AppState;

fn require_admin(claims: &Claims) -> Result<(), AppError> {
    if claims.role != 1 {
        return Err(AppError::Forbidden(
            "Se requieren permisos de administrador".into(),
        ));
    }
    Ok(())
}

pub async fn list_users(
    State(state): State<AppState>,
    claims: Extension<Claims>,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    require_admin(&claims)?;

    let users = sqlx::query_as::<_, User>(
        "SELECT * FROM users ORDER BY created_at DESC",
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar usuarios: {e}")))?;

    Ok(Json(users.into_iter().map(UserResponse::from).collect()))
}

pub async fn update_user(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<i32>,
    Json(body): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    require_admin(&claims)?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener usuario: {e}")))?;

    let user = match user {
        Some(u) => u,
        None => return Err(AppError::BadRequest("Usuario no encontrado".into())),
    };

    if user.role == 1 {
        return Err(AppError::Forbidden(
            "No puedes modificar a otro administrador".into(),
        ));
    }

    let first_name = match body.first_name {
        Some(v) if v.trim().is_empty() => {
            return Err(AppError::BadRequest("El nombre es obligatorio".into()))
        }
        Some(v) => v.trim().to_string(),
        None => user.first_name,
    };
    let last_name = match body.last_name {
        Some(v) if v.trim().is_empty() => {
            return Err(AppError::BadRequest("El apellido es obligatorio".into()))
        }
        Some(v) => v.trim().to_string(),
        None => user.last_name,
    };

    let password_hash = match body.password {
        Some(p) => {
            validate_password(&p)?;
            bcrypt::hash(&p, 10)
                .map_err(|_| AppError::Internal("Error al procesar la contraseña".into()))?
        }
        None => user.password_hash,
    };

    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE users SET first_name = $1, last_name = $2, password_hash = $3, updated_at = $4
        WHERE id = $5
        "#,
    )
    .bind(&first_name)
    .bind(&last_name)
    .bind(&password_hash)
    .bind(now)
    .bind(id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al actualizar usuario: {e}")))?;

    let updated = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener usuario: {e}")))?;

    Ok(Json(UserResponse::from(updated)))
}

pub async fn delete_user(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Path(id): Path<i32>,
) -> Result<Json<UserResponse>, AppError> {
    require_admin(&claims)?;

    if id == claims.sub {
        return Err(AppError::BadRequest(
            "No puedes eliminarte a ti mismo".into(),
        ));
    }

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener usuario: {e}")))?;

    let user = match user {
        Some(u) => u,
        None => return Err(AppError::BadRequest("Usuario no encontrado".into())),
    };

    if user.role == 1 {
        return Err(AppError::Forbidden(
            "No puedes eliminar a otro administrador".into(),
        ));
    }

    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al eliminar usuario: {e}")))?;

    Ok(Json(UserResponse::from(user)))
}
