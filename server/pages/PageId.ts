// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"

type Props = {
  children?: any
}

export const PageId = ({ children }: Props) => html`<div id="pageId" style=${{ display: "none" }}>${children}</div>`
