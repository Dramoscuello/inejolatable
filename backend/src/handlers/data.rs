use axum::{
    extract::{Path, Query, State},
    Json,
};
use chrono::{DateTime, Utc};

use crate::db::generate_id;
use crate::errors::AppError;
use crate::models::{
    CreateFieldRequest, CreateRecordRequest, CreateTableRequest, Field, PickerField,
    PickerQuery, PickerRecord, Record, RecordPickerResponse, Table, TableWithFields,
    UpdateFieldRequest, UpdateRecordRequest, UpdateTableRequest,
};
use crate::state::AppState;

pub async fn list_tables(
    State(state): State<AppState>,
    Path(base_id): Path<String>,
) -> Result<Json<Vec<Table>>, AppError> {
    let tables = sqlx::query_as::<_, Table>(
        "SELECT * FROM tables WHERE base_id = $1 ORDER BY order_position ASC",
    )
    .bind(&base_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar tablas: {e}")))?;

    Ok(Json(tables))
}

pub async fn create_table(
    State(state): State<AppState>,
    Path(base_id): Path<String>,
    Json(body): Json<CreateTableRequest>,
) -> Result<Json<Table>, AppError> {
    if body.name.trim().is_empty() {
        return Err(AppError::BadRequest("El nombre de la tabla es obligatorio".into()));
    }

    let base_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM bases WHERE id = $1)",
    )
    .bind(&base_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(false);

    if !base_exists {
        return Err(AppError::BadRequest("La base no existe".into()));
    }

    let next_order: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(order_position), 0) + 1 FROM tables WHERE base_id = $1",
    )
    .bind(&base_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(1);

    let id = generate_id("tbl");
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO tables (id, base_id, name, description, order_position, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#,
    )
    .bind(&id)
    .bind(&base_id)
    .bind(body.name.trim())
    .bind(&body.description)
    .bind(next_order)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al crear tabla: {e}")))?;

    let table = sqlx::query_as::<_, Table>("SELECT * FROM tables WHERE id = $1")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener tabla: {e}")))?;

    Ok(Json(table))
}

