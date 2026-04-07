#!/usr/bin/env ts-node
// Creates an empty SQL migration file ready to be filled.
// Usage: npx ts-node [path/to/]CreateMigration.ts [migration-name]

import { DatabaseMigration } from './DatabaseMigration'

export class CreateMigration extends DatabaseMigration {
  private static readonly EMPTY_MIGRATION_TEMPLATE = '-- UP\n\n\n-- DOWN\n'

  public run(migrationName: string): void {
    const fileName = this.writeMigrationFile(migrationName, CreateMigration.EMPTY_MIGRATION_TEMPLATE)
    console.info(`Created: migrations/${fileName}`)
  }

  public static main(): void {
    const migrationName = process.argv[DatabaseMigration.FIRST_CLI_ARG_INDEX] || 'Database-change'
    new CreateMigration().run(migrationName)
  }

  public static handleError(err: Error): void {
    console.error(err)
    process.exit(DatabaseMigration.ERROR_EXIT_CODE)
  }
}

CreateMigration.main()
