// Copyright (C) Konrad Gadzinowski

import { FlashType, Request } from "../server/Request"
import { check } from "express-validator"
import { TextUtils } from "../text/TextUtils"
import { ContextRunner, ValidationChain } from "express-validator/src/chain"
import { HydratedDocument } from "mongoose"
import { Collection } from "../database/Collection"
import { Network } from "../network/Network"
import spacetime from "spacetime"

const DEBUG = false

type InputData = { name: string; value: string; errors: string[] }
type FileData = { name: string; value: any; errors: string[] }
export type FormData = { name?: string; inputs: InputData[]; files: FileData[] }
export type FormParams = { success: boolean; form: FormData }

export enum ValidationType {
  TypeEmail,
  TypeNumber,
  TypeUrl,
  Required,
  MaxLength,
  MinLength,
  EqualTo,
  Exactly,
  Pattern,
  Min,
  Max,
  Step
}

export type ValidationRule = {
  type: ValidationType
  value?: any
}

export type InputRules = {
  name: string,
  rules: ValidationRule[]
}

export class Form {

  public static getParamsList = async (req: Request, inputs: InputRules[]) => {
    let errors: string[] = []
    const params = []

    for (const input of inputs) {
      let elementErrors = await Form.checkInput(req, input.name, input.rules)
      errors = [...errors, ...elementErrors]
      params[input.name] = Network.getParamFromRequest(req, input.name)
    }

    return {
      success: errors.length === 0,
      errors,
      params
    }
  }

  public static getParams = async (req: Request, elementsPromise: Promise<any>, formName?: string): Promise<FormParams> => {
    const elements: any = await elementsPromise
    let errors: string[] = []

    const analyzeChildren = async (element: any, initForm: FormData | null = null): Promise<FormData | null> => {
      if (!element || !element.props || !element.props.children) return initForm

      let children = element.props.children
      if (!Array.isArray(children)) children = [children]
      let form = initForm

      for (const child of children) {
        try {
          const baseType = child?.type?.target ?? child?.type
          const name = child?.props?.name
          const type = baseType?.name ?? baseType
          const subType = child?.props?.type

          const isDisabled = !!child?.props?.disabled && child?.props?.disabled !== "false" && child?.props?.disabled !== "no"
          if (isDisabled) {
            continue
          }

          const isFormDefined = !!form
          const isElementForm = ["SubmitForm", "form"].includes(type)
          const isInput =  ["input", "Input", "select", "Select", "SelectInput", "textarea", "Textarea", "DatePicker", "checkbox", "Dropzone"].includes(type)
          const isFile = subType === "file" || type === "UploadImg"

          if (isElementForm) {
            if (isFormDefined) continue

            if (!formName || (!!formName && formName === name)) {
              const newForm = {
                name,
                inputs: [],
                files: []
              }
              form = newForm
              form = await analyzeChildren(child, newForm)
            }
          } else if (isFile) {
            const rules: ValidationRule[] = []
            if (child?.props?.required) rules.push({ type: ValidationType.Required })
            const elementErrors = await Form.checkFile(req, name, rules)

            form.files[name] = {
              name,
              value: req.files?.find((entry) => entry.fieldname === name),
              errors: elementErrors
            }

            if (type === "UploadImg") {
              // Special upload element
              const deletePropName = "delete" + name
              form.inputs[deletePropName] = {
                name,
                value: req.body[deletePropName],
                errors: []
              }
            }

          } else if (isFormDefined && isInput) {
            const rules: ValidationRule[] = []
            if (child?.props?.required) rules.push({ type: ValidationType.Required })

            const isEmail = child?.props?.type === "email"
            const isText = child?.props?.type === "text" ||  ["textarea", "Textarea"].includes(type)
            const isPassword = child?.props?.type === "password"
            const isNumber = child?.props?.type === "number"
            const isUrl = child?.props?.type === "url"
            const isReadOnly = child?.props?.readOnly || child?.props?.disabled
            if (isReadOnly) continue

            if (isEmail) {
              rules.push({ type: ValidationType.TypeEmail })
            }
            if (isText || isPassword || isEmail || isUrl) {
              if (child?.props?.maxLength !== undefined) {
                rules.push({ type: ValidationType.MaxLength, value: Number(child?.props?.maxLength) })
              }
              if (child?.props?.minLength !== undefined) {
                rules.push({ type: ValidationType.MinLength, value: Number(child?.props?.minLength) })
              }
              if (child?.props?.pattern !== undefined) {
                rules.push({ type: ValidationType.Pattern, value: child?.props?.pattern.toString() })
              }
              if (child?.props["data-equal-to"] !== undefined) {
                rules.push({ type: ValidationType.EqualTo, value: child?.props["data-equal-to"] })
              }
              if (child?.props["data-exactly"] !== undefined) {
                rules.push({ type: ValidationType.Exactly, value: child?.props["data-exactly"] })
              }
            }
            if (isNumber) {
              rules.push({ type: ValidationType.TypeNumber })
              if (child?.props?.max !== undefined) {
                rules.push({ type: ValidationType.Max, value: Number(child?.props?.max) })
              }
              if (child?.props?.min !== undefined) {
                rules.push({ type: ValidationType.Min, value: Number(child?.props?.min) })
              }
              if (child?.props?.step !== undefined) {
                rules.push({ type: ValidationType.Step, value: Number(child?.props?.step) })
              }
            }
            if (isUrl) {
              rules.push({ type: ValidationType.TypeUrl })
            }

            let elementErrors = await Form.checkInput(req, name, rules)
            errors = [...errors, ...elementErrors]

            if (DEBUG) console.info("Analyzing input: " + name, child)

            form.inputs[name] = {
              name,
              value: req.body[name],
              errors: elementErrors
            }

          } else {
            form = await analyzeChildren(child, form)
          }
        } catch (error) {
          console.error(error)
        }
      }

      return form
    }
    const form = await analyzeChildren(elements)

    if (errors.length > 0) {
      req.flash(FlashType.Errors, errors)
    }

    return {
      success: errors.length === 0 && !req.error,
      form
    }
  }

