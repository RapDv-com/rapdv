// Copyright (C) Konrad Gadzinowski

import { Request } from "express"
import React, { ReactNode } from "react"
import { TextUtils } from "../text/TextUtils"

type Props = {
  req?: Request
  className?: string
  label?: string
  hideLabel?: boolean
  rows?: number
}
export class Textarea extends React.Component<Props & React.InputHTMLAttributes<HTMLTextAreaElement>> {

  getInvalidFeedback = () => {
    let invalidFeedback = []

    if (this.props.required) {
      invalidFeedback.push(`Field is required`)
    }
    if (this.props.minLength !== undefined && this.props.maxLength !== undefined) {
      invalidFeedback.push(`Field needs to be between ${this.props.minLength} and ${this.props.maxLength} characters`)
    } else if (this.props.maxLength !== undefined) {
      invalidFeedback.push(`Field needs to be at most ${this.props.maxLength} characters`)
    } else if (this.props.minLength !== undefined) {
      invalidFeedback.push(`Field needs to be at least ${this.props.minLength} characters`)
    }

    return invalidFeedback.map((entry, index) => <div key={index}>{entry}</div>)
  }


  render(): ReactNode | string {
    const { name, placeholder, children, value, hideLabel, req, className, label, ...otherProps } = this.props
    const valueFromReq = !!req ? req.body[name] : undefined // Get previous value from request

    let placeholderText = placeholder
    if (!placeholderText) {
      // Generate placeholder from name field
      placeholderText = TextUtils.addSpaceBeforeCapitalLetters(name)
      placeholderText = TextUtils.toTitleCase(placeholderText)
    }

    const invalidFeedback = this.getInvalidFeedback()
    const isRequired = this.props.required
    const optionalText = isRequired || this.props.readOnly ? "" : "(Optional)"

    return (
      <div className="mb-3">
        {hideLabel !== true && <label htmlFor={`input${name}`} className="form-label">
          {label ?? placeholderText} <small>{optionalText}</small>
        </label>}
        <textarea
          {...otherProps}
          name={name}
          className={`form-control ${className}`}
          placeholder={placeholderText}
          defaultValue={valueFromReq ?? children ?? value}
        />
        <div className="invalid-feedback">{invalidFeedback}</div>
      </div>
    )
  }
}
