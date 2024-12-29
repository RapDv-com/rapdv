// Copyright (C) Konrad Gadzinowski

import { Response } from "express"
import { HydratedDocument } from "mongoose"
import { Collection } from "../database/Collection"
import { CollectionFile } from "../database/CollectionFile"
import { HttpStatus } from "../network/HttpStatus"

export class Files {
  public static downloadFileById = async (fileId: String, res: Response) => {
    const collectionFile = Collection.get("File") as CollectionFile
    let file = await collectionFile.findById(fileId)
    this.downloadFile(file, res)
  }

  public static downloadFileByKey = async (key: String, res: Response) => {
    const collectionFile = Collection.get("File") as CollectionFile
    let file = await collectionFile.findByKey(key)
    this.downloadFile(file, res)
  }

  public static downloadFile = async (file: HydratedDocument<any>, res: Response) => {
    if (!file) {
      res.status(HttpStatus.NOT_FOUND)
      res.send("Couldn't find file. ")
      return
    }
    
    const data = await file.loadData()

    res.status(HttpStatus.OK)
    res.contentType(file.mimetype)
    res.send(data)
  }
}
