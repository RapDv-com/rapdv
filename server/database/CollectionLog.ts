// Copyright (C) Konrad Gadzinowski

import { Schema } from "mongoose"
import { Collection } from "./Collection"

export enum LogType {
  EmailSent = "EmailSent",
  Error = "Error",
  RecurringJobStarted = "RecurringJobStarted",
}

export class CollectionLog extends Collection {

  constructor() {
    super(
      "Log",
      {
        title: String,
        type: String,
        description: String,
      },
      undefined,
      (schema: Schema): Schema => {
        return schema
      }
    )
  }

  public static create = async (
    title: string,
    type: LogType,
    description: string,
  ): Promise<any> => Collection.saveLog(title, type, description)

  public findAllLogs = async (from: number, limit: number, filter: string, type: string = null): Promise<Array<any>> => {
    try {
      let result = await this.getFindQuery(filter, type).skip(from).limit(limit).sort({ eventDate: -1, updatedAt: -1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionLog.findAll. " + error)
      return null
    }
  }

  public count = async (filter: string, type: string = null): Promise<number> => {
    try {
      let result = await this.getFindQuery(filter, type).count()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionLog.count. " + error)
      return null
    }
  }

  private getFindQuery = (filter: string, type: string = null) => {
    let query = this.model.find(this.getRegexQuery(filter))

    if (!!type) {
      query = query.where("type").eq(type)
    }

    return query
  }

  private getRegexQuery = (filter) => {
    if (!filter || filter.length == 0) return {}

    let regex = new RegExp(filter, "i")
    return {
      $or: [{ title: regex }, { type: regex }, { descriptionHtmlShort: regex }, { descriptionHtmlFull: regex }]
    }
  }
}
