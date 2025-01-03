// Copyright (C) Konrad Gadzinowski

import { Option } from "../ui/Select"
import { CountriesList } from "./CountriesList"
import { Currency } from "./Currency"

export class SelectOptions {

  public static getCurrencies = (): Option[] => [
    {
      title: "Please select",
      value: "",
      disabled: true
    },
    ...Currency.getCurrencies().map((currency) => ({
      title: `${currency.name} (${currency.code})`,
      value: currency.code
    }))
  ]

  public static getCountries = (): Option[] => {
    const countries = CountriesList.getCountriesAsJson()
    const results: Option[] = [
      {
        title: "Please select, you can type it",
        value: "",
        disabled: true
      },
      ...countries.map((country) => ({
        title: country.countryName,
        value: country.countryCode
      }))
    ]
    return results
  }

  public static getEuCountries = (): Option[] => {
    const euCountries = CountriesList.getEuCountriesList()
    const countries = CountriesList.getCountriesAsJson()
    const results: Option[] = [
      {
        title: "Please select, you can type it",
        value: "",
        disabled: true
      },
      ...countries
        .filter((country) => euCountries.includes(country.countryCode))
        .map((country) => ({
          title: country.countryName,
          value: country.countryCode
        }))
    ]
    return results
  }

  private static getOptionsFromEnum = (options): Option[] => [
    ...Object.values(options).map((option: any) => ({
      title: option,
      value: option
    }))
  ]

  public static getFromEnum = (options): Option[] => [
    {
      title: "Please select",
      value: "",
      disabled: true
    },
    ...SelectOptions.getOptionsFromEnum(options)
  ]

  public static getFromEnumOptional = (options): Option[] => [
    {
      title: "All",
      value: "",
    },
    ...SelectOptions.getOptionsFromEnum(options)
  ]
}
