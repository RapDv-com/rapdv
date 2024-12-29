// Copyright (C) Konrad Gadzinowski

import { Request } from "express"
import React, { ReactNode } from "react"
import { TextUtils } from "../text/TextUtils"
import { Types } from "../types/Types"

export type Option = {
  value: string
  title?: string
  disabled?: boolean
}

type Props = {
  req?: Request
  options: string[] | Option[]
  hideLabel?: boolean
  className?: string
}
export class Select extends React.Component<Props & React.SelectHTMLAttributes<HTMLSelectElement>> {
  getInvalidFeedback = () => {
    let invalidFeedback = []

    if (this.props.required) {
      invalidFeedback.push(`Field is required`)
    }

    return invalidFeedback.map((entry, index) => <div key={index}>{entry}</div>)
  }

  render(): ReactNode | string {
    const { name, placeholder, value, req, options, hideLabel, className, ...otherProps } = this.props
    const valueFromReq = !!req ? req.body[name] : undefined // Get previous value from request

    let placeholderText = placeholder
    if (!placeholderText) {
      // Generate placeholder from name field
      placeholderText = TextUtils.toTitleCase(name, true)
    }

    const invalidFeedback = this.getInvalidFeedback()
    const isRequired = this.props.required
    const optionalText = isRequired || this.props.disabled ? "" : "(Optional)"

    return (
      <div className="mb-3">
        {!hideLabel && <label htmlFor={`input${name}`} className="form-label">
          {placeholderText} <small>{optionalText}</small>
        </label>}
        <select
          id={`input${name}`}
          className={`form-select form-control-md ${className}`}
          {...otherProps}
          name={name}
          placeholder={placeholderText}
          defaultValue={valueFromReq ?? value}
        >
          {options.map((option, index) => {
            const isOptionText = Types.isString(option)
            let title = isOptionText ? null : option.title
            let value = isOptionText ? option : option.value

            const isTitleDefined = !!title && title.trim().length > 0
            const titleShown = isTitleDefined ? title : TextUtils.toTitleCase(value, true)

            return <option key={index} value={value} hidden={option.disabled}>
              {titleShown}
            </option>
          })}
        </select>
        <div className="invalid-feedback">{invalidFeedback}</div>
      </div>
    )
  }
}
