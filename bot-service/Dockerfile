# Use Playwright's official image which includes browsers
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile || npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build || npm run build

# Expose port
EXPOSE 3001

# Start the service
CMD ["node", "dist/index.js"]
