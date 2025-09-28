// Copyright (C) Konrad Gadzinowski

import { TextUtils } from "../text/TextUtils"
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

  public static getCountries = (supporedCountryCodes?: string[]): Option[] => {


    const countryOptions = []
    const allCountries = CountriesList.getCountriesAsJson()

    for (const country of allCountries) {
      if (supporedCountryCodes && supporedCountryCodes.length > 0 && !supporedCountryCodes.includes(country.countryCode)) {
        continue
      }
      countryOptions.push({
        title: country.countryName,
        value: country.countryCode
      })
    }

    const results: Option[] = [
      {
        title: "Please select, you can type it",
        value: "",
        disabled: true
      },
      ...countryOptions
    ]
    return results
  }

  public static getUsaStates = (): Option[] => {
    const states = CountriesList.getUsaStatesAsJson()
    const results: Option[] = [
      {
        title: "Please select, you can type it",
        value: "",
        disabled: true
      },
      ...states.map((state) => ({
        title: state.name,
        value: state.code
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
      title: TextUtils.toTitleCase(option, true),
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
