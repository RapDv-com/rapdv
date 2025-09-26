// Copyright (C) Konrad Gadzinowski

import { Auth } from "../auth/Auth"
import { UserRole } from "../database/CollectionUser"
import { html } from "../html/Html"
import { Role } from "../Role"
import { Request } from "../server/Request"
import { Link } from "./Link"

type Props = {
  icon?: string
  req?: Request
  restrictions?: (Role | UserRole | string)[]
  noNavLinkStyle?: boolean
  hidden?: boolean
  href: string
  className?: string
  [key: string]: any
}

export const NavLink = ({
  req,
  restrictions,
  className = "",
  noNavLinkStyle,
  hidden,
  href,
  ...otherProps
}: Props) => {
  if (hidden) {
    return null
  }

  if (restrictions && !req) {
    throw "When setting restrictions to the NavLink, you also need to pass req"
  }

  if (restrictions && !Auth.doesUserHaveAccess(req?.user, restrictions)) {
    return null
  }

  const formatUrl = (url) => url?.trim().replace(/\//g, "")
  const isActive = !!req?.url && formatUrl(req.url) === formatUrl(href)

  const linkClassName = `${noNavLinkStyle ? "" : "nav-link"}${isActive ? " active" : ""} ${className}`

  return html`
    <li class="nav-item">
      <${Link}
        ...${otherProps}
        href=${href}
        req=${req}
        restrictions=${restrictions}
        className=${linkClassName}
      />
    </li>
  `
}
