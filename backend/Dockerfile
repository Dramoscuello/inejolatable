# ── Builder stage ──────────────────────
FROM rust:latest AS builder

WORKDIR /app

ENV CARGO_NET_RETRY=10
ENV CARGO_TERM_COLOR=never
ENV RUST_BACKTRACE=1

# Copia todo el código fuente directamente
COPY . .

# Compila el backend real. Limita jobs si el servidor tiene poca RAM.
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
