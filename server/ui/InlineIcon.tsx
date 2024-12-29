// Copyright (C) Konrad Gadzinowski

import React from "react"
import styled from "styled-components"
import { Types } from "../types/Types"

type Props = {
  src: string | any
  color?: string
  size?: string
  noMargin?: boolean
  alt?: string
  className?: string
}

export const InlineIcon = ({ src, color, size, noMargin, alt, className }: Props) => {
  if (!src) return null
  const style = !!color ? { color } : undefined
  // Make sure that URLs won't be used as a class name
  if (Types.isString(src) && !src.includes("/")) return <FontIcon className={`${src} ${className}`} size={size} noMargin={noMargin} style={style}></FontIcon>
  return <Icon src={src} size={size} alt={alt} className={className} />
}

const FontIcon = styled.i<{ size?: string, noMargin?: boolean }>`
  ${({ size }) => !!size ? `font-size: ${size}` : ""};
  ${({ noMargin }) => !!noMargin ? `` : "margin-right: 5px;"};

`

const Icon = styled.img<{ size?: string }>`
  height: ${({ size }) => size ?? "35px"};
  margin-left: 5px;
  margin-right: 5px;
  object-fit: contain;
  user-select: none;
  user-drag: none;
`
