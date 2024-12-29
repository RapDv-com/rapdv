// Copyright (C) Konrad Gadzinowski

export class HtmlUtils {
  public static sanitizeForInjectionTags(text) {
    if (!text) return text

    let SCRIPT_REGEXES = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
      /<xml\b[^<]*(?:(?!<\/xml>)<[^<]*)*<\/xml>/gi,
      /<!--(?:.|\n|\t|\r)*?-->/gi
    ]

    for (let regex of SCRIPT_REGEXES) {
      while (regex.test(text)) {
        text = text.replace(regex, "")
      }
    }

    return text
  }

  public static removeAllTags(text) {
    if (!text) return text

    var SCRIPT_REGEX = /<(?:.|\n)*?>/gm
    while (SCRIPT_REGEX.test(text)) {
      text = text.replace(SCRIPT_REGEX, "")
    }

    return text
  }

  public static textToHtml = (text) => text.replace(new RegExp('\r?\n','g'), '<br />'); 
}
