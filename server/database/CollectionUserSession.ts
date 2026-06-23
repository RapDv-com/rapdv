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

    let expiresDate = new Date(new Date().getTime() + CollectionUserSession.DEFAULT_USER_EXPERIATION_TIME_MS)
    const userId = user && user.id ? user.id.toString() : user?.toString()

    const newInstance = UserSession.build({
      userId,
      sessionId,
      ip,
      userAgent,
      expiresDate,
    })

    await newInstance.save()
    return newInstance
  }

  public static findSessions = async (user: any): Promise<any> => {
    if (!user) return null

    try {
      const userId = user && user.id ? user.id.toString() : user?.toString()
      let result = await UserSession.findAll({
        where: { userId },
        order: [['createdAt', 'ASC']],
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.findSessions. ' + error)
      return null
    }
  }

  public static findUserSession = async (user: any, sessionId: string): Promise<any> => {
    if (!user) return null

    try {
      const userId = user && user.id ? user.id.toString() : user?.toString()
      let result = await UserSession.findOne({
        where: { userId, sessionId },
        order: [['createdAt', 'ASC']],
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.findUserSession. ' + error)
      return null
    }
  }

  public static findSession = async (sessionId: string): Promise<any> => {
    if (!sessionId) return null

    try {
      let result = await UserSession.findOne({
        where: { sessionId },
        order: [['createdAt', 'ASC']],
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.findSession. ' + error)
      return null
    }
  }

  public static removeUserSession = async (user: any, sessionId: string) => {
    if (!user) return null

    try {
      const userId = user && user.id ? user.id.toString() : user?.toString()
      let result = await UserSession.destroy({ where: { userId, sessionId } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.removeUserSession. ' + error)
      return null
    }
  }

  public static removeSession = async (sessionId: string) => {
    if (!sessionId) return null

    try {
      let result = await UserSession.destroy({ where: { sessionId } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.removeSession. ' + error)
      return null
    }
  }

  public static removeAllUserSessions = async (user: any) => {
    if (!user) return null

    try {
      const userId = user && user.id ? user.id.toString() : user?.toString()
      let result = await UserSession.destroy({ where: { userId } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUserSession.removeAllUserSessions. ' + error)
      return null
    }
  }

  public static removeAllExpiredSessions = async () => {
    try {
      const result = await UserSession.destroy({
        where: { expiresDate: { [Op.lt]: new Date() } },
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
