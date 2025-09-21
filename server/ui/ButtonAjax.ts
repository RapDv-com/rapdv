// Copyright (C) Konrad Gadzinowski

import { ReqType } from "../ReqType"
import { html } from "../html/Html";

type Props = {
  className?: string
  children?: any
  params?: Object
  method?: ReqType
  noPjax?: boolean
  hidden?: boolean
}

export const ButtonAjax = ({ children, className, method, params, noPjax, ...otherProps }: Props) => {
  if (otherProps.hidden) {
    return null
  }
  const pjaxClass = noPjax ? "" : "pjax"
  
  return html`
    <form
      ...${otherProps}
      class=${pjaxClass}
      method=${method ?? ReqType.Post}
      enctype="multipart/form-data"
      novalidate
    >
      <input type="hidden" name="_csrf" value="{{_csrf}}" />
      ${
        params &&
        Object.entries(params).map(
          ([key, value]) =>
            html`<input type="hidden" name=${key} value=${value} />`
        )
      }
      <button type="submit" class=${className}>
        ${children}
      </button>
    </form>
    `;
  }
