use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct User {
    pub id: i32,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: i16,
    pub state: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub role: i16,
    pub state: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            role: u.role,
            state: u.state,
            created_at: u.created_at,
            updated_at: u.updated_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub password: String,
    pub confirm_password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,
    pub email: String,
    pub role: i16,
    pub exp: usize,
    pub iat: usize,
    pub token_type: String,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkspaceRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorkspaceRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Base {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct BaseWithWorkspace {
    pub id: String,
    pub workspace_id: String,
    pub workspace_name: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBaseRequest {
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBaseRequest {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Table {
    pub id: String,
    pub base_id: String,
    pub name: String,
    pub description: Option<String>,
    pub order_position: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTableRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTableRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Field {
    pub id: String,
    pub table_id: String,
    pub name: String,
    pub field_type: String,
    pub options_json: Option<serde_json::Value>,
    pub order_position: i32,
    pub is_primary: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFieldRequest {
    pub name: String,
    pub field_type: String,
    pub options_json: Option<serde_json::Value>,
    pub is_primary: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFieldRequest {
    pub name: Option<String>,
    pub field_type: Option<String>,
    pub options_json: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Record {
    pub id: String,
    pub table_id: String,
    pub data_json: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecordRequest {
    pub data_json: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRecordRequest {
    pub data_json: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct PickerField {
    pub id: String,
    pub name: String,
    pub field_type: String,
    pub options_json: Option<serde_json::Value>,
    pub is_primary: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PickerQuery {
    pub search_query: Option<String>,
    pub limit: Option<i64>,
    pub cursor: Option<String>,
}

impl From<Field> for PickerField {
    fn from(f: Field) -> Self {
        Self {
            id: f.id,
            name: f.name,
            field_type: f.field_type,
            options_json: f.options_json,
            is_primary: f.is_primary,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct PickerRecord {
    pub id: String,
    pub fields: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct RecordPickerResponse {
    pub fields: Vec<PickerField>,
    pub records: Vec<PickerRecord>,
    pub next_cursor: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TableWithFields {
    pub id: String,
    pub base_id: String,
    pub name: String,
    pub description: Option<String>,
    pub order_position: i32,
    pub fields: Vec<Field>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Form {
    pub id: String,
    pub table_id: String,
    pub name: String,
    pub description: Option<String>,
    pub config_json: serde_json::Value,
    pub public_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFormRequest {
    pub table_id: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFormRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub config_json: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct FormSubmitRequest {
    pub data_json: serde_json::Value,
}
