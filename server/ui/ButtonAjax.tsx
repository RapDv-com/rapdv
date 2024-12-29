// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { ReqType } from "../ReqType"

type Props = {
  children?: any
  params?: Object
  method?: ReqType
}

export class ButtonAjax extends React.Component<Props & React.FormHTMLAttributes<HTMLFormElement>> {
  render(): ReactNode | string {
    const { children, className, method, params, ...otherProps } = this.props
    if (otherProps.hidden) {
      return null
    }
    return (
      <form {...otherProps} className="pjax" method={method ?? ReqType.Post} encType="multipart/form-data" noValidate>
        <input type="hidden" name="_csrf" value="{{_csrf}}" />
        {!!params && Object.keys(params).map((key, index) => <input key={index} type="hidden" name={key} value={params[key]} />)}
        <button type="submit" className={className}>
          {children}
        </button>
      </form>
    )
  }
}
