// Copyright (C) Konrad Gadzinowski

import { Collection } from "./Collection"
import fs from "fs"
import crypto from "crypto"
import { Schema } from "mongoose"
import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3ClientConfig } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export enum FileStorageType {
  Database = "database",
  S3 = "S3"
}

export class CollectionFile extends Collection {
  private static DEBUG = false
  private static NAME = "File"

  constructor() {
    super(CollectionFile.NAME, {
      key: { type: String, unique: true },
      isPublic: { type: Boolean, default: false },
      data: Buffer,
      s3Key: String,
      name: String,
      storageType: {
        type: String,
        enum: [
          FileStorageType.Database,
          FileStorageType.S3,
        ],
        default: FileStorageType.Database
      },
      encoding: String,
      mimetype: String,
      size: Number,
      md5: String
    },
    undefined,
    (schema: Schema): Schema => {

      schema.methods.removeIfItsNotUsed = async function (): Promise<boolean> {

        const allCollections = Collection.getAll()

        for (const collectionKey in allCollections) {
          const collection = allCollections[collectionKey]
          for (const key in collection.model.schema.paths) {
            const path = collection.model.schema.paths[key]
            if (path.options.ref === CollectionFile.NAME) {
              // We found dependency
              if (CollectionFile.DEBUG) console.info(`File depends on collection: ${collectionKey} key: ${key}`)
              const query: any = {}
              query[key] = this._id
              const count = await collection.count(query)
              if (CollectionFile.DEBUG) console.info(`File ${key} query count: ${count}`, query)
              if (count > 0) {
                // File is being used - do not remove it!
                return false
              }
            }
          }
        }

        // Remove S3 file
        if (this.storageType === FileStorageType.S3) {
          try {
            const s3 = CollectionFile.getS3()
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: this.s3Key
            }
            await s3.send(new DeleteObjectCommand(params));
          } catch (error) {
            console.error(`Failed to delete file from S3: ${error}`);
            throw error;
          }
        }

        await this.remove()
        return true
      }

      schema.methods.loadData = async function (): Promise<Buffer> {

        try {
          if (this.storageType === FileStorageType.S3) {
            const s3 = CollectionFile.getS3()
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: this.s3Key
            }
            const data: any = await s3.send(new GetObjectCommand(params));

            return await CollectionFile.streamToBuffer(data.Body as Readable);
          } else {
            return this.data
          }
        } catch (error) {
          console.error(`Couldn't load file data. Bucket: ${process.env.AWS_S3_BUCKET_NAME}, file key: ${this.s3Key} `, error)
          return null
        }
      }

      return schema
    })
  }

  private static streamToBuffer = async (readableStream: Readable): Promise<Buffer> => {
    const chunks = [];
    for await (const chunk of readableStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  public static getS3 = () => {
    const config: S3ClientConfig = {
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      },
    }

    if (process.env.AWS_S3_ENDPOINT) {
      config.endpoint = process.env.AWS_S3_ENDPOINT
      config.forcePathStyle = true
    }

    const s3client = new S3Client(config);
    return s3client
  }

  public static getIt() {
    return Collection.get(CollectionFile.NAME) as CollectionFile
  }

  public static removeFile(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) return
      fs.unlinkSync(filePath)
    } catch (exception) {
      Collection.onError("Couldn't remove file", "Couldn't remove file: " + filePath)
    }
  }

  public static generateTempFilePath(): string {
    let destDir = "./tmp"

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir)
    }

    let path = destDir + "/" + CollectionFile.generateRandomFileName(12)
    while (fs.existsSync(path)) {
      path = destDir + "/" + CollectionFile.generateRandomFileName(12)
    }

    return path
  }

  public static generateRandomFileName(randomTextLength = 12): string {
    let text = ""
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    randomTextLength = Math.max(randomTextLength, 1)

    for (let i = 0; i < randomTextLength; i++) text += possible.charAt(Math.floor(Math.random() * possible.length))

    return text
  }

  public createFileFromUpload = (storageType: FileStorageType, fileData: any): Promise<any> => {
    return this.createFile(
      fileData.originalname,
      storageType,
      fileData.path,
      fileData.encoding,
      fileData.mimetype,
      fileData.size,
      false)
  }

  public createFile = (name: string, storageType: FileStorageType, filePath: string, encoding: string, mimetype: string, size: number, isPublic: boolean): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Calculate files MD5
      const hashStream = crypto.createHash("md5").setEncoding("hex");
      fs.createReadStream(filePath)
        .pipe(hashStream)
        .on("finish", async () => {
          const md5: String = hashStream.read()
          const file = this.createFileFromContent(
            name,
            md5,
            storageType,
            filePath,
            encoding,
            mimetype,
            size,
            isPublic,
            async () => {
              return fs.readFileSync(filePath)
            },
            async () => {
              CollectionFile.removeFile(filePath)
            })
          resolve(file)
      })
    })
  }

  public createFileFromText = (name: string, storageType: FileStorageType, content: string, encoding: string, mimetype: string, isPublic: boolean): Promise<any> => {

    if (!content) {
      return null
    }

    const size = content.length
    const hash = crypto.createHash("md5").update(content).digest("hex");

    const file = this.createFileFromContent(
      name,
      hash,
      storageType,
      "From Text",
      encoding,
      mimetype,
      size,
      isPublic,
      async () => {
        return Buffer.from(content)
      },
      async () => {
        // Nothing to remove
      })

    return file
  }

  public createFileFromContent = (name: string, md5: String, storageType: FileStorageType, filePath: string, encoding: string, mimetype: string, size: number, isPublic: boolean, readData: () => Promise<any>, removeFile: () => Promise<void>): Promise<any> => {
    const self = this
    return new Promise(async (resolve, reject) => {
      // Calculate files MD5

          if (CollectionFile.DEBUG) {
            console.info("Creating file: " + name + ", " + filePath + ", " + encoding + ", " + mimetype + ", " + size + ", " + md5)
          }

          try {
            let file = await this.findDuplicate(encoding, mimetype, size, md5)

            if (file) {
              // Found duplicate
              await removeFile()
              return resolve(file)
            }

            // Create new file
            const key = await self.generateKey(null, name, this.findByKey)
            let File = self.model

            if (storageType === FileStorageType.S3) {
              const data = await readData()
              let params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key,
                Body: data
              }

              const s3 = CollectionFile.getS3()
              const uploadResult: any = await s3.send(new PutObjectCommand(params));

              file = new File({
                key,
                isPublic,
                s3Key: key,
                name,
                storageType,
                encoding,
                mimetype,
                size,
                md5
              })

            } else {
              // Save to database by default
              const data = await readData()
              file = new File({
                key,
                isPublic,
                data,
                name,
                storageType,
                encoding,
                mimetype,
                size,
                md5
              })
            }

            try {
              await file.save()
              resolve(file)
            } catch (error) {
              reject(error)
            } finally {
              await removeFile()
            }
          } catch (error) {
            Collection.onError("Couldn't find file duplicate", "Error on finding file duplicate: " + name + ", " + filePath + ", " + encoding + ", " + mimetype + ", " + size + ", " + md5 + ". " + error)
          }
      })
  }

  public findByKeyOrId = async (keyOrId): Promise<any> => {
    if (!keyOrId) return null

    try {
      let result = await this.findByKey(keyOrId)
      if (!!result) return result
      result = await this.findById(keyOrId)
    } catch (error) {
      console.warn("Couldn't complete CollectionFile.findByKeyOrId. " + error)
      return null
    }
  }

  public findByKey = async (key): Promise<any> => {
    if (!key) return null

    try {
      let result = await this.model.findOne({ key }).sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionFile.findByKey. " + error)
      return null
    }
  }

  public findDuplicate = (encoding: String, mimetype: String, size: Number, md5: String): Promise<any> => {
    if (
      encoding == null ||
      encoding == undefined ||
      !mimetype ||
      size == null ||
      size == undefined ||
      !md5 ||
      mimetype.length == 0 ||
      md5.length == 0
    ) {
      throw new Error("Not enough data to find duplicate.")
    }

    return this.model
      .findOne({
        encoding: encoding,
        mimetype: mimetype,
        size: size,
        md5: md5
      })
      .sort({ timestamp: 1 })
      .exec()
  }

  public findById = async (id: any): Promise<any> => {
    if (!id) return null

    try {
      let result = await this.model.findById(id).sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionFile.findById. " + error)
      return null
    }
  }
}
