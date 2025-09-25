// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { InlineIcon } from "./InlineIcon"

export function Card({
  icon,
  title,
  description,
  hideOverflow,
  href,
  children,
  className = "",
  noPadding,
  noMargin,
  style = {}
}) {
  const content = html`
    <div class="card-body" style=${{ padding: noPadding ? "0" : undefined }}>
      ${title &&
      html`
        <h5 class="card-title">
          ${icon && html`<${InlineIcon} src=${icon} />`} ${title}
        </h5>
      `}
      ${description &&
      html`
        <p class="card-text">${description}</p>
      `}
      ${children}
    </div>
  `

  const mainClassName = `card ${noMargin ? "" : "mb-3"} ${className} ${
    hideOverflow ? "hide-overflow" : ""
  }`

  if (href) {
    return html`
      <a
        class="${mainClassName} text-decoration-none"
        href=${href}
        style=${{
          ...style,
          userSelect: "none",
          userDrag: "none",
        }}
      >
        ${content}
      </a>
    `
  }

  return html`
    <div class=${mainClassName} style=${style}>
      ${content}
    </div>
  `
}
