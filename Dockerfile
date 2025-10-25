FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install OpenVPN, Easy-RSA and required tools
RUN apk add --no-cache \
    openvpn \
    easy-rsa \
    iptables \
    bash \
    openssl \
    curl \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# Create necessary directories
RUN mkdir -p /etc/openvpn/easy-rsa \
    /var/log/openvpn \
    /etc/openvpn/ccd

# Copy Easy-RSA
RUN cp -r /usr/share/easy-rsa/* /etc/openvpn/easy-rsa/

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV PUBLIC_HOST=localhost
ENV PUBLIC_PORT=1194

# Expose ports
EXPOSE 3000 1194/udp

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server/index.js"]

