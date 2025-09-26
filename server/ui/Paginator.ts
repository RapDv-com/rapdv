// Copyright (C) Konrad Gadzinowski

import url from "url"
import { Request } from "../server/Request"
import { html } from "../html/Html"
import { Component, VNode } from "preact"

type Props = {
  req: Request
  center?: boolean
  itemsCount: number
  itemsPerPage?: number
  keyPage?: string
  hideIfSinglePage?: boolean
}

export class Paginator extends Component<Props> {

  public static ITEMS_PER_PAGE = 20
  private static KEY_PAGE: string = "page"

  private static PAGE_NMB_TO_REAL_OFFSET: number = -1 // &page=1 -> Shows Page 1

  private MAX_PAGES_NEARBY: number = 3
  private MIN_PAGES: number = 1

  private AVOID_MARGIN_POSITION: number = 1 // Extreme links don't get margin if for e.g. 100 is next to 99

  public totalPages: number
  public currentPage: number

  private pageUrl: string
  private queryString: Array<string>
  private keyPage: string

  public static getFromPosition = (req: Request, itemsCount: number, itemsPerPage: number = Paginator.ITEMS_PER_PAGE, keyPage?: number) => {
    let parsedUrl = url.parse(req.originalUrl, true)
    let queryString: any = parsedUrl.query

    let totalPages: number = Math.ceil(itemsCount / itemsPerPage)

    // Get users from -> to
    let currentPage = parseInt(queryString[keyPage ?? Paginator.KEY_PAGE])
    if (isNaN(currentPage)) currentPage = 0
    currentPage = currentPage + Paginator.PAGE_NMB_TO_REAL_OFFSET
    currentPage = Math.min(currentPage, totalPages - 1)
    currentPage = Math.max(currentPage, 0)

    let fromPosition: number = itemsPerPage * currentPage

    return fromPosition
  }

  public render = (): VNode => {
    if (!!this.props.keyPage) {
      this.keyPage = this.props.keyPage
    } else {
      this.keyPage = Paginator.KEY_PAGE
    }

    let { totalPages, currentPage, basePageUrl, queryString } = this.getPaginatorParams(
      this.props.req,
      this.keyPage,
      this.props.itemsCount,
      this.props.itemsPerPage
    )

    totalPages = Math.max(totalPages, 1)
    currentPage = Math.max(currentPage, 0)
    currentPage = Math.min(totalPages - 1, currentPage)

    this.totalPages = totalPages

    if (totalPages <= 1 && this.props.hideIfSinglePage) {
      return null
    }

    if (!currentPage) currentPage = 0
    this.currentPage = currentPage
    this.pageUrl = basePageUrl

    this.queryString = []
    for (let key in queryString) {
      let value = queryString[key]
      this.queryString[key] = value
    }

    return html`
      <${PaginatorList} class="pagination" center=${this.props.center}>
        ${this.getHtmlElements()}
      <//>
    `
  }

  private getPaginatorParams = (req: Request, keyPage: string, count: number, itemsPerPage: number = Paginator.ITEMS_PER_PAGE) => {
    if (isNaN(count)) count = 0

    let parsedUrl = url.parse(req.originalUrl, true)
    let basePageUrl: string = process.env.BASE_URL + parsedUrl.pathname
    let queryString: any = parsedUrl.query

    let totalPages: number = Math.ceil(count / itemsPerPage)

    // Get users from -> to
    let currentPage = parseInt(queryString[keyPage ?? Paginator.KEY_PAGE])
    if (isNaN(currentPage)) currentPage = 0
    currentPage = currentPage + Paginator.PAGE_NMB_TO_REAL_OFFSET
    currentPage = Math.min(currentPage, totalPages - 1)
    currentPage = Math.max(currentPage, 0)

    let fromPosition: number = itemsPerPage * currentPage
    let maxCount: number = itemsPerPage

    let max: number = count - fromPosition
    max = Math.min(max, maxCount)
    max = Math.max(max, 1)

    return {
      totalPages,
      currentPage,
      basePageUrl,
      queryString
    }
  }

  public getHtmlElements(): Array<VNode> {
    let elements: Array<VNode> = []

    let firstPage: number = 0
    let totalPages: number = Math.max(this.totalPages, this.MIN_PAGES)

    // Show maximum few nearby pages links and fast forward / backward to maximum page
    let startPage: number = Math.max(this.currentPage - this.MAX_PAGES_NEARBY, firstPage)
    let lastPage: number = Math.min(this.currentPage + this.MAX_PAGES_NEARBY, totalPages + Paginator.PAGE_NMB_TO_REAL_OFFSET)

    let showFastFirst: boolean = startPage != firstPage
    let showFastLast: boolean = lastPage != totalPages + Paginator.PAGE_NMB_TO_REAL_OFFSET

    // Add first lisk
    if (showFastFirst) {
      // Check if we should add spacing
      let cssClass: string = ""
      let isNextToCorrectNumber: boolean = startPage == firstPage + this.AVOID_MARGIN_POSITION
      if (!isNextToCorrectNumber) {
        cssClass = " me-3"
      }

      let tag: VNode = this.getPageLink(elements.length, firstPage, cssClass, this.pageUrl)
      elements.push(tag)
    }

    // Add other links
    for (let i = startPage; i <= lastPage; i++) {
      let tag: VNode = this.getPageLink(elements.length, i, "", this.pageUrl)
      elements.push(tag)
    }

    // Add last link
    if (showFastLast) {
      // Check if we should add spacing
      let cssClass: string = ""
      let isNextToCorrectNumber: boolean = lastPage == totalPages - this.AVOID_MARGIN_POSITION + Paginator.PAGE_NMB_TO_REAL_OFFSET
      if (!isNextToCorrectNumber) {
        cssClass = " ms-3"
      }

      let tag: VNode = this.getPageLink(elements.length, totalPages + Paginator.PAGE_NMB_TO_REAL_OFFSET, cssClass, this.pageUrl)
      elements.push(tag)
    }

    return elements
  }

  private getPageLink(index: number, pageNmb: number, cssClasses: string, pageUrl: string): VNode {
    let classes: string = "page-item" + cssClasses
    const readablePageNmb = pageNmb - Paginator.PAGE_NMB_TO_REAL_OFFSET
    const isActive = pageNmb == this.currentPage
    if (isActive) {
      classes += " active"
    }

    // Get base url
    delete this.queryString[this.keyPage]
    if (pageNmb === 0) {
      delete this.queryString[this.keyPage]
    } else {
      this.queryString[this.keyPage] = [(readablePageNmb).toString()]
    }

    let url: string = this.createUrlWithGetParameters(pageUrl, this.queryString)

    return html`
      <li key=${index} class=${classes} aria-current=${isActive ? "page" : undefined}>
        <a href=${url} class="page-link">
          ${pageNmb - Paginator.PAGE_NMB_TO_REAL_OFFSET}
        </a>
      </li>
    `
  }

  private createUrlWithGetParameters(baseUrl: string, queryString: Array<string>): string {
    let url = baseUrl

    let isFirst: boolean = true

    for (let key in queryString) {
      let value: string = queryString[key]

      if (isFirst) {
        isFirst = false
        url += "?" + key + "=" + value
      } else {
        url += "&" + key + "=" + value
      }
    }

    return url
  }
}

export const PaginatorList = ({ center, children, ...props }) => {
  return html`
    <ul
      ...${props}
      style=${{
        display: "flex",
        ...(center ? { justifyContent: "center" } : {}),
        ...(props.style || {}),
      }}
    >
      ${children}
    </ul>
  `
}