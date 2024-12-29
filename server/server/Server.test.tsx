// Copyright (C) Konrad Gadzinowski

import { expect } from "chai"
import { Server } from "./Server"
import { describe } from "mocha"
import { MockedApp } from "../mocks/MockedApp"

describe("AppServer", () => {
  var app

  beforeEach(() => {
    app = new Server(() => new MockedApp())
  })

  afterEach(() => {
    app = null
  })

  it("express exists", () => {
    expect(app.getExpress()).to.not.equal(null)
    expect(app.getExpress()).to.not.equal(undefined)
  })

  it("listener exists", () => {
    expect(app.appListener).to.not.equal(null)
    expect(app.appListener).to.not.equal(undefined)
  })
})
