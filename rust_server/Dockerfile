# 1. Build Stage
FROM rust:latest as builder

WORKDIR /usr/src/app
COPY . .

# Build dependencies and app
# We use --release for optimized binary
RUN cargo build --release

# 2. Runtime Stage
FROM debian:bookworm-slim

# Install OpenSSL (often needed for HTTPS requests) and ca-certificates
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

# Copy the binary from builder
COPY --from=builder /usr/src/app/target/release/rust_server .

# Expose port (Render sets PORT env var, but we default to 8001 if not set, though we should respect env)
ENV PORT=8001

# Run the binary
CMD ["./rust_server"]
