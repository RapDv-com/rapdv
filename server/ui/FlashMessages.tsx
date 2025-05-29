// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import styled from "styled-components"
import { Request } from "../server/Request"
import { Types } from "../types/Types"

type Props = {
  req: Request
}

export class FlashMessages extends React.Component<Props> {
  renderMsg = (text: any) => {
    if (Types.isString(text)) return text
    return JSON.stringify(text)
  }

  renderMessages = (messages: any[], type: string) => {
    if (!messages) return null
    return (
      <div className={`alert alert-${type} fade show`}>
        <Container>
          {messages.map(({ msg }, index) => (
            <div key={index}>{this.renderMsg(msg)}</div>
          ))}
        </Container>
        <button type="button" data-dismiss="alert" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    )
  }

  render = (): ReactNode | string => {
    const { req } = this.props
    const request: any = req
    if (!req.session) {
      return <></>
    }
    const messages = request.flash()

    return (
      <>
        {this.renderMessages(messages.errors, "danger")}
        {this.renderMessages(messages.warning, "warning")}
        {this.renderMessages(messages.info, "info")}
        {this.renderMessages(messages.success, "success")}
      </>
    )
  }
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
`
