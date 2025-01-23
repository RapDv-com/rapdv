// Copyright (C) Konrad Gadzinowski

import Pjax from "pjax"
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap/dist/js/bootstrap.js"
import "bootstrap-icons/font/bootstrap-icons.css"
import "nprogress/nprogress.css"
import NProgress from "nprogress/nprogress.js"
import { ClientPage, PagesCtrl } from "../elements/PagesCtrl"
import { Form } from "../elements/Form"
import "./styles/main.css"
import "./styles/sizing.css"

export class AppClient {
  initiated = false
  pagesCtrl: PagesCtrl

  public pjax: Pjax
  private onPageLoaded?: () => void

  constructor(onPageLoaded?: () => void) {
    this.onPageLoaded = onPageLoaded
  }

  start = (pages?: Array<ClientPage>) => {
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
