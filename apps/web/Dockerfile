# Dev-mode container — optimizes for iteration speed, not size. A production
# build stage lands in M4 (deploy target: Vercel).
FROM node:24-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack prepare --activate && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "dev"]
