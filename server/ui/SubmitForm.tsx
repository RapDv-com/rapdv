// Copyright (C) Konrad Gadzinowski

import { html } from "htm/preact"
import { ReqType } from "../ReqType"
import { InlineIcon } from "./InlineIcon"

export function SubmitForm(props) {
  const {
    children,
    className = "",
    title,
    submitText,
    method,
    center,
    disabled,
    submitBtnClass,
    submitBtnIcon,
    hideSubmitButton,
    noPjax,
    noCsrf,
    showActionInFixedPanel,
    ...otherProps
  } = props

  const submitBtnClasses = center ? "w-100" : ""
  const pjaxClass = noPjax ? "" : " pjax"
  const encType = method === ReqType.Get ? undefined : "multipart/form-data"

  const submitButton = html`
    <button
      type="submit"
      class="btn btn-md ${submitBtnClass ?? "btn-primary"} ${submitBtnClasses}"
      disabled=${disabled}
    >
      ${submitBtnIcon && html`<${InlineIcon} src=${submitBtnIcon} />`}
      ${submitText ?? "Submit"}
    </button>
  `

  const fixedPanelStyle = {
    position: "fixed",
    bottom: 0,
    right: 0,
    left: 0,
    padding: "25px 30px",
    backgroundColor: "white",
    borderTop: "1px solid #ddd",
    textAlign: "right",
    zIndex: 3,
  }

  return html`
    <div class=${center ? `text-center ${className}` : className}>
      ${title && html`<h1 class="h4 mb-4 fw-normal">${title}</h1>`}
      <form
        ...${otherProps}
        method=${method ?? ReqType.Post}
        class="needs-validation${pjaxClass}"
        encType=${encType}
        noValidate
      >
        ${!noCsrf &&
        html`<input type="hidden" name="_csrf" value="{{_csrf}}" />`}
        ${children}
        ${!hideSubmitButton && !showActionInFixedPanel &&
        html`<div>${submitButton}</div>`}
        ${!hideSubmitButton && showActionInFixedPanel &&
        html`
          <div style=${fixedPanelStyle}>
            <div class="container-max-md">${submitButton}</div>
          </div>
        `}
      </form>
    </div>
  `
}
