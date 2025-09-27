// Copyright (C) Konrad Gadzinowski

import { PagesCtrl } from "rapdv/elements/PagesCtrl"
import { Form } from "rapdv/elements/Form"

export class AppClient {
  initiated = false
  pagesCtrl

  pjax
  onPageLoaded

  constructor(onPageLoaded) {
    this.onPageLoaded = onPageLoaded
  }

  start = (pages) => {
    if (this.initiated) return
    this.initiated = true
    this.setupPjax()

    this.pagesCtrl = new PagesCtrl()
    if (!!pages) {
      for (const page of pages) {
        this.pagesCtrl.addPage(page)
      }
    }
  }

  setupPjax = () => {
    document.addEventListener("DOMContentLoaded", () => {
      this.pjax = new Pjax({ elements: 'a:not([target="_blank"]):not(.noPjax)[href], form.pjax', selectors: ["title", "header", "main", "footer", "style"], cacheBust: false })
      NProgress.configure({ parent: "body", showSpinner: false })
      this.pagesCtrl.setPjax(this.pjax)
      this.pagesCtrl.setupPage()
      Form.setupForms()
      if (!!this.onPageLoaded) this.onPageLoaded()
    })

    document.addEventListener("pjax:send", () => {
      NProgress.start()
    })

    document.addEventListener("pjax:complete", () => {
      NProgress.done()
    })

    document.addEventListener("pjax:error", () => {
      NProgress.done()
    })

    document.addEventListener("pjax:success", () => {
      NProgress.done()
      this.pagesCtrl.setupPage()
      Form.setupForms()
      if (!!this.onPageLoaded) this.onPageLoaded()
    })
  }
}
