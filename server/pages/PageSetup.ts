// Copyright (C) Konrad Gadzinowski

import { NextFunction, Response } from "express"
import { CollectionSystem } from "../database/CollectionSystem"
import { CollectionUser, UserRole, UserStatus } from "../database/CollectionUser"
import { Form } from "../form/Form"
import { FlashType, Request } from "../server/Request"
import { html } from "../html/Html"
import { SubmitForm } from "../ui/SubmitForm"
import { Input } from "../ui/Input"
import { VNode } from "preact"

export class PageSetup {
  public static render = async (req: Request, res: Response): Promise<VNode> => {
    return html`
    <div>
      <${SubmitForm} title="Create Admin account" submitText="Create Account">
        <${Input} type="email" name="email" req=${req} required />
      <//>
    </div>
  `
  }

  public static finishSetup = async (req: Request, res: Response, next: NextFunction): Promise<VNode> => {
    const { success, form } = await Form.getParams(req, PageSetup.render(req, res))

    if (!success) {
      return PageSetup.render(req, res)
    }

    try {
      const email = form.inputs["email"]?.value
      await CollectionUser.createUserForAuthEmailCodes(email, true, "", "", UserRole.Admin, UserStatus.Live, "")

      const system = await CollectionSystem.get()
      system.isSetupFinished = true
      await system.save()
    } catch (error) {
      req.flash(FlashType.Errors, error)
      return PageSetup.render(req, res)
    }

    req.flash(FlashType.Success, "Setup is finished. Have fun with your app!")
    res.redirect("/")
  }
}
