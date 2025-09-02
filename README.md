# Treasure Bank - Integral 2025 App

A medieval-themed coin management system for group competitions and events. Built with the T3 Stack for managing groups, coin transactions, and rankings in a gamified environment.

## 🏰 About

Treasure Bank is designed for medieval-themed events and competitions where participants form guilds (groups) and compete for coins through various activities. The application features:

- **Group Management**: Create and join guilds with unique access codes
- **Coin System**: Track and manage coin transactions for each group
- **Ranking System**: Real-time leaderboard showing group standings
- **Admin Panel**: Administrative tools for awarding coins and managing the system
- **Authentication**: Secure login via Authentik OIDC integration
- **Medieval Theme**: Custom UI with medieval atmosphere and styling

## 🛠️ Tech Stack

This project is built using the [T3 Stack](https://create.t3.gg/):

- **[Next.js](https://nextjs.org)** - React framework with App Router
- **[NextAuth.js](https://next-auth.js.org)** - Authentication with Authentik OIDC
- **[Prisma](https://prisma.io)** - Database ORM with PostgreSQL
- **[tRPC](https://trpc.io)** - Type-safe API layer
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component library
- **TypeScript** - Type safety throughout the stack

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Docker** (for local database)
- **PostgreSQL** (or use Docker container)
- **Authentik instance** (for OIDC authentication)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd integral-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/integral_app"

# Authentication (NextAuth.js)
AUTH_SECRET="your-random-secret-key-here"

# Authentik OIDC Configuration
AUTHENTIK_ID="your-authentik-client-id"
AUTHENTIK_SECRET="your-authentik-client-secret"
AUTHENTIK_ISSUER="https://your-authentik-instance.com/application/o/your-app/"

# Environment
NODE_ENV="development"
```

#### Environment Variables Explained:

- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Random string for NextAuth.js (generate with `openssl rand -base64 32`)
- `AUTHENTIK_ID`: Client ID from your Authentik OIDC application
- `AUTHENTIK_SECRET`: Client secret from your Authentik OIDC application
- `AUTHENTIK_ISSUER`: Your Authentik OIDC issuer URL

### 4. Database Setup

#### Option A: Using Docker (Recommended)

The project includes a convenient script to start a PostgreSQL container:

```bash
# Make the script executable (Linux/macOS)
chmod +x start-database.sh

# Start the database container
./start-database.sh
```

#### Option B: Manual PostgreSQL Setup

If you prefer to use an existing PostgreSQL instance, ensure it's running and update the `DATABASE_URL` accordingly.

### 5. Database Migration

Set up the database schema:

```bash
# Generate Prisma client
npm run postinstall

# Push the schema to the database
npm run db:push

# Optional: Open Prisma Studio to view the database
npm run db:studio
```

### 6. Authentication Setup

Configure your Authentik instance:

1. Create a new OIDC application in Authentik
2. Set the redirect URI to: `http://localhost:3000/api/auth/callback/authentik`
3. Note down the Client ID and Client Secret
4. Create an admin group in Authentik (referenced as "admin-group-name" in the code)
5. Update the environment variables with your Authentik configuration

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbo
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking
- `npm run format:check` - Check code formatting
- `npm run format:write` - Format code with Prettier
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate and run migrations
- `npm run db:migrate` - Deploy migrations to production

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── _components/        # Shared components
│   ├── admin/             # Admin panel
│   ├── auth/              # Authentication pages
│   ├── group/             # Group management
│   └── ranking/           # Leaderboard
├── server/                # Backend logic
│   ├── api/               # tRPC routers
│   ├── auth/              # Authentication config
│   └── db.ts              # Database client
└── styles/                # Global styles and themes
```

## 🎮 Features

### Group Management
- Create new groups with auto-generated access codes
- Join existing groups using invite codes
- View group members and details

### Coin System
- Track coin balances for each group
- Historical transaction records
- Admin-controlled coin distribution

### Ranking System
- Real-time leaderboard
- Sorted by total coins
- Public viewing for all participants

### Admin Features
- Award coins to specific groups
- View transaction history
- Manage group permissions

## 🔐 Authentication & Authorization

The app uses NextAuth.js with Authentik OIDC for authentication:

- **Regular Users**: Can create/join groups, view rankings
- **Administrators**: Members of the "admin-group-name" group in Authentik
- **Protected Routes**: Admin panel requires admin privileges

## 🚀 Deployment

### Production Database

For production, set up a PostgreSQL database and update the `DATABASE_URL`:

```bash
# Run migrations in production
npm run db:migrate
```

### Deployment Platforms

The app can be deployed to various platforms:

- **[Vercel](https://vercel.com)** (Recommended for Next.js)
- **[Netlify](https://netlify.com)**
- **Docker** (use the included configuration)

For detailed deployment guides, refer to the [T3 Stack documentation](https://create.t3.gg/en/deployment).

## 🛠️ Development

### Database Management

```bash
# Reset database (development only)
npm run db:push

# View database in browser
npm run db:studio

# Generate Prisma client after schema changes
npm run postinstall
```

### Code Quality

```bash
# Check formatting and linting
npm run check

# Fix issues automatically
npm run lint:fix && npm run format:write
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Note**: This application is specifically designed for the Integral 2025 medieval-themed event. Customize the theming, group management, and coin system according to your event's specific requirements.