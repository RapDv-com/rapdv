// Copyright (C) Konrad Gadzinowski

import fs from "fs"
import csvParser from "csv-parse/sync"

export class Translation {

  private static DEFAULT_LANG_CODE = "en"

  protected records: any[]
  protected langCode: string
  protected csvPath: string

  constructor(langCode: string, csvPath: string) {
    this.langCode = langCode || Translation.DEFAULT_LANG_CODE
    this.csvPath = csvPath

    const csvData = fs.readFileSync(csvPath, "utf8")
    this.records = csvParser.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    })
  }

  public get(key: string): string {
    if (!key || key.trim() === "") {
      return ""
    }

    for (const record of this.records) {
      if (record.en === key) {
        return String(record[this.langCode] || record[Translation.DEFAULT_LANG_CODE] || key)
      }
    }

    return key
  }
}
