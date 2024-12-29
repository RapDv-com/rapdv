// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import styled from "styled-components"
import { Link } from "./Link"

type Props = {
  children?: any
  className?: string
  hideRapDvInfo?: boolean
}

export class Footer extends React.Component<Props> {
  render(): ReactNode | string {
    const { children, className, hideRapDvInfo } = this.props
    return (
      <footer className={className}>
        {children}
        {!hideRapDvInfo && <RightLink href="https://rapdv.com">Built with ⚡️RapDv</RightLink>}
      </footer>
    )
  }
}

const RightLink = styled(Link)`
  margin-left: auto;
  color: black;
  text-decoration: none;
`
