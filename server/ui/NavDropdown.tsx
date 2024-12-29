// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import styled from "styled-components"
import { Auth } from "../auth/Auth"
import { UserRole } from "../database/CollectionUser"
import { Role } from "../Role"
import { Request } from "../server/Request"
import { InlineIcon } from "./InlineIcon"

type Props = {
  title: string | React.ReactNode
  icon?: string
  req?: Request
  restrictions?: (Role | UserRole | string)[]
  className?: string
  dropdownClassName?: string
  children?: React.ReactNode
}

export class NavDropdown extends React.Component<Props> {
  render(): ReactNode | string {
    const { className, dropdownClassName, children, restrictions, title, icon, req } = this.props

    if (!!restrictions && !req) throw 'When setting restrictions to the NavDropdown, you also need to pass req'

    // Check restrictions
    if (!!restrictions && !Auth.doesUserHaveAccess(req?.user, restrictions)) {
      return null
    }

    return (
      <li className={`nav-item dropdown ${className ?? ""}`}>
        <DropdownToggle className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <InlineIcon src={icon} />
          {title}
        </DropdownToggle>
        <ul className={`dropdown-menu ${dropdownClassName ?? ""}`}>{children}</ul>
      </li>
    )
  }
}

const DropdownToggle = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
`
