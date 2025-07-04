// Copyright (C) Konrad Gadzinowski

import { Database } from "./Database"
import mongoose, { Schema } from "mongoose"
import { Collection } from "./Collection"
import { Tasks } from "../tasks/Tasks"

export class CollectionUserSession extends Collection {
  
  public static DEFAULT_USER_EXPERIATION_TIME_MS = 365 * 24 * 60 * 60 * 1000 // 1yr
  public static DEFAULT_GUEST_EXPERIATION_TIME_MS = 30 * 60 * 1000 // 30min
  private static REMOVE_EXPIRED_SESSIONS_EVERY_MS: number = 86400000 // 24h
  private static REMOVE_EXPIRED_SESSIONS_TIMER_KEY = "REMOVE_EXPIRED_SESSIONS"

  constructor() {
    super(
      "UserSession",
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        sessionId: { type: String, unique: true },
        ip: String,
        userAgent: String,
        expiresDate: Date
      },
      [{
        user: "text",
        sessionId: "text"
      }],
      (schema: Schema): Schema => {
        schema.methods.isValid = function () {
          let expiriesTime = this.expiresDate.getTime() - Date.now()
          if (expiriesTime < 0) return false
          return true
        }
        return schema
      }
    )
  }

  public static createUserSession = async (user: any, sessionId: string, ip: string, userAgent: string): Promise<any> => {
    const self = this

    // Remove previous session if exists
    await CollectionUserSession.removeSession(sessionId)

    // Create new session
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession
    let UserSession = collectionUserSession.model
    let expiresDate = new Date(new Date().getTime() + self.DEFAULT_USER_EXPERIATION_TIME_MS)

    let newInstance = new UserSession({
      user,
      sessionId,
      ip,
      userAgent,
      expiresDate
    })

    await newInstance.save()
    
    return newInstance
  }

  public static findSessions = async (user: any): Promise<any> => {
    if (!user) return null
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession

    try {
      let result = await collectionUserSession.model
        .find({ user: Database.getEntryId(user) })
        .sort({ timestamp: 1 })
        .exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUserSession.findSessions. " + error)
      return null
    }
  }

  public static findUserSession = async (user: any, sessionId: string): Promise<any> => {
    if (!user) return null
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession

    try {
      let result = await collectionUserSession.model.findOne({ user, sessionId }).sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUserSession.findUserSession. " + error)
      return null
    }
  }

  public static findSession = async (sessionId: string): Promise<any> => {
    if (!sessionId) return null
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession

    try {
      let result = await collectionUserSession.model.findOne({ sessionId }).sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUserSession.findSession. " + error)
      return null
    }
  }

  public static removeUserSession = async (user: any, sessionId: string) => {
    if (!user) return null
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession

    try {
      let result = await collectionUserSession.model.deleteMany({
        user,
        sessionId
      })
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUserSession.removeUserSession. " + error)
      return null
    }
  }

  public static removeSession = async (sessionId: string) => {
    if (!sessionId) return null
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession

    try {
      let result = await collectionUserSession.model.deleteMany({
        sessionId
      })
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUserSession.removeSession. " + error)
      return null
    }
  }

  public static removeAllUserSessions = async (user: any) => {
    if (!user) return null
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession

    try {
      let result = await collectionUserSession.model.deleteMany({
        user
      })
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUserSession.removeAllUserSessions. " + error)
      return null
    }
  }

  public static removeAllExpiredSessions = async () => {
    const collectionUserSession = Collection.get("UserSession") as CollectionUserSession

    try {
      const result = await collectionUserSession.model.deleteMany({
        expiresDate: { $lt: new Date() }
      })
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUserSession.removeAllExpiredSessions. " + error)
      return null
    }
  }

  public static stopJobForRemovingAllExpiredSessions() {
    Tasks.stopJob(CollectionUserSession.REMOVE_EXPIRED_SESSIONS_TIMER_KEY)
  }

  public static startJobForRemovingAllExpiredSessions() {
    Tasks.startJob(CollectionUserSession.REMOVE_EXPIRED_SESSIONS_TIMER_KEY,
      CollectionUserSession.removeAllExpiredSessions,
      CollectionUserSession.REMOVE_EXPIRED_SESSIONS_EVERY_MS)
  }
}
