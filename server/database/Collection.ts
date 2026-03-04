// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Op } from 'sequelize'
import { TextUtils } from '../text/TextUtils'
import { Database } from './Database'

// SequelizeRepositoryAdapter — provides a repository API over Sequelize models
class SequelizeRepositoryAdapter {
  constructor(private modelClass: any) {}

  private translateOrder(order: any): any[] {
    if (!order) return [['createdAt', 'DESC']]
    return Object.entries(order).map(([k, v]) => [k, v])
  }

  private translateOptions(opts: any): any {
    const seqOpts: any = {}

    if (opts.where) seqOpts.where = opts.where

    if (opts.order) {
      seqOpts.order = this.translateOrder(opts.order)
    }

    if (opts.relations?.length) {
      seqOpts.include = opts.relations.map((rel: string) => {
        const assoc = this.modelClass.associations?.[rel]
        if (assoc) return { model: assoc.target, as: rel }
        return rel
      })
    }

    if (opts.skip !== undefined) seqOpts.offset = opts.skip
    if (opts.take !== undefined) seqOpts.limit = opts.take

    return seqOpts
  }

  create(data?: any) {
    return this.modelClass.build(data || {})
  }

  async save(entity: any) {
    return entity.save()
  }

  async find(opts: any = {}) {
    return this.modelClass.findAll(this.translateOptions(opts))
  }

  async findOne(opts: any = {}) {
    return this.modelClass.findOne(this.translateOptions(opts))
  }

  async delete(where: any) {
    return this.modelClass.destroy({ where })
  }

  async remove(entity: any) {
    return entity.destroy()
  }

  async count(opts: any = {}) {
    const seqOpts: any = {}
    if (opts.where) seqOpts.where = opts.where
    return this.modelClass.count(seqOpts)
  }

  // Retained for backward compatibility — collection files that still use it
  // will need to be rewritten; this throws a helpful error to catch any missed ones.
  createQueryBuilder(alias: string): never {
    throw new Error(`createQueryBuilder('${alias}') is not supported with Sequelize. Rewrite the query using Op.iLike / Op.or.`)
  }
}

export class Collection {
  public entityClass: Function

  public static collections = []

  get repository(): SequelizeRepositoryAdapter {
    return new SequelizeRepositoryAdapter(this.entityClass)
  }

  public static areEntriesSame = (entryA, entryB) => Collection.getEntryId(entryA) === Collection.getEntryId(entryB)

  public static getEntryId(entry): any {
    if (!entry) return null
    if (entry._id) return entry._id.toString()
    if (entry.id) return entry.id.toString()
    return entry.toString()
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
    await entry.remove()
    return true
  }

  public static deleteEntries = async (collectionName: string, queryData: any): Promise<boolean> => {
    const collection = Collection.get(collectionName)
    await collection.repository.delete(collection.translateQuery(queryData))
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
      const log = logCollection.repository.create({ title, type, description })
      await logCollection.repository.save(log)
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

  public translateQuery = (queryData: any): any => {
    if (!queryData) return {}

    let result: any = {}

    // Get entity associations for relation detection
    const associations: any = (this.entityClass as any).associations || {}

    for (const key in queryData) {
      const value = queryData[key]

      // Map _id alias to the actual primary key column
      if (key === '_id') {
        result['id'] = value
        continue
      }

      // Check if this is a relation field (association)
      if (associations[key]) {
        const assoc = associations[key]
        const idKey = assoc.foreignKey || (key + 'Id')
        if (value === null || value === undefined) {
          result[idKey] = null
        } else if (value && typeof value === 'object' && (value._id || value.id)) {
          result[idKey] = (value._id || value.id).toString()
        } else {
          result[idKey] = value.toString()
        }
        continue
      }

      if (value === null || value === undefined) {
        result[key] = value
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        if (value.$lt !== undefined) result[key] = { [Op.lt]: value.$lt }
        else if (value.$gt !== undefined) result[key] = { [Op.gt]: value.$gt }
        else if (value.$in !== undefined) result[key] = { [Op.in]: value.$in }
        else if (value.$ne !== undefined) result[key] = { [Op.ne]: value.$ne }
        else result[key] = value
      } else {
        result[key] = value
      }
    }

    return result
  }

  private translateSort = (sort: any): any => {
    if (!sort) return { createdAt: 'DESC' }

    let result: any = {}
    for (const key in sort) {
      result[key] = sort[key] === -1 || sort[key] === 'DESC' ? 'DESC' : 'ASC'
    }
    return result
  }

  public findOne = async (queryData: any, populate?: string[], sort?: any): Promise<any> => {
    try {
      const where = this.translateQuery(queryData)
      const order = sort ? this.translateSort(sort) : { createdAt: 'ASC' }
      const result = await this.repository.findOne({
        where,
        relations: populate,
        order,
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findOne. ' + error)
      return null
    }
  }

  public findLast = async (queryData: any, populate?: string[]): Promise<any> => {
    try {
      const where = this.translateQuery(queryData)
      const result = await this.repository.findOne({
        where,
        relations: populate,
        order: { createdAt: 'DESC' },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findLast. ' + error)
      return null
    }
  }

  public findOldest = async (queryData: any, populate?: string[]): Promise<any> => {
    try {
      const where = this.translateQuery(queryData)
      const result = await this.repository.findOne({
        where,
        relations: populate,
        order: { createdAt: 'ASC' },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findOldest. ' + error)
      return null
    }
  }

  public create = (): any => {
    return this.repository.create()
  }

  public findOneOrCreate = async (queryData: any, populate?: string[]): Promise<any> => {
    const existing = await this.findOne(queryData, populate)
    if (!!existing) return existing
    const entity = this.repository.create()
    Object.assign(entity, queryData)
    return entity
  }

  public findById = async (id: any, populate?: string[]): Promise<any> => {
    if (!id) return null

    try {
      const idStr = id._id ? id._id.toString() : id.toString()
      const result = await this.repository.findOne({
        where: { id: idStr },
        relations: populate,
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findById. ' + error)
      return null
    }
  }

  public findAll = async (queryData?: any, from?: number, limit?: number, populate?: string[], sort?: any): Promise<any[]> => {
    try {
      const where = queryData ? this.translateQuery(queryData) : {}
      const order = sort ? this.translateSort(sort) : { createdAt: 'DESC' }

      const options: any = { where, order, relations: populate }
      if (from !== undefined) options.skip = from
      if (limit !== undefined && limit > 0) options.take = limit

      const result = await this.repository.find(options)
      return result
    } catch (error) {
      console.warn('Couldn\'t complete Collection.findAll. ' + error)
      return null
    }
  }

  public count = async (queryData?: any): Promise<number> => {
    try {
      const where = queryData ? this.translateQuery(queryData) : {}
      const result = await this.repository.count({ where })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete Collection.count. ' + error)
      return null
    }
  }

  public save = async (data: any): Promise<any> => {
    let entry
    if (!data._id && !data.id) {
      entry = this.repository.create(data)
    } else {
      const id = data._id || data.id
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

    await this.repository.save(entry)
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
        isDuplicate = (!currentId && entryWithSameKey) || (currentId && entryWithSameKey && entryWithSameKey._id.toString() != currentId)
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
