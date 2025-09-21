// Copyright (C) Konrad Gadzinowski

export class ClientPage {
  getPageId() { throw new Error("Not implemented"); }
  execute(pjax) { throw new Error("Not implemented"); }
  onPageClose() { throw new Error("Not implemented"); }
}

export class PagesCtrl {

  pages = new Array()
  currentPage
  pjax

  constructor() {
    this.pages = new Array()
  }

  addPage = (page) => {
    this.pages.push(page)
  }

  setPjax = (pjax) => {
    this.pjax = pjax
  }

  getCurrentPageId = () => {
    if (!this.currentPage) return ""
    return this.currentPage.getPageId()
  }

  setupPage = () => {
    this.closePage()
    let page = this.executeCurrentPageLogic()
    if (page) this.currentPage = page
  }

  closePage = () => {
    if (this.currentPage) {
      this.currentPage.onPageClose()
      this.currentPage = null
    }
  }

  executeCurrentPageLogic = () => {
    const pageIdElement = document.querySelector("#pageId")
    if (!pageIdElement) return

    const pageId = pageIdElement.innerText
    pageIdElement.parentNode.removeChild(pageIdElement)

    if (!pageId || pageId.length === 0) return

    for (let i = 0; i < this.pages.length; i++) {
      let page = this.pages[i]

      if (pageId == page.getPageId()) {
        page.execute(this.pjax)
        return page
      }
    }

    return null
  }
}
