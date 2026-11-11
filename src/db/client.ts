import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Drizzle/Postgres client. This repo has no live DB provisioned by
 * default (see docker-compose.yml for local Postgres, or a Vercel
 * Marketplace Postgres in production) — `postgres()` connects lazily on
 * first query, so simply creating the client here never throws even if
 * nothing is listening yet. Callers (lib/reports/*, API routes) must
 * still handle a missing `db` and query failures gracefully (e.g. return
 * an empty list / 503) rather than assuming Postgres is reachable.
 */

const connectionString = process.env.DATABASE_URL;

export const sql = connectionString
  ? postgres(connectionString, { max: 5, connect_timeout: 5 })
  : null;

export const db = sql ? drizzle(sql, { schema }) : null;

export type Database = NonNullable<typeof db>;
