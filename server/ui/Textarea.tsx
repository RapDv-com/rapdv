// Copyright (C) Konrad Gadzinowski

import { Request } from "express"
import React, { ReactNode } from "react"
import path from "path"
import { TextUtils } from "../text/TextUtils"
import { Translation } from "../lang/Translation"

type Props = {
  req?: Request
  className?: string
  label?: string
  hideLabel?: boolean
  rows?: number
  lang?: string
}
export class Textarea extends React.Component<Props & React.InputHTMLAttributes<HTMLTextAreaElement>> {

  private static DEFAULT_LANG = "en"

  getInvalidFeedback = () => {
    const translation = new Translation(this.props.lang ?? Textarea.DEFAULT_LANG, path.join(__dirname, "Textarea.lang.csv"))
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

    return invalidFeedback.map((entry, index) => <div key={index}>{entry}</div>)
  }


  render(): ReactNode | string {
    const { name, placeholder, children, value, hideLabel, req, className, label, lang, ...otherProps } = this.props
    const valueFromReq = !!req ? req.body[name] : undefined // Get previous value from request

    let placeholderText = placeholder
    if (!placeholderText) {
      // Generate placeholder from name field
      placeholderText = TextUtils.addSpaceBeforeCapitalLetters(name)
      placeholderText = TextUtils.toTitleCase(placeholderText)
    }

    const invalidFeedback = this.getInvalidFeedback()
    const isRequired = this.props.required
    const optionalText = isRequired || this.props.readOnly ? "*" : ""

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
