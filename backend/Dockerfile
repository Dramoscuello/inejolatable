# ── Builder stage ──────────────────────
FROM rust:latest AS builder

WORKDIR /app

# Evita que Cargo reconstruye innecesariamente y mejora estabilidad en builds
ENV CARGO_NET_RETRY=10
ENV CARGO_TERM_COLOR=never
ENV RUST_BACKTRACE=1

COPY Cargo.toml Cargo.lock ./

# Cacheo de dependencias: compilamos un binario dummy con las mismas deps
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release --locked
RUN rm -rf src

COPY src ./src

# Fuerza la recompilación del binario real después de haber compilado el dummy.
RUN cargo clean -p inejoma-backend

# Limita jobs paralelos para evitar OOM en servidores con poca RAM.
# Ajusta el número según la RAM disponible (ej. 1 job por cada 2 GB de RAM).
ARG CARGO_BUILD_JOBS=2
RUN cargo build --release --locked --jobs ${CARGO_BUILD_JOBS}

# ── Runtime stage ──────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r inejoma && useradd -r -g inejoma inejoma

COPY --from=builder /app/target/release/inejoma-backend /usr/local/bin/inejoma-backend
RUN chmod +x /usr/local/bin/inejoma-backend

USER inejoma

EXPOSE 3001

CMD ["inejoma-backend"]
