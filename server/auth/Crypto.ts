// Copyright (C) Konrad Gadzinowski

import crypto from "crypto"

export class Crypto {
  public static getRandomToken = (): Promise<string> =>
    new Promise((resolve, reject) => crypto.randomBytes(16, (error, buffer) => (!!error ? reject(error) : resolve(buffer.toString("hex")))))
}
