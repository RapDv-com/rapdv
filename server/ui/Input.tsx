// Copyright (C) Konrad Gadzinowski

import { Request } from "express"
import React, { ReactNode } from "react"
import { TextUtils } from "../text/TextUtils"

type Props = {
  req?: Request
  separateLabel?: boolean
  label?: string | ReactNode | Element
}
export class Input extends React.Component<Props & React.InputHTMLAttributes<HTMLInputElement>> {
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
    if (this.props.type === "email") {
      invalidFeedback.push(`Field needs to be a valid email`)
    }
    if (this.props.type === "number") {
      invalidFeedback.push(`Field needs to be a valid number`)
    }
    if (this.props.type === "url") {
      invalidFeedback.push(`Field needs to be a valid URL`)
    }

    if (this.props.min !== undefined && this.props.max !== undefined) {
      invalidFeedback.push(`Field needs to be between ${this.props.min} and ${this.props.max}`)
    } else if (this.props.max !== undefined) {
      invalidFeedback.push(`Field needs to be at most ${this.props.max}`)
    } else if (this.props.min !== undefined) {
      invalidFeedback.push(`Field needs to be at least ${this.props.min}`)
    }

    return invalidFeedback.map((entry, index) => <div key={index}>{entry}</div>)
  }

  render(): ReactNode | string {
    const { name, placeholder, value, req, separateLabel, label, ...otherProps } = this.props
    const valueFromReq = !!req ? req.body[name] : undefined // Get previous value from request

    let placeholderText = placeholder
    if (!placeholderText) {
      // Generate placeholder from name field
      placeholderText = TextUtils.toTitleCase(name, true)
    }

    const invalidFeedback = this.getInvalidFeedback()
    const isRequired = this.props.required
    const optionalText = isRequired || this.props.readOnly || this.props.disabled ? "" : "(Optional)"
    const isFileUpload = otherProps.type === "file"
    const isCheckbox = otherProps.type === "checkbox"
    const isRadio = otherProps.type === "radio"
    const isHidden = otherProps.type === "hidden"

    if (isHidden) {
      return <input {...otherProps} name={name} defaultValue={valueFromReq ?? value} />
    }

    const labelText = label ?? placeholderText

    if (isCheckbox) {
      const checkedValues = ["on", "true", "checked", "yes"]
      let isChecked = checkedValues.includes(valueFromReq)
      if (value) {
        isChecked = checkedValues.includes(value.toString())
      }

      return <div className="mb-3">
      <label className="form-check">
        <input id={`input${name}`} className="form-check-input" type="checkbox" {...otherProps} name={name} aria-label={placeholderText} defaultChecked={isChecked} />
        <div className="form-check-label">
          <>{labelText}</>
        </div>
        <div className="invalid-feedback">{invalidFeedback}</div>
      </label>
    </div>
    }

    if (isRadio) {
      return <div className="mb-3">
      <label className="form-check">
        <input id={`input${name}`} className="form-check-input" type="checkbox" {...otherProps} name={name} aria-label={placeholderText} value={value} />
        <div className="form-check-label">
          <>{labelText}</>
        </div>
        <div className="invalid-feedback">{invalidFeedback}</div>
      </label>
    </div>
    }

    if (separateLabel || isFileUpload) {
      return (
        <div className="mb-3">
          <label htmlFor={`input${name}`} className="form-label">
            <>{labelText} <small>{optionalText}</small></>
          </label>
          <input
            id={`input${name}`}
            className="form-control form-control-md"
            {...otherProps}
            name={name}
            placeholder={placeholderText}
            defaultValue={valueFromReq ?? value}
          />
          <div className="invalid-feedback">{invalidFeedback}</div>
        </div>
      )
    } else {
      return (
        <div className="form-floating mb-3">
          <input
            id={`floating${name}`}
            className="form-control"
            {...otherProps}
            name={name}
            placeholder={placeholderText}
            defaultValue={valueFromReq ?? value}
          />
          <label htmlFor={`floating${name}`}>
            <>{labelText} <small>{optionalText}</small></>
          </label>
          <div className="invalid-feedback">{invalidFeedback}</div>
        </div>
      )
    }
  }
}
