# ── Builder stage ──────────────────────
FROM rust:1.80-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY src ./src
RUN cargo build --release

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
