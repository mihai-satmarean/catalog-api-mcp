# 🚀 Next.js + Tailwind + Drizzle + SQLite

A modern full-stack application setup with Next.js 15, Tailwind CSS, Drizzle ORM, and SQLite running in a single Docker container.

## 🛠️ Tech Stack

- **Next.js 15** - Latest React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Drizzle ORM** - Type-safe SQL ORM
- **SQLite** - Lightweight relational database
- **TypeScript** - Type-safe JavaScript
- **Docker** - Single container deployment

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set up Environment Variables (Optional)

Create a `.env.local` file in the root directory (optional, defaults to `./sqlite.db`):

```env
# Database (optional - defaults to ./sqlite.db)
DATABASE_URL="./sqlite.db"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run Database Migrations

```bash
npm run db:push
```

This will create the SQLite database file and set up all tables.

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🐳 Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at [http://localhost:3000](http://localhost:3000).

The SQLite database is persisted in a Docker volume at `/app/data/sqlite.db`.

### Build and Run with Docker Directly

```bash
# Build the image
docker build -t bmac-app .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v bmac-sqlite-data:/app/data \
  --name bmac-app \
  bmac-app
```

## 📁 Project Structure

```
bmac-demo/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx         # Home page
│   └── db/
│       ├── index.ts         # Database connection
│       └── schema.ts        # Database schema
├── Dockerfile               # Single container Docker setup
├── docker-compose.yml       # Docker Compose configuration
├── drizzle.config.ts        # Drizzle configuration
└── sqlite.db                # SQLite database file (created after migration)
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

## 🎨 Features

- **User Management**: Create and view users with form validation
- **Type Safety**: Full TypeScript support with Drizzle ORM
- **Modern UI**: Beautiful interface built with Tailwind CSS
- **Real-time Updates**: Automatic UI updates when data changes
- **Database GUI**: Drizzle Studio for database management
- **Single Container**: Easy deployment with Docker

## 🔧 API Endpoints

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

## 🚀 Deployment

This application is designed for single-container deployment:

1. **Docker**: Use the provided Dockerfile and docker-compose.yml
2. **SQLite**: Database is stored in `/app/data/sqlite.db` (persisted via volume)
3. **Environment**: Set `DATABASE_URL` if you want a custom database path

### Production Considerations

- The SQLite database file is stored in a Docker volume for persistence
- For production, consider backing up the database volume regularly
- SQLite works well for small to medium-sized applications
- For high-traffic applications, consider migrating to PostgreSQL or MySQL

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [SQLite](https://www.sqlite.org/docs.html)