  public static editEntry = async (
    urlParameter: string,
    collectionName: string,
    queryData: any,
    populate?: string[]
  ): Promise<{ isNew: boolean; entry: HydratedDocument<any> | undefined }> => {
    const isNew = !urlParameter
    let entry: any
    if (isNew) {
      const collection = Collection.get(collectionName)
      entry = new collection.model()
    } else {
      entry = await Collection.findEntry(collectionName, queryData, populate)
    }

    return { isNew, entry }
  }

  public static getOptionalDateFromForm = (form: FormData, paramName: string) => {
      const dateText = form.inputs[paramName]?.value
      if (!!dateText && dateText.trim().length > 0) {
        const date = spacetime(form.inputs[paramName]?.value).toNativeDate()
        return date
      }

      return null
  }

  private static checkInput = async (req: Request, name: string, rules: ValidationRule[]): Promise<string[]> => {
    let errors: string[] = []

    const isRequired = rules.some((rule) => rule.type === ValidationType.Required)
    const isValueDefined = req.body[name] != null && req.body[name].toString().length > 0
    const checkFormat = isRequired || isValueDefined

    for (const rule of rules) {
      let ruleErrors: string[] = []
      const { type, value } = rule
      if (type === ValidationType.Required) {
        ruleErrors = await Form.checkRule(req, name, "is required.", (context: ValidationChain) => context.notEmpty())
      } else if (type === ValidationType.TypeEmail && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, "needs to be a valid email.", (context: ValidationChain) => context.isEmail())
      } else if (type === ValidationType.TypeNumber && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, "needs to be a valid number.", (context: ValidationChain) => context.isNumeric())
      } else if (type === ValidationType.TypeUrl && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, "needs to be a valid URL.", (context: ValidationChain) => context.isURL())
      } else if (type === ValidationType.MinLength && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, `needs to be at least ${value} characters long.`, (context: ValidationChain) =>
          context.isLength({ min: value })
        )
      } else if (type === ValidationType.MaxLength && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, `needs to be at most ${value} characters long.`, (context: ValidationChain) =>
          context.isLength({ max: value })
        )
      } else if (type === ValidationType.Min && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, `needs to be at least ${value}.`, (context: ValidationChain) => context.isFloat({ min: value }))
      } else if (type === ValidationType.Max && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, `needs to be at most ${value}.`, (context: ValidationChain) => context.isFloat({ max: value }))
      } else if (type === ValidationType.Step && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, `needs to be divisible by ${value}.`, (context: ValidationChain) =>
          context.custom((inputValue) => {
            const MULTIPLIER = 10000
            const inputSafe = Math.round(inputValue * MULTIPLIER)
            const valueSafe = Math.round(value * MULTIPLIER)
            if (inputSafe !== undefined && Number(inputSafe) % valueSafe !== 0) throw "Value is invalid"
            return true
          })
        )
      } else if (type === ValidationType.Pattern && checkFormat) {
        ruleErrors = await Form.checkRule(req, name, `needs to match formula: ${value}.`, (context: ValidationChain) => context.matches(value))
      } else if (type === ValidationType.EqualTo) {
        ruleErrors = await Form.checkRule(
          req,
          name,
          `needs to have the same value as: '${TextUtils.toTitleCase(value)}'.`,
          (context: ValidationChain) =>
            context.custom((inputValue) => {
              const otherValue = req.body[value]
              const prepareValue = (text) => text.toString().trim()
              if (prepareValue(otherValue) !== prepareValue(inputValue)) throw "Values are different"
              return true
            })
        )
      } else if (type === ValidationType.Exactly) {
        ruleErrors = await Form.checkRule(
          req,
          name,
          `needs to have this exact value: '${value}'.`,
          (context: ValidationChain) =>
            context.custom((inputValue) => {
              if (inputValue !== value) throw `Value is not exactly ${value}`
              return true
            })
        )
      }

      errors = [...errors, ...ruleErrors]
    }

    return errors
  }

  private static checkFile = async (req: Request, name: string, rules: ValidationRule[]): Promise<string[]> => {
    let errors: string[] = []

    for (const rule of rules) {
      const { type, value } = rule

      let ruleErrors: string[] = []

      if (type === ValidationType.Required) {
        const file = req.files?.find((entry) => entry.fieldname === name)
        if (!file) ruleErrors.push(`'${TextUtils.toTitleCase(name, true)}' is required.`)
      }

      errors = [...errors, ...ruleErrors]
    }

    return errors
  }

  private static checkRule = async (
    req: Request,
    name: string,
    message: string,
    addRules: (context: ValidationChain) => ContextRunner
  ): Promise<string[]> => {
    const errors = []
    const inputCheck = check(name)
    const chains = addRules(inputCheck)
    const checkResult: any = await chains.run(req)
    if (checkResult.errors.length > 0) errors.push(`'${TextUtils.toTitleCase(name, true)}' ${message}`)
    return errors
  }
}
