FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["pnpm", "--filter", "@workspace/api-server", "start"]