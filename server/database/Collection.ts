// Copyright (C) Konrad Gadzinowski

import mongoose, { HydratedDocument, IndexDefinition, Model, ObjectId, Schema, SchemaDefinition } from "mongoose"
import { TextUtils } from "../text/TextUtils"

export class Collection {
  public model: Model<any, any, any, any, any>

  public static collections = []

  public static areEntriesSame = (entryA, entryB) => Collection.getEntryId(entryA) === Collection.getEntryId(entryB)

  public static getEntryId(entry): any {
    if (!entry) return null
    if (entry._id) entry = entry._id
    entry = entry.toString()
    return entry
  }

  public static getAll = (): Collection[] => Collection.collections

  public static get = <T extends Collection>(name: string): T => {
    const instance = Collection.collections[name]
    if (!instance) {
      const error = `Collection instance: '${name}' is missing!`
      Collection.onError(error, error)
      throw error
    }

    return instance
  }

  public static findEntry = async (collectionName: string, queryData: any, populate?: string[]): Promise<HydratedDocument<any>> => {
    const collection = Collection.get(collectionName)
    return collection.findOne(queryData, populate)
  }

  public static deleteEntry = async (collectionName: string, queryData: any): Promise<boolean> => {
    const collection = Collection.get(collectionName)
    const entry = await collection.findOne(queryData)
    if (!entry) return false
    await entry.delete()
    return true
  }

  public static deleteEntries = async (collectionName: string, queryData: any): Promise<boolean> => {
    const collection = Collection.get(collectionName)
    await collection.model.deleteMany(queryData)
    return true
  }

  private static set = (name: string, collection: Collection) => {
    if (!Collection.collections) Collection.collections = []
    Collection.collections[name] = collection
  }

  public static doesAlreadyExists = (name: string): boolean => !!Collection.collections[name]

  public static clearCollections = (): void => {
    const models: any = mongoose.connection.models
    for (var model in models) {
      delete models[model];
    }


    Collection.collections = []
  }

  public static countByAggregate = async (collection: any, queryAggregate: Array<any>): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      const query = [...queryAggregate]
      query.push({ $group: { _id: null, count: { $sum: 1 } } })
      
