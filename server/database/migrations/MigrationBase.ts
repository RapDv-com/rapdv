import * as fs from 'fs'
import * as path from 'path'

export class MigrationBase {
  private static readonly TWO_DIGITS = 2
  private static readonly ZERO_PAD = '0'
  private static readonly MONTH_OFFSET = 1

  protected static readonly FIRST_CLI_ARG_INDEX = 2
  protected static readonly ERROR_EXIT_CODE = 1

  protected buildTimestamp(): string {
    const now = new Date()
    return (
      now.getFullYear().toString() +
      (now.getMonth() + MigrationBase.MONTH_OFFSET).toString().padStart(MigrationBase.TWO_DIGITS, MigrationBase.ZERO_PAD) +
      now.getDate().toString().padStart(MigrationBase.TWO_DIGITS, MigrationBase.ZERO_PAD) +
      now.getHours().toString().padStart(MigrationBase.TWO_DIGITS, MigrationBase.ZERO_PAD) +
      now.getMinutes().toString().padStart(MigrationBase.TWO_DIGITS, MigrationBase.ZERO_PAD) +
      now.getSeconds().toString().padStart(MigrationBase.TWO_DIGITS, MigrationBase.ZERO_PAD)
    )
  }

  protected writeMigrationFile(name: string, content: string): string {
    const timestamp = this.buildTimestamp()
    const fileName = `${timestamp}-${name}.sql`
    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    fs.mkdirSync(migrationsDir, { recursive: true })
    fs.writeFileSync(path.join(migrationsDir, fileName), content)
    return fileName
  }
}
