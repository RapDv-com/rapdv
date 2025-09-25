// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { InlineIcon } from "./InlineIcon"

export function NavDropdownItem({ className, children, href, icon, ...otherProps }) {
  return html`
    <li class=${className || undefined}>
      <a class="dropdown-item" href=${href} ...${otherProps}>
        ${icon && html`<${InlineIcon} src=${icon} />`} ${children}
      </a>
    </li>
  `
}
