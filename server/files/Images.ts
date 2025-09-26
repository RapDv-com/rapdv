// Copyright (C) Konrad Gadzinowski

import { Response } from "express"
import { Collection } from "../database/Collection"
import { CollectionImageFile } from "../database/CollectionImageFile"
import { HttpStatus } from "../network/HttpStatus"
import { File } from "../server/Request"
import { ImageInfo, ImageProcessor } from "./ImageProcessor"
import { FileStorageType } from "../database/CollectionFile"

export class Images {
  public static downloadPhoto = async (key: string, res: Response) => {
    const collectionImageFile = Collection.get("ImageFile") as CollectionImageFile
    let imageFile = await collectionImageFile.findByKey(key)
    if (!imageFile) {
      res.status(HttpStatus.NOT_FOUND)
      res.send("Couldn't find file.")
      return
    }

    const imageData = await imageFile.file.loadData()

    res.status(HttpStatus.OK)
    res.contentType(imageFile.file.mimetype)
    res.send(imageData)
  }

  public static deletePhoto = async (key: string, res: Response) => {
    await CollectionImageFile.removeImageIfItsNotUsed(key, (success: boolean, message: string) => {
      if (!success) {
        res.status(HttpStatus.NOT_FOUND)
        res.send(message)
      } else {
        res.status(HttpStatus.OK)
        res.send(message)
      }
    })
  }

  public static savePhoto = (file: File, storageType: FileStorageType, maxSizePx: number = 2000, cropToSquare: boolean = false, isPublic = false): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      if (!file) {
        reject("File not found.")
        return
      }

      if (file.mimetype.indexOf("image") == -1) {
        reject("Uploaded file needs to be an image.")
        return
      }

      let imageProcessor = new ImageProcessor()
      imageProcessor
        .processUploadedImage(file.path, maxSizePx, cropToSquare, "webp")
        .then((info: ImageInfo) => {
          CollectionImageFile.createImage(file.originalname, storageType, info.path, file.encoding, info.format, info.size, isPublic)
            .then((imageFile) => {
              resolve(imageFile)
            })
            .catch((error) => {
              reject("Error on upload: " + error)
            })
        })
        .catch((error) => {
          reject("Error on upload. " + error)
        })
    })
  }
}
