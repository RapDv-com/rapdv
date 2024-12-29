// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { ReqType } from "../ReqType"
import { InlineIcon } from "./InlineIcon"
import styled from "styled-components"

type Props = {
  children?: any
  title?: string
  submitText?: string
  method?: ReqType
  center?: boolean
  disabled?: boolean
  submitBtnClass?: string
  submitBtnIcon?: string
  hideSubmitButton?: boolean
  noPjax?: boolean
  noCsrf?: boolean
  showActionInFixedPanel?: boolean
}

export class SubmitForm extends React.Component<Props & React.FormHTMLAttributes<HTMLFormElement>> {
  render(): ReactNode | string {
    
    const { children, className, title, submitText, method, center, disabled, submitBtnClass, submitBtnIcon, hideSubmitButton, noPjax, noCsrf, showActionInFixedPanel, ...otherProps } = this.props
    
    const submitBtnClasses = !!center ? "w-100" : ""
    const pjaxClass = noPjax ? "" : " pjax"
    const encType = method === ReqType.Get ? undefined : "multipart/form-data"

    const submitButton = <button type="submit" className={`btn btn-md ${submitBtnClass ?? "btn-primary"} ${submitBtnClasses}`} disabled={disabled}>
    {!!submitBtnIcon && <InlineIcon src={submitBtnIcon} />}{submitText ?? "Submit"}
  </button>

    return (
      <div className={!!center ? `text-center ${className}` : className}>
        {title && <h1 className="h4 mb-4 fw-normal">{title}</h1>}
        <form {...otherProps} method={method ?? ReqType.Post} className={`needs-validation${pjaxClass}`} encType={encType} noValidate>
          {!noCsrf && <input type="hidden" name="_csrf" value="{{_csrf}}" />}
          {children}
          {!hideSubmitButton && !showActionInFixedPanel && <div className="mb-3">
            {submitButton}
          </div>}
          {!hideSubmitButton && showActionInFixedPanel && <FixedPanel>
            <div className="container-max-md">
              {submitButton}
            </div>
          </FixedPanel>}
        </form>
      </div>
    )
  }
}

const FixedPanel = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 25px 30px 25px 30px;
  background-color: white;
  border-top: 1px solid #ddd;
  text-align: right;
  z-index: 3;
`
