#!/usr/bin/env ts-node
// Runs all pending SQL migrations against the database specified by DATABASE_URL.
// Usage: DATABASE_URL=mariadb://... npx ts-node scripts/RunMigration.ts

import 'reflect-metadata'
import { Sequelize } from 'sequelize-typescript'
import * as fs from 'fs'
import * as path from 'path'

export class RunMigration {
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

  private async ensureMigrationsTable(): Promise<void> {
    await this.sequelize.query(
      'CREATE TABLE IF NOT EXISTS `migrations` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(255) NOT NULL, `executedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)'
    )
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

    await this.ensureMigrationsTable()

    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.')
      return
    }

    const sqlFiles = fs.readdirSync(migrationsDir).filter(fileName => fileName.endsWith('.sql')).sort()

    const executed: any[] = await this.sequelize.query('SELECT `name` FROM `migrations`', {
      plain: false,
      raw: true,
      type: 'SELECT' as any,
    })
    const executedNames = new Set((executed as any[]).map(row => row.name))

    let ran = 0
    for (const file of sqlFiles) {
      if (executedNames.has(file)) continue

      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      const { up } = this.parseMigrationSql(content)
      if (!up) continue

      console.log(`Running migration: ${file}`)
      await this.sequelize.query(up)
      await this.sequelize.query('INSERT INTO `migrations` (`name`) VALUES (?)', { replacements: [file] })
      console.log(`Applied: ${file}`)
      ran++
    }

    if (ran === 0) console.log('No new migrations to run.')
    await this.sequelize.close()
  }

  private static readonly ERROR_EXIT_CODE = 1

  public static async main(): Promise<void> {
    await new RunMigration().run()
  }

  public static handleError(err: Error): void {
    console.error(err)
    process.exit(RunMigration.ERROR_EXIT_CODE)
  }
}

RunMigration.main().catch(RunMigration.handleError)
