// Copyright (C) Konrad Gadzinowski

import { CollectionEvolution } from "./CollectionEvolution"
import { CollectionLog } from "./CollectionLog"
import { CollectionFile } from "./CollectionFile"
import { CollectionImageFile } from "./CollectionImageFile"
import { CollectionUser } from "./CollectionUser"
import { CollectionUserSession } from "./CollectionUserSession"
import mongoose from "mongoose"
import { Mockgoose } from "mockgoose"
import { CollectionSystem } from "./CollectionSystem"
import { Collection } from "./Collection"
import { RapDvApp } from "../RapDvApp"

export enum QueryType {
  Include = "inlcude",
  Exclude = "exclude",
  Ignore = "ignore"
}

export class Database {
  
  public static IGNORE_NUMBER: number = -1
  public static SORT_NEWEST_FIRST = { createdAt: -1 }
  public static SORT_OLDEST_FIRST = { createdAt: 1 }
  
  public static ASC = 1 
  public static DESC = -1

  private static RECONNECT_AFTER_MS = 20000
  private static RECONNECT_MAX_TRIES = 10
  private static MSG_CLEAR_CACHE: string = "clearCache"

  public static isTest: boolean = false

  private static onClearCache

  public reconnect: boolean
  public mongoDbUri
  public reconnectedTries = 0
  public reconnectTimer
  public modelEvolution

  constructor() {}

  public static getEntryId(entry): any {
    if (!entry) return null
    if (entry._id) entry = entry._id
    entry = entry.toString()
    return entry
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
    let key = ""

    if (initialKey) {
      key = initialKey.toLowerCase()
    } else {
      let defaultKeyLength = 12
      key = generateRandomString(defaultKeyLength)
    }

    // Include user data
    key = accentsToLatin(key)
    key = key.replace(/[.,;:\s]/g, "-").replace(/[^A-Z0-9\-_]/gi, "")

    let currentId = null
    if (_id) currentId = _id.toString()

    // Check for already existing user with this key
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
          keyBase = key + "-"
        }
        key = keyBase + anotherNumber
        anotherNumber++
      }
    } catch (exception) {
      console.error("couldn't check if there is already user with this key. " + exception)
    }

    return key
  }

  public init = async (mongoDbUri: string, reconnect: boolean) => {
    this.reconnect = reconnect
    this.reconnectedTries = 0
    this.mongoDbUri = mongoDbUri
    mongoose.Promise = global.Promise

    Collection.clearCollections()

    if (mongoDbUri.indexOf("mongodb://") < 0) {
      // Tests
      Database.isTest = true
      let mockgoose = new Mockgoose(mongoose)

      await mockgoose.prepareStorage()
      await this.setupConnection()
    } else {
      // Development or production
      await this.setupConnection()
    }
  }

  public async initDatabaseContent(customRoles: string[]) {
    // Init schemas
    new CollectionLog()
    new CollectionFile()
    new CollectionImageFile()
    new CollectionSystem()
    CollectionSystem.create()
    new CollectionUser(customRoles)
    new CollectionUserSession()
  }

  public static clearCache() {
    if (!!process.send) {
      process.send({
        task: Database.MSG_CLEAR_CACHE
      })
    } else {
      if (Database.onClearCache) Database.onClearCache()
    }
  }

  public onClearCache(onClearCache: () => void) {
    Database.onClearCache = onClearCache
    process.on("message", (msg: any) => {
      if (msg.task === Database.MSG_CLEAR_CACHE) {
        if (Database.onClearCache) Database.onClearCache()
      }
    })
  }

  private setupConnection = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {

      const onDbConnectionOpened = () => {
        // We're connected!
        console.info("Mongoose connection is open")
    
        // Set models
        const collectionEvolution = new CollectionEvolution()
        this.modelEvolution = collectionEvolution.model
        resolve()
      }

      this.connectToMongoDb()
  
      // Set connection
      let db = mongoose.connection
  
      db.on("error", console.error.bind(console, "connection error:"))
      db.once("open", () => {
        onDbConnectionOpened()
      })
  
      db.on("connected", () => {
        console.info("Mongoose default connection open to " + this.mongoDbUri)
      })
  
      db.on("error", (error) => {
        console.info("Mongoose default connection error: " + error)
        mongoose.disconnect()
  
        if (this.reconnectedTries >= Database.RECONNECT_MAX_TRIES) return
        if (!this.reconnect) return
  
        this.reconnectTimer = setTimeout(() => {
          this.connectToMongoDb()
          this.reconnectedTries++
        }, Database.RECONNECT_AFTER_MS)
      })
  
      db.on("disconnected", () => {
        console.info("Mongoose default connection disconnected")
      })
  
      // If the Node process ends, close the Mongoose connection
      const onClose = async() => {
        await db.close()
        console.info("Mongoose default connection disconnected through app termination")
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
        process.exit(0)
      }
  
      process.on("SIGINT", onClose)
      process.on("SIGTERM", onClose)

      const CONNECTED = 1
      if (mongoose.connection.readyState === CONNECTED) {
        onDbConnectionOpened()
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
        const evolution = await this.modelEvolution.findOne({}, null, { sort: { date: -1 } })

        let dbVersionChanged: boolean = false

        if (!evolution) {
          // First version
          dbVersionChanged = true
          console.info("Initial database created. Scheme ver.: " + newVersion)
          await onDbVersionChangedCallback(newVersion)
        } else {
          let currentVersion: number = evolution.number
          if (currentVersion < newVersion) {
            dbVersionChanged = true
            console.info("Database version changed: " + currentVersion + " -> " + newVersion)
            console.info('Starting migration...')
            await onDbVersionChangedCallback(currentVersion)
            console.info('Migration was successful!')
          }
        }

        if (dbVersionChanged) {
          // Set new database version
          let evolution = new this.modelEvolution({
            number: newVersion,
            comments: description,
            date: new Date()
          })
          await evolution.save()
        }

        return resolve()
      } catch (error) {
        console.error("Error on checking current database version: " + error)
        return resolve()
      }
    })
  }

  private connectToMongoDb() {
    mongoose.connect(this.mongoDbUri, {
      autoIndex: process.env.AUTO_INDEX === "true" || !RapDvApp.isProduction(),
    })
  }
}
