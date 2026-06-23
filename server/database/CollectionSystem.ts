// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Column, Table } from 'sequelize-typescript'
import { RapDvBaseEntity } from './RapDvBaseEntity'
import { Collection } from './Collection'

@Table({ tableName: 'systems', timestamps: true })
export class System extends RapDvBaseEntity {
  @Column({ allowNull: true })
  isSetupFinished: boolean
}

export class CollectionSystem extends Collection {
  constructor() {
    super('System', System)
  }

  public static create(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let system = await System.findOne({ where: {} })
      if (!!system) {
        resolve(system)
        return
      }

      system = System.build({})
      system.isSetupFinished = false
      await system.save()
      resolve(system)
    })
  }

  public static get(): Promise<any>
  public static get(name: string): Collection
  public static get(name?: string): Promise<any> | Collection {
    if (!!name) {
      return Collection.get('System')
    }

    return new Promise(async (resolve, reject) => {
      try {
        let system = await System.findOne({ where: {} })
        if (!system) system = await CollectionSystem.create()
        resolve(system)
      } catch (error) {
        reject(error)
      }
    })
  }
}
