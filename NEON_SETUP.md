# Setting up Neon Database for HabitFlow

## Steps to Create and Connect Neon Database

### 1. Create a Neon Project

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up or log in to your account.
3. Click "New Project"
4. Give it a name (e.g., "habitflow")
5. Choose your region
6. Click "Create project"

### 2. Get Your Connection String

1. Once the project is created, you'll see the connection string
2. It will look like: `postgresql://user:password@host/dbname?sslmode=require`
3. Copy this connection string

### 3. Set Environment Variable

Open the DevServer Environment Variables tool and add:

- **Key**: `DATABASE_URL`
- **Value**: Paste your Neon connection string

### 4. Verify Connection

The app will automatically initialize the database tables on startup. Check the server logs for:

```
Database tables initialized successfully
```

## Database Schema

The following tables are automatically created:

### habits

- `id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT)
- `name` (TEXT)
- `icon` (TEXT)
- `color` (TEXT)
- `notes` (TEXT, nullable)
- `order` (INT)
- `archived` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### daily_records

- `id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT)
- `date` (TEXT)
- `completion_percentage` (INT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- UNIQUE constraint on (user_id, date)

### habit_completions

- `id` (TEXT, PRIMARY KEY)
- `record_id` (TEXT, FOREIGN KEY)
- `habit_id` (TEXT, FOREIGN KEY)
- `completed` (BOOLEAN)
- `completed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- UNIQUE constraint on (record_id, habit_id)

## Features

Once connected:

- All habits are persisted to Neon DB
- Daily tracking data is stored
- Habit completions are tracked with timestamps
- Streaks can be calculated from the data (future enhancement)

## Troubleshooting

**Connection Error?**

- Verify the DATABASE_URL is correctly set
- Check that your Neon project status is "Active"
- Make sure SSL mode is set to `require` in the connection string

**Tables not created?**

- Check server logs for initialization errors
- The tables are created automatically on first server start