// Copyright (C) Konrad Gadzinowski

import { CollectionFile, FileStorageType } from "./CollectionFile"
import { CollectionLog, LogType } from "./CollectionLog"
import { HttpStatus } from "../network/HttpStatus"
import mongoose, { ObjectId, Schema } from "mongoose"
import fs from "fs"
import mime from "mime"
import request from "request"
import { Collection } from "./Collection"
import { Tasks } from "../tasks/Tasks"

export class CollectionImageFile extends Collection {

  public static DEFAULT_IMAGE_URL = "/client/assets/placeholder-image.svg"

  private static REMOVE_UNUSED_IMAGES_EVERY_MS: number = 24 * 60 * 60 * 1000 // 24h
  private static REMOVE_UNUSED_IMAGES_OLDER_THEN_MS: number = 4 * 60 * 60 * 1000 // 4h
  private static REMOVE_UNUSED_IMAGES_TIMER_KEY = "REMOVE_UNUSED_IMAGES"
  private static NAME = "ImageFile"

  constructor() {
    super(
      CollectionImageFile.NAME,
      {
        key: { type: String, unique: true },
        nameDisplayed: String,
        file: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
        isPublic: { type: Boolean, default: false },
      },
      undefined,
      (schema: Schema): Schema => {
        schema.methods.removeWithFile = async function (): Promise<any> {
          const collectionImageFile = Collection.get(CollectionImageFile.NAME)
          let found = await collectionImageFile.model.find({ file: this.file }).exec()
          let file

          // Check if only this image is using this file
          if (found.length == 1) {
            const collectionFile = CollectionFile.getIt()
            file = await collectionFile.model.findById(this.file).exec()
          }

          await this.remove()

          if (!!file) {
            await file.removeIfItsNotUsed()
          }
        }

        schema.methods.removeImageIfItsNotUsed = async function (): Promise<boolean> {
          const DEBUG = false

          // Remove only images older then some time
          if (new Date().getTime() <= this.createdAt.getTime() + CollectionImageFile.REMOVE_UNUSED_IMAGES_OLDER_THEN_MS) {
            return false
          }

          const allCollections = Collection.getAll()

          for (const collectionKey in allCollections) {
            const collection = allCollections[collectionKey]
            for (const key in collection.model.schema.paths) {
              const path = collection.model.schema.paths[key]

              if (path.options?.ref === CollectionImageFile.NAME) {
                // We found dependency
                if (DEBUG) console.info(`Image depends on collection: ${collectionKey} key: ${key}`)
                const query: any = {}
                query[key] = this._id
                const count = await collection.count(query)
                if (DEBUG) console.info(`Image ${key} query count: ${count}`, query)
                if (count > 0) {
                  // File is being used - do not remove it!
                  return false
                }
              }

              if (path?.options?.type[0]?.ref === CollectionImageFile.NAME) {
                // We found dependency in an array
                if (DEBUG) console.info(`Image depends on collection: ${collectionKey} array key: ${key}`)
                const query: any = {}
                query[key] = { $in: [this._id ] }
                const count = await collection.count(query)
                if (DEBUG) console.info(`Image ${key} query count: ${count}`, query)
                if (count > 0) {
                  // File is being used - do not remove it!
                  return false
                }
              }
            }
          }

          await this.removeWithFile()
          return true
        }

        return schema
      }
    )
  }

  public static getIt() {
    return Collection.get(CollectionImageFile.NAME) as CollectionImageFile
  }

  public static createImage = async (name: string, storageType: FileStorageType, filePath: string, encoding: string, mimetype: string, size: number, isPublic: boolean): Promise<any> => {
      const collectionFile: CollectionFile = Collection.get("File") as CollectionFile
      const file = await collectionFile.createFile(name, storageType, filePath, encoding, mimetype, size, isPublic)

      if (!file || !file._id) {
        throw new Error("Error. Image file wasn't stored.")
      }

      const collectionImageFile = Collection.get(CollectionImageFile.NAME) as CollectionImageFile
      const key = await collectionImageFile.generateKey(null, name, collectionImageFile.findByKey)
      let ImageFile = collectionImageFile.model
      const imageFile = new ImageFile({
        key: key,
        nameDisplayed: name,
        file: file._id,
        isPublic
      })

      await imageFile.save()
      return imageFile
  }

