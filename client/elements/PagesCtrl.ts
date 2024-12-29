// Copyright (C) Konrad Gadzinowski

import Pjax from "pjax"

export interface ClientPage {
  getPageId(): string
  execute(pjax: Pjax): void
  onPageClose(): void
}

export class PagesCtrl {

  private pages: Array<ClientPage> = new Array()
  private currentPage
  private pjax: Pjax

  public constructor() {
    this.pages = new Array()
  }

  public addPage = (page: ClientPage) => {
    this.pages.push(page)
  }

  public setPjax = (pjax: Pjax) => {
    this.pjax = pjax
  }

  public getCurrentPageId = () => {
    if (!this.currentPage) return ""
    return this.currentPage.getPageId()
  }

  public setupPage = () => {
    this.closePage()
    let page = this.executeCurrentPageLogic()
    if (page) this.currentPage = page
  }

  private closePage = () => {
    if (this.currentPage) {
      this.currentPage.onPageClose()
      this.currentPage = null
    }
  }

  private executeCurrentPageLogic = () => {
    const pageIdElement: any = document.querySelector("#pageId")
    if (!pageIdElement) return

    const pageId = pageIdElement.innerText
    pageIdElement.parentNode.removeChild(pageIdElement)

    if (!pageId || pageId.length === 0) return

    for (let i = 0; i < this.pages.length; i++) {
      let page: ClientPage = this.pages[i]

      if (pageId == page.getPageId()) {
        page.execute(this.pjax)
        return page
      }
    }

    return null
  }
}
