// Copyright (C) Konrad Gadzinowski

import { Sequelize } from "sequelize-typescript"
import session from "express-session"
import { Pool } from "pg"
import connectPgSimple from "connect-pg-simple"
import { DatabaseConnection } from "../DatabaseConnection"
import { SessionStoreConnection } from "./SessionStoreConnection"

export class ConnectPostgres {
  private static readonly DEFAULT_POSTGRES_PORT = 5432
  private static readonly SESSION_TABLE_NAME = "user_sessions_store"
  private static readonly SESSION_PRUNE_INTERVAL_SECONDS = 60 * 15

  public static async connect(entities: Function[]): Promise<DatabaseConnection> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL must be set to a valid PostgreSQL connection string.")
    }
    const skipSslCheck = process.env.SKIP_DATABASE_SSL_CHECK === "true"
    const sslOptions = skipSslCheck ? { rejectUnauthorized: false } : undefined

    const sequelize = new Sequelize(databaseUrl, {
      dialect: "postgres",
      models: entities as any,
      logging: process.env.LOG_DATABASE === "true" ? console.info : false,
      dialectOptions: sslOptions ? { ssl: sslOptions } : {},
    })
    await sequelize.authenticate()

    const parsedUrl = new URL(databaseUrl)
    const pool = new Pool({
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || ConnectPostgres.DEFAULT_POSTGRES_PORT,
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.slice(1),
      ssl: sslOptions,
    })
    const PgSessionStore = connectPgSimple(session)
    const sessionStore = new PgSessionStore({
      pool,
      tableName: ConnectPostgres.SESSION_TABLE_NAME,
      createTableIfMissing: true,
      pruneSessionInterval: ConnectPostgres.SESSION_PRUNE_INTERVAL_SECONDS,
    })

    const close = async () => {
      await SessionStoreConnection.close(sessionStore)
      await sequelize.close()
      await pool.end()
    }

    return new DatabaseConnection(sequelize, sessionStore, close)
  }
}
