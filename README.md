# test-msc — MSC Heal Hub без Supabase (тестовый стенд)

Цель: доказать, что весь бэкенд medsc.uz можно держать **без Supabase** на своём
сервере, сохранив базу 1:1, и с новым фронтом на Next.js.

## Состав

```
test-msc/
├── docker-compose.yml      # Postgres 15 (+ Adminer) для локального теста
├── db/
│   ├── 00-compat.sql       # Supabase-compat: схемы auth/storage, роли, auth.uid()/role()/jwt()
│   ├── 10-schema.sql       # 29 таблиц + RLS + триггеры (из репозитория msc-heal-hub)
│   ├── 20-rpc.sql          # 42 plpgsql-функции (has_role, archive_lead, RPC и т.д.)
│   ├── 30-storage.sql      # бакеты + storage RLS
│   └── 90-seed.sql         # тестовые данные (пока нет доступа к облаку)
├── server/                 # Express + TS — заменяет PostgREST + GoTrue + Storage
└── client/                 # Next.js + Tailwind — новый фронт (без supabase-js)
```

## Принцип работы (как RLS остаётся 1:1 без Supabase)

PostgREST в Supabase на каждый запрос делает `SET request.jwt.claims = '{...}'` и
переключает роль на `authenticated`/`anon`. Тогда политики, которые ссылаются на
`auth.uid()` и `has_role(...)`, применяются автоматически.

Наш Express делает то же самое: на каждый запрос берёт пользователя из JWT,
открывает транзакцию, выполняет
`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '<jwt>'`
и только потом запрос. Вся логика прав остаётся в Postgres — ничего не дублируем
в коде.

## Запуск (после готовности server/client)

```bash
cd test-msc
docker compose up -d db          # поднять Postgres + загрузить схему
# server: npm i && npm run dev    (http://localhost:4000)
# client: npm i && npm run dev    (http://localhost:3000)
```

## Импорт настоящих данных 1:1 (когда будет доступ к облаку)

```bash
export CLOUD_DB_URL='postgresql://postgres.smvbhwaupvbxqxqxzzjx:PASSWORD@HOST:5432/postgres'
./scripts/import-from-cloud.sh   # pg_dump cloud --data-only → restore локально
```

До этого момента работаем на `90-seed.sql` (тестовые данные).
