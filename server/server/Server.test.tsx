// Copyright (C) Konrad Gadzinowski

import { expect } from "chai"
import { Server } from "./Server"
import { describe } from "mocha"
import { MockedApp } from "../mocks/MockedApp"

describe("AppServer", () => {
  let server
  let app

  beforeEach(() => {
    server = new Server(() => new MockedApp())
    app = server.getApp()
  })

  afterEach(() => {
    server = null
  })

  it("main layout exists", () => {
    const mainLayout = app.getLayout()
    expect(mainLayout).to.not.equal(null)
    expect(mainLayout).to.not.equal(undefined)
  })

  it("error view is defined", () => {
    const errorView = app.getErrorView(new Error("Test error"))
    expect(errorView).to.not.equal(null)
    expect(errorView).to.not.equal(undefined)
  })
})
