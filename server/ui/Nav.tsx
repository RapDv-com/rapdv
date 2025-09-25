// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html";

export function Nav({
  appName,
  icon,
  children,
  showIcon,
  className,
  href,
  hideNav,
  customBrand,
}) {
  return html`
    <nav class="navbar navbar-expand-lg ${className ?? "bg-light"}">
      <div class="container-fluid">
        ${!customBrand &&
        html`
          <a
            class="navbar-brand"
            href=${href ?? "/"}
            style=${{
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            ${showIcon &&
            html`
              <img
                src=${icon ?? "/client/assets/favicon.svg"}
                alt="${appName} icon"
                style=${{ height: "32px", marginRight: "10px" }}
              />
            `}
            ${appName}
          </a>
        `}
        ${customBrand && customBrand}
        ${!hideNav &&
        html`
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
        `}
        ${!hideNav &&
        html`
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            ${children}
          </div>
        `}
      </div>
    </nav>
  `
}
