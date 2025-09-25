// Copyright (C) Konrad Gadzinowski

import { html } from "../html/Html"
import { TextUtils } from "../text/TextUtils"
import { Types } from "../types/Types"

export function List({ fields, data, hideHeader, className }) {
  if (!fields || fields.length === 0) return null

  const keyToTitle = (key) => {
    if (!Types.isString(key)) return key
    const splitKey = key.split(".").join(" ")
    return TextUtils.toTitleCase(splitKey, true)
  }

  const getObjectValue = (obj, key) => {
    const keys = key.split(".")
    let currentData = obj
    for (const part of keys) {
      if (currentData?.[part] == null) {
        return ""
      }
      currentData = currentData[part]
    }
    return currentData
  }

  const tbodyClass = hideHeader ? "" : "table-group-divider"

  return html`
    <div class="table-responsive">
      <table class="table ${className ?? ""}">
        ${!hideHeader &&
        html`
          <thead>
            <tr>
              ${fields.map((field, index) => {
                if (field.hide) return null
                const name = field.title ?? keyToTitle(field.key)
                return html`<th key=${index} scope="col">${name}</th>`
              })}
            </tr>
          </thead>
        `}
        <tbody class=${tbodyClass}>
          ${data.map(
            (entry, rowIndex) => html`
              <tr key=${rowIndex}>
                ${fields.map((field, index) => {
                  if (field.hide) return null
                  const content = field.custom
                    ? field.custom(entry, rowIndex)
                    : keyToTitle(getObjectValue(entry, field.key))
                  return html`<td key=${index}>${content}</td>`
                })}
              </tr>
            `
          )}
        </tbody>
      </table>
    </div>
  `
}
