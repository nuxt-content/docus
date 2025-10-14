FROM node:22-alpine

# Install necessary tools
RUN apk add --no-cache git

WORKDIR /workspace

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy CLI files (including pre-built dist)
COPY cli/package.json ./cli/
COPY cli/dist ./cli/dist

# Install only production dependencies
WORKDIR /workspace/cli
RUN pnpm install --prod --frozen-lockfile=false --ignore-scripts

# Make dist/main.mjs executable and create global link manually
RUN chmod +x /workspace/cli/dist/main.mjs && \
    mkdir -p /usr/local/bin && \
    ln -s /workspace/cli/dist/main.mjs /usr/local/bin/create-docus

# Move to test directory
WORKDIR /test

# Run the command that should reproduce the error
CMD ["create-docus", "my-docs"]

