#!/usr/bin/env ts-node
// Generates a SQL migration from Sequelize model definitions.
// Uses pg-mem so no real database connection is required.
// Usage: npx ts-node [path/to/]GenerateMigration.ts [migration-name]

import 'reflect-metadata'
import { Sequelize } from 'sequelize-typescript'
import * as fs from 'fs'
import * as path from 'path'
import { RapDvApp } from '../../RapDvApp'

export class GenerateMigration {
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

  private writeMigrationFile(name: string, content: string): string {
    const timestamp = Date.now()
    const fileName = `${timestamp}-${name}.sql`
    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    fs.mkdirSync(migrationsDir, { recursive: true })
    fs.writeFileSync(path.join(migrationsDir, fileName), content)
    return fileName
  }

  public async run(migrationName: string = 'initial'): Promise<void> {
    const builtInModels = this.loadBuiltInModels()
    const appModels = await this.loadAppModels()
    const allModels = [...builtInModels, ...appModels]

    const { newDb } = require('pg-mem')
    const db = newDb()
    const pgMem = db.adapters.createPg()

    const sequelize = new Sequelize({
      dialect: 'postgres',
      dialectModule: pgMem,
      database: 'test',
      username: 'test',
      password: 'test',
      host: 'localhost',
      models: allModels as any,
      logging: (sql: string) => {
        const cleaned = sql.replace(/^Executing \(default\): /, '')
        if (/^\s*CREATE TABLE/i.test(cleaned)) {
          this.sqlStatements.push(cleaned)
        }
      },
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

    console.log(`Generated: migrations/${fileName}`)
    console.log(`Tables: ${tableNames.join(', ')}`)
  }

  public static async main(): Promise<void> {
    const migrationName = process.argv[2] || 'initial'
    await new GenerateMigration().run(migrationName)
  }
}

GenerateMigration.main().catch(err => {
  console.error(err)
  process.exit(1)
})
