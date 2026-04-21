// Copyright (C) Konrad Gadzinowski

import { Sequelize } from 'sequelize-typescript'
import session from 'express-session'

export class DatabaseConnection {
  public sequelize: Sequelize
  public sessionStore: session.Store
  public close: () => Promise<void>

  constructor(sequelize: Sequelize, sessionStore: session.Store, close: () => Promise<void>) {
    this.sequelize = sequelize
    this.sessionStore = sessionStore
    this.close = close
  }
}
