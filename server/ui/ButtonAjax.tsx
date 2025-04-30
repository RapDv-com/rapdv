// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { ReqType } from "../ReqType"

type Props = {
  children?: any
  params?: Object
  method?: ReqType
  noPjax?: boolean
}

export class ButtonAjax extends React.Component<Props & React.FormHTMLAttributes<HTMLFormElement>> {
  render(): ReactNode | string {
    const { children, className, method, params, noPjax, ...otherProps } = this.props
    if (otherProps.hidden) {
      return null
    }
    const pjaxClass = noPjax ? "" : "pjax"
    
    return (
      <form {...otherProps} className={pjaxClass} method={method ?? ReqType.Post} encType="multipart/form-data" noValidate>
        <input type="hidden" name="_csrf" value="{{_csrf}}" />
        {!!params && Object.keys(params).map((key, index) => <input key={index} type="hidden" name={key} value={params[key]} />)}
        <button type="submit" className={className}>
          {children}
        </button>
      </form>
    )
  }
}
