FROM node:20-slim AS base
RUN corepack enable
ENV DATABASE_URL="postgresql://mssm:mssm@postgres_db:5432/mssm?schema=mssm"
RUN apt-get update -y
RUN apt-get install -y openssl

COPY . /mssm
WORKDIR /mssm
RUN npm ci
RUN npx prisma generate

FROM base AS deploy
CMD [ "npx", "prisma", "db", "push" ]

FROM base AS mssmbot
CMD [ "npm", "run", "start" ]