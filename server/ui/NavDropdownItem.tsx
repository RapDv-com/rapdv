// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { InlineIcon } from "./InlineIcon"

type Props = {
  className?: string
  icon?: string
  children?: React.ReactNode
}

export class NavDropdownItem extends React.Component<Props & React.AnchorHTMLAttributes<HTMLAnchorElement>> {
  render(): ReactNode | string {
    const { className, children, href, title, icon, ...otherProps } = this.props
    return (
      <li className={!!className ? className : undefined}>
        <a className="dropdown-item" href={href} {...otherProps}>
          {icon && <InlineIcon src={icon} />}
          {children}
        </a>
      </li>
    )
  }
}