pub async fn get_table(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
) -> Result<Json<TableWithFields>, AppError> {
    let table = sqlx::query_as::<_, Table>("SELECT * FROM tables WHERE id = $1")
        .bind(&table_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener tabla: {e}")))?;

    let table = match table {
        Some(t) => t,
        None => return Err(AppError::BadRequest("Tabla no encontrada".into())),
    };

    let fields = sqlx::query_as::<_, Field>(
        "SELECT * FROM fields WHERE table_id = $1 ORDER BY order_position ASC",
    )
    .bind(&table_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener campos: {e}")))?;

    Ok(Json(TableWithFields {
        id: table.id,
        base_id: table.base_id,
        name: table.name,
        description: table.description,
        order_position: table.order_position,
        fields,
        created_at: table.created_at,
        updated_at: table.updated_at,
    }))
}

pub async fn update_table(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
    Json(body): Json<UpdateTableRequest>,
) -> Result<Json<Table>, AppError> {
    let existing = sqlx::query_as::<_, Table>("SELECT * FROM tables WHERE id = $1")
        .bind(&table_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener tabla: {e}")))?;

    let existing = match existing {
        Some(t) => t,
        None => return Err(AppError::BadRequest("Tabla no encontrada".into())),
    };

    let name = body.name.unwrap_or(existing.name);
    let description = body.description.or(existing.description);
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE tables SET name = $1, description = $2, updated_at = $3 WHERE id = $4
        "#,
    )
    .bind(&name)
    .bind(&description)
    .bind(now)
    .bind(&table_id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al actualizar tabla: {e}")))?;

    let table = sqlx::query_as::<_, Table>("SELECT * FROM tables WHERE id = $1")
        .bind(&table_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener tabla: {e}")))?;

    Ok(Json(table))
}

pub async fn delete_table(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM tables WHERE id = $1")
        .bind(&table_id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al eliminar tabla: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Tabla no encontrada".into()));
    }

    Ok(Json(serde_json::json!({"message": "Tabla eliminada correctamente"})))
}

pub async fn list_fields(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
) -> Result<Json<Vec<Field>>, AppError> {
    let fields = sqlx::query_as::<_, Field>(
        "SELECT * FROM fields WHERE table_id = $1 ORDER BY order_position ASC",
    )
    .bind(&table_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar campos: {e}")))?;

    Ok(Json(fields))
}

pub async fn create_field(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
    Json(body): Json<CreateFieldRequest>,
) -> Result<Json<Field>, AppError> {
    if body.name.trim().is_empty() {
        return Err(AppError::BadRequest("El nombre del campo es obligatorio".into()));
    }

    let next_order: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(order_position), 0) + 1 FROM fields WHERE table_id = $1",
    )
    .bind(&table_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(1);

    let id = generate_id("fld");
    let now = Utc::now();
    let is_primary = body.is_primary.unwrap_or(false);

    sqlx::query(
        r#"
        INSERT INTO fields (id, table_id, name, field_type, options_json, order_position, is_primary, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        "#,
    )
    .bind(&id)
    .bind(&table_id)
    .bind(body.name.trim())
    .bind(&body.field_type)
    .bind(&body.options_json)
    .bind(next_order)
    .bind(is_primary)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al crear campo: {e}")))?;

    let field = sqlx::query_as::<_, Field>("SELECT * FROM fields WHERE id = $1")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener campo: {e}")))?;

    Ok(Json(field))
}

pub async fn update_field(
    State(state): State<AppState>,
    Path(field_id): Path<String>,
    Json(body): Json<UpdateFieldRequest>,
) -> Result<Json<Field>, AppError> {
    let existing = sqlx::query_as::<_, Field>("SELECT * FROM fields WHERE id = $1")
        .bind(&field_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error: {e}")))?;

    let existing = match existing {
        Some(f) => f,
        None => return Err(AppError::BadRequest("Campo no encontrado".into())),
    };

    let name = body.name.unwrap_or(existing.name);
    let field_type = body.field_type.unwrap_or(existing.field_type);
    let options_json = body.options_json.or(existing.options_json);
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE fields SET name = $1, field_type = $2, options_json = $3, updated_at = $4
        WHERE id = $5
        "#,
    )
    .bind(&name)
    .bind(&field_type)
    .bind(&options_json)
    .bind(now)
    .bind(&field_id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al actualizar campo: {e}")))?;

    let field = sqlx::query_as::<_, Field>("SELECT * FROM fields WHERE id = $1")
        .bind(&field_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error: {e}")))?;

    Ok(Json(field))
}

pub async fn delete_field(
    State(state): State<AppState>,
    Path(field_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM fields WHERE id = $1")
        .bind(&field_id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al eliminar campo: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Campo no encontrado".into()));
    }

    Ok(Json(serde_json::json!({"message": "Campo eliminado correctamente"})))
}

pub async fn list_records(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
) -> Result<Json<Vec<Record>>, AppError> {
    let records = sqlx::query_as::<_, Record>(
        "SELECT * FROM records WHERE table_id = $1 ORDER BY created_at ASC",
    )
    .bind(&table_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al listar registros: {e}")))?;

    Ok(Json(records))
}

fn encode_cursor(created_at: &DateTime<Utc>, id: &str) -> String {
    let raw = format!("{}|{}", created_at.to_rfc3339(), id);
    raw.as_bytes()
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect()
}

fn decode_cursor(cursor: &str) -> Option<(DateTime<Utc>, String)> {
    if cursor.len() % 2 != 0 {
        return None;
    }
    let bytes = (0..cursor.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&cursor[i..i + 2], 16).ok())
        .collect::<Option<Vec<u8>>>()?;
    let raw = String::from_utf8(bytes).ok()?;
    let (ts, id) = raw.split_once('|')?;
    let dt = DateTime::parse_from_rfc3339(ts).ok()?.with_timezone(&Utc);
    Some((dt, id.to_string()))
}

pub async fn list_records_picker(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
    Query(params): Query<PickerQuery>,
) -> Result<Json<RecordPickerResponse>, AppError> {
    let table_name = sqlx::query_scalar::<_, String>("SELECT name FROM tables WHERE id = $1")
        .bind(&table_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener tabla: {e}")))?
        .ok_or_else(|| AppError::BadRequest("Tabla no encontrada".into()))?;

    let fields = sqlx::query_as::<_, Field>(
        "SELECT * FROM fields WHERE table_id = $1 ORDER BY order_position ASC",
    )
    .bind(&table_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al obtener campos: {e}")))?;

    if fields.is_empty() {
        return Err(AppError::BadRequest("Tabla no encontrada".into()));
    }

    let primary_idx = fields.iter().position(|f| f.is_primary).unwrap_or(0);
    let primary = &fields[primary_idx];
    let card_fields: Vec<&Field> = std::iter::once(primary)
        .chain(fields.iter().filter(|f| f.id != primary.id).take(4))
        .collect();

    let limit = params.limit.unwrap_or(20).clamp(1, 50);
    let search = params
        .search_query
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let mut qb = sqlx::QueryBuilder::<sqlx::Postgres>::new(
        "SELECT id, data_json, created_at FROM records WHERE table_id = ",
    );
    qb.push_bind(&table_id);

    if let Some(s) = search {
        let pattern = format!(
            "%{}%",
            s.replace('\\', r"\\").replace('%', r"\%").replace('_', r"\_")
        );
        qb.push(" AND (");
        let mut first = true;
        for f in card_fields.iter().filter(|f| f.field_type != "attachment") {
            if !first {
                qb.push(" OR ");
            }
            first = false;
            qb.push("data_json->>");
            qb.push_bind(f.id.clone());
            qb.push(" ILIKE ");
            qb.push_bind(pattern.clone());
        }
        if first {
            qb.push("FALSE");
        }
        qb.push(")");
    }

    if let Some(cursor) = params.cursor.as_deref().filter(|c| !c.is_empty()) {
        if let Some((ts, id)) = decode_cursor(cursor) {
            qb.push(" AND (created_at, id) > (");
            qb.push_bind(ts);
            qb.push(", ");
            qb.push_bind(id);
            qb.push(")");
        }
    }

    qb.push(" ORDER BY created_at ASC, id ASC LIMIT ");
    qb.push_bind(limit + 1);

    let rows = qb
        .build_query_as::<(String, serde_json::Value, DateTime<Utc>)>()
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al listar registros: {e}")))?;

    let has_more = rows.len() as i64 > limit;
    let page = &rows[..rows.len().min(limit as usize)];

    let next_cursor = if has_more {
        page.last()
            .map(|(_, _, created_at)| created_at)
            .and_then(|ts| page.last().map(|(id, _, _)| encode_cursor(ts, id)))
    } else {
        None
    };

    let records: Vec<PickerRecord> = page
        .iter()
        .map(|(id, data_json, _)| {
            let projected = serde_json::Map::from_iter(card_fields.iter().filter_map(|f| {
                data_json
                    .get(&f.id)
                    .map(|v| (f.id.clone(), v.clone()))
            }));
            PickerRecord {
                id: id.clone(),
                fields: serde_json::Value::Object(projected),
            }
        })
        .collect();

    Ok(Json(RecordPickerResponse {
        table_name,
        fields: card_fields
            .into_iter()
            .cloned()
            .map(PickerField::from)
            .collect(),
        records,
        next_cursor,
    }))
}

pub async fn create_record(
    State(state): State<AppState>,
    Path(table_id): Path<String>,
    Json(body): Json<CreateRecordRequest>,
) -> Result<Json<Record>, AppError> {
    let id = generate_id("rec");
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO records (id, table_id, data_json, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(&id)
    .bind(&table_id)
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

pub async fn update_record(
    State(state): State<AppState>,
    Path(record_id): Path<String>,
    Json(body): Json<UpdateRecordRequest>,
) -> Result<Json<Record>, AppError> {
    let now = Utc::now();

    let existing = sqlx::query_as::<_, Record>("SELECT * FROM records WHERE id = $1")
        .bind(&record_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener registro: {e}")))?;

    let existing = existing.ok_or_else(|| AppError::BadRequest("Registro no encontrado".into()))?;

    let mut merged = existing.data_json.clone();
    if let (serde_json::Value::Object(ref mut m), serde_json::Value::Object(update)) =
        (&mut merged, &body.data_json)
    {
        for (k, v) in update {
            m.insert(k.clone(), v.clone());
        }
    } else {
        merged = body.data_json.clone();
    }

    sqlx::query(
        r#"
        UPDATE records SET data_json = $1, updated_at = $2 WHERE id = $3
        "#,
    )
    .bind(&merged)
    .bind(now)
    .bind(&record_id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al actualizar registro: {e}")))?;

    let record = sqlx::query_as::<_, Record>("SELECT * FROM records WHERE id = $1")
        .bind(&record_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al obtener registro: {e}")))?;

    Ok(Json(record))
}

pub async fn delete_record(
    State(state): State<AppState>,
    Path(record_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM records WHERE id = $1")
        .bind(&record_id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Error al eliminar registro: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Registro no encontrado".into()));
    }

    Ok(Json(serde_json::json!({"message": "Registro eliminado correctamente"})))
}
