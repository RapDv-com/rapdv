// Copyright (C) Konrad Gadzinowski

export class Money {

  public static toSafe(value: any): number {
    try {
      if (!value) return 0;
      if (Money.isString(value)) value = parseFloat(value as string);
      value = value * 100;
      value = Math.round(value);
    } catch (error) {
      return 0;
    }
    return value;
  }

  public static toReadable(safeValue: any, defaultValue: any = 0): number {
    try {
      if (!safeValue) return defaultValue;
      if (Money.isString(safeValue)) safeValue = parseFloat(safeValue as string);
      safeValue = safeValue / 100;
    } catch (error) {
      return defaultValue;
    }
    return safeValue;
  }

  private static isString (value) {
    return typeof value === 'string' || value instanceof String;
  }
}
