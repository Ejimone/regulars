# Dev-mode container. Production runs on Vercel (see README), so this image
# optimizes for iteration speed, not size.
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
