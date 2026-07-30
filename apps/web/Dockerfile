# Dev-mode container — optimizes for iteration speed, not size. A production
# build stage lands in M4 (deploy target: DigitalOcean App Platform).
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
