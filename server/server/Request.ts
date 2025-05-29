// Copyright (C) Konrad Gadzinowski

import { Request as ExpressRequest } from "express"
import { HydratedDocument } from "mongoose"

export enum FlashType {
  Info = "info",
  Success = "success",
  Warning = "warning",
  Errors = "errors"
}

export type File = {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}

type RequestExtensions = {
  flash: (type: FlashType, message: string | string[]) => void
  logIn: (user: HydratedDocument<any>, callback: (error: string) => void) => void
  sessionID?: string
  user?: HydratedDocument<any>
  files?: File[]
  session?: any
  isBot?: boolean
  error: string
}

export type Request = ExpressRequest & RequestExtensions
