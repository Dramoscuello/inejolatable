# ── Builder stage ──────────────────────
FROM rust:latest AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY src ./src
RUN cargo build --release

# ── Runtime stage ──────────────────────
FROM rust:slim-bookworm

COPY --from=builder /app/target/release/inejoma-backend /usr/local/bin/inejoma-backend

EXPOSE 3001
CMD ["inejoma-backend"]
