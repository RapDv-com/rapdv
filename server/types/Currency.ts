// Copyright (C) Konrad Gadzinowski

import { Money } from "./Money";

export class Currency {

  public static USD = "USD"
  public static EUR = "EUR"
  public static AUD = "AUD"
  public static GBP = "GBP"
  public static NZD = "NZD"
  public static PLN = "PLN"
  public static CAD = "CAD"
  public static JPY = "JPY"
  public static BGN = "BGN"
  public static CZK = "CZK"
  public static DKK = "DKK"
  public static HUF = "HUF"
  public static RON = "RON"
  public static SEK = "SEK"
  public static CHF = "CHF"
  public static NOK = "NOK"
  public static TRY = "TRY"
  public static MXN = "MXN"
  public static THB = "THB"
  public static SGD = "SGD"
  public static AED = "AED"
  public static MYR = "MYR"

  public code: string
  public countryCode2Letters: string
  public symbol: string
  public name: string
  public isSymbolInFront: boolean

  public static getCurrencies = () => {
    const currencies = []
    currencies.push(new Currency(Currency.USD, "US", "$", "United States Dollar", true))
    currencies.push(new Currency(Currency.EUR, "EU", "€", "Euro", true))
    currencies.push(new Currency(Currency.AED, "AE", "د.إ", "United Arab Emirates Dirham", true))
    currencies.push(new Currency(Currency.AUD, "AU", "$", "Australian Dollar", true))
    currencies.push(new Currency(Currency.BGN, "BG", "лв", "Bulgarian Lev", false))
    currencies.push(new Currency(Currency.CAD, "CA", "$", "Canadian Dollar", true))
    currencies.push(new Currency(Currency.CHF, "CH", "CHF", "Swiss Franc", true))
    currencies.push(new Currency(Currency.CZK, "CZ", "Kč", "Czech Koruna", false))
    currencies.push(new Currency(Currency.DKK, "DK", "kr", "Danish Krone", false))
    currencies.push(new Currency(Currency.GBP, "GB", "£", "Pound Sterling", true))
    currencies.push(new Currency(Currency.HUF, "HU", "Ft", "Hungarian Forint", false))
    currencies.push(new Currency(Currency.JPY, "JP", "¥", "Japanese Yen", false))
    currencies.push(new Currency(Currency.MXN, "MX", "$", "Mexican Peso", true))
    currencies.push(new Currency(Currency.MYR, "MY", "RM", "Malaysian Ringgit", true))
    currencies.push(new Currency(Currency.NOK, "NO", "kr", "Norwegian Krone", false))
    currencies.push(new Currency(Currency.NZD, "NZ", "$", "New Zealand Dollar", true))
    currencies.push(new Currency(Currency.PLN, "PL", "zł", "Polish Złoty", false))
    currencies.push(new Currency(Currency.RON, "RO", "lei", "Romanian Leu", false))
    currencies.push(new Currency(Currency.SEK, "SE", "kr", "Swedish Krona", false))
    currencies.push(new Currency(Currency.SGD, "SG", "$", "Singapore Dollar", true))
    currencies.push(new Currency(Currency.THB, "TH", "฿", "Thai Baht", true))
    currencies.push(new Currency(Currency.TRY, "TR", "₺", "Turkish Lira", true))
    return currencies
  }

  constructor(code: string,
    countryCode2Letters: string,
    symbol: string,
    name: string,
    isSymbolInFront: boolean
  ) {
    this.code = code.toUpperCase()
    this.countryCode2Letters = countryCode2Letters
    this.symbol = symbol
    this.name = name
    this.isSymbolInFront = isSymbolInFront
  }

  public static addCommaAtThousands(price: any): string {
    if (!price) return null;
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  public static showPriceAsText(price: number, currencyCode: string, hideTrailingZeros?: boolean) {

    let priceText: string = "-";

    if (price === null || price === undefined) {
      return priceText;
    }

    price = Money.toReadable(price)
    priceText = parseFloat(price.toString()).toFixed(2);

    if (hideTrailingZeros) {
      priceText = parseFloat(priceText).toString();
    }

    priceText = Currency.addCommaAtThousands(priceText);

    if (!currencyCode) currencyCode = "USD";
    currencyCode = currencyCode.toUpperCase();

    let currencies: Array<Currency> = Currency.getCurrencies()
    for (let currency of currencies) {
      if (currency.code == currencyCode) {
        if (currency.isSymbolInFront) priceText = currency.symbol + priceText;
        else priceText = priceText + currency.symbol;
        break;
      }
    }

    return priceText;
  }

  public static showPriceAsShortText(price: number, currencyCode: string) {

    let priceText: string = "-";

    if (price === null || price === undefined) {
      return priceText;
    }

    price = Math.abs(price);

    price = Money.toReadable(price)

    if (price < 1000) {
      priceText = Math.round(price).toString();
    } else if(price < 1000000) {
      price = price / 1000;
      priceText = Math.round(price).toString() + "k";

    } else if(price < 1000000000) {
      price = price / 1000000;
      priceText = Math.round(price).toString() + "M";
    } else if(price < 1000000000000) {
      price = price / 1000000000;
      priceText = Math.round(price).toString() + "B";
    } else {
      priceText = "$$$";
    }

    if (!currencyCode) currencyCode = "USD";
    currencyCode = currencyCode.toUpperCase();

    let currencies: Array<Currency> = Currency.getCurrencies()
    for (let currency of currencies) {
      if (currency.code == currencyCode) {
        if (currency.isSymbolInFront) priceText = currency.symbol + priceText;
        else priceText = priceText + currency.symbol;
        break;
      }
    }

    return priceText;
  }

  public static findByCode = (code: string): Currency | undefined => Currency.getCurrencies().find((currency) => currency.code == code)
}
