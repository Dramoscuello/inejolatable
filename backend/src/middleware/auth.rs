use axum::{extract::{Request, State}, http::StatusCode, middleware::Next, response::IntoResponse, response::Response, Json};
use crate::models::{Claims, ErrorResponse};
use crate::state::AppState;

#[allow(dead_code)]
pub async fn jwt_auth(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let secret = &state.config.jwt_secret;

    let header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    let token = match header {
        Some(t) => t,
        None => {
            let body = Json(ErrorResponse {
                error: "Token no proporcionado".into(),
            });
            return Ok((StatusCode::UNAUTHORIZED, body).into_response());
        }
    };

    let token_data = match jsonwebtoken::decode::<Claims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::default(),
    ) {
        Ok(data) => data,
        Err(_) => {
            let body = Json(ErrorResponse {
                error: "Token inválido o expirado".into(),
            });
            return Ok((StatusCode::UNAUTHORIZED, body).into_response());
        }
    };

    if token_data.claims.token_type != "access" {
        let body = Json(ErrorResponse {
            error: "Tipo de token inválido".into(),
        });
        return Ok((StatusCode::UNAUTHORIZED, body).into_response());
    }

    req.extensions_mut().insert(token_data.claims);
    Ok(next.run(req).await)
}
