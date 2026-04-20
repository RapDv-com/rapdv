#!/usr/bin/env ts-node
// Generates a SQL migration from Sequelize model definitions.
// Requires a running MariaDB instance via DATABASE_URL.
// Usage: npx ts-node [path/to/]GenerateMigration.ts [migration-name]

import 'reflect-metadata'
import { Sequelize } from 'sequelize-typescript'
import * as path from 'path'
import dotenv from 'dotenv'
import { RapDvApp } from '../../RapDvApp'
import { DatabaseMigration } from './DatabaseMigration'

export class GenerateMigration extends DatabaseMigration {
  private sqlStatements: string[] = []

  private loadBuiltInModels(): any[] {
    const { Log } = require('../CollectionLog')
    const { File } = require('../CollectionFile')
    const { ImageFile } = require('../CollectionImageFile')
    const { System } = require('../CollectionSystem')
    const { User } = require('../CollectionUser')
    const { UserSession } = require('../CollectionUserSession')
    return [Log, File, ImageFile, System, User, UserSession]
  }

  private async loadAppModels(): Promise<any[]> {
    const appPath = path.resolve(process.cwd(), 'server/App')
    const appModule = require(appPath)
    const AppClass = appModule.App
    if (!AppClass) return []

    const app: RapDvApp = new AppClass()
    await app.getStorage()
    return app.appEntities as any[]
  }

  private buildUpSection(): string {
    return this.sqlStatements.join(';\n\n') + ';'
  }

  private buildDownSection(): string {
    const tableNames = this.sqlStatements
      .map(statement => statement.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/)?.[1])
      .filter(Boolean)
      .reverse()
    return tableNames.map(tableName => `DROP TABLE IF EXISTS "${tableName}" CASCADE`).join(';\n') + ';'
  }


  public async run(migrationName: string): Promise<void> {
    dotenv.config({ path: '.env.example', override: true })
    dotenv.config({ path: '.env', override: true })

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required to generate migrations. Set it in your .env file.')
    }

    const builtInModels = this.loadBuiltInModels()
    const appModels = await this.loadAppModels()
    const allModels = [...builtInModels, ...appModels]

    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'mariadb',
      models: allModels as any,
      logging: (sql: string) => {
        const cleaned = sql.replace(/^Executing \(default\): /, '')
        if (/^\s*CREATE TABLE/i.test(cleaned)) {
          this.sqlStatements.push(cleaned)
        }
      },
      dialectOptions: process.env.SKIP_DATABASE_SSL_CHECK == 'true' ? { ssl: { rejectUnauthorized: false } } : {},
    })

    await sequelize.sync({ force: true })
    await sequelize.close()

    if (this.sqlStatements.length === 0) {
      throw new Error('No CREATE TABLE statements captured.')
    }

    const content = `-- UP\n${this.buildUpSection()}\n\n-- DOWN\n${this.buildDownSection()}\n`
    const fileName = this.writeMigrationFile(migrationName, content)

    const tableNames = this.sqlStatements
      .map(statement => statement.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/)?.[1])
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
