// Copyright (C) Konrad Gadzinowski

import { Auth } from "../auth/Auth"
import { html } from "../html/Html"
import { InlineIcon } from "./InlineIcon"

export function NavDropdown({
  title,
  icon,
  req,
  restrictions,
  className = "",
  dropdownClassName = "",
  children,
}) {
  if (restrictions && !req) {
    throw "When setting restrictions to the NavDropdown, you also need to pass req"
  }

  if (restrictions && !Auth.doesUserHaveAccess(req?.user, restrictions)) {
    return null
  }

  return html`
    <li class="nav-item dropdown ${className}">
      <a
        class="nav-link dropdown-toggle"
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style=${{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "40px",
        }}
      >
        ${icon && html`<${InlineIcon} src=${icon} />`} ${title}
      </a>
      <ul class="dropdown-menu ${dropdownClassName}">${children}</ul>
    </li>
  `
}
