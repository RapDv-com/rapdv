// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Sequelize } from 'sequelize-typescript'
import { Collection } from './Collection'
import * as fs from 'fs'
import * as path from 'path'

export enum QueryType {
  Include = 'inlcude',
  Exclude = 'exclude',
  Ignore = 'ignore',
}

export class Database {
  public static sequelize: Sequelize
  public static isTest: boolean = false

  public static IGNORE_NUMBER: number = -1
  public static SORT_NEWEST_FIRST = { createdAt: -1 }
  public static SORT_OLDEST_FIRST = { createdAt: 1 }

  public static ASC = 1
  public static DESC = -1

  private static MSG_CLEAR_CACHE: string = 'clearCache'
  private static onClearCache

  constructor() {}

  public static getEntryId(entry): any {
    if (!entry) return null
    if (entry._id) return entry._id.toString()
    if (entry.id) return entry.id.toString()
    return entry.toString()
  }

  public static async createOrGetRef(instance: any, propertyName, createNew: () => Promise<any>, findById: (id) => Promise<any>): Promise<any> {
    if (!instance[propertyName]) {
      let newInstance = await createNew()
      instance[propertyName] = newInstance._id
      await instance.save()
      return newInstance
    }

    if (instance[propertyName]._id) return instance[propertyName]
    instance[propertyName] = await findById(instance[propertyName])
    return instance[propertyName]
  }

  public static async generateKey(
    _id,
    initialKey,
    findByKey: (key) => Promise<any>,
    accentsToLatin: (text: string) => string,
    generateRandomString: (textLength: number) => string
  ): Promise<string> {
    let key = ''

    if (initialKey) {
      key = initialKey.toLowerCase()
    } else {
      let defaultKeyLength = 12
      key = generateRandomString(defaultKeyLength)
    }

    key = accentsToLatin(key)
    key = key.replace(/[.,;:\s]/g, '-').replace(/[^A-Z0-9\-_]/gi, '')

    let currentId = null
    if (_id) currentId = _id.toString()

    try {
      let addedDash = false
      let isDuplicate = true
      let keyBase = key
      let anotherNumber = 0

      while (isDuplicate) {
        let entryWithSameKey = await findByKey(key)
        isDuplicate = (!currentId && !!entryWithSameKey) || (currentId && !!entryWithSameKey && entryWithSameKey._id.toString() != currentId)
        if (!isDuplicate) break

        if (!addedDash) {
          addedDash = true
          keyBase = key + '-'
        }
        key = keyBase + anotherNumber
        anotherNumber++
      }
    } catch (exception) {
      console.error('couldn\'t check if there is already user with this key. ' + exception)
    }

    return key
  }

  public init = async (databaseUrl: string, isProd: boolean, appEntities: Function[] = []) => {
    Collection.clearCollections()

    // Import built-in entities
    const { Log } = require('./CollectionLog')
    const { File } = require('./CollectionFile')
    const { ImageFile } = require('./CollectionImageFile')
    const { System } = require('./CollectionSystem')
    const { User } = require('./CollectionUser')
    const { UserSession } = require('./CollectionUserSession')

    const builtInEntities = [Log, File, ImageFile, System, User, UserSession]
    const allEntities = [...builtInEntities, ...appEntities]

    if (!databaseUrl || (!databaseUrl.startsWith('postgresql') && !databaseUrl.startsWith('postgres'))) {
      // Test mode: use pg-mem
      Database.isTest = true
      const { newDb } = require('pg-mem')
      const db = newDb()
      const pgMem = db.adapters.createPg()
      Database.sequelize = new Sequelize({
        dialect: 'postgres',
        dialectModule: pgMem,
        database: 'test',
        username: 'test',
        password: 'test',
        host: 'localhost',
        models: allEntities as any,
        logging: process.env.LOG_DATABASE === 'true' ? console.log : false,
      })
      await Database.sequelize.sync({ force: true })
      console.info('pg-mem (in-memory PostgreSQL) connection is open for testing')
    } else {
      Database.sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        models: allEntities as any,
        logging: process.env.LOG_DATABASE === 'true' ? console.log : false,
        dialectOptions: isProd ? { ssl: { rejectUnauthorized: false } } : {},
      })
      await Database.sequelize.authenticate()
      console.info('PostgreSQL connection is open')

