// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Collection } from './Collection'
import { CollectionEvolution, Evolution } from './CollectionEvolution'

export enum QueryType {
  Include = 'inlcude',
  Exclude = 'exclude',
  Ignore = 'ignore',
}

export class Database {
  public static dataSource: DataSource
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

  public init = async (databaseUrl: string, isProd: boolean, customEntities: Function[] = []) => {
    Collection.clearCollections()

    // Import built-in entities
    const { Log } = require('./CollectionLog')
    const { File } = require('./CollectionFile')
    const { ImageFile } = require('./CollectionImageFile')
    const { System } = require('./CollectionSystem')
    const { User } = require('./CollectionUser')
    const { UserSession } = require('./CollectionUserSession')

    const builtInEntities = [Evolution, Log, File, ImageFile, System, User, UserSession]
    const allEntities = [...builtInEntities, ...customEntities]

    if (!databaseUrl || (!databaseUrl.startsWith('postgresql') && !databaseUrl.startsWith('postgres'))) {
      // Test mode: use pg-mem
      Database.isTest = true
      const { newDb } = require('pg-mem')
      const db = newDb()
      Database.dataSource = db.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: allEntities,
        synchronize: true,
        logging: false,
      })
      await Database.dataSource.initialize()
      console.info('pg-mem (in-memory PostgreSQL) connection is open for testing')
    } else {
      Database.dataSource = new DataSource({
        type: 'postgres',
        url: databaseUrl,
        entities: allEntities,
        migrations: ['migrations/*.ts'],
        migrationsRun: false,
        synchronize: false,
        logging: !isProd,
        ssl: isProd ? { rejectUnauthorized: false } : false,
      })
      await Database.dataSource.initialize()
      console.info('PostgreSQL connection is open')
    }

    // Init evolution collection
    new CollectionEvolution()

    // Handle graceful shutdown
    const onClose = async () => {
      if (Database.dataSource && Database.dataSource.isInitialized) {
        await Database.dataSource.destroy()
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

  public updateDbVersion(
    newVersion: number,
    description: string,
    onDbVersionChangedCallback: (currentVersion: number) => Promise<any>
  ): Promise<any> {
    return new Promise<string | void>(async (resolve, reject) => {
      try {
        const repo = Database.dataSource.getRepository(Evolution)
        const evolution = await repo.findOne({ where: {}, order: { date: 'DESC' } })

        let dbVersionChanged: boolean = false

        if (!evolution) {
          dbVersionChanged = true
          console.info('Initial database created. Scheme ver.: ' + newVersion)
          await onDbVersionChangedCallback(newVersion)
        } else {
          let currentVersion: number = evolution.number
          if (currentVersion < newVersion) {
            dbVersionChanged = true
            console.info('Database version changed: ' + currentVersion + ' -> ' + newVersion)
            console.info('Starting migration...')
            await onDbVersionChangedCallback(currentVersion)
            console.info('Migration was successful!')
          }
        }

        if (dbVersionChanged) {
          const newEvolution = repo.create({
            number: newVersion,
            comments: description,
            date: new Date(),
          })
          await repo.save(newEvolution)
        }

        return resolve()
      } catch (error) {
        console.error('Error on checking current database version: ' + error)
        return resolve()
      }
    })
  }
}
