// Copyright (C) Konrad Gadzinowski

export class Random {

  public static generateRandomString(randomTextLength = 8): string {
    let text = ""
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    randomTextLength = Math.max(randomTextLength, 1)

    for (let i = 0; i < randomTextLength; i++) text += possible.charAt(Math.floor(Math.random() * possible.length))

    return text
  }

  public static generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8)
  }
}
