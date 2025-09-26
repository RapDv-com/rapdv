import { Auth } from "../auth/Auth"
import { html } from "../html/Html"
import { InlineIcon } from "./InlineIcon"
import { UserRole } from "../database/CollectionUser"
import { Role } from "../Role"
import { Request } from "../server/Request"

type Props = {
  icon?: string
  req?: Request
  restrictions?: (Role | UserRole | string)[]
  href: string
  children?: any
  className?: string
  style?: any
  [key: string]: any
}

export const Link = (props: Props) => {
  const { href, children, icon, restrictions, req, ...otherProps } = props

  if (restrictions && !req) {
    throw "When setting restrictions to the Link, you also need to pass req"
  }

  if (restrictions && !Auth.doesUserHaveAccess(req?.user, restrictions)) {
    return null
  }

  return html`
    <a href=${href} ...${otherProps}>
      ${icon && html`<${InlineIcon} src=${icon} />`}
      ${children}
    </a>
  `
}
