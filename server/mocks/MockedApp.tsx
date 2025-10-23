// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { Role } from "..//Role"
import { ReqType } from "..//ReqType"
import { Nav } from "..//ui/Nav"
import { Footer } from "..//ui/Footer"
import { Link } from "..//ui/Link"
import { Schema } from "mongoose"
import { Request } from "..//server/Request"
import { UserRole } from "..//database/CollectionUser"
import { NavLink } from "..//ui/NavLink"
import { FlashMessages } from "..//ui/FlashMessages"
import { NavDropdownItem } from "..//ui/NavDropdownItem"
import { NavDropdown } from "..//ui/NavDropdown"
import { RapDvApp } from "../RapDvApp"
import { Mailer } from "../mailer/Mailer"

export class MockedApp extends RapDvApp {
  getBasicInfo = () => ({
    name: "Test App",
    description: "It's a test app",
    themeColor: "#000000"
  })

  public initAuth: () => Promise<void> = async () => {
  }

  getPages = async () => {
    this.addRoute(
      "/",
      ReqType.Get,
      async () => <div>Main Page</div>,
      "RapDv Blog - Create apps quickly",
      "RapDv is a rapid development framework for quickly creating any web application."
    )
    this.addRoute("/terms", ReqType.Get, async () => <div>Terms and conditions</div>, "Terms and Conditions", "Our terms and conditions")
    this.addRoute("/privacy", ReqType.Get, async () => <div>Privacy policy</div>, "Privacy Policy", "Our privacy policy")
  }

  getLayout = async (
    req: Request,
    canonicalUrl: string,
    title: string,
    description: string,
    content: ReactNode | string,
    disableIndexing: boolean,
    clientFilesId: string,
    otherOptions?: any
  ): Promise<ReactNode> => {
    const year = new Date().getFullYear()
    const appInfo = this.getBasicInfo()
    return (
      <>
        <header>
          <Nav appName={appInfo.name}>
            <NavLink href="/log-in" icon="bi bi-box-arrow-in-left" req={req} restrictions={[Role.Guest]}>
              Log In
            </NavLink>
            <NavLink href="/publish" req={req} restrictions={[UserRole.Admin, "Writer"]}>
              Publish
            </NavLink>
            <NavLink href="/users" req={req} restrictions={[UserRole.Admin]}>
              Users
            </NavLink>
            <NavDropdown title={req?.user?.email} icon={await req?.user?.getPhotoSrc()} req={req} restrictions={[Role.LoggedIn]}>
              <NavDropdownItem href="/profile">Profile</NavDropdownItem>
              <NavDropdownItem href="/log-out">Log out</NavDropdownItem>
            </NavDropdown>
          </Nav>
        </header>
        <main>
          <FlashMessages req={req} />
          {content}
        </main>
        <Footer>
          Company Inc ©{year}
          <Link href="/terms">Terms and Conditions</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </Footer>
      </>
    )
  }

  getErrorView = async (error) => ({
    title: "Error | Test App",
    description: "Something went wrong",
    content: <div>{error?.message}</div>
  })

  getRoles = () => ["Writer"]

  getStorage = async () => {
    this.addCollection(
      "Post",
      {
        key: { type: String, unique: true },
        title: String,
        description: String,
        content: String,
        publishedDate: Date
      },
      [{}]
    )

    this.addCollection("Comment", {
      content: String,
      post: { type: Schema.Types.ObjectId, ref: "Post" },
      author: { type: Schema.Types.ObjectId, ref: "User" },
      publishedDate: Date
    })

    await this.addDbEvolution(1, "Initial database version", async (currentVersion: number) => {})
  }

  public startRecurringTasks = async (mailer: Mailer) => {
    // Nothing to start
  }

  public addDatabaseEvolutions = async () => {
    // Nothing to add
  }
}
