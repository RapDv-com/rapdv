// Copyright (C) Konrad Gadzinowski

import { html } from "./Html";
import { HtmlUtils } from "./HtmlUtils"

type Props = {
  children?: any
  className?: string
}

export const DivHtml = ({ children, className }: Props) => {
  return html`
    <div
      class=${className}
    >
      ${HtmlUtils.sanitizeForInjectionTags(children)}\
    </div>
  `;
};