// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { Types } from "../types/Types"

type Props = {
  src: string | any
  color?: string
  size?: string
  noMargin?: boolean
  alt?: string
  className?: string
}

export const InlineIcon = ({ src, color, size, noMargin, alt, className = "" }: Props) => {
  if (!src) return null

  const colorStyle = color ? { color } : {}

  // Case 1: font icon (e.g. Bootstrap Icons)
  if (Types.isString(src) && !src.includes("/")) {
    const style = {
      ...colorStyle,
      fontSize: size ?? undefined,
      marginRight: noMargin ? undefined : "5px",
    }

    return html`<i class="${src} ${className}" style=${style}></i>`
  }

  // Case 2: image icon
  const style = {
    height: size ?? "35px",
    marginLeft: "5px",
    marginRight: "5px",
    objectFit: "contain",
    userSelect: "none",
    userDrag: "none",
  }

  return html`<img src=${src} alt=${alt} class=${className} style=${style} />`
}
