// Copyright (C) Konrad Gadzinowski

export class BuiltInEntities {
  public static getAll(): Function[] {
    const { Log } = require('./CollectionLog')
    const { File } = require('./CollectionFile')
    const { ImageFile } = require('./CollectionImageFile')
    const { System } = require('./CollectionSystem')
    const { User } = require('./CollectionUser')
    const { UserSession } = require('./CollectionUserSession')
    return [Log, File, ImageFile, System, User, UserSession]
  }
}
