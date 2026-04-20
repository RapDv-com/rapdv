import 'reflect-metadata'
import { Sequelize } from 'sequelize-typescript'
import * as fs from 'fs'
import * as path from 'path'

export class DatabaseMigration {
  public static readonly ERROR_EXIT_CODE = 1
  protected static readonly FIRST_CLI_ARG_INDEX = 2
  
  private static readonly TWO_DIGITS = 2
  private static readonly ZERO_PAD = '0'
  private static readonly MONTH_OFFSET = 1

  private sequelize: Sequelize

  protected buildTimestamp(): string {
    const now = new Date()
    return (
      now.getFullYear().toString() +
      (now.getMonth() + DatabaseMigration.MONTH_OFFSET).toString().padStart(DatabaseMigration.TWO_DIGITS, DatabaseMigration.ZERO_PAD) +
      now.getDate().toString().padStart(DatabaseMigration.TWO_DIGITS, DatabaseMigration.ZERO_PAD) +
      now.getHours().toString().padStart(DatabaseMigration.TWO_DIGITS, DatabaseMigration.ZERO_PAD) +
      now.getMinutes().toString().padStart(DatabaseMigration.TWO_DIGITS, DatabaseMigration.ZERO_PAD) +
      now.getSeconds().toString().padStart(DatabaseMigration.TWO_DIGITS, DatabaseMigration.ZERO_PAD)
    )
  }

  protected writeMigrationFile(name: string, content: string): string {
    const timestamp = this.buildTimestamp()
    const fileName = `${timestamp}-${name}.sql`
    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    fs.mkdirSync(migrationsDir, { recursive: true })
    fs.writeFileSync(path.join(migrationsDir, fileName), content)
    return fileName
  }

  public async runMigrations(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be set to a valid MariaDB connection string.')
    }

    this.sequelize = new Sequelize(databaseUrl, {
      dialect: 'mariadb',
      logging: false,
      dialectOptions: process.env.SKIP_DATABASE_SSL_CHECK == 'true' ? { ssl: { rejectUnauthorized: false } } : {},
    })

    await this.sequelize.authenticate()
    console.info('Connected to MariaDB')

    await this.ensureMigrationsTable()

    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.info('No migrations directory found.')
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

      console.info(`Running migration: ${file}`)
      const statements = this.splitSql(up).map(statement => statement.trim()).filter(statement => statement.length > 0)
      for (const statement of statements) {
        await this.sequelize.query(statement)
      }
      await this.sequelize.query('INSERT INTO `migrations` (`name`) VALUES (?)', { replacements: [file] })
      console.info(`Applied: ${file}`)
      ran++
    }

    if (ran === 0) console.info('No new migrations to run.')
    await this.sequelize.close()
  }

  public async rollback(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be set to a valid MariaDB connection string.')
    }

    this.sequelize = new Sequelize(databaseUrl, {
      dialect: 'mariadb',
      logging: false,
      dialectOptions: process.env.SKIP_DATABASE_SSL_CHECK == 'true' ? { ssl: { rejectUnauthorized: false } } : {},
    })

    await this.sequelize.authenticate()
    console.info('Connected to MariaDB')

    const result: any[] = await this.sequelize.query(
      'SELECT `id`, `name` FROM `migrations` ORDER BY `id` DESC LIMIT 1',
      { plain: false, raw: true, type: 'SELECT' }
    )

    if (!result || result.length === 0) {
      console.info('No migrations to roll back.')
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

    console.info(`Rolling back migration: ${name}`)
    const statements = this.splitSql(down).map(statement => statement.trim()).filter(statement => statement.length > 0)
    for (const statement of statements) {
      await this.sequelize.query(statement)
    }
    await this.sequelize.query('DELETE FROM `migrations` WHERE `id` = ?', { replacements: [id] })
    console.info(`Rolled back: ${name}`)

    await this.sequelize.close()
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.sequelize.query(
      'CREATE TABLE IF NOT EXISTS `migrations` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(255) NOT NULL, `executedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)'
    )
  }

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

  private splitSql(sql: string): string[] {
    const results = sql
    .replace(/'[^']*'/g, match => match.replace(/;/g, '\uE000')) // Make sure we won't split by semicolons inside string literals. We replace them temporarily with \x00
    .split(';')
    .map(text => text.replace(/\uE000/g, ';'));

    return results;
  }
}
