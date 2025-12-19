# 🚀 Next.js + Tailwind + Drizzle + PostgreSQL

A modern full-stack application setup with Next.js 15, Tailwind CSS, Drizzle ORM, and PostgreSQL running in Docker.

## 🛠️ Tech Stack

- **Next.js 15** - Latest React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Drizzle ORM** - Type-safe SQL ORM
- **PostgreSQL** - Relational database running in Docker
- **TypeScript** - Type-safe JavaScript

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd bmac-demo
npm install
```

### 2. Set up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/bmac_demo"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Start PostgreSQL with Docker

```bash
npm run docker:up
```

This will start PostgreSQL in a Docker container with:
- Database: `bmac_demo`
- Username: `postgres`
- Password: `password`
- Port: `5432`

### 4. Run Database Migrations

```bash
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
bmac-demo/
├── src/
│   ├── app/
│   │   ├── api/users/     # API routes
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   └── db/
│       ├── index.ts       # Database connection
│       └── schema.ts      # Database schema
├── docker-compose.yml     # PostgreSQL Docker setup
├── drizzle.config.ts      # Drizzle configuration
└── init.sql              # Database initialization
```

## 🗄️ Database Commands

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema changes directly (development)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## 🐳 Docker Commands

```bash
# Start PostgreSQL container
npm run docker:up

# Stop PostgreSQL container
npm run docker:down

# View PostgreSQL logs
npm run docker:logs
```

## 🎨 Features

- **User Management**: Create and view users with form validation
- **Type Safety**: Full TypeScript support with Drizzle ORM
- **Modern UI**: Beautiful interface built with Tailwind CSS
- **Real-time Updates**: Automatic UI updates when data changes
- **Database GUI**: Drizzle Studio for database management

## 🔧 API Endpoints

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

## 🚀 Deployment

This setup is ready for deployment on platforms like Vercel, Netlify, or Railway. Make sure to:

1. Set up a PostgreSQL database (e.g., Neon, Supabase, or Railway)
2. Update the `DATABASE_URL` environment variable
3. Run database migrations in production

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [PostgreSQL](https://www.postgresql.org/docs/)
