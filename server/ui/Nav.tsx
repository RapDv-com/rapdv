// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import styled from "styled-components"

type Props = {
  appName: string
  icon?: any
  children?: any
  showIcon?: boolean
  className?: string
  href?: string
  hideNav?: boolean
  customBrand?: ReactNode
}

export class Nav extends React.Component<Props> {
  render(): ReactNode | string {
    const { appName, children, showIcon, icon, className, href, hideNav, customBrand } = this.props
    return (
      <nav className={`navbar navbar-expand-lg ${className ?? "bg-light"}`}>
        <div className="container-fluid">
          {!customBrand && <NavbarBrand className="navbar-brand" href={href ?? "/"}>
            {showIcon && <AppIcon src={icon ?? "/client/assets/favicon.svg"} alt={`${appName} icon`} />}
            {appName}
          </NavbarBrand>}
          {!!customBrand && customBrand}
          {!hideNav && <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>}
          {!hideNav && <div className="collapse navbar-collapse" id="navbarSupportedContent">
            {children}
          </div>}
        </div>
      </nav>
    )
  }
}

const NavbarBrand = styled.a`
  padding: 0;
  display: flex;
  align-items: center;
`

const AppIcon = styled.img`
  height: 32px;
  margin-right: 10px;
`
