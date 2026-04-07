#!/usr/bin/env ts-node

import 'reflect-metadata'
import { DatabaseMigration } from './DatabaseMigration'

export class RunMigration {

  public static async main(): Promise<void> {
    const databaseMigrations = new DatabaseMigration()
    await databaseMigrations.runMigrations()
  }

  public static handleError(err: Error): void {
    console.error(err)
    process.exit(DatabaseMigration.ERROR_EXIT_CODE)
  }
}

RunMigration.main().catch(RunMigration.handleError)
