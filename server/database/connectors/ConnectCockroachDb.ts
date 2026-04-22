// Copyright (C) Konrad Gadzinowski

import { Sequelize } from "sequelize-typescript"
import session from "express-session"
import { Pool } from "pg"
import connectPgSimple from "connect-pg-simple"
import { DatabaseConnection } from "../DatabaseConnection"
import fs from "fs"

export class ConnectCockroachDb {
  private static readonly DEFAULT_COCKROACHDB_PORT = 26257
  private static readonly SESSION_TABLE_NAME = "user_sessions_store"
  private static readonly SESSION_PRUNE_INTERVAL_SECONDS = 60 * 15

  public static async connect(entities: Function[]): Promise<DatabaseConnection> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL must be set to a valid CockroachDB connection string.")
    }
    const skipSslCheck = process.env.SKIP_DATABASE_SSL_CHECK === "true"
    const caPath = process.env.DATABASE_SSL_CA
    const keyPath = process.env.DATABASE_SSL_KEY
    const certPath = process.env.DATABASE_SSL_CERT
    const hasCerts = caPath && keyPath && certPath
    let sslOptions: any = undefined
    if (hasCerts) {
      sslOptions = {
        ca: fs.readFileSync(caPath),
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    } else if (skipSslCheck) {
      sslOptions = { rejectUnauthorized: false }
    }

    const sequelize = new Sequelize(databaseUrl, {
      dialect: "postgres",
      models: entities as any,
      logging: process.env.LOG_DATABASE === "true" ? console.info : false,
      dialectOptions: sslOptions ? { ssl: sslOptions } : {},
    })
    await sequelize.authenticate()
    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${ConnectCockroachDb.SESSION_TABLE_NAME}" ("sid" VARCHAR PRIMARY KEY, "sess" JSON NOT NULL, "expire" TIMESTAMP(6) NOT NULL)`)
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "${ConnectCockroachDb.SESSION_TABLE_NAME}_expire_idx" ON "${ConnectCockroachDb.SESSION_TABLE_NAME}" ("expire")`)

    const parsedUrl = new URL(databaseUrl)
    const pool = new Pool({
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || ConnectCockroachDb.DEFAULT_COCKROACHDB_PORT,
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.slice(1),
      ssl: sslOptions,
    })
    const PgSessionStore = connectPgSimple(session)
    const sessionStore = new PgSessionStore({
      pool,
      tableName: ConnectCockroachDb.SESSION_TABLE_NAME,
      createTableIfMissing: false,
      pruneSessionInterval: ConnectCockroachDb.SESSION_PRUNE_INTERVAL_SECONDS,
    })

    const close = async () => {
      await sequelize.close()
      await pool.end()
    }

    return new DatabaseConnection(sequelize, sessionStore, close)
  }
}
