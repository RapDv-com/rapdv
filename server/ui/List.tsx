// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { TextUtils } from "../text/TextUtils"
import { Types } from "../types/Types"

export type FieldInfo = {
  key: string
  title?: string
  hide?: boolean
  custom?: (entry: any, index: number) => ReactNode | string
}

type Props = {
  fields: FieldInfo[]
  data: Array<any>
  hideHeader?: boolean
  className?: string
}

export class List extends React.Component<Props> {

  private keyToTitle = (key: string) => {
    if (!Types.isString(key)) return key
    const splitKey = key.split('.').join(' ')
    return TextUtils.toTitleCase(splitKey, true)
  }

  /**
   * Gets value by using key in a dot notation, e.g. user.data.email
   */
  private getObjectValue = (data: any, key: string) => {
    const keys = key.split(".");
    let currentData: any = data;

    for (const keyPart of keys) {
      if (currentData[keyPart] == null) {
        return ""; // Key is not present in the object
      }
      currentData = currentData[keyPart];
    }

    return currentData;
  }

  render = (): ReactNode | string => {
    const { fields, data, hideHeader, className } = this.props
    if (!fields || fields.length === 0) return null
    const tbodyClass = hideHeader ? "" : "table-group-divider"

    return (
      <div className="table-responsive">
        <table className={`table ${className ?? ""}`}>
          {!hideHeader && <thead>
            <tr>
              {fields.map((field, index) => {
                if (field.hide) return null
                let name = field.title
                if (!name) name = this.keyToTitle(field.key)
                return (
                  <th key={index} scope="col">
                    {name}
                  </th>
                )
              })}
            </tr>
          </thead>}
          <tbody className={tbodyClass}>
            {data.map((entry, rowIndex) => (
              <tr key={rowIndex}>
                {fields.map((field, index) => {
                  if (field.hide) return null
                  let content: ReactNode | string = ""
                  if (!!field.custom) {
                    content = field.custom(entry, rowIndex)
                  } else {
                    content = this.keyToTitle(this.getObjectValue(entry, field.key))
                  }
                  return <td key={index}>{content}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}
;``
