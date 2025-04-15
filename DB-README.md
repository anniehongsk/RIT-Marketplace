# RIT Marketplace Database

This application supports both PostgreSQL and SQLite databases for development and production use.

## Database Configuration

The application will automatically detect which database to use based on the environment variable `DB_TYPE`. If the variable is not set, it will default to SQLite.

### PostgreSQL

To use PostgreSQL, set the following environment variables:

```
DB_TYPE=postgres
DATABASE_URL=postgres://username:password@hostname:port/database
```

The `DATABASE_URL` is required when using PostgreSQL.

### SQLite

To use SQLite, you can either:

1. Set `DB_TYPE=sqlite` explicitly, or
2. Leave `DB_TYPE` unset (the application will default to SQLite)

The SQLite database will be created at `db/sqlite.db`.

## Working with SQLite for Development

A SQLite database is ideal for development because:

1. It doesn't require a separate server
2. You can easily examine the database with DB Browser for SQLite
3. The database file can be committed to version control (though this is not recommended for production data)

### Setting Up the SQLite Database

The database is automatically created when you start the application, but you can also create it manually:

```bash
bash scripts/run-sqlite-push.sh
```

### Using DB Browser for SQLite

1. Download and install [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the database file at `db/sqlite.db`
3. You can now browse the database schema, execute queries, and view data

## Database Schema

The application uses the following tables:

- `users`: User accounts and authentication
- `products`: Listed marketplace items
- `chats`: Buyer-seller communication
- `messages`: Individual chat messages
- `sessions`: Session data for authenticated users

## Switching Between Databases

To switch between PostgreSQL and SQLite:

1. Set or unset the `DB_TYPE` environment variable
2. Restart the application

Note that data is not automatically migrated between databases. If you switch database types, you will need to recreate your data.