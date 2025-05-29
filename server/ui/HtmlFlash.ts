// Copyright (C) Konrad Gadzinowski

export class HtmlFlash {
  public static normalizeFlash(req, name) {
    let messages = req.flash(name)
    if (!messages || messages == "") return

    let addMsgParam = (value) => {
      if (!value) return

      // Make sure that each flash message has always message in 'msg' property
      if (!!value?.message || value?.msg?.message) {
        if (value?.msg?.message) value.msg = { msg: value.msg.message }
        if (value?.message) value = { msg: value.message }
      } else if (!value.msg) {
        let msg = value
        value = {}
        value.msg = msg
      } else if (value?.msg?.msg) {
        value.msg = value.msg.msg
      }

      return value
    }

    let results = []
    if (messages.constructor === Array) {
      for (let value of messages) {
        let msgParam = addMsgParam(value)
        if (msgParam) results.push(msgParam)
      }
    } else {
      let msgParam = addMsgParam(messages)
      if (msgParam) results.push(msgParam)
    }

    req.flash(name, results)
  }
}
