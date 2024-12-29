// Copyright (C) Konrad Gadzinowski

import { Collection } from "./Collection"

export class CollectionEvolution extends Collection {
  constructor() {
    super("Evolution", {
      number: Number,
      comments: String,
      date: Date
    })
  }
}
