// Copyright (C) Konrad Gadzinowski

import { Auth } from "../auth/Auth"
import { html } from "../html/Html"
import { InlineIcon } from "./InlineIcon"
import { UserRole } from "../database/CollectionUser"
import { Role } from "../Role"
import { Request } from "../server/Request"
import { VNode } from "preact"

type Props = {
  title: string | VNode
  icon?: string
  req?: Request
  restrictions?: (Role | UserRole | string)[]
  className?: string
  dropdownClassName?: string
  children?: VNode
}

export const NavDropdown = ({
  title,
  icon,
  req,
  restrictions,
  className = "",
  dropdownClassName = "",
  children,
}: Props) => {
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
