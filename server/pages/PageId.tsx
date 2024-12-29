// Copyright (C) Konrad Gadzinowski

import React, { ReactElement, ReactNode } from "react"
import styled from "styled-components"

type Props = {
  children?: ReactNode
}

export const PageId = ({ children }): ReactElement<Props> => <Container id="pageId">{children}</Container>

const Container = styled.div`
  display: none;
`
