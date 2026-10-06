// Copyright (C) Konrad Gadzinowski

import React from "react"
import ReactDOMServer from "react-dom/server"
import { expect } from "chai"
import { describe } from "mocha"
import { FlashMessages } from "./FlashMessages"

describe("Flash messages", () => {
  it("shows text messages and validation errors", () => {
    const request: any = {
      flash: () => ({ success: ["Your profile is updated."], errors: [{ msg: "Invalid value", param: "bio" }, new Error("Couldn't save the file")] })
    }
    const html = ReactDOMServer.renderToStaticMarkup(<FlashMessages req={request} />)
    expect(html).to.include("<div>Your profile is updated.</div>")
    expect(html).to.include("<div>Invalid value</div>")
    expect(html).to.include("<div>Couldn&#x27;t save the file</div>")
  })
})
