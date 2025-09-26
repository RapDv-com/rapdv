// Copyright (C) Konrad Gadzinowski

import url from "url"
import { html } from "../html/Html"

type Props = {
  req: Request
  center?: boolean
  itemsCount: number
  itemsPerPage?: number
  keyPage?: string
  hideIfSinglePage?: boolean
}

export const Paginator = ({
  req,
  center = false,
  itemsCount,
  itemsPerPage = Paginator.ITEMS_PER_PAGE,
  keyPage,
  hideIfSinglePage = false
}: Props) => {
  const KEY_PAGE = keyPage || "page"
  const ITEMS_PER_PAGE = 20
  const PAGE_NMB_TO_REAL_OFFSET = -1
  const MAX_PAGES_NEARBY = 3
  const MIN_PAGES = 1
  const AVOID_MARGIN_POSITION = 1

  const getPaginatorParams = (req, keyPage, count, itemsPerPage = ITEMS_PER_PAGE) => {
    if (isNaN(count)) count = 0
    const parsedUrl = url.parse(req.originalUrl, true)
    const basePageUrl = process.env.BASE_URL + parsedUrl.pathname
    const queryString: any = parsedUrl.query

    let totalPages = Math.ceil(count / itemsPerPage)
    let currentPage = parseInt(queryString[keyPage ?? "page"])
    if (isNaN(currentPage)) currentPage = 0
    currentPage += PAGE_NMB_TO_REAL_OFFSET
    currentPage = Math.min(currentPage, totalPages - 1)
    currentPage = Math.max(currentPage, 0)

    return { totalPages, currentPage, basePageUrl, queryString }
  }

  const { totalPages: tp, currentPage: cp, basePageUrl, queryString } =
    getPaginatorParams(req, KEY_PAGE, itemsCount, itemsPerPage)

  let totalPages = Math.max(tp, 1)
  let currentPage = Math.min(Math.max(cp, 0), totalPages - 1)

  if (totalPages <= 1 && hideIfSinglePage) {
    return null
  }

  const queryObj = { ...queryString }

  const createUrlWithGetParameters = (baseUrl, params) => {
    const keys = Object.keys(params)
    if (keys.length === 0) return baseUrl
    return (
      baseUrl +
      "?" +
      keys.map((k) => `${k}=${params[k]}`).join("&")
    )
  }

  const getPageLink = (index, pageNmb, cssClasses, pageUrl) => {
    let classes = "page-item" + cssClasses
    const readablePageNmb = pageNmb - PAGE_NMB_TO_REAL_OFFSET
    const isActive = pageNmb === currentPage
    if (isActive) classes += " active"

    // build query
    const params = { ...queryObj }
    if (pageNmb === 0) {
      delete params[KEY_PAGE]
    } else {
      params[KEY_PAGE] = readablePageNmb.toString()
    }

    const linkUrl = createUrlWithGetParameters(pageUrl, params)

    return html`
      <li key=${index} class=${classes} aria-current=${isActive ? "page" : undefined}>
        <a href=${linkUrl} class="page-link">${readablePageNmb}</a>
      </li>
    `
  }

  const getHtmlElements = () => {
    const elements = []
    const firstPage = 0
    const lastPage = totalPages + PAGE_NMB_TO_REAL_OFFSET
    const startPage = Math.max(currentPage - MAX_PAGES_NEARBY, firstPage)
    const endPage = Math.min(currentPage + MAX_PAGES_NEARBY, lastPage)

    const showFastFirst = startPage !== firstPage
    const showFastLast = endPage !== lastPage

    if (showFastFirst) {
      const isNextTo = startPage === firstPage + AVOID_MARGIN_POSITION
      elements.push(getPageLink(elements.length, firstPage, isNextTo ? "" : " me-3", basePageUrl))
    }

    for (let i = startPage; i <= endPage; i++) {
      elements.push(getPageLink(elements.length, i, "", basePageUrl))
    }

    if (showFastLast) {
      const isNextTo = endPage === totalPages - AVOID_MARGIN_POSITION + PAGE_NMB_TO_REAL_OFFSET
      elements.push(getPageLink(elements.length, lastPage, isNextTo ? "" : " ms-3", basePageUrl))
    }

    return elements
  }

  return html`
    <ul class="pagination" style=${center ? { display: "flex", justifyContent: "center" } : {}}>
      ${getHtmlElements()}
    </ul>
  `
}

Paginator.ITEMS_PER_PAGE = 20
