// Copyright (C) Konrad Gadzinowski

import Pjax from "pjax"
import "nprogress/nprogress.css"
import NProgress from "nprogress/nprogress.js"
import { PagesCtrl } from "../elements/PagesCtrl"
import "./styles/main.scss"
import "./styles/sizing.scss"
import Pjax from "pjax"

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
