// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { InlineIcon } from "./InlineIcon"

type Props = {
  className?: string
  icon?: string
  children?: React.ReactNode
  href?: string
  [key: string]: any
}

export const NavDropdownItem = ({ className, children, href, icon, ...otherProps }: Props) => {
  return html`
    <li class=${className || undefined}>
      <a class="dropdown-item" href=${href} ...${otherProps}>
        ${icon && html`<${InlineIcon} src=${icon} />`} ${children}
      </a>
    </li>
  `
}
