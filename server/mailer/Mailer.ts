// Copyright (C) Konrad Gadzinowski

import { Types } from "../types/Types"
import { CheckEmail, EmailExistance } from "./CheckEmail"
import nodemailer from "nodemailer"

export class Mailer {
  private static DEBUG = false
  private static SEND_EMAILS_IF_NOT_PROD = false

  name: string
  email: string
  login: string
  password: string
  host: string
  port: string
  isProd: boolean
  checkIfEmailExists: boolean
  onMailSentListener: (
    subject: string,
    toEmails: string[],
    ccEmails: string[],
    bccEmails: string[],
    fromEmail: string,
    replyTo: string,
    contentHtml: string
  ) => Promise<any>
  onMailSendErrorListener: (
    error: any,
    subject: string,
    toEmails: string[],
    ccEmails: string[],
    bccEmails: string[],
    fromEmail: string,
    replyTo: string,
    contentHtml: string
  ) => Promise<any>

  constructor(
    name: string,
    email: string,
    login: string,
    password: string,
    host: string,
    port: string,
    isProd: boolean,
    checkIfEmailExists: boolean = false
  ) {
    this.name = name
    this.email = email
    this.login = login
    this.password = password
    this.host = host
    this.port = port
    this.isProd = isProd
    this.checkIfEmailExists = checkIfEmailExists
  }

  public setOnMailSentListener(
    onMailSentListener: (
      subject: string,
      toEmails: string[],
      ccEmails: string[],
      bccEmails: string[],
      fromEmail: string,
      replyTo: string,
      contentHtml: string
    ) => Promise<any>
  ) {
    this.onMailSentListener = onMailSentListener
  }

  public setOnMailSendErrorListener(
    onMailSendErrorListener: (
      error: any,
      subject: string,
      toEmails: string[],
      ccEmails: string[],
      bccEmails: string[],
      fromEmail: string,
      replyTo: string,
      contentHtml: string
    ) => Promise<any>
  ) {
    this.onMailSendErrorListener = onMailSendErrorListener
  }

  public async getExistingEmailAddresses(emails: string[]): Promise<string[]> {
    let existingEmails = []

    for (let email of emails) {
      let isValid = await this.doesEmailExist(email)
      if (isValid) {
        existingEmails.push(email)
      }
    }

    return existingEmails
  }

  public async sendMail(
    subject: string,
    toEmails: string[],
    ccEmails: string[],
    bccEmails: string[],
    fromEmail: string,
    replyTo: string,
    contentHtml: string,
    attachments: any[]
  ): Promise<string | undefined> {
    let self = this

    if (toEmails.length == 0 && ccEmails.length == 0 && bccEmails.length == 0) {
      throw "You need to specify recipient email addresses."
    }

    let existingToEmails: string[] = await this.getExistingEmailAddresses(toEmails)
    let existingCcEmails: string[] = await this.getExistingEmailAddresses(ccEmails)
    let existingBccEmails: string[] = await this.getExistingEmailAddresses(bccEmails)

    if (existingToEmails.length + existingCcEmails.length + existingBccEmails.length == 0) {
      if (toEmails.length + ccEmails.length + bccEmails.length == 1) {
        throw "Specified email address is not valid."
      } else {
        throw "None of the specified email addresses are valid."
      }
    }

    toEmails = existingToEmails
    ccEmails = existingCcEmails
    bccEmails = existingBccEmails

    let toEmailsText = self.formatToEmails(toEmails)
    let ccEmailsText = self.formatToEmails(ccEmails)
    let bccEmailsText = self.formatToEmails(bccEmails)

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      pool: true,
      host: self.host,
      port: self.port,
      secure: process.env.SEND_FROM_SECURE === "false" ? false : true,
      auth: {
        user: self.login,
        pass: self.password
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
      }
    })

    // Attach all files
    let attachmentsEmail = []

    for (let attachmentName in attachments) {
      let attachmentValue = attachments[attachmentName]

      attachmentsEmail.push({
        // utf-8 string as an attachment
        filename: attachmentName,
        path: attachmentValue
      })
    }

    // Setup email data with unicode symbols
    let mailOptions: any = {
      from: fromEmail,
      to: toEmailsText,
      cc: ccEmailsText,
      bcc: bccEmailsText,
      subject: subject,
      html: contentHtml,
      attachments: attachmentsEmail
    }

    if (Types.isTextDefined(replyTo)) {
      mailOptions.replyTo = replyTo
    }

    if (Mailer.DEBUG) {
      console.info("Sent message to: " + toEmailsText + ". Subject: " + subject + ". Content: " + contentHtml)
    }

    if (!!self.onMailSentListener) {
      await self.onMailSentListener(subject, toEmails, ccEmails, bccEmails, fromEmail, replyTo, contentHtml)
    }

    // send mail with defined transport object
    if (this.isProd || Mailer.SEND_EMAILS_IF_NOT_PROD) {
      try {
        const info = await transporter.sendMail(mailOptions)
        return info
      } catch (error) {
        console.error("Can't send email. " + error)
        
        if (!!self.onMailSendErrorListener) {
          await self.onMailSendErrorListener(error, subject, toEmails, ccEmails, bccEmails, fromEmail, replyTo, contentHtml)
        }
        
        throw "Can't send email. " + error.message
      }
    } else {
      console.info("-- Didn't really send email since we are not in production --")
      console.info("From: " + fromEmail)
      console.info("To: " + toEmailsText)
      console.info("Cc: " + ccEmailsText)
      console.info("Bcc: " + bccEmailsText)
      console.info("Reply To: " + replyTo)
      console.info("Subject: " + subject)
      console.info("Content: " + contentHtml)
    }
  }

  public sendMailAsSupport(
    subject: string,
    toEmails: string[],
    ccEmails: string[],
    bccEmails: string[],
    replyTo: string,
    contentHtml: string,
    attachments: any[]
  ): Promise<string | undefined> {
    let fromEmail = '"' + this.name + '" <' + this.email + ">"

    let replyToEmail = replyTo
    if (!Types.isTextDefined(replyTo)) {
      replyToEmail = process.env.SEND_REPLY_TO ?? null
    }

    return this.sendMail(subject, toEmails, ccEmails, bccEmails, fromEmail, replyToEmail, contentHtml, attachments)
  }

  public async doesEmailExist(email: string): Promise<boolean> {
    if (!email || email.trim().length === 0) return false
    let self = this
    let excludedPhrases = [
      "example.com",
      "example.org",
      "example.net",
      "example.pl",
      "example.com.pl",
      "example.co.uk",
      "example.com.au",
      "@test.com",
      "@test.co.uk",
      "@test.com.au",
      "@test.net",
      "@test.pl"
    ]
    for (let excludedPhrase of excludedPhrases) {
      if (email.indexOf(excludedPhrase) > 0) return false
    }

    if (!self.checkIfEmailExists) return true

    try {
      const emailExistance = await CheckEmail.doesEmailExist(email)
      return emailExistance === EmailExistance.Exists || emailExistance === EmailExistance.NotSure
    } catch (error) {
      console.error("Couldn't check email existance: " + email)
      return false
    }
  }

  formatToEmails(toEmails: string[]): string {
    let toEmailsText = ""
    for (let i = 0; i < toEmails.length; i++) {
      let email = toEmails[i]
      if (i == 0) {
        toEmailsText = email
      } else {
        toEmailsText += ", " + email
      }
    }

    return toEmailsText
  }
}
