// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"


export function FlashMessages({ req }) {
  const renderMsg = (text) => {
    return typeof text === "string" ? text : JSON.stringify(text)
  }

  const renderMessages = (messages, type) => {
    if (!messages) return null
    return html`
      <div class="alert alert-${type} fade show">
        <div style=${{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
          justifyContent: "center",
        }}>
          ${messages.map(({ msg }, index) =>
            html`<div key=${index}>${renderMsg(msg)}</div>`
          )}
        </div>
        <button
          type="button"
          class="btn-close"
          data-dismiss="alert"
          data-bs-dismiss="alert"
          aria-label="Close"
        ></button>
      </div>
    `
  }

  const messages = req.flash()

  return html`
    ${renderMessages(messages.errors, "danger")}
    ${renderMessages(messages.warning, "warning")}
    ${renderMessages(messages.info, "info")}
    ${renderMessages(messages.success, "success")}
  `
}
