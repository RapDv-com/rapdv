// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { Request } from "../server/Request"
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
  name: string
  placeholder?: string
  value?: string | number | boolean
  required?: boolean
  disabled?: boolean
  [key: string]: any
}

export const Select = (props: Props) => {
  const { name, placeholder, value, req, options, hideLabel, className = "", ...otherProps } = props
  const valueFromReq = req ? req.body[name] : undefined

  const getInvalidFeedback = () => {
    const invalidFeedback = []
    if (props.required) {
      invalidFeedback.push("Field is required")
    }
    return invalidFeedback.map((entry, index) => html`<div key=${index}>${entry}</div>`)
  }

  let placeholderText = placeholder || TextUtils.toTitleCase(name, true)
  const invalidFeedback = getInvalidFeedback()
  const isRequired = props.required
  const optionalText = isRequired || props.disabled ? "" : "(Optional)"

  return html`
    <div class="mb-3">
      ${!hideLabel &&
      html`
        <label for=${`input${name}`} class="form-label">
          ${placeholderText} <small>${optionalText}</small>
        </label>
      `}
      <select
        id=${`input${name}`}
        class="form-select form-control-md ${className}"
        ...${otherProps}
        name=${name}
        placeholder=${placeholderText}
        defaultValue=${valueFromReq ?? value}
      >
        ${options.map((option, index) => {
          const isOptionText = Types.isString(option)
          const optValue = isOptionText ? option : option.value
          const title = isOptionText ? null : option.title
          const isTitleDefined = !!title && title.trim().length > 0
          const titleShown = isTitleDefined ? title : TextUtils.toTitleCase(optValue, true)

          return html`
            <option key=${index} value=${optValue} hidden=${!isOptionText && option.disabled}>
              ${titleShown}
            </option>
          `
        })}
      </select>
      <div class="invalid-feedback">${invalidFeedback}</div>
    </div>
  `
}
