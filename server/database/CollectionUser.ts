// Copyright (C) Konrad Gadzinowski

import { HydratedDocument } from "mongoose"
import { CollectionImageFile } from "./CollectionImageFile"
import mongoose, { ObjectId, Schema } from "mongoose"
import bcrypt from "bcrypt-nodejs"
import { Collection } from "./Collection"
import { FileStorageType } from "./CollectionFile"

export enum UserRole {
  User = "User",
  Admin = "Admin"
}

export enum UserStatus {
  Live = "Live",
  Banned = "Banned"
}

const Provider = new mongoose.Schema({
  id: String,
  name: String,
});

export class CollectionUser extends Collection {

  private static GIVE_TIME_TO_VERIFY_MS = 7200000 // 2h
  private static ROLES = []
  private static DEFAULT_PHOTO_URL = "/client/assets/avatar-default.svg"

  public static getRoles = (): string[] => CollectionUser.ROLES

  constructor(customRoles: string[], customProps: any = {}) {
    CollectionUser.ROLES = [UserRole.User, UserRole.Admin, ...customRoles]
    super(
      "User",
      {
        email: { type: String, unique: true },

        emailVerified: { type: Boolean, default: false },
        emailVerificationCode: String, // For AuthEmailCodes
        verificationCodeEmailSentDate: { type: Date, default: new Date(0) },
        
        password: String,

        failedLoginAttempts: {
          type: Number,
          default: 0
        },
        lastFailedLoginAttempt: { type: Date, default: new Date(0) },

        loginProviders: [Provider],

        firstName: String,
        lastName: String,
        photoId: { type: mongoose.Schema.Types.ObjectId, ref: "ImageFile" },

        status: {
          type: String,
          enum: [UserStatus.Live, UserStatus.Banned],
          default: UserStatus.Live
        },

        notes: String,

        role: {
          type: String,
          enum: CollectionUser.ROLES,
          default: UserRole.User
        },
        ...customProps
      },
      [{
        firstName: "text",
        lastName: "text",
        email: "text",
        role: "text"
      }],
      (schema: Schema) => {
        schema.methods.getFullName = function (): string {
          let fullName = this.firstName
          if (!!this.lastName && this.lastName.length > 0) {
            if (!!fullName && fullName.length > 0) fullName += " "
            fullName += this.lastName
          }

          return fullName
        }

        /**
         * Password hash middleware.
         */
        schema.pre("save", async function save(next) {
          const user = this
          if (!user.isModified("password")) {
            return next()
          }

          bcrypt.genSalt(10, (error, salt) => {
            if (error) {
              return next(error)
            }
            bcrypt.hash(user.password, salt, null, (error, hash) => {
              if (error) {
                return next(error)
              }
              user.password = hash
              next()
            })
          })
        })

        /**
         * Helper method for validating user's password.
         */
        schema.methods.comparePassword = function comparePassword(candidatePassword, callback) {
          bcrypt.compare(candidatePassword, this.password, (error, isMatch) => {
            callback(error, isMatch)
          })
        }

        schema.methods.isBanned = function () {
          return this.status == UserStatus.Banned
        }

        schema.methods.isLive = function () {
          return this.status == UserStatus.Live
        }

        schema.methods.isUser = function () {
          return this.role == UserRole.User
        }

        schema.methods.isAdmin = function () {
          return this.role == UserRole.Admin
        }

        schema.methods.isEmailVerified = function () {
          if (this.emailVerified) return true

          let registeredTimeElapsed = Date.now() - this.createdAt.getTime()
          if (registeredTimeElapsed > CollectionUser.GIVE_TIME_TO_VERIFY_MS) {
            return false
          }

          return true
        }

        schema.methods.getPhotoSrc = async function () {
          const imageUrl = await CollectionImageFile.getImageUrl(this.photoId, CollectionUser.DEFAULT_PHOTO_URL)
          return imageUrl
        }

        schema.methods.setPhotoFromUrl = async function (pictureUrl) {
          try {
            let imageFile = await CollectionImageFile.createImageFromUrl(pictureUrl, process.env.STORE_USER_PHOTOS_IN_S3 === "true" ? FileStorageType.S3 : FileStorageType.Database, "jpeg", "7bit", false);
            if (imageFile) {
              this.photoId = imageFile._id;
            }
          } catch(err) {
            console.error("Couldn't save profile photo from URL. ", err);
          }
        };

        schema.methods.getStatusBadge = function () {
          if (this.status == UserStatus.Live) {
            return "success"
          } else if (this.status == UserStatus.Banned) {
            return "danger"
          }

          return "warning"
        }

        schema.methods.addProvider = function (id, provider) {

          if (!this.loginProviders || this.loginProviders.length == 0 || this.loginProviders.constructor !== Array) {
            this.loginProviders = [{id: id, name: provider}];
            return;
          }

          // Check if provider is already set
          for (let providerExisting of this.loginProviders) {
            if (providerExisting.name == provider) return;
          }

          this.loginProviders.push({id: id, name: provider});
        };

        return schema
      }
    )
  }

  public static isValidStatus = (status): boolean => {
    return UserStatus.Live == status || UserStatus.Banned == status
  }

