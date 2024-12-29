// Copyright (C) Konrad Gadzinowski

import React from "react"
import { HtmlUtils } from "./HtmlUtils"

type Props = {
  children?: any
  className?: string
}

export const DivHtml = ({ children, className }: Props) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: HtmlUtils.sanitizeForInjectionTags(children)}}></div>
)
