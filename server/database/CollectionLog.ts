// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Column, DataType, Table } from 'sequelize-typescript'
import { Op } from 'sequelize'
import { RapDvBaseEntity } from './RapDvBaseEntity'
import { Collection } from './Collection'

export enum LogType {
  EmailSent = 'EmailSent',
  Error = 'Error',
  RecurringJobStarted = 'RecurringJobStarted',
}

@Table({ tableName: 'logs', timestamps: true })
export class Log extends RapDvBaseEntity {
  @Column({ allowNull: true, type: DataType.TEXT })
  title: string

  @Column({ allowNull: true })
  type: string

  @Column({ allowNull: true, type: DataType.TEXT })
  description: string
}

export class CollectionLog extends Collection {
  constructor() {
    super('Log', Log)
  }

  public static create = async (title: string, type: LogType, description: string): Promise<any> =>
    Collection.saveLog(title, type, description)

  public findAllLogs = async (from: number, limit: number, filter: string, type: string = null): Promise<Array<any>> => {
    try {
      const where = this.buildLogWhere(filter, type)
      const result = await Log.findAll({
        where,
        order: [['updatedAt', 'DESC']],
        offset: from,
        limit,
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionLog.findAllLogs. ' + error)
      return null
    }
  }

  public count = async (filter: string, type: string = null): Promise<number> => {
    try {
      const where = this.buildLogWhere(filter, type)
      const result = await Log.count({ where })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionLog.count. ' + error)
      return null
    }
  }

  private buildLogWhere = (filter: string, type: string = null): any => {
    const hasFilter = filter && filter.length > 0
    const hasType = !!type
    const conditions: any[] = []

    if (hasFilter) {
      conditions.push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${filter}%` } },
          { type: { [Op.iLike]: `%${filter}%` } },
          { description: { [Op.iLike]: `%${filter}%` } },
        ],
      })
    }

    if (hasType) {
      conditions.push({ type })
    }

    if (conditions.length === 0) return {}
    if (conditions.length === 1) return conditions[0]
    return { [Op.and]: conditions }
  }
}
