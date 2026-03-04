// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { BelongsTo, Column, DataType, ForeignKey, Table, Unique } from 'sequelize-typescript'
import { Op } from 'sequelize'
import { RapDvBaseEntity } from './RapDvBaseEntity'
import { User } from './CollectionUser'
import { Collection } from './Collection'
import { Tasks } from '../tasks/Tasks'

@Table({ tableName: 'user_sessions', timestamps: true })
export class UserSession extends RapDvBaseEntity {
  @ForeignKey(() => User)
  @Column({ allowNull: true, type: DataType.UUID })
  userId: string

  @BelongsTo(() => User)
  user: User

  @Unique
  @Column({ allowNull: true })
  sessionId: string

  @Column({ allowNull: true })
  ip: string

  @Column({ allowNull: true })
  userAgent: string

  @Column({ allowNull: true, type: DataType.DATE })
  expiresDate: Date

  isValid(): boolean {
    return this.expiresDate?.getTime() > Date.now()
  }
}

export class CollectionUserSession extends Collection {
  public static DEFAULT_USER_EXPERIATION_TIME_MS = 365 * 24 * 60 * 60 * 1000 // 1yr
  public static DEFAULT_GUEST_EXPERIATION_TIME_MS = 30 * 60 * 1000 // 30min
  private static REMOVE_EXPIRED_SESSIONS_EVERY_MS: number = 86400000 // 24h
  private static REMOVE_EXPIRED_SESSIONS_TIMER_KEY = 'REMOVE_EXPIRED_SESSIONS'

  constructor() {
    super('UserSession', UserSession)
  }

  public static createUserSession = async (user: any, sessionId: string, ip: string, userAgent: string): Promise<any> => {
    await CollectionUserSession.removeSession(sessionId)

    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession
    let expiresDate = new Date(new Date().getTime() + CollectionUserSession.DEFAULT_USER_EXPERIATION_TIME_MS)
    const userId = user && (user._id || user.id) ? (user._id || user.id).toString() : user?.toString()

    const newInstance = collectionUserSession.repository.create({
      userId,
      sessionId,
      ip,
      userAgent,
      expiresDate,
    })

    await collectionUserSession.repository.save(newInstance)
    return newInstance
  }

  public static findSessions = async (user: any): Promise<any> => {
    if (!user) return null
    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession

    try {
      const userId = user && (user._id || user.id) ? (user._id || user.id).toString() : user?.toString()
      let result = await collectionUserSession.repository.find({
        where: { userId },
        order: { createdAt: 'ASC' },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.findSessions. ' + error)
      return null
    }
  }

  public static findUserSession = async (user: any, sessionId: string): Promise<any> => {
    if (!user) return null
    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession

    try {
      const userId = user && (user._id || user.id) ? (user._id || user.id).toString() : user?.toString()
      let result = await collectionUserSession.repository.findOne({
        where: { userId, sessionId },
        order: { createdAt: 'ASC' },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.findUserSession. ' + error)
      return null
    }
  }

  public static findSession = async (sessionId: string): Promise<any> => {
    if (!sessionId) return null
    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession

    try {
      let result = await collectionUserSession.repository.findOne({
        where: { sessionId },
        order: { createdAt: 'ASC' },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.findSession. ' + error)
      return null
    }
  }

  public static removeUserSession = async (user: any, sessionId: string) => {
    if (!user) return null
    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession

    try {
      const userId = user && (user._id || user.id) ? (user._id || user.id).toString() : user?.toString()
      let result = await collectionUserSession.repository.delete({ userId, sessionId })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.removeUserSession. ' + error)
      return null
    }
  }

  public static removeSession = async (sessionId: string) => {
    if (!sessionId) return null
    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession

    try {
      let result = await collectionUserSession.repository.delete({ sessionId })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.removeSession. ' + error)
      return null
    }
  }

  public static removeAllUserSessions = async (user: any) => {
    if (!user) return null
    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession

    try {
      const userId = user && (user._id || user.id) ? (user._id || user.id).toString() : user?.toString()
      let result = await collectionUserSession.repository.delete({ userId })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.removeAllUserSessions. ' + error)
      return null
    }
  }

  public static removeAllExpiredSessions = async () => {
    const collectionUserSession = Collection.get('UserSession') as CollectionUserSession

    try {
      const result = await collectionUserSession.repository.delete({
        expiresDate: { [Op.lt]: new Date() },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.removeAllExpiredSessions. ' + error)
      return null
    }
  }

  public static stopJobForRemovingAllExpiredSessions() {
    Tasks.stopJob(CollectionUserSession.REMOVE_EXPIRED_SESSIONS_TIMER_KEY)
  }

  public static startJobForRemovingAllExpiredSessions() {
    Tasks.startJob(
      CollectionUserSession.REMOVE_EXPIRED_SESSIONS_TIMER_KEY,
      CollectionUserSession.removeAllExpiredSessions,
      CollectionUserSession.REMOVE_EXPIRED_SESSIONS_EVERY_MS
    )
  }
}
