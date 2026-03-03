// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Column, Entity } from 'typeorm'
import { RapDvBaseEntity } from './RapDvBaseEntity'
import { Collection } from './Collection'

export enum LogType {
  EmailSent = 'EmailSent',
  Error = 'Error',
  RecurringJobStarted = 'RecurringJobStarted',
}

@Entity('logs')
export class Log extends RapDvBaseEntity {
  @Column({ nullable: true, type: 'text' })
  title: string

  @Column({ nullable: true })
  type: string

  @Column({ nullable: true, type: 'text' })
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
      const qb = this.buildLogQuery(filter, type)
      const result = await qb.orderBy('log.updatedAt', 'DESC').skip(from).take(limit).getMany()
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionLog.findAllLogs. ' + error)
      return null
    }
  }

  public count = async (filter: string, type: string = null): Promise<number> => {
    try {
      const qb = this.buildLogQuery(filter, type)
      const result = await qb.getCount()
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionLog.count. ' + error)
      return null
    }
  }

  private buildLogQuery = (filter: string, type: string = null) => {
    let qb = this.repository.createQueryBuilder('log')

    const hasFilter = filter && filter.length > 0
    const hasType = !!type

    if (hasFilter && hasType) {
      qb = qb
        .where('(log.title ILIKE :filter OR log.type ILIKE :filter OR log.description ILIKE :filter)', { filter: `%${filter}%` })
        .andWhere('log.type = :type', { type })
    } else if (hasFilter) {
      qb = qb.where('(log.title ILIKE :filter OR log.type ILIKE :filter OR log.description ILIKE :filter)', { filter: `%${filter}%` })
    } else if (hasType) {
      qb = qb.where('log.type = :type', { type })
    }

    return qb
  }
}
