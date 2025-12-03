# EducationHub

Образовательная платформа с каталогом курсов, системой обучения и административной панелью.

## Технологический стек

- **Frontend/Backend**: Next.js 15.5.5 (App Router)
- **Язык**: TypeScript 5
- **База данных**: PostgreSQL + Drizzle ORM
- **Аутентификация**: NextAuth.js 4.24.11
- **State Management**: Zustand 5.0.8, TanStack Query 5
- **UI**: Tailwind CSS 4
- **Валидация**: Zod 4.1.12

## Установка и запуск

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/educationhub
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Применение миграций

```bash
pnpm drizzle-kit push
```

Или для создания новой миграции:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 4. Запуск проекта

```bash
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
src/
├── app/                    # Next.js App Router страницы
│   ├── api/               # API routes
│   ├── auth/             # Страницы аутентификации
│   ├── courses/           # Страницы курсов
│   ├── dashboard/         # Личный кабинет
│   ├── admin/             # Административная панель
│   └── learn/             # Страница обучения
├── components/            # React компоненты
├── lib/                   # Утилиты и конфигурация
│   ├── db.ts             # Подключение к БД
│   ├── schema.ts         # Схема Drizzle ORM
│   └── auth-config.ts    # Конфигурация NextAuth
└── types/                # TypeScript типы
```

## Основные функции

### Публичная часть
- Главная страница с популярными курсами
- Каталог курсов с фильтрацией и поиском
- Страница курса с описанием, уроками и отзывами
- Категории обучения

### Авторизованная часть
- Личный кабинет с прогрессом обучения
- Запись на курсы
- Просмотр уроков и отслеживание прогресса
- Отзывы и рейтинги курсов
- Сертификаты об окончании

### Административная панель
- Управление курсами
- Управление категориями
- Управление учебными заведениями
- Управление преподавателями
- Модерация отзывов

## Роли пользователей

- **STUDENT** - студент (по умолчанию)
- **ADMIN** - администратор

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход (через NextAuth)
- `GET /api/auth/me` - Получить текущего пользователя

### Курсы
- `POST /api/courses/[id]/enroll` - Записаться на курс
- `POST /api/progress` - Обновить прогресс урока
- `POST /api/reviews` - Создать/обновить отзыв

## Разработка

### Создание миграций

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

### Проверка типов

```bash
pnpm tsc --noEmit
```

### Линтинг

```bash
pnpm lint
```

## Лицензия

MIT
