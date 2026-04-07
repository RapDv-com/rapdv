#!/usr/bin/env ts-node

import 'reflect-metadata'
import { DatabaseMigration } from './DatabaseMigration'

export class RollbackMigration {

  public static async main(): Promise<void> {
    const databaseMigrations = new DatabaseMigration()
    await databaseMigrations.rollback()
  }

  public static handleError(err: Error): void {
    console.error(err)
    process.exit(DatabaseMigration.ERROR_EXIT_CODE)
  }
}

RollbackMigration.main().catch(RollbackMigration.handleError)
