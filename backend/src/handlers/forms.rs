use axum::{
    extract::{Path, State},
    Json,
};
use crate::errors::AppError;
use crate::models::{
    CreateFormRequest, Field, Form, FormSubmitRequest, Record, UpdateFormRequest,
};
use crate::state::AppState;
use rand::Rng;
use serde::Serialize;

#[derive(Serialize)]
pub struct PublicForm {
    id: String,
    name: String,
    description: Option<String>,
    config_json: serde_json::Value,
    table_id: String,
    fields: Vec<Field>,
}

pub async fn get_form_by_hash(
    State(state): State<AppState>,
    Path(hash): Path<String>,
) -> Result<Json<PublicForm>, AppError> {
    let form = sqlx::query_as::<_, Form>("SELECT * FROM forms WHERE public_hash = $1")
        .bind(&hash)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener formulario: {e}")))?
        .ok_or_else(|| AppError::BadRequest("Formulario no encontrado".into()))?;

    let fields = sqlx::query_as::<_, Field>(
        "SELECT * FROM fields WHERE table_id = $1 ORDER BY order_position ASC",
    )
    .bind(&form.table_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener campos: {e}")))?;

    Ok(Json(PublicForm {
        id: form.id,
        name: form.name,
        description: form.description,
        config_json: form.config_json,
        table_id: form.table_id,
        fields,
    }))
}

fn generate_public_hash() -> String {
    let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyz0123456789".chars().collect();
    let mut rng = rand::thread_rng();
    (0..14).map(|_| chars[rng.gen_range(0..chars.len())]).collect()
}

pub async fn list_forms_by_base(
    State(state): State<AppState>,
    Path(base_id): Path<String>,
) -> Result<Json<Vec<Form>>, AppError> {
    let forms = sqlx::query_as::<_, Form>(
        r#"
        SELECT f.* FROM forms f
        INNER JOIN tables t ON f.table_id = t.id
        WHERE t.base_id = $1
        ORDER BY f.created_at DESC
        "#,
    )
    .bind(&base_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar formularios: {e}")))?;

    Ok(Json(forms))
}

pub async fn create_form(
    State(state): State<AppState>,
    Json(body): Json<CreateFormRequest>,
) -> Result<Json<Form>, AppError> {
    let id = crate::db::generate_id("frm");
    let now = chrono::Utc::now();

    sqlx::query_as::<_, Form>(
        r#"
        INSERT INTO forms (id, table_id, name, description, config_json, created_at, updated_at)
        VALUES ($1, $2, $3, $4, '{}', $5, $6)
        RETURNING *
        "#,
    )
    .bind(&id)
    .bind(&body.table_id)
    .bind(&body.name)
    .bind(&body.description)
    .bind(now)
    .bind(now)
    .fetch_one(&state.pool)
    .await
    .map(Json)
    .map_err(|e| AppError::Internal(format!("Error al crear formulario: {e}")))
}

pub async fn get_form(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Form>, AppError> {
    sqlx::query_as::<_, Form>("SELECT * FROM forms WHERE id = $1")
        .bind(&id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener formulario: {e}")))?
        .map(Json)
        .ok_or_else(|| AppError::BadRequest("Formulario no encontrado".into()))
}

pub async fn update_form(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateFormRequest>,
) -> Result<Json<Form>, AppError> {
    let now = chrono::Utc::now();
    let existing = sqlx::query_as::<_, Form>("SELECT * FROM forms WHERE id = $1")
        .bind(&id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener formulario: {e}")))?
        .ok_or_else(|| AppError::BadRequest("Formulario no encontrado".into()))?;

    let name = body.name.unwrap_or(existing.name);
    let description = body.description.or(existing.description);
    let config_json = body.config_json.unwrap_or(existing.config_json);

    let form = sqlx::query_as::<_, Form>(
        r#"
        UPDATE forms SET name = $1, description = $2, config_json = $3, updated_at = $4
        WHERE id = $5
        RETURNING *
        "#,
    )
    .bind(&name)
    .bind(&description)
    .bind(&config_json)
    .bind(now)
    .bind(&id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al actualizar formulario: {e}")))?;

    Ok(Json(form))
}

pub async fn publish_form(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Form>, AppError> {
    let hash = generate_public_hash();
    let now = chrono::Utc::now();

    let form = sqlx::query_as::<_, Form>(
        r#"
        UPDATE forms SET public_hash = $1, updated_at = $2
        WHERE id = $3
        RETURNING *
        "#,
    )
    .bind(&hash)
    .bind(now)
    .bind(&id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al publicar formulario: {e}")))?
    .ok_or_else(|| AppError::BadRequest("Formulario no encontrado".into()))?;

    Ok(Json(form))
}

pub async fn form_submit(
    State(state): State<AppState>,
    Path(hash): Path<String>,
    Json(body): Json<FormSubmitRequest>,
) -> Result<Json<Record>, AppError> {
    let form = sqlx::query_as::<_, Form>("SELECT * FROM forms WHERE public_hash = $1")
        .bind(&hash)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al buscar formulario: {e}")))?
        .ok_or_else(|| AppError::BadRequest("Formulario no encontrado".into()))?;

    let id = crate::db::generate_id("rec");
    let now = chrono::Utc::now();

    sqlx::query(
        r#"
        INSERT INTO records (id, table_id, data_json, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(&id)
    .bind(&form.table_id)
    .bind(&body.data_json)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al crear registro: {e}")))?;

    let record = sqlx::query_as::<_, Record>("SELECT * FROM records WHERE id = $1")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener registro: {e}")))?;

    Ok(Json(record))
}

pub async fn delete_form(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM forms WHERE id = $1")
        .bind(&id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al eliminar formulario: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Formulario no encontrado".into()));
    }

    Ok(Json(serde_json::json!({"message": "Formulario eliminado correctamente"})))
}
