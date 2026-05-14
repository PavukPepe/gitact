# Описание CI/CD пайплайна — pipe.yml

## Заголовок и триггер

```yaml
name: front-pipeline
```
Название пайплайна. Отображается в интерфейсе GitHub Actions на вкладке Actions.
```yaml
on:
  push:
    branches:
      - main
```
Триггер запуска: пайплайн автоматически стартует при каждом `git push` в ветку `main`. На другие ветки не реагирует.

## Job: install — Установка зависимостей

```yaml
  install:
    name: Install Dependencies
    runs-on: ubuntu-latest
```
Задание с именем «Install Dependencies». Выполняется на виртуальной машине с последней версией Ubuntu, которую предоставляет GitHub.
```yaml
      - name: Checkout repo
        uses: actions/checkout@v6
```
Клонирует репозиторий на виртуальную машину. `actions/checkout` — официальное действие GitHub, `@v6` — версия этого действия.
```yaml
      - name: Setup npm
        uses: actions/setup-node@v6
        with:
          node-version: 22
```
Устанавливает Node.js версии 22 на виртуальную машину. Без этого шага команды `npm` недоступны.
```yaml
      - name: Install dependencies
        run: |
          npm ci --cache .npm-cache --prefer-offline
          echo "Dependencies installed successfully"
```
Устанавливает зависимости из `package-lock.json`. `npm ci` — более строгий аналог `npm install`: удаляет `node_modules` и устанавливает точные версии из lock-файла. `--cache .npm-cache` — указывает папку кэша. `--prefer-offline` — сначала берёт пакеты из кэша, не обращаясь к сети. `echo` — выводит подтверждение в лог.

## Job: lint — Проверка стиля кода

```yaml
  lint:
    needs: install
```
`needs: install` — запустится только после успешного завершения `install`. Если `install` упал — `lint` не запустится.
```yaml
      - name: Run ESLint
        run: npm run lint:ci
```
Запускает ESLint через скрипт `lint:ci` из `package.json`. Проверяет код на соответствие правилам: неиспользуемые переменные, стиль кавычек, отступы и т.д. Скрипт `:ci` сохраняет результат в JSON-файл вместо вывода в консоль.
```yaml
      - name: Upload ESLint Report
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: eslint-report-${{ github.sha }}
          path: eslint-report.json
          retention-days: 7
```
Загружает отчёт ESLint как артефакт. `if: always()` — выполняется даже если предыдущий шаг упал, чтобы отчёт об ошибках тоже сохранялся. `${{ github.sha }}` — уникальный суффикс из SHA коммита, чтобы отчёты разных коммитов не перезаписывали друг друга. `retention-days: 7` — артефакт хранится 7 дней, затем удаляется автоматически.

## Job: typecheck — Проверка типов TypeScript

```yaml
  typecheck:
    needs: install
```
Запускается параллельно с `lint` — оба зависят только от `install`, поэтому выполняются одновременно.
```yaml
      - name: Run TypeScript Check
        run: npx tsc --noEmit
```
Запускает компилятор TypeScript в режиме только проверки типов. `--noEmit` — не генерирует JavaScript-файлы, только проверяет типы. Если в коде есть ошибки типов — задание упадёт и `build` не запустится.

## Job: build — Сборка приложения

```yaml
  build:
    needs: [lint, typecheck]
```
Сборка запускается только если оба предыдущих задания (`lint` и `typecheck`) завершились успешно. Это гарантирует, что в production попадает только проверенный код.
```yaml
      - name: Build Application
        run: npm run build
```
Запускает `next build` — собирает оптимизированную production-версию Next.js приложения.
```yaml
      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v6
        with:
          name: next-build-${{ github.sha }}
          path: .next
          include-hidden-files: true
          retention-days: 3
```
Сохраняет папку `.next` (результат сборки) как артефакт. `include-hidden-files: true` — включает скрытые файлы, которые есть в `.next`. `retention-days: 3` — хранится 3 дня (меньше, чем отчёты, так как занимает больше места). Этот артефакт используется в следующем задании `bundle_size`.

## Job: audit — Аудит безопасности

```yaml
  audit:
    needs: install
```
Аудит безопасности зависимостей. Запускается параллельно с `lint` и `typecheck`.
```yaml
      - name: Run npm audit
        run: npm audit --audit-level=high 2>&1 | tee audit-report.txt || true
```
Проверяет все зависимости на известные уязвимости. `--audit-level=high` — сообщать только об уязвимостях уровня `high` и `critical`, игнорируя `low` и `moderate`. `2>&1` — перенаправляет stderr в stdout, чтобы ошибки тоже попали в файл. `| tee audit-report.txt` — одновременно выводит результат в консоль и записывает в файл. `|| true` — предотвращает падение задания при нахождении уязвимостей (только фиксирует, не блокирует пайплайн).
```yaml
      - name: Upload Audit Report
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: audit-report-${{ github.sha }}
          path: audit-report.txt
          retention-days: 7
```
Сохраняет отчёт аудита как артефакт. `if: always()` — гарантирует сохранение даже при найденных уязвимостях.

## Job: bundle_size — Анализ размера бандла

```yaml
  bundle_size:
    needs: build
```
Анализ размера итоговой сборки. Запускается после `build`, так как нужна папка `.next`.
```yaml
      - name: Download Build Artifacts
        uses: actions/download-artifact@v6
        with:
          name: next-build-${{ github.sha }}
          path: .next/
```
Скачивает артефакт сборки, сохранённый в задании `build`. Это позволяет не пересобирать приложение заново.
```yaml
          echo "=== Next.js bundle size report ===" | tee bundle-report.txt
```
Начинает формировать текстовый отчёт. `tee` пишет одновременно в консоль и в файл `bundle-report.txt`.
```yaml
          du -sh .next/                             | tee -a bundle-report.txt
```
`du -sh` — показывает суммарный размер папки `.next/`. `-s` — суммарно без разбивки по файлам, `-h` — в читаемом формате (KB/MB/GB). `-a` у `tee` — режим добавления в файл без перезаписи.
```yaml
          du -sh .next/static/     2>/dev/null     | tee -a bundle-report.txt
```
Размер папки со статическими файлами (CSS, JS, изображения). `2>/dev/null` — подавляет ошибки если папка не существует.
```yaml
          find .next/static/chunks -name "*.js" \
            -exec du -sh {} \; 2>/dev/null \
            | sort -rh | head -10                  | tee -a bundle-report.txt
```
Находит все JS-чанки и показывает 10 самых тяжёлых. `find ... -name "*.js"` — ищет все JS-файлы в папке chunks. `-exec du -sh {} \;` — для каждого файла вызывает `du` для получения его размера. `sort -rh` — сортирует в обратном порядке по человекочитаемым размерам. `head -10` — оставляет только первые 10 строк.

## Схема выполнения

```
push → main
         │
         ▼
      [install]
         │
    ┌────┼────┐
    ▼    ▼    ▼
 [lint] [typecheck] [audit]
    │    │
    └────┘
         │
       [build]
         │
    [bundle_size]
```
`lint`, `typecheck` и `audit` выполняются параллельно — это ускоряет пайплайн. `build` ждёт завершения `lint` и `typecheck`. `bundle_size` ждёт `build`.
