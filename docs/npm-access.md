# Проблемы с установкой npm-зависимостей в окружении CI

При попытке установить dev-зависимость `@eslint/js` (и любые другие пакеты из npm) окружение возвращает статус `403 Forbidden`:

```
npm install @eslint/js --save-dev
# ...
npm ERR! code E403
npm ERR! 403 403 Forbidden - GET https://registry.npmjs.org/@eslint%2fjs
```

Даже при смене реестра на `https://registry.npmmirror.com` ошибка повторяется. Прямой запрос через `curl` подтверждает, что внешний трафик к npm заблокирован:

```
curl -I https://registry.npmjs.org/@eslint%2fjs
# HTTP/1.1 403 Forbidden
```

Из-за этого `npm run lint` по-прежнему завершает работу с ошибкой, потому что пакет `@eslint/js` недоступен.

## Рекомендации

1. Выполнить установку зависимостей в окружении с доступом к npm и закоммитить обновлённые `package-lock.json` и `node_modules/.package-lock.json` (если используется).
2. Либо настроить приватный зеркальный реестр npm, доступный из текущего окружения, и прописать его в `.npmrc`.
3. После успешной установки повторно запустить `npm run lint`.

См. также вывод команды `npm run lint` в CI:

```
Oops! Something went wrong! :(

ESLint: 9.38.0

Error: Cannot find package '/workspace/msc-heal-hub/node_modules/@eslint/js/index.js'
```
