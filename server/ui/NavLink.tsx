// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { Auth } from "../auth/Auth"
import { UserRole } from "../database/CollectionUser"
import { Role } from "../Role"
import { Request } from "../server/Request"
import { Link } from "./Link"

type Props = {
  icon?: string
  req?: Request
  restrictions?: (Role | UserRole | string)[]
  noNavLinkStyle?: boolean
  hidden?: boolean
}

export class NavLink extends React.Component<Props & React.AnchorHTMLAttributes<HTMLAnchorElement>> {
  render(): ReactNode | string {
    const { req, restrictions, className, noNavLinkStyle, hidden, ...otherProps } = this.props

    if (hidden) {
      return null
    }

    if (!!restrictions && !req) throw 'When setting restrictions to the NavLink, you also need to pass req'

    // Check restrictions
    if (!!restrictions && !Auth.doesUserHaveAccess(req?.user, restrictions)) {
      return null
    }

    const formatUrl = (url: string) => url?.trim().replace(/\//g, "")
    const isActive = !!req?.url && formatUrl(req?.url) === formatUrl(this.props.href)

    const linkClassName = `${noNavLinkStyle ? "" : "nav-link"}${isActive ? " active" : ""} ${className}`
    return (
      <li className="nav-item">
        <Link {...otherProps} req={req} restrictions={restrictions} className={linkClassName} />
      </li>
    )
  }
}
