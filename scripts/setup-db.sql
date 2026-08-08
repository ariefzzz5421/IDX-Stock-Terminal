-- Creates the role and database IDX Terminal expects, matching the
-- DATABASE_URL in .env.example. Run once as a superuser:
--
--   psql -U postgres -h localhost -f scripts/setup-db.sql
--
-- Only needed if you installed PostgreSQL natively. The bundled
-- docker-compose.yml already creates this role and database for you.

-- CREATEDB is needed by `prisma migrate dev`, which builds a throwaway shadow
-- database to check migrations against. Without it you get:
--   P3014  Prisma Migrate could not create the shadow database
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'idx') THEN
    CREATE ROLE idx LOGIN PASSWORD 'idx' CREATEDB;
  ELSE
    ALTER ROLE idx CREATEDB;
  END IF;
END
$$;

-- CREATE DATABASE cannot run inside a DO block, so this is a no-op-on-repeat
-- via \gexec instead.
SELECT 'CREATE DATABASE idx_terminal OWNER idx'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'idx_terminal')
\gexec

\connect idx_terminal
GRANT ALL ON SCHEMA public TO idx;
ALTER SCHEMA public OWNER TO idx;
