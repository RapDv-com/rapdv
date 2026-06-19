// Copyright (C) Konrad Gadzinowski

import { Request } from "express"
import React, { ReactNode } from "react"
import path from "path"
import { TextUtils } from "../text/TextUtils"
import { Translation } from "../lang/Translation"

type Props = {
  req?: Request
  separateLabel?: boolean
  marginBottomClass?: string
  label?: string | ReactNode | Element
  lang?: string
}
export class Input extends React.Component<Props & React.InputHTMLAttributes<HTMLInputElement>> {

  private static DEFAULT_LANG = "en"

  getInvalidFeedback = () => {
    const translation = new Translation(this.props.lang ?? Input.DEFAULT_LANG, path.join(__dirname, "Input.lang.csv"))
    const t = translation.get.bind(translation)

    const invalidFeedback = []

    if (this.props.required) {
      invalidFeedback.push(t("Field is required"))
    }
    if (this.props.minLength !== undefined && this.props.maxLength !== undefined) {
      invalidFeedback.push(t("Field needs to be between {min} and {max} characters").replace("{min}", String(this.props.minLength)).replace("{max}", String(this.props.maxLength)))
    } else if (this.props.maxLength !== undefined) {
      invalidFeedback.push(t("Field needs to be at most {max} characters").replace("{max}", String(this.props.maxLength)))
    } else if (this.props.minLength !== undefined) {
      invalidFeedback.push(t("Field needs to be at least {min} characters").replace("{min}", String(this.props.minLength)))
    }
    if (this.props.type === "email") {
      invalidFeedback.push(t("Field needs to be a valid email"))
    }
    if (this.props.type === "number") {
      invalidFeedback.push(t("Field needs to be a valid number"))
    }
    if (this.props.type === "url") {
      invalidFeedback.push(t("Field needs to be a valid URL"))
    }

    if (this.props.min !== undefined && this.props.max !== undefined) {
      invalidFeedback.push(t("Field needs to be between {min} and {max}").replace("{min}", String(this.props.min)).replace("{max}", String(this.props.max)))
    } else if (this.props.max !== undefined) {
      invalidFeedback.push(t("Field needs to be at most {max}").replace("{max}", String(this.props.max)))
    } else if (this.props.min !== undefined) {
      invalidFeedback.push(t("Field needs to be at least {min}").replace("{min}", String(this.props.min)))
    }

    return invalidFeedback.map((entry, index) => <div key={index}>{entry}</div>)
  }

  render(): ReactNode | string {
    const { name, placeholder, value, req, separateLabel, marginBottomClass, label, lang, ...otherProps } = this.props
    const valueFromReq = !!req ? req.body[name] : undefined // Get previous value from request

    let placeholderText = placeholder
    if (!placeholderText) {
      // Generate placeholder from name field
      placeholderText = TextUtils.toTitleCase(name, true)
    }

    const invalidFeedback = this.getInvalidFeedback()
    const isRequired = this.props.required
    const optionalText = isRequired || this.props.readOnly || this.props.disabled ? "*" : ""
    const isFileUpload = otherProps.type === "file"
    const isCheckbox = otherProps.type === "checkbox"
    const isRadio = otherProps.type === "radio"
    const isHidden = otherProps.type === "hidden"

    if (isHidden) {
      return <input {...otherProps} name={name} defaultValue={valueFromReq ?? value} />
    }

    const labelText = label ?? placeholderText
    const marginBottomClassName = marginBottomClass ?? "mb-3"

    if (isCheckbox) {
      const checkedValues = ["on", "true", "checked", "yes"]
      let isChecked = checkedValues.includes(valueFromReq)
      if (value) {
        isChecked = checkedValues.includes(value.toString())
      }

      return <div className={marginBottomClassName}>
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
      return <div className={marginBottomClassName}>
      <label className="form-check">
        <input id={`input${name}`} className="form-check-input" type="radio" {...otherProps} name={name} aria-label={placeholderText} value={value} />
        <div className="form-check-label">
          <>{labelText}</>
        </div>
        <div className="invalid-feedback">{invalidFeedback}</div>
      </label>
    </div>
    }

    if (separateLabel || isFileUpload) {
      return (
        <div className={marginBottomClassName}>
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
        <div className={`form-floating ${marginBottomClassName}`}>
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
