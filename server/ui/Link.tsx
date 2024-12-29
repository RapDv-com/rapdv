// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { Auth } from "../auth/Auth"
import { UserRole } from "../database/CollectionUser"
import { Role } from "../Role"
import { Request } from "../server/Request"
import { InlineIcon } from "./InlineIcon"

type Props = {
  icon?: string
  req?: Request
  restrictions?: (Role | UserRole | string)[]
}

export class Link extends React.Component<Props & React.AnchorHTMLAttributes<HTMLAnchorElement>> {
  render(): ReactNode | string {
    const { href, children, icon, restrictions, req, ...otherProps } = this.props

    if (!!restrictions && !req) throw 'When setting restrictions to the Link, you also need to pass req'

    // Check restrictions
    if (!!restrictions && !Auth.doesUserHaveAccess(req?.user, restrictions)) {
      return null
    }

    return (
      <a href={href} {...otherProps}>
        {icon && <InlineIcon src={icon} />}
        {children}
      </a>
    )
  }
}
