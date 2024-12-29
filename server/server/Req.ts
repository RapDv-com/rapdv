// Copyright (C) Konrad Gadzinowski

import { Request as ExpressRequest } from "express"

export class Req {
  public static getDomain = (req: ExpressRequest) => {
    return req.headers.host ?? req.headers.origin
  }
}
