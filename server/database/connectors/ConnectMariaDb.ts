// Copyright (C) Konrad Gadzinowski

import { Sequelize } from 'sequelize-typescript'
import session from 'express-session'
import mysql from 'mysql2/promise'
import MySQLStore from 'express-mysql-session'
import { DatabaseConnection } from '../DatabaseConnection'

export class ConnectMariaDb {
  private static readonly DEFAULT_MARIADB_PORT = 3306

  public static async connect(entities: Function[]): Promise<DatabaseConnection> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be set to a valid MariaDB connection string.')
    }
    const skipSslCheck = process.env.SKIP_DATABASE_SSL_CHECK === 'true'

    let dialectOptions: any = {}
    if (skipSslCheck) {
      dialectOptions = { ssl: { rejectUnauthorized: false } }
    }

    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'mariadb',
      models: entities as any,
      logging: process.env.LOG_DATABASE === 'true' ? console.info : false,
      dialectOptions,
    })
    await sequelize.authenticate()

    const parsedUrl = new URL(databaseUrl)
    let poolOptions: any = {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || ConnectMariaDb.DEFAULT_MARIADB_PORT,
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.slice(1),
    }
    if (skipSslCheck) {
      poolOptions.ssl = { rejectUnauthorized: false }
    }
    const pool = mysql.createPool(poolOptions)
    const SessionStore = MySQLStore(session)
    const sessionStore = new SessionStore({ createDatabaseTable: true }, pool) as unknown as session.Store

    const close = async () => {
      await sequelize.close()
      await pool.end()
    }

    return new DatabaseConnection(sequelize, sessionStore, close)
  }
}
