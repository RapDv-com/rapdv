// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { TextUtils } from '../text/TextUtils'

export type Sort = [string, 'ASC' | 'DESC'][]

export class Collection {
  public entityClass: Function

  public static collections = []

  public get model(): any {
    return this.entityClass as any
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

  public static findEntry = async (collectionName: string, queryData: any, populate?: string[]): Promise<any> => {
    const collection = Collection.get(collectionName)
    return collection.findOne(queryData, populate)
  }

  public static deleteEntry = async (collectionName: string, queryData: any): Promise<boolean> => {
    const collection = Collection.get(collectionName)
    const entry = await collection.findOne(queryData)
    if (!entry) return false
    await entry.destroy()
    return true
  }

  public static deleteEntries = async (collectionName: string, queryData: any): Promise<boolean> => {
    const collection = Collection.get(collectionName)
    await collection.model.destroy({ where: queryData })
    return true
  }

  private static set = (name: string, collection: Collection) => {
    if (!Collection.collections) Collection.collections = []
    Collection.collections[name] = collection
  }

  public static doesAlreadyExists = (name: string): boolean => !!Collection.collections[name]

  public static clearCollections = (): void => {
    Collection.collections = []
  }

  public static onError = (title: string, message: string) => {
    console.error('Error! ' + title + ', ' + message)
    const LOG_TYPE_ERROR = 'Error'
    Collection.saveLog('Error! ' + title, LOG_TYPE_ERROR, message)
  }

  /**
   * This method is here to avoid circular dependency to CollectionLog
   */
  public static saveLog = async (title: string, type: string, description: string): Promise<any> => {
    try {
      const logCollection = Collection.collections['Log']
      if (!logCollection) return null
      const log = logCollection.model.build({ title, type, description })
      await log.save()
      return log
    } catch (e) {
      console.error('Couldn\'t save log: ' + e)
      return null
    }
  }

  private name: string

  constructor(name: string, entityClass: Function) {
    this.name = name
    this.entityClass = entityClass

    if (Collection.doesAlreadyExists(name)) {
      throw 'Collection already exists!'
    }

    Collection.set(name, this)
  }

  public getName = (): string => this.name

  private buildInclude = (populate?: string[]): any[] | undefined => {
    if (!populate || populate.length === 0) return undefined
    return populate.map((relationName) => {
      const association = this.model.associations?.[relationName]
      if (association) return { model: association.target, as: relationName }
      return relationName
    })
  }

  public findOne = async (queryData: any, populate?: string[], sort?: Sort): Promise<any> => {
    try {
      const options: any = { where: queryData || {} }
      const include = this.buildInclude(populate)
      if (include) options.include = include
      if (sort) options.order = sort
      return await this.model.findOne(options)
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findOne. ' + error)
      return null
    }
  }

  public findLast = async (queryData: any, populate?: string[]): Promise<any> => {
    return this.findOne(queryData, populate, [['createdAt', 'DESC']])
  }

  public findOldest = async (queryData: any, populate?: string[]): Promise<any> => {
    return this.findOne(queryData, populate, [['createdAt', 'ASC']])
  }

  public create = (): any => {
    return this.model.build({})
  }

  public findOneOrCreate = async (queryData: any, populate?: string[]): Promise<any> => {
    const existing = await this.findOne(queryData, populate)
    if (!!existing) return existing
    const entity = this.model.build({})
    Object.assign(entity, queryData)
    return entity
  }

  public findById = async (id: any, populate?: string[]): Promise<any> => {
    if (!id) return null

    try {
      const idStr = id.id ? id.id.toString() : id.toString()
      const options: any = { where: { id: idStr } }
      const include = this.buildInclude(populate)
      if (include) options.include = include
      return await this.model.findOne(options)
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findById. ' + error)
      return null
    }
  }

  public findAll = async (queryData?: any, from?: number, limit?: number, populate?: string[], sort?: Sort): Promise<any[]> => {
    try {
      const options: any = { where: queryData || {} }
      const include = this.buildInclude(populate)
      if (include) options.include = include
      if (sort) options.order = sort
      if (from !== undefined) options.offset = from
      if (limit !== undefined && limit > 0) options.limit = limit

      return await this.model.findAll(options)
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findAll. ' + error)
      return null
    }
  }

  public count = async (queryData?: any): Promise<number> => {
    try {
      return await this.model.count({ where: queryData || {} })
    } catch (error) {
      console.warn('Couldn\'t complete Collection.count. ' + error)
      return null
    }
  }

  public save = async (data: any): Promise<any> => {
    let entry
    if (!data.id) {
      entry = this.model.build(data)
    } else {
      const id = data.id
      entry = await this.findById(id)
      if (!entry) {
        Collection.onError(
          `Couldn't update entry in ${this.name}`,
          `Couldn't update entry in ${this.name} with ID: ${id}. This item doesn't exist.`
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
    findDuplicateByKey: (key: string) => Promise<any>,
    dontReplaceCharacters: boolean = false
  ): Promise<string> => {
    let key: any = name.toLowerCase()
    key = TextUtils.accentsToLatin(key)
    key = TextUtils.toKebabCase(key, true)

    if (!dontReplaceCharacters) {
      key = key.replace(/[.,;:\s]/g, '-').replace(/[^A-Z0-9\-_]/gi, '_')
    }

    if (currentId) currentId = currentId.toString()

    try {
      let isDuplicate = true
      while (isDuplicate) {
        let entryWithSameKey = await findDuplicateByKey(key)
        isDuplicate = (!currentId && entryWithSameKey) || (currentId && entryWithSameKey && entryWithSameKey.id.toString() != currentId)
        if (!isDuplicate) break

        const SINGLE_DIGIT = 10
        if (!isNaN(key)) key = parseFloat(key)
        key = key + Math.floor(Math.random() * SINGLE_DIGIT)
        key = key.toString()
      }
    } catch (exception) {
      Collection.onError('Couldn\'t check if entry with key exists', 'Couldn\'t check if there is already entry with this key. ' + exception)
    }

    return key
  }
}
