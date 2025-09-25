import { Auth } from "../auth/Auth"
import { html } from "../html/Html"
import { InlineIcon } from "./InlineIcon"

export function Link(props) {
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