  public static createImageFromUrl = (url: string, storageType: FileStorageType, defaultMimeType = "jpeg", defaultEncoding = "7bit", isPublic: boolean): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!url) return reject("URL wasn't provided.")

      // Specify size for Facebook
      let specifySize = false

      if (url.indexOf("height") >= 0) {
        specifySize = true
        url = url.substr(0, url.indexOf("height"))
      }

      if (url.indexOf("width") >= 0) {
        specifySize = true
        url = url.substr(0, url.indexOf("width"))
      }

      if (specifySize) {
        url = url + "height=300&width=300"
      }

      let dest = CollectionFile.generateTempFilePath()

      request(
        {
          followAllRedirects: true,
          url: url,
          encoding: "binary",
          headers: {
            accept: "image/*",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36"
          }
        },
        (error, response, body) => {
          if (error) {
            CollectionFile.removeFile(dest)
            return reject(error.message)
          }

          if (response.statusCode !== HttpStatus.OK) {
            return reject("User profile photo URL response status was " + response.statusCode)
          }

          fs.writeFile(dest, body, "binary", (error) => {
            if (error) return reject(error)

            const fileStats = fs.statSync(dest)

            let encoding = defaultEncoding
            let mimetype = mime.getType(dest)
            if (!mimetype) mimetype = defaultMimeType
            let size = fileStats.size

            CollectionImageFile.createImage("photo", storageType, dest, encoding, mimetype, size, isPublic)
              .then((imageFile) => {
                resolve(imageFile)
              })
              .catch((error) => {
                reject(error)
              })
          })
        }
      )
    })
  }

  public static getImageUrl = async (imageId: string, defaultUrl?: string) => {
    let photoUrl = defaultUrl
    if (!!imageId) {
      const collectionImageFile = Collection.get("ImageFile") as CollectionImageFile
      let photo = await collectionImageFile.findById(imageId)
      if (photo && photo.file) {
        const fileData = await photo.file.loadData()
        if (!!fileData) {
          photoUrl = "data:" + photo.file.mimetype + ";base64, " + new Buffer(fileData).toString("base64")
        }
      }
    }

    return photoUrl
  }

  public static deleteById = async (imageId: string): Promise<boolean> => {
    const collectionImageFile = Collection.get("ImageFile") as CollectionImageFile
    const image = await collectionImageFile.findById(imageId)
    if (!image) {
      return false
    }
    const wasRemoved = await image.removeImageIfItsNotUsed()
    return wasRemoved
  }

  public findAll = async (): Promise<any> => {
    try {
      let result = await this.model.find().populate("file").sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionImageFile.findAll. " + error)
      return null
    }
  }

  public findByKeyOrId = async (keyOrId): Promise<any> => {
    if (!keyOrId) return null

    try {
      let result = await this.findByKey(keyOrId)
      if (!!result) return result
      result = await this.findById(keyOrId)
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionImageFile.findByKeyOrId. " + error)
      return null
    }
  }

  public findByKey = async (key): Promise<any> => {
    if (!key) return null

    try {
      let result = await this.model.findOne({ key }).populate("file").sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionImageFile.findByKey. " + error)
      return null
    }
  }

  public findById = async (id: ObjectId | string): Promise<any> => {
    if (!id) return null

    try {
      let result = await this.model.findById(id.toString()).populate("file").sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionImageFile.findById. " + error)
      return null
    }
  }

  public find = async (filter: string, fromPosition: number, max: number): Promise<any> => {
    try {
      let query = null

      if (filter != null && filter.length > 0) {
        query = this.model.find({ $or: this.getFilterQuery(filter) })
      } else {
        query = this.model.find()
      }

      let result = await query.where().skip(fromPosition).limit(max).sort({ order: 1, timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionImageFile.find. " + error)
      return null
    }
  }

  public count = async (filter?: string): Promise<number> => {
    try {
      let query = null

      if (filter != null && filter.length > 0) {
        query = this.model.find({ $or: this.getFilterQuery(filter) })
      } else {
        query = this.model.find()
      }

      let result = await query.where().count()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionImageFile.count. " + error)
      return null
    }
  }

  private getFilterQuery = (filter) => {
    let regex = new RegExp(filter, "i")
    let query = [{ key: regex }, { nameDisplayed: regex }]
    return query
  }

  public getImageDataFromIdsPromise = (imageIds: any) => {
    return new Promise(async (resolve, reject) => {
      this.getImageDataFromIds(imageIds, (imageData: Array<any>) => {
        resolve(imageData)
      })
    })
  }

  public getImageDataFromIds = async (imageIds: any, callback: (imageData: Array<any>) => void) => {
    if (imageIds.constructor !== Array) {
      imageIds = JSON.parse(imageIds)
    }

    if (!imageIds || imageIds.length == 0) return callback([])

    let imageData = []

    for (let id of imageIds) {
      if (!id) continue

      try {
        let image = await this.findById(id)
        if (!image) {
          continue
        }
        let data = {
          key: image.key,
          name: image.nameDisplayed,
          mimetype: image.file.mimetype,
          sizeBytes: image.file.size
        }
        imageData.push(data)
      } catch (exception) {
        console.warn("Couldn't find image by id: " + id)
      }
    }

    return callback(imageData)
  }

  public getImageIdsFromData = async (imageData: any, callback: (imageIds: Array<any>) => void) => {
    if (imageData.constructor !== Array) {
      imageData = JSON.parse(imageData)
    }

    if (!imageData || imageData.length == 0) return callback([])

    let imageIds = []

    for (let data of imageData) {
      if (!data || !data.key) continue
      let key = data.key

      try {
        let image = await this.findByKey(key)
        if (image) imageIds.push(image._id)
      } catch (exception) {
        console.warn("Couldn't find image by key: " + key)
      }
    }

    return callback(imageIds)
  }

  /*
   * Clean up task
   */

  public static async removeImageIfItsNotUsed(key: string, callback: (success: boolean, message: string) => void) {
    const collectionImageFile = Collection.get(CollectionImageFile.NAME) as CollectionImageFile
    let imageFile = await collectionImageFile.findByKey(key)

    if (!imageFile) {
      callback(false, "Couldn't find file.")
      return
    }

    let wasRemoved = await imageFile.removeImageIfItsNotUsed()
    let message = wasRemoved ? "Photo was removed." : "Photo wasn't removed because it might be still in use."
    callback(true, message)
  }

  /**
   * Recurring job that removes all unused images every now and then
   */
  public static removeAllUnusedImages = async () => {
    console.info("Removing unused images...")

    const collectionImageFile = Collection.get(CollectionImageFile.NAME) as CollectionImageFile
    let allImages = await collectionImageFile.model.find().sort({ order: 1, timestamp: 1 }).exec()

    let imagesRemoved = 0
    let imagesKept = 0
    let imagesTotal = allImages.length

    for (let image of allImages) {
      let wasRemoved = await image.removeImageIfItsNotUsed()
      if (wasRemoved) {
        ++imagesRemoved
      } else {
        ++imagesKept
      }
    }

    let message = "Finished removing unused images. Removed " + imagesRemoved + ". Kept " + imagesKept + ". Total " + imagesTotal + "."

    console.info(message)

    CollectionLog.create("Removed unused images.", LogType.RecurringJobStarted, message)
  }

  public static stopJobForRemovingAllUnusedImages() {
    Tasks.stopJob(CollectionImageFile.REMOVE_UNUSED_IMAGES_TIMER_KEY)
  }

  public static startJobForRemovingAllUnusedImages() {
    Tasks.startJob(CollectionImageFile.REMOVE_UNUSED_IMAGES_TIMER_KEY,
      CollectionImageFile.removeAllUnusedImages,
      CollectionImageFile.REMOVE_UNUSED_IMAGES_EVERY_MS)
  }
}
