// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { Link } from "./Link"

export function Footer({ children, className = "", hideRapDvInfo }) {
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
