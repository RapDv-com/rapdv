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
      const repo = Collection.get('System').repository

      let system = await repo.findOne({ where: {} })
      if (!!system) {
        resolve(system)
        return
      }

      system = repo.create()
      system.isSetupFinished = false
      system = await repo.save(system)
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
        const repo = Collection.get('System').repository
        let system = await repo.findOne({ where: {} })
        if (!system) system = await CollectionSystem.create()
        resolve(system)
      } catch (error) {
        reject(error)
      }
    })
  }
}
