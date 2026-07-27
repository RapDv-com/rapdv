// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import url from "url"
import { Request } from "../server/Request"
import styled from "styled-components"

type Props = {
  req: Request
  center?: boolean
  itemsCount: number
  itemsPerPage?: number
  keyPage?: string
  hideIfSinglePage?: boolean
  className?: string
  removeParams?: string[]
  maxButtons?: number
}

export class Paginator extends React.Component<Props> {

  public static ITEMS_PER_PAGE = 20
  private static KEY_PAGE: string = "page"

  private static PAGE_NMB_TO_REAL_OFFSET: number = -1 // &page=1 -> Shows Page 1
  private static NEARBY_SIDES: number = 2
  private static WINDOW_FIT_ITERATIONS: number = 3

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

  render = (): ReactNode | string => {
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
    
    if (this.props.removeParams) {
      for (const param of this.props.removeParams) {
        delete this.queryString[param]
      }
    }

    return <PaginatorList className={`pagination${this.props.className ? ` ${this.props.className}` : ``}`} center={this.props.center}>
        {this.getHtmlElements()}
      </PaginatorList>
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

  public getHtmlElements(): Array<ReactNode> {
    let elements: Array<ReactNode> = []

    let firstPage: number = 0
    let totalPages: number = Math.max(this.totalPages, this.MIN_PAGES)

    const lastPageIndex: number = totalPages + Paginator.PAGE_NMB_TO_REAL_OFFSET

    // Show maximum few nearby pages links and fast forward / backward to maximum page
    let startPage: number
    let lastPage: number
    if (this.props.maxButtons !== undefined) {
      ({ startPage, lastPage } = this.getWindowForMaxButtons(this.props.maxButtons, lastPageIndex))
    } else {
      startPage = Math.max(this.currentPage - this.MAX_PAGES_NEARBY, firstPage)
      lastPage = Math.min(this.currentPage + this.MAX_PAGES_NEARBY, lastPageIndex)
    }

    let showFastFirst: boolean = startPage != firstPage
    let showFastLast: boolean = lastPage != lastPageIndex

    // Add first lisk
    if (showFastFirst) {
      // Check if we should add spacing
      let cssClass: string = ""
      let isNextToCorrectNumber: boolean = startPage == firstPage + this.AVOID_MARGIN_POSITION
      if (!isNextToCorrectNumber) {
        cssClass = " me-3"
      }

      let tag: ReactNode = this.getPageLink(elements.length, firstPage, cssClass, this.pageUrl)
      elements.push(tag)
    }

    // Add other links
    for (let i = startPage; i <= lastPage; i++) {
      let tag: ReactNode = this.getPageLink(elements.length, i, "", this.pageUrl)
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

      let tag: ReactNode = this.getPageLink(elements.length, totalPages + Paginator.PAGE_NMB_TO_REAL_OFFSET, cssClass, this.pageUrl)
      elements.push(tag)
    }

    return elements
  }

  private getWindowForMaxButtons = (maxButtons: number, lastPageIndex: number): { startPage: number, lastPage: number } => {
    const firstPage = 0
    let reserveFirst = false
    let reserveLast = false
    let startPage = firstPage
    let lastPage = lastPageIndex

    // The fast links consume button slots only when shown, and showing them depends on the
    // window itself, so refine the window until the flags settle.
    for (let iteration = 0; iteration < Paginator.WINDOW_FIT_ITERATIONS; iteration++) {
      const centerCount = Math.max(this.MIN_PAGES, maxButtons - (reserveFirst ? 1 : 0) - (reserveLast ? 1 : 0))
      const pagesBefore = Math.floor((centerCount - 1) / Paginator.NEARBY_SIDES)
      startPage = Math.max(this.currentPage - pagesBefore, firstPage)
      lastPage = Math.min(startPage + centerCount - 1, lastPageIndex)
      startPage = Math.max(lastPage - centerCount + 1, firstPage)
      reserveFirst = startPage > firstPage
      reserveLast = lastPage < lastPageIndex
    }

    return { startPage, lastPage }
  }

  private getPageLink(index: number, pageNmb: number, cssClasses: string, pageUrl: string): ReactNode {
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

    return (
      <li key={index} className={classes} aria-current={isActive ? "page" : undefined}>
        <a href={url} className="page-link">
          {pageNmb - Paginator.PAGE_NMB_TO_REAL_OFFSET}
        </a>
      </li>
    )
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

const PaginatorList = styled.ul<{ center: boolean }>`
  display: flex;
  ${({ center }) => center && `justify-content: center;`}
`
