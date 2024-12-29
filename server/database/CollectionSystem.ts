// Copyright (C) Konrad Gadzinowski

import { HydratedDocument } from "mongoose"
import { Collection } from "./Collection"

export class CollectionSystem extends Collection {
  constructor() {
    super("System", {
      isSetupFinished: Boolean
    })
  }

  public static create(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const System = Collection.get("System").model

      let system = await System.findOne()
      if (!!system) {
        // Entry already exist
        resolve(system)
        return
      }

      system = new System()
      system.isSetupFinished = false

      system = await system.save()
      resolve(system)
    })
  }

  public static get(): Promise<HydratedDocument<any>>
  public static get(name: string): Collection
  public static get(name?: string): Promise<HydratedDocument<any>> | Collection {
    if (!!name) {
      return Collection.get("System")
    }

    return new Promise(async (resolve, reject) => {
      try {
        const System = Collection.get("System").model
  
        let system = await System.findOne().exec()
        if (!system) system = await CollectionSystem.create()
        resolve(system)
      } catch (error) {
        reject(error)
      }
    })
  }
}
