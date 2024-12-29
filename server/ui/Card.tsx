// Copyright (C) Konrad Gadzinowski

import React, { CSSProperties, ReactNode } from "react"
import { InlineIcon } from "./InlineIcon"
import styled from "styled-components"

type Props = {
  icon?: string
  title?: string | ReactNode | Element
  description?: string | ReactNode | Element
  hideOverflow?: boolean
  href?: string
  children?: any
  className?: string
  noPadding?: boolean
  style?: CSSProperties | undefined;
}

export const Card = ({ icon, title, description, hideOverflow, href, children, className, noPadding, style }: Props) => {

  const content = <div className="card-body" style={{ padding: noPadding ? '0': undefined }} >
    {title && <h5 className="card-title">
      <>
        {!!icon && <InlineIcon src={icon} />}
        {title}
      </>
    </h5>}
    {!!description && <p className="card-text"><>{description}</></p>}
    {children}
  </div>

  const mainClassName = `card mb-3 ${className ?? ""} ${hideOverflow ? "hide-overflow" : ""}`

  if (!!href) {
    return <Link className={`${mainClassName} text-decoration-none`} href={href} style={style}>
      {content}
    </Link>
  }

  return <div className={mainClassName} style={style}>
    {content}
  </div>
}

const Link = styled.a`
  user-select: none;
  user-drag: none;
`
