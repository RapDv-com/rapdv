#!/usr/bin/env ts-node
// Rolls back the last applied SQL migration against the database specified by DATABASE_URL.
// Usage: DATABASE_URL=mariadb://... npx ts-node scripts/RollbackMigration.ts

import 'reflect-metadata'
import { Sequelize } from 'sequelize-typescript'
import * as fs from 'fs'
import * as path from 'path'

export class RollbackMigration {
  private sequelize: Sequelize

  private parseMigrationSql(content: string): { up: string; down: string } {
    const upMarker = '-- UP'
    const downMarker = '-- DOWN'
    const upIndex = content.indexOf(upMarker)
    const downIndex = content.indexOf(downMarker)

    if (upIndex === -1) throw new Error('Migration file must contain a "-- UP" section')
    if (downIndex === -1) throw new Error('Migration file must contain a "-- DOWN" section')

    return {
      up: content.substring(upIndex + upMarker.length, downIndex).trim(),
      down: content.substring(downIndex + downMarker.length).trim(),
    }
  }

  public async run(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be set to a valid MariaDB connection string.')
    }

    this.sequelize = new Sequelize(databaseUrl, {
      dialect: 'mariadb',
      logging: false,
    })

    await this.sequelize.authenticate()
    console.log('Connected to MariaDB')

    const result: any[] = await this.sequelize.query(
      'SELECT `id`, `name` FROM `migrations` ORDER BY `id` DESC LIMIT 1',
      { plain: false, raw: true, type: 'SELECT' as any }
    )

    if (!result || result.length === 0) {
      console.log('No migrations to roll back.')
      await this.sequelize.close()
      return
    }

    const { id, name } = result[0]

    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    const filePath = path.join(migrationsDir, name)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`)
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const { down } = this.parseMigrationSql(content)

    if (!down) {
      throw new Error(`Migration "${name}" has an empty DOWN section.`)
    }

    console.log(`Rolling back migration: ${name}`)
    const statements = down.split(';').map(s => s.trim()).filter(s => s.length > 0)
    for (const statement of statements) {
      await this.sequelize.query(statement)
    }
    await this.sequelize.query('DELETE FROM `migrations` WHERE `id` = ?', { replacements: [id] })
    console.log(`Rolled back: ${name}`)

    await this.sequelize.close()
  }

  private static readonly ERROR_EXIT_CODE = 1

  public static async main(): Promise<void> {
    await new RollbackMigration().run()
  }

  public static handleError(err: Error): void {
    console.error(err)
    process.exit(RollbackMigration.ERROR_EXIT_CODE)
  }
}

RollbackMigration.main().catch(RollbackMigration.handleError)
