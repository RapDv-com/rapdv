// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { Link } from "./Link"

type Props = {
  children?: any
  className?: string
  hideRapDvInfo?: boolean
}

export const Footer = ({ children, className = "", hideRapDvInfo }: Props) => {
  return html`
    <footer class=${className}>
      ${children}
      ${!hideRapDvInfo &&
      html`
        <${Link}
          href="https://rapdv.com"
          style=${{
            marginLeft: "auto",
            color: "black",
            textDecoration: "none",
          }}
        >
          Built with ⚡️RapDv
        <//>
      `}
    </footer>
  `
}