      await Database.runSqlMigrations()
    }

    // Handle graceful shutdown
    const onClose = async () => {
      if (Database.sequelize) {
        await Database.sequelize.close()
        console.info('PostgreSQL connection closed')
      }
      process.exit(0)
    }

    process.on('SIGINT', onClose)
    process.on('SIGTERM', onClose)
  }

  public async initDatabaseContent(customRoles: string[], customUserProps: any = {}) {
    const { CollectionLog } = require('./CollectionLog')
    const { CollectionFile } = require('./CollectionFile')
    const { CollectionImageFile } = require('./CollectionImageFile')
    const { CollectionSystem } = require('./CollectionSystem')
    const { CollectionUser } = require('./CollectionUser')
    const { CollectionUserSession } = require('./CollectionUserSession')

    new CollectionLog()
    new CollectionFile()
    new CollectionImageFile()
    new CollectionSystem()
    CollectionSystem.create()
    new CollectionUser(customRoles, customUserProps)
    new CollectionUserSession()
  }

  private static parseMigrationSql(content: string): { up: string, down: string } {
    const upMarker = '-- UP'
    const downMarker = '-- DOWN'

    const upIndex = content.indexOf(upMarker)
    const downIndex = content.indexOf(downMarker)

    if (upIndex === -1) {
      throw new Error('Migration file must contain a "-- UP" section')
    }

    if (downIndex === -1) {
      throw new Error('Migration file must contain a "-- DOWN" section')
    }

    const up = content.substring(upIndex + upMarker.length, downIndex).trim()
    const down = content.substring(downIndex + downMarker.length).trim()

    return { up, down }
  }

  private static getMigrationsDir(): string {
    return path.resolve(process.cwd(), 'migrations')
  }

  private static async ensureMigrationsTable() {
    await Database.sequelize.query(`CREATE TABLE IF NOT EXISTS "migrations" ("id" SERIAL PRIMARY KEY, "name" character varying NOT NULL, "executedAt" TIMESTAMP NOT NULL DEFAULT now())`)
  }

  private static async runSqlMigrations() {
    try {
      await Database.ensureMigrationsTable()

      const migrationsDir = Database.getMigrationsDir()
      if (!fs.existsSync(migrationsDir)) return

      const sqlFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort()

      const executed: any[] = await Database.sequelize.query(`SELECT "name" FROM "migrations"`, { plain: false, raw: true, type: 'SELECT' as any })
      const executedNames = new Set((executed as any[]).map(r => r.name))

      for (const file of sqlFiles) {
        if (executedNames.has(file)) continue

        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
        const { up } = Database.parseMigrationSql(content)
        if (!up) continue

        console.info(`Running migration: ${file}`)
        await Database.sequelize.query(up)
        await Database.sequelize.query(`INSERT INTO "migrations" ("name") VALUES ($1)`, { bind: [file] })
        console.info(`Migration applied: ${file}`)
      }
    } catch (error) {
      console.error('Migration error:', error)
      throw error
    }
  }

  public static async rollbackLastMigration() {
    try {
      await Database.ensureMigrationsTable()

      const result: any[] = await Database.sequelize.query(`SELECT "id", "name" FROM "migrations" ORDER BY "id" DESC LIMIT 1`, { plain: false, raw: true, type: 'SELECT' as any })
      if (!result || result.length === 0) {
        console.info('No migrations to roll back')
        return
      }

      const { id, name } = result[0]
      const migrationsDir = Database.getMigrationsDir()
      const filePath = path.join(migrationsDir, name)

      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file not found: ${name}`)
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      const { down } = Database.parseMigrationSql(content)

      if (!down) {
        throw new Error(`Migration ${name} has an empty DOWN section`)
      }

      console.info(`Rolling back migration: ${name}`)
      await Database.sequelize.query(down)
      await Database.sequelize.query(`DELETE FROM "migrations" WHERE "id" = $1`, { bind: [id] })
      console.info(`Migration rolled back: ${name}`)
    } catch (error) {
      console.error('Rollback error:', error)
      throw error
    }
  }

  public static clearCache() {
    if (!!process.send) {
      process.send({
        task: Database.MSG_CLEAR_CACHE,
      })
    } else {
      if (Database.onClearCache) Database.onClearCache()
    }
  }

  public onClearCache(onClearCache: () => void) {
    Database.onClearCache = onClearCache
    process.on('message', (msg: any) => {
      if (msg.task === Database.MSG_CLEAR_CACHE) {
        if (Database.onClearCache) Database.onClearCache()
      }
    })
  }

}
