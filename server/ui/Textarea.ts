// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { Request } from "../server/Request"
import { TextUtils } from "../text/TextUtils"

type Props = {
  req?: Request
  className?: string
  label?: string
  hideLabel?: boolean
  rows?: number
  name: string
  placeholder?: string
  value?: string | number | boolean
  required?: boolean
  readOnly?: boolean
  minLength?: number
  maxLength?: number
  children?: any
  [key: string]: any
}

export const Textarea = (props: Props) => {
  const { name, placeholder, children, value, hideLabel, req, className = "", label, ...otherProps } = props
  const valueFromReq = req ? req.body[name] : undefined

  const getInvalidFeedback = () => {
    const invalidFeedback = []
    if (props.required) {
      invalidFeedback.push("Field is required")
    }
    if (props.minLength !== undefined && props.maxLength !== undefined) {
      invalidFeedback.push(`Field needs to be between ${props.minLength} and ${props.maxLength} characters`)
    } else if (props.maxLength !== undefined) {
      invalidFeedback.push(`Field needs to be at most ${props.maxLength} characters`)
    } else if (props.minLength !== undefined) {
      invalidFeedback.push(`Field needs to be at least ${props.minLength} characters`)
    }
    return invalidFeedback.map((entry, index) => html`<div key=${index}>${entry}</div>`)
  }

  let placeholderText = placeholder
  if (!placeholderText) {
    placeholderText = TextUtils.addSpaceBeforeCapitalLetters(name)
    placeholderText = TextUtils.toTitleCase(placeholderText)
  }

  const invalidFeedback = getInvalidFeedback()
  const isRequired = props.required
  const optionalText = isRequired || props.readOnly ? "" : "(Optional)"

  return html`
    <div class="mb-3">
      ${hideLabel !== true &&
      html`
        <label for=${`input${name}`} class="form-label">
          ${label ?? placeholderText} <small>${optionalText}</small>
        </label>
      `}
      <textarea
        ...${otherProps}
        name=${name}
        class="form-control ${className}"
        placeholder=${placeholderText}
        defaultValue=${valueFromReq ?? children ?? value}
      />
      <div class="invalid-feedback">${invalidFeedback}</div>
    </div>
  `
}
