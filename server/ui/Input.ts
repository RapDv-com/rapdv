// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { TextUtils } from "../text/TextUtils"

type Props = {
  name: string
  placeholder?: string
  value?: string | number | boolean
  required?: boolean
  req?: Request
  separateLabel?: boolean
  label?: string | any | Element
  marginBottomClass?: string
  className?: string
  type?: string
  readOnly?: boolean
  disabled?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number | "any"
  [key: string]: any
}

export const Input = (props: Props) => {
  const {
    name,
    placeholder,
    value,
    req,
    separateLabel,
    marginBottomClass,
    label,
    ...otherProps
  } = props

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
    if (props.type === "email") {
      invalidFeedback.push("Field needs to be a valid email")
    }
    if (props.type === "number") {
      invalidFeedback.push("Field needs to be a valid number")
    }
    if (props.type === "url") {
      invalidFeedback.push("Field needs to be a valid URL")
    }

    if (props.min !== undefined && props.max !== undefined) {
      invalidFeedback.push(`Field needs to be between ${props.min} and ${props.max}`)
    } else if (props.max !== undefined) {
      invalidFeedback.push(`Field needs to be at most ${props.max}`)
    } else if (props.min !== undefined) {
      invalidFeedback.push(`Field needs to be at least ${props.min}`)
    }

    return invalidFeedback.map((entry, index) =>
      html`<div key=${index}>${entry}</div>`
    )
  }

  const valueFromReq = req ? req.body[name] : undefined
  let placeholderText = placeholder || TextUtils.toTitleCase(name, true)

  const invalidFeedback = getInvalidFeedback()
  const isRequired = props.required
  const optionalText =
    isRequired || props.readOnly || props.disabled ? "" : "(Optional)"
  const isFileUpload = otherProps.type === "file"
  const isCheckbox = otherProps.type === "checkbox"
  const isRadio = otherProps.type === "radio"
  const isHidden = otherProps.type === "hidden"

  if (isHidden) {
    return html`
      <input
        ...${otherProps}
        name=${name}
        defaultValue=${valueFromReq ?? value}
      />
    `
  }

  const labelText = label ?? placeholderText
  const marginBottomClassName = marginBottomClass ?? "mb-3"

  if (isCheckbox) {
    const checkedValues = ["on", "true", "checked", "yes"]
    let isChecked = checkedValues.includes(valueFromReq)
    if (value) {
      isChecked = checkedValues.includes(value.toString())
    }

    return html`
      <div class=${marginBottomClassName}>
        <label class="form-check">
          <input
            id=${`input${name}`}
            class="form-check-input"
            type="checkbox"
            ...${otherProps}
            name=${name}
            aria-label=${placeholderText}
            defaultChecked=${isChecked}
          />
          <div class="form-check-label">${labelText}</div>
          <div class="invalid-feedback">${invalidFeedback}</div>
        </label>
      </div>
    `
  }

  if (isRadio) {
    return html`
      <div class=${marginBottomClassName}>
        <label class="form-check">
          <input
            id=${`input${name}`}
            class="form-check-input"
            type="radio"
            ...${otherProps}
            name=${name}
            aria-label=${placeholderText}
            value=${value}
          />
          <div class="form-check-label">${labelText}</div>
          <div class="invalid-feedback">${invalidFeedback}</div>
        </label>
      </div>
    `
  }

  if (separateLabel || isFileUpload) {
    return html`
      <div class=${marginBottomClassName}>
        <label for=${`input${name}`} class="form-label">
          ${labelText} <small>${optionalText}</small>
        </label>
        <input
          id=${`input${name}`}
          class="form-control form-control-md"
          ...${otherProps}
          name=${name}
          placeholder=${placeholderText}
          defaultValue=${valueFromReq ?? value}
        />
        <div class="invalid-feedback">${invalidFeedback}</div>
      </div>
    `
  }

  return html`
    <div class="form-floating ${marginBottomClassName}">
      <input
        id=${`floating${name}`}
        class="form-control"
        ...${otherProps}
        name=${name}
        placeholder=${placeholderText}
        defaultValue=${valueFromReq ?? value}
      />
      <label for=${`floating${name}`}>
        ${labelText} <small>${optionalText}</small>
      </label>
      <div class="invalid-feedback">${invalidFeedback}</div>
    </div>
  `
}
