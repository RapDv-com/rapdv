// Copyright (C) Konrad Gadzinowski

import spacetime from "spacetime"

export class Time {

  public static formatDate = (date: Date, format: string = "dd MMM YYYY", defaultNone: string = "-"): string => {
    if (!date) {
      return defaultNone
    }
    return spacetime(date).unixFmt(format ?? "dd MMM YYYY")
  }
}
