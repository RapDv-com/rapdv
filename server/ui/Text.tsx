// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"

export class Text extends React.Component<{ text: string }> {
  render(): ReactNode | string {
    return <div>{this.props.text}</div>
  }
}