      collection.model.aggregate(query, (error, count) => {

        let countNumber = 0
        if (count && count.length > 0 && count[0].count) {
          countNumber = parseInt(count[0].count)
        }

        resolve(countNumber)
      })
    })
  }

  public static onError = (title: string, message: string) => {
    console.error("Error! " + title + ", " + message)
    const LOG_TYPE_ERROR = "Error"
    Collection.saveLog("Error! " + title, LOG_TYPE_ERROR, message)
  }

  /**
   * This method is here to avoid circular dependency to CollectionLog
   */
  public static saveLog = async (
    title: string,
    type: string,
    description: string,
  ): Promise<any> => {
    const Log = Collection.get("Log").model

    // Create initial company
    const log = new Log({
      title,
      type,
      description,
    })

    await log.save()
    return log
  }

  private name: string

  constructor(name: string, schema: SchemaDefinition, index?: IndexDefinition, modifySchema?: (schema: Schema) => Schema) {
    this.name = name

    if (Collection.doesAlreadyExists(name)) {
      throw "Collection already exists!"
    }

    let collection = new Schema(schema, { timestamps: true })
    if (!!index) collection.index(index)
    if (!!modifySchema) collection = modifySchema(collection)

    const model = mongoose.model(name, collection)
    this.model = model

    Collection.set(name, this)

    const collectionKeys = Object.keys(Collection.collections)
  }

  public getName = (): string => this.name

  public findOne = async (queryData: any, populate?: string[]): Promise<HydratedDocument<any>> => {
    try {
      let query = this.model.findOne(queryData)
      if (!!populate) {
        for (const populateName of populate) {
          query = query.populate(populateName)
        }
      }
      let result = await query.sort({ createdAt: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete Collection.findOne. " + error)
      return null
    }
  }

  public findLast = async (queryData: any, populate?: string[]): Promise<HydratedDocument<any>> => {
    try {
      let query = this.model.findOne(queryData)
      if (!!populate) {
        for (const populateName of populate) {
          query = query.populate(populateName)
        }
      }
      let result = await query.sort({ createdAt: -1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete Collection.findLast. " + error)
      return null
    }
  }

  public findOldest = async (queryData: any, populate?: string[]): Promise<HydratedDocument<any>> => {
    try {
      let query = this.model.findOne(queryData)
      if (!!populate) {
        for (const populateName of populate) {
          query = query.populate(populateName)
        }
      }
      let result = await query.sort({ createdAt: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete Collection.findOldest. " + error)
      return null
    }
  }

  public create = (): HydratedDocument<any> => {
    return new this.model()
  }

  public findOneOrCreate = async (queryData: any, populate?: string[]): Promise<HydratedDocument<any>> => {
    const existing = await this.findOne(queryData, populate)
    if (!!existing) return existing
    return new this.model(queryData)
  }

  public findById = async (id: ObjectId | string, populate?: string[]): Promise<HydratedDocument<any>> => {
    if (!id) return null

    try {
      let query = this.model.findOne({ _id: id.toString() })
      if (!!populate) {
        for (const populateName of populate) {
          query = query.populate(populateName)
        }
      }
      let result = await query.sort({ createdAt: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete Collection.findById. " + error)
      return null
    }
  }

  public findAll = async (queryData?: any, from?: number, limit?: number, populate?: string[], sort?: any): Promise<HydratedDocument<any>[]> => {
    try {
      let query = this.model.find(queryData)
      if (from !== undefined) {
        query = query.skip(from)
      }
      if (limit !== undefined && limit > 0) {
        query = query.limit(limit)
      }
      if (sort !== undefined) {
        query = query.sort(sort)
      } else {
        query = query.sort({ createdAt: -1 })
      }
      if (!!populate) {
        for (const populateName of populate) {
          query = query.populate(populateName)
        }
      }
      const result = await query.exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete Collection.findAll. " + error)
      return null
    }
  }

  public count = async (queryData?: any): Promise<number> => {
    try {
      let result = await this.model.find(queryData).count()
      return result
    } catch (error) {
      console.warn("Couldn't complete Collection.findAll. " + error)
      return null
    }
  }

  public save = async (data: any): Promise<HydratedDocument<any>> => {
    let entry
    if (!data._id) {
      // New entry
      const Entry = this.model
      entry = new Entry(data)
    } else {
      // Update data
      entry = await this.findById(data._id)
      if (!entry) {
        Collection.onError(
          `Couldn't update entry in ${this.model.collection.name}`,
          `Couldn't update entry in ${this.model.collection.name} with ID: ${data._id}. This item doesn't exist.`
        )
        return
      }

      for (const key in data) {
        entry[key] = data[key]
      }
    }

    await entry.save()
    return entry
  }

  public generateKey = async (
    currentId: string | null,
    name: string,
    findDuplicateByKey: (key: string) => Promise<HydratedDocument<any>>,
    dontReplaceCharacters: boolean = false
  ): Promise<string> => {
    let key: any = name.toLowerCase()
    key = TextUtils.accentsToLatin(key)
    key = TextUtils.toKebabCase(key, true)

    if (!dontReplaceCharacters) {
      key = key.replace(/[.,;:\s]/g, "-").replace(/[^A-Z0-9\-_]/gi, "_")
    }

    if (currentId) currentId = currentId.toString()

    // Check for already existing entry with this key
    try {
      let isDuplicate = true
      while (isDuplicate) {
        let entryWithSameKey = await findDuplicateByKey(key)
        isDuplicate = (!currentId && entryWithSameKey) || (currentId && entryWithSameKey && entryWithSameKey._id.toString() != currentId)
        if (!isDuplicate) break

        const SINGLE_DIGIT = 10
        if (!isNaN(key)) key = parseFloat(key)
        key = key + Math.floor(Math.random() * SINGLE_DIGIT)
        key = key.toString()
      }
    } catch (exception) {
      Collection.onError("Couldn't check if entry with key exists", "Couldn't check if there is already entry with this key. " + exception)
    }

    return key
  }
}
