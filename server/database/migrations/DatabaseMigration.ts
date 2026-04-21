import 'reflect-metadata'
import { Sequelize } from 'sequelize-typescript'
import { DataTypes, QueryTypes } from 'sequelize'
import dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { Database } from '../Database'
import { DatabaseConnection } from '../DatabaseConnection'
import { BuiltInEntities } from '../BuiltInEntities'

export class DatabaseMigration {
  public static readonly ERROR_EXIT_CODE = 1
  protected static readonly FIRST_CLI_ARG_INDEX = 2

  private static readonly TWO_DIGITS = 2
  private static readonly ZERO_PAD = '0'
  private static readonly MONTH_OFFSET = 1
  private static readonly MIGRATIONS_TABLE = 'migrations'

  private sequelize: Sequelize
  private ownedConnection: DatabaseConnection | null = null

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

  protected async getSequelize(): Promise<Sequelize> {
    if (this.sequelize) return this.sequelize
    if (Database.sequelize) {
      this.sequelize = Database.sequelize
      return this.sequelize
    }

    dotenv.config({ path: '.env.example', override: true })
    dotenv.config({ path: '.env', override: true })

    const appPath = path.resolve(process.cwd(), 'server/App')
    const appModule = require(appPath)
    const AppClass = appModule.App
    if (!AppClass) {
      throw new Error('Could not load App class from server/App')
    }

    const app = new AppClass()
    if (typeof app.getStorage === 'function') {
      await app.getStorage()
    }
    const entities = [...BuiltInEntities.getAll(), ...app.appEntities]
    const connection: DatabaseConnection = await app.connectDatabase(false, entities)
    this.ownedConnection = connection
    this.sequelize = connection.sequelize
    return this.sequelize
  }

  protected async closeIfOwned(): Promise<void> {
    if (this.ownedConnection) {
      await this.ownedConnection.close()
      this.ownedConnection = null
    }
  }

  public async runMigrations(sequelizeOverride?: Sequelize): Promise<void> {
    if (sequelizeOverride) this.sequelize = sequelizeOverride
    const sequelize = await this.getSequelize()

    await sequelize.authenticate()
    console.info(`Connected to ${sequelize.getDialect()}`)

    await this.ensureMigrationsTable(sequelize)

    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.info('No migrations directory found.')
      await this.closeIfOwned()
      return
    }

    const sqlFiles = fs.readdirSync(migrationsDir).filter(fileName => fileName.endsWith('.sql')).sort()

    const executed: any[] = await sequelize.query(
      `SELECT name FROM ${DatabaseMigration.MIGRATIONS_TABLE}`,
      { plain: false, raw: true, type: QueryTypes.SELECT }
    )
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
        await sequelize.query(statement)
      }
      await sequelize.query(
        `INSERT INTO ${DatabaseMigration.MIGRATIONS_TABLE} (name) VALUES (?)`,
        { replacements: [file] }
      )
      console.info(`Applied: ${file}`)
      ran++
    }

    if (ran === 0) console.info('No new migrations to run.')
    await this.closeIfOwned()
  }

  public async rollback(): Promise<void> {
    const sequelize = await this.getSequelize()

    await sequelize.authenticate()
    console.info(`Connected to ${sequelize.getDialect()}`)

    const result: any[] = await sequelize.query(
      `SELECT id, name FROM ${DatabaseMigration.MIGRATIONS_TABLE} ORDER BY id DESC LIMIT 1`,
      { plain: false, raw: true, type: QueryTypes.SELECT }
    )

    if (!result || result.length === 0) {
      console.info('No migrations to roll back.')
      await this.closeIfOwned()
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
      await sequelize.query(statement)
    }
    await sequelize.query(
      `DELETE FROM ${DatabaseMigration.MIGRATIONS_TABLE} WHERE id = ?`,
      { replacements: [id] }
    )
    console.info(`Rolled back: ${name}`)

    await this.closeIfOwned()
  }

  private async ensureMigrationsTable(sequelize: Sequelize): Promise<void> {
    const queryInterface = sequelize.getQueryInterface()
    const allTables: any[] = await queryInterface.showAllTables() as any[]
    const hasTable = allTables
      .map(table => (typeof table === 'string' ? table : table.tableName))
      .some(tableName => tableName === DatabaseMigration.MIGRATIONS_TABLE)
    if (hasTable) return

    await queryInterface.createTable(DatabaseMigration.MIGRATIONS_TABLE, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      executedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
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
