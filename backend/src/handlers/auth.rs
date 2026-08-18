use axum::{extract::State, Json};

use crate::config::Config;
use crate::errors::AppError;
use crate::models::{
    AuthResponse, Claims, LoginRequest, RefreshRequest, RegisterRequest, User, UserResponse,
};
use crate::state::AppState;

pub(crate) fn validate_password(password: &str) -> Result<(), AppError> {
    if password.len() < 8 {
        return Err(AppError::BadRequest(
            "La contraseña debe tener al menos 8 caracteres".into(),
        ));
    }
    if !password.chars().any(|c| c.is_alphabetic()) {
        return Err(AppError::BadRequest(
            "La contraseña debe contener al menos 1 letra".into(),
        ));
    }
    if !password.chars().any(|c| c.is_numeric()) {
        return Err(AppError::BadRequest(
            "La contraseña debe contener al menos 1 número".into(),
        ));
    }
    Ok(())
}

fn generate_tokens(user: &User, config: &Config) -> Result<(String, String), AppError> {
    let now = chrono::Utc::now();
    let access_exp = now + chrono::Duration::seconds(config.jwt_expiration);
    let refresh_exp = now + chrono::Duration::days(7);

    let access_claims = Claims {
        sub: user.id,
        email: user.email.clone(),
        role: user.role,
        exp: access_exp.timestamp() as usize,
        iat: now.timestamp() as usize,
        token_type: "access".into(),
    };

    let refresh_claims = Claims {
        sub: user.id,
        email: user.email.clone(),
        role: user.role,
        exp: refresh_exp.timestamp() as usize,
        iat: now.timestamp() as usize,
        token_type: "refresh".into(),
    };

    let access_token = jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &access_claims,
        &jsonwebtoken::EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )
    .map_err(|_| AppError::Internal("Failed to generate access token".into()))?;

    let refresh_token = jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &refresh_claims,
        &jsonwebtoken::EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )
    .map_err(|_| AppError::Internal("Failed to generate refresh token".into()))?;

    Ok((access_token, refresh_token))
}

pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    if body.first_name.trim().is_empty() {
        return Err(AppError::BadRequest("El nombre es obligatorio".into()));
    }
    if body.last_name.trim().is_empty() {
        return Err(AppError::BadRequest("El apellido es obligatorio".into()));
    }
    if body.email.trim().is_empty() {
        return Err(AppError::BadRequest("El correo es obligatorio".into()));
    }
    if body.password != body.confirm_password {
        return Err(AppError::BadRequest(
            "Las contraseñas no coinciden".into(),
        ));
    }
    validate_password(&body.password)?;

    let existing = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
    )
    .bind(&body.email)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error de base de datos: {e}")))?;

    if existing {
        return Err(AppError::Conflict(
            "El correo ya está registrado".into(),
        ));
    }

    let hash = bcrypt::hash(&body.password, 10)
        .map_err(|_| AppError::Internal("Error al procesar la contraseña".into()))?;

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (first_name, last_name, email, password_hash, role, state)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(&body.first_name)
    .bind(&body.last_name)
    .bind(&body.email)
    .bind(&hash)
    .bind(2i16)
    .bind(true)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error al crear usuario: {e}")))?;

    let (access_token, refresh_token) = generate_tokens(&user, &state.config)?;

    Ok(Json(AuthResponse {
        user: UserResponse::from(user),
        access_token,
        refresh_token,
    }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1",
    )
    .bind(&body.email)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error de base de datos: {e}")))?;

    let user = match user {
        Some(u) => u,
        None => {
            return Err(AppError::Unauthorized(
                "Correo o contraseña incorrectos".into(),
            ))
        }
    };

    let valid = bcrypt::verify(&body.password, &user.password_hash)
        .unwrap_or(false);

    if !valid {
        return Err(AppError::Unauthorized(
            "Correo o contraseña incorrectos".into(),
        ));
    }

    if !user.state {
        return Err(AppError::Unauthorized(
            "La cuenta está desactivada".into(),
        ));
    }

    let (access_token, refresh_token) = generate_tokens(&user, &state.config)?;

    Ok(Json(AuthResponse {
        user: UserResponse::from(user),
        access_token,
        refresh_token,
    }))
}

pub async fn refresh(
    State(state): State<AppState>,
    Json(body): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let token_data = jsonwebtoken::decode::<Claims>(
        &body.refresh_token,
        &jsonwebtoken::DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &jsonwebtoken::Validation::default(),
    )
    .map_err(|_| AppError::Unauthorized("Token inválido o expirado".into()))?;

    if token_data.claims.token_type != "refresh" {
        return Err(AppError::Unauthorized("Tipo de token inválido".into()));
    }

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1",
    )
    .bind(token_data.claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Error de base de datos: {e}")))?;

    let user = match user {
        Some(u) => u,
        None => return Err(AppError::Unauthorized("Usuario no encontrado".into())),
    };

    if !user.state {
        return Err(AppError::Unauthorized("La cuenta está desactivada".into()));
    }

    let (access_token, refresh_token) = generate_tokens(&user, &state.config)?;

    Ok(Json(AuthResponse {
        user: UserResponse::from(user),
        access_token,
        refresh_token,
    }))
}
