use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub async fn create_pool(database_url: &str) -> PgPool {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
        .expect("Failed to connect to PostgreSQL")
}

pub async fn run_migrations(pool: &PgPool) {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role SMALLINT NOT NULL DEFAULT 2,
            state BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run users migration");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS workspaces (
            id VARCHAR(17) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run workspaces migration");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS bases (
            id VARCHAR(17) PRIMARY KEY,
            workspace_id VARCHAR(17) NOT NULL REFERENCES workspaces(id),
            name VARCHAR(255) NOT NULL,
            icon VARCHAR(10) NOT NULL DEFAULT '📋',
            color VARCHAR(50) NOT NULL DEFAULT 'blue',
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run bases migration");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tables (
            id VARCHAR(17) PRIMARY KEY,
            base_id VARCHAR(17) NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            order_position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run tables migration");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS fields (
            id VARCHAR(17) PRIMARY KEY,
            table_id VARCHAR(17) NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            field_type VARCHAR(50) NOT NULL DEFAULT 'singleLineText',
            options_json JSONB,
            order_position INTEGER NOT NULL DEFAULT 0,
            is_primary BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run fields migration");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS records (
            id VARCHAR(17) PRIMARY KEY,
            table_id VARCHAR(17) NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
            data_json JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run records migration");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS forms (
            id VARCHAR(17) PRIMARY KEY,
            table_id VARCHAR(17) NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            config_json JSONB NOT NULL DEFAULT '{}',
            public_hash VARCHAR(32) UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run forms migration");

    sqlx::query("ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)")
        .execute(pool)
        .await
        .ok();

    sqlx::query("ALTER TABLE bases ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)")
        .execute(pool)
        .await
        .ok();
}

pub async fn seed_admin(pool: &PgPool, email: &str, password: &str, name: &str) {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
    )
    .bind(email)
    .fetch_one(pool)
    .await
    .unwrap_or(false);

    if exists {
        tracing::info!("Admin user already exists, skipping seed");
        return;
    }

    let hash = bcrypt::hash(password, 10).expect("Failed to hash admin password");

    let parts: Vec<&str> = name.split_whitespace().collect();
    let first_name = parts.first().copied().unwrap_or("Admin");
    let last_name = if parts.len() > 1 {
        parts[1..].join(" ")
    } else {
        "User".to_string()
    };

    sqlx::query(
        r#"
        INSERT INTO users (first_name, last_name, email, password_hash, role, state)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
    )
    .bind(&first_name)
    .bind(&last_name)
    .bind(email)
    .bind(&hash)
    .bind(1i16)
    .bind(true)
    .execute(pool)
    .await
    .expect("Failed to seed admin user");

    tracing::info!("Admin user seeded: {email} ({first_name} {last_name})");
}

pub async fn seed_default_workspace(pool: &PgPool) {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM workspaces WHERE name = 'Mi espacio de trabajo')",
    )
    .fetch_one(pool)
    .await
    .unwrap_or(false);

    if exists {
        tracing::info!("Default workspace already exists, skipping seed");
        return;
    }

    let id = generate_id("wsp");

    sqlx::query(
        r#"
        INSERT INTO workspaces (id, name, description, user_id)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(&id)
    .bind("Mi espacio de trabajo")
    .bind("Espacio de trabajo por defecto")
    .bind(1i32)
    .execute(pool)
    .await
    .expect("Failed to seed default workspace");

    tracing::info!("Default workspace seeded: {id}");
}

pub async fn seed_default_base(pool: &PgPool) {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM bases)",
    )
    .fetch_one(pool)
    .await
    .unwrap_or(false);

    if exists {
        tracing::info!("Bases already exist, skipping seed");
        return;
    }

    let workspace_id = sqlx::query_scalar::<_, String>(
        "SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1",
    )
    .fetch_one(pool)
    .await
    .unwrap_or_default();

    if workspace_id.is_empty() {
        tracing::warn!("No workspace found to seed base into");
        return;
    }

    let id = generate_id("app");
    sqlx::query(
        r#"
        INSERT INTO bases (id, workspace_id, name, icon, color, description, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#,
    )
    .bind(&id)
    .bind(&workspace_id)
    .bind("Mi primera base")
    .bind("🚀")
    .bind("blue")
    .bind("Base de ejemplo creada automáticamente")
    .bind(1i32)
    .execute(pool)
    .await
    .expect("Failed to seed default base");

    tracing::info!("Default base seeded: {id} in workspace {workspace_id}");
}

pub fn generate_id(prefix: &str) -> String {
    use rand::Rng;
    let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyz0123456789".chars().collect();
    let mut rng = rand::thread_rng();
    let suffix: String = (0..14).map(|_| chars[rng.gen_range(0..chars.len())]).collect();
    format!("{prefix}{suffix}")
}
