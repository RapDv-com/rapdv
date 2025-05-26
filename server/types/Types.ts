// Copyright (C) Konrad Gadzinowski

export class Types {
  public static isNumeric = (variable: any): boolean => {
    return !isNaN(parseFloat(variable)) && isFinite(variable);
  }

  public static isString = (variable: any): boolean => {
    if (!variable) return false
    return typeof variable === "string" || variable instanceof String
  }

  public static isBoolean = (variable: any): boolean => {
    if (variable === undefined || variable === null) return false
    return typeof variable === "boolean" || variable instanceof Boolean
  }

  public static isTextDefined = (text?: string | null):  boolean => {
    if (!text) return false
    if (text.trim().length === 0) return false
    return true
  }

  public static parseInt = (value: any, defaultVal: number): number => {
    let result = parseInt(value)
    if (isNaN(result)) return defaultVal
    return result
  }

  public static isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
}