  public static createUserForAuthEmail = (
    email: string,
    emailVerified: boolean,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole | string,
    status: UserStatus,
    notes: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const collectionUser = Collection.get("User") as CollectionUser

      let User = collectionUser.model
      let newInstance = new User({
        email,
        emailVerified,
        verificationCodeEmailSentDate: new Date(0),
        verificationTokenEmailSentDate: new Date(0),
        password,
        firstName,
        lastName,
        role,
        status,
        notes
      })

      newInstance.save((error) => {
        if (error) {
          let errorMsg = "Couldn't create user. " + error
          Collection.onError("Couldn't create user", errorMsg)
          reject(errorMsg)
        } else {
          resolve(newInstance)
        }
      })
    })
  }

  public static createUserForAuthEmailCodes = (
    email: string,
    emailVerified: boolean,
    firstName: string,
    lastName: string,
    role: UserRole | string,
    status: UserStatus,
    notes: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const collectionUser = Collection.get("User") as CollectionUser

      let User = collectionUser.model
      let newInstance = new User({
        email,
        emailVerified,
        verificationCodeEmailSentDate: new Date(0),
        verificationTokenEmailSentDate: new Date(0),
        firstName,
        lastName,
        role,
        status,
        failedLoginAttempts: 0,
        lastFailedLoginAttempt: new Date(0),
        notes
      })

      newInstance.save((error) => {
        if (error) {
          let errorMsg = "Couldn't create user. " + error
          Collection.onError("Couldn't create user", errorMsg)
          reject(errorMsg)
        } else {
          resolve(newInstance)
        }
      })
    })
  }

  public static findUserByEmail = async (email: string): Promise<any> => {
    try {
      const collectionUser = Collection.get("User") as CollectionUser
      let query = collectionUser.model.findOne({ email })

      let result = await query.sort({ timestamp: 1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUser.findUserByEmail. " + error)
      return null
    }
  }

  public static findUserById = async (id: ObjectId | string) => {
    if (!id) return null

    try {
      const collectionUser = Collection.get("User") as CollectionUser
      const query = collectionUser.model.findOne({ _id: id.toString() })
      const result = await query.exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUser.findUserById. " + error)
      return null
    }
  }

  public static findUsersByStatus = async (fromPosition: number, usersMax: number, status: UserStatus, newestFirst: boolean = true) => {
    try {
      const collectionUser = Collection.get("User") as CollectionUser
      let result = await collectionUser.model
        .find({ status: status })
        .skip(fromPosition)
        .limit(usersMax)
        .sort({ createdAt: newestFirst ? -1 : 1 })
        .exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUser.findUsersByStatus. " + error)
      return null
    }
  }

  public static findUsers = async (filter?: string, status?: string, fromPosition?: number, usersMax?: number, userRole?: UserRole): Promise<any> => {
    return new Promise<HydratedDocument<any>[]>(async (resolve, reject) => {
      const collectionUser = Collection.get("User") as CollectionUser
      let queryAggregate = CollectionUser.getQueryFindUsers(filter, status, userRole, fromPosition, usersMax)
      collectionUser.model.aggregate(queryAggregate, async (error, users) => {
        if (error) Collection.onError("Couldn't get users", "Error on getting users. " + error)

        // Fetch mongoose store objects with methods
        let results = []
        for (let user of users) {
          results.push(await CollectionUser.findUserById(user._id))
        }

        resolve(results)
      })
    })
  }

  public static findAllUsersByRole = async (userRole: UserRole): Promise<any> => {
    try {
      const collectionUser = Collection.get("User") as CollectionUser
      let result = await collectionUser.model.find().where("role").eq(userRole).sort({ createdAt: -1 }).exec()
      return result
    } catch (error) {
      console.warn("Couldn't complete CollectionUser.findAllUsersByRole. " + error)
      return null
    }
  }

  public static getAllUsersCount = async (filter?: string, status?: string, userRole?: UserRole): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      const collectionUser = Collection.get("User") as CollectionUser
      const ignoreLimits = -1
      const queryAggregate = CollectionUser.getQueryFindUsers(filter, status, userRole, ignoreLimits, ignoreLimits)
      queryAggregate.push({ $group: { _id: null, count: { $sum: 1 } } })
      collectionUser.model.aggregate(queryAggregate, (error, count) => {
        let countNumber = 0
        if (count && count.length > 0 && count[0].count) {
          countNumber = parseInt(count[0].count)
        }

        resolve(countNumber)
      })
    })
  }

  public static findAllValidAdmins = (): Promise<HydratedDocument<any>[]> =>
    CollectionUser.findUsers(undefined, UserStatus.Live, undefined, undefined, UserRole.Admin)

  private static getQueryFindUsers = (filter?: string, status?: string, userRole?: UserRole, fromPosition: number = -1, max: number = -1) => {
    if (!!status && status.toLowerCase() == "all") status = null

    let queryAggregate: Array<any> = []

    if (!!status && CollectionUser.isValidStatus(status)) {
      queryAggregate.push({ $match: { status } })
    }

    if (!!userRole) {
      queryAggregate.push({ $match: { role: userRole } })
    }

    if (filter != null && filter.length > 0) {
      let regex = new RegExp(filter, "i")
      const conditions: Array<any> = [
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
        { communicator: regex },
        { email: regex },
        { role: regex }
      ]

      queryAggregate.push({
        $match: {
          $or: conditions
        }
      })
    }

    queryAggregate.push({
      $sort: { createdAt: -1 }
    })

    if (fromPosition >= 0) {
      let json = { $skip: fromPosition }
      queryAggregate.push(json)
    }

    if (max > 0) {
      let json = { $limit: max }
      queryAggregate.push(json)
    }

    return queryAggregate
  }
}
