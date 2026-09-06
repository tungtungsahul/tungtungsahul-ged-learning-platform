FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm prisma generate
RUN pnpm build
EXPOSE 4000
CMD ["pnpm","start"]
