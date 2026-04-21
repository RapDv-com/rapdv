#!/usr/bin/env ts-node
// Generates a SQL migration from Sequelize model definitions.
// Uses the dialect configured by App.connectDatabase (for example MariaDB or PostgreSQL).
// Usage: npx ts-node [path/to/]GenerateMigration.ts [migration-name]

import 'reflect-metadata'
import * as path from 'path'
import dotenv from 'dotenv'
import { RapDvApp } from '../../RapDvApp'
import { BuiltInEntities } from '../BuiltInEntities'
import { DatabaseConnection } from '../DatabaseConnection'
import { DatabaseMigration } from './DatabaseMigration'

export class GenerateMigration extends DatabaseMigration {
  private static readonly CREATE_TABLE_REGEX = /CREATE TABLE IF NOT EXISTS [`"]([^`"]+)[`"]/
  private sqlStatements: string[] = []

  private async loadApp(): Promise<RapDvApp> {
    const appPath = path.resolve(process.cwd(), 'server/App')
    const appModule = require(appPath)
    const AppClass = appModule.App
    if (!AppClass) {
      throw new Error('Could not load App class from server/App')
    }

    const app: RapDvApp = new AppClass()
    await app.getStorage()
    return app
  }

  private buildUpSection(): string {
    return this.sqlStatements.join(';\n\n') + ';'
  }

  private buildDownSection(): string {
    const tableNames = this.sqlStatements
      .map(statement => statement.match(GenerateMigration.CREATE_TABLE_REGEX)?.[1])
      .filter(Boolean)
      .reverse()
    return tableNames.map(tableName => `DROP TABLE IF EXISTS "${tableName}" CASCADE`).join(';\n') + ';'
  }

  public async run(migrationName: string): Promise<void> {
    dotenv.config({ path: '.env.example', override: true })
    dotenv.config({ path: '.env', override: true })

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required to generate migrations. Set it in your .env file.')
    }

    const app = await this.loadApp()
    const entities = [...BuiltInEntities.getAll(), ...app.appEntities]
    const connection: DatabaseConnection = await app.connectDatabase(false, entities)

    const captureCreateTable = (sql: string) => {
      const cleaned = sql.replace(/^Executing \(default\): /, '')
      if (/^\s*CREATE TABLE/i.test(cleaned)) {
        this.sqlStatements.push(cleaned)
      }
    }

    await connection.sequelize.sync({ force: true, logging: captureCreateTable })
    await connection.close()

    if (this.sqlStatements.length === 0) {
      throw new Error('No CREATE TABLE statements captured.')
    }

    const content = `-- UP\n${this.buildUpSection()}\n\n-- DOWN\n${this.buildDownSection()}\n`
    const fileName = this.writeMigrationFile(migrationName, content)

    const tableNames = this.sqlStatements
      .map(statement => statement.match(GenerateMigration.CREATE_TABLE_REGEX)?.[1])
      .filter(Boolean)

    console.info(`Generated: migrations/${fileName}`)
    console.info(`Tables: ${tableNames.join(', ')}`)
  }

  public static async main(): Promise<void> {
    const migrationName = process.argv[DatabaseMigration.FIRST_CLI_ARG_INDEX] || 'Database-change'
    await new GenerateMigration().run(migrationName)
  }

  public static handleError(err: Error): void {
    console.error(err)
    process.exit(DatabaseMigration.ERROR_EXIT_CODE)
  }
}

GenerateMigration.main().catch(GenerateMigration.handleError)
