// Copyright (C) Konrad Gadzinowski

export class CountriesList {
  public static getContinentReadibleName(continent: string): string {
    if (continent == "EU") return "Europe";
    if (continent == "AF") return "Africa";
    if (continent == "AF") return "Africa";
    if (continent == "AS") return "Asia";
    if (continent == "NA") return "North America";
    if (continent == "SA") return "South America";
    if (continent == "OC") return "Oceania";
    if (continent == "AN") return "Antarctica";

    return "";
  }

  public static getEuCountriesList(): Array<string> {
    return [
      // EU countries
      "AT",
      "BE",
      "BG",
      "CH", // Switzerland - EFTA Member
      "CY",
      "CZ",
      "DE",
      "DK",
      "EE",
      "ES",
      "FI",
      "FR",
      "GR",
      "HR",
      "HU",
      "IE",
      "IS", // Iceland - EFTA Member
      "IT",
      "LI", // Liechtenstein - EFTA Member
      "LT",
      "LU",
      "LV",
      "MT",
      "NO", // Norway - EFTA Member
      "NL",
      "PL",
      "PT",
      "RO",
      "SE",
      "SI",
      "SK",
      // Special territories below
      "MC",
      "IM"
    ];
  }

  public static getForbiddenCountriesList(): Array<string> {
    return ["BY", "CN", "CU", "IR", "KP", "RU", "SD", "SY", "CI", "MM", "SS"];
  }

  public static isForbiddenCountry(countryCode: string): boolean {
    let forbiddenCountries = CountriesList.getForbiddenCountriesList();
    return forbiddenCountries.indexOf(countryCode) >= 0;
  }

  public static isEuCountry(countryCode: string): boolean {
    let euCountries = CountriesList.getEuCountriesList();
    return euCountries.indexOf(countryCode) >= 0;
  }

  public static getCountryNameFromCode(countryCode: string): string {
    if (!countryCode || countryCode == "") return "";

    let countries = CountriesList.getCountriesAsJson();

    for (let countryInList of countries) {
      if (countryInList.countryCode == countryCode) {
        return countryInList.countryName;
      }
    }

    return countryCode;
  }

  public static getStateNameFromCode = (countryCode: string, stateCode: string) => {
    if (!countryCode || countryCode == "") return "";
    if (!stateCode || stateCode == "") return "";

    if (countryCode === "US") {

      // United States
      const usaStates = CountriesList.getUsaStatesAsJson();
      for (let state of usaStates) {
        if (state.code == stateCode) {
          return state.name;
        }
      }
    }

    return "";
  }

  public static formatTimeZoneNameToReadable(name: string): string {
    if (name == null) return "";

    let result = name;

    let nameSplit = name.split("/");
    if (nameSplit.length > 1) {
      let continent = nameSplit[0];

      result = "";

      for (let i = 1; i < nameSplit.length; i++) {
        if (i > 1) result += ", ";
        result += nameSplit[i];
      }

      if (continent.length > 0) {
        result += " (" + continent + ")";
      }
    }

    result = result.replace("_", " ");

    return result;
  }

  public static getCountriesAsJson() {
    return [
      {
        countryCode: "US",
        countryName: "United States",
        currencyCode: "USD",
        continent: "NA"
      },
      {
        countryCode: "GB",
        countryName: "United Kingdom",
        currencyCode: "GBP",
        continent: "EU"
      },
      {
        countryCode: "AU",
        countryName: "Australia",
        currencyCode: "AUD",
        continent: "OC"
      },
      {
        countryCode: "DE",
        countryName: "Germany",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "CH",
        countryName: "Switzerland",
        currencyCode: "CHF",
        continent: "EU"
      },
      {
        countryCode: "AD",
        countryName: "Andorra",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "AE",
        countryName: "United Arab Emirates",
        currencyCode: "AED",
        continent: "AS"
      },
      {
        countryCode: "AF",
        countryName: "Afghanistan",
        currencyCode: "AFN",
        continent: "AS"
      },
      {
        countryCode: "AG",
        countryName: "Antigua and Barbuda",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "AI",
        countryName: "Anguilla",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "AL",
        countryName: "Albania",
        currencyCode: "ALL",
        continent: "EU"
      },
      {
        countryCode: "AM",
        countryName: "Armenia",
        currencyCode: "AMD",
        continent: "AS"
      },
      {
        countryCode: "AO",
        countryName: "Angola",
        currencyCode: "AOA",
        continent: "AF"
      },
      {
        countryCode: "AQ",
        countryName: "Antarctica",
        currencyCode: "",
        continent: "AN"
      },
      {
        countryCode: "AR",
        countryName: "Argentina",
        currencyCode: "ARS",
        continent: "SA"
      },
      {
        countryCode: "AS",
        countryName: "American Samoa",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "AT",
        countryName: "Austria",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "AW",
        countryName: "Aruba",
        currencyCode: "AWG",
        continent: "NA"
      },
      {
        countryCode: "AX",
        countryName: "Åland",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "AZ",
        countryName: "Azerbaijan",
        currencyCode: "AZN",
        continent: "AS"
      },
      {
        countryCode: "BA",
        countryName: "Bosnia and Herzegovina",
        currencyCode: "BAM",
        continent: "EU"
      },
      {
        countryCode: "BB",
        countryName: "Barbados",
        currencyCode: "BBD",
        continent: "NA"
      },
      {
        countryCode: "BD",
        countryName: "Bangladesh",
        currencyCode: "BDT",
        continent: "AS"
      },
      {
        countryCode: "BE",
        countryName: "Belgium",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "BF",
        countryName: "Burkina Faso",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "BG",
        countryName: "Bulgaria",
        currencyCode: "BGN",
        continent: "EU"
      },
      {
        countryCode: "BH",
        countryName: "Bahrain",
        currencyCode: "BHD",
        continent: "AS"
      },
      {
        countryCode: "BI",
        countryName: "Burundi",
        currencyCode: "BIF",
        continent: "AF"
      },
      {
        countryCode: "BJ",
        countryName: "Benin",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "BL",
        countryName: "Saint Barthélemy",
        currencyCode: "EUR",
        continent: "NA"
      },
      {
        countryCode: "BM",
        countryName: "Bermuda",
        currencyCode: "BMD",
        continent: "NA"
      },
      {
        countryCode: "BN",
        countryName: "Brunei",
        currencyCode: "BND",
        continent: "AS"
      },
      {
        countryCode: "BO",
        countryName: "Bolivia",
        currencyCode: "BOB",
        continent: "SA"
      },
      {
        countryCode: "BQ",
        countryName: "Bonaire",
        currencyCode: "USD",
        continent: "NA"
      },
      {
        countryCode: "BR",
        countryName: "Brazil",
        currencyCode: "BRL",
        continent: "SA"
      },
      {
        countryCode: "BS",
        countryName: "Bahamas",
        currencyCode: "BSD",
        continent: "NA"
      },
      {
        countryCode: "BT",
        countryName: "Bhutan",
        currencyCode: "BTN",
        continent: "AS"
      },
      {
        countryCode: "BV",
        countryName: "Bouvet Island",
        currencyCode: "NOK",
        continent: "AN"
      },
      {
        countryCode: "BW",
        countryName: "Botswana",
        currencyCode: "BWP",
        continent: "AF"
      },
      {
        countryCode: "BY",
        countryName: "Belarus",
        currencyCode: "BYN",
        continent: "EU"
      },
      {
        countryCode: "BZ",
        countryName: "Belize",
        currencyCode: "BZD",
        continent: "NA"
      },
      {
        countryCode: "CA",
        countryName: "Canada",
        currencyCode: "CAD",
        continent: "NA"
      },
      {
        countryCode: "CC",
        countryName: "Cocos [Keeling] Islands",
        currencyCode: "AUD",
        continent: "AS"
      },
      {
        countryCode: "CD",
        countryName: "Democratic Republic of the Congo",
        currencyCode: "CDF",
        continent: "AF"
      },
      {
        countryCode: "CF",
        countryName: "Central African Republic",
        currencyCode: "XAF",
        continent: "AF"
      },
      {
        countryCode: "CG",
        countryName: "Republic of the Congo",
        currencyCode: "XAF",
        continent: "AF"
      },
      {
        countryCode: "CI",
        countryName: "Ivory Coast",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "CK",
        countryName: "Cook Islands",
        currencyCode: "NZD",
        continent: "OC"
      },
      {
        countryCode: "CL",
        countryName: "Chile",
        currencyCode: "CLP",
        continent: "SA"
      },
      {
        countryCode: "CM",
        countryName: "Cameroon",
        currencyCode: "XAF",
        continent: "AF"
      },
      {
        countryCode: "CN",
        countryName: "China",
        currencyCode: "CNY",
        continent: "AS"
      },
      {
        countryCode: "CO",
        countryName: "Colombia",
        currencyCode: "COP",
        continent: "SA"
      },
      {
        countryCode: "CR",
        countryName: "Costa Rica",
        currencyCode: "CRC",
        continent: "NA"
      },
      {
        countryCode: "CU",
        countryName: "Cuba",
        currencyCode: "CUP",
        continent: "NA"
      },
      {
        countryCode: "CV",
        countryName: "Cape Verde",
        currencyCode: "CVE",
        continent: "AF"
      },
      {
        countryCode: "CW",
        countryName: "Curacao",
        currencyCode: "ANG",
        continent: "NA"
      },
      {
        countryCode: "CX",
        countryName: "Christmas Island",
        currencyCode: "AUD",
        continent: "OC"
      },
      {
        countryCode: "CY",
        countryName: "Cyprus",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "CZ",
        countryName: "Czechia",
        currencyCode: "CZK",
        continent: "EU"
      },
      {
        countryCode: "DJ",
        countryName: "Djibouti",
        currencyCode: "DJF",
        continent: "AF"
      },
      {
        countryCode: "DK",
        countryName: "Denmark",
        currencyCode: "DKK",
        continent: "EU"
      },
      {
        countryCode: "DM",
        countryName: "Dominica",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "DO",
        countryName: "Dominican Republic",
        currencyCode: "DOP",
        continent: "NA"
      },
      {
        countryCode: "DZ",
        countryName: "Algeria",
        currencyCode: "DZD",
        continent: "AF"
      },
      {
        countryCode: "EC",
        countryName: "Ecuador",
        currencyCode: "USD",
        continent: "SA"
      },
      {
        countryCode: "EE",
        countryName: "Estonia",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "EG",
        countryName: "Egypt",
        currencyCode: "EGP",
        continent: "AF"
      },
      {
        countryCode: "EH",
        countryName: "Western Sahara",
        currencyCode: "MAD",
        continent: "AF"
      },
      {
        countryCode: "ER",
        countryName: "Eritrea",
        currencyCode: "ERN",
        continent: "AF"
      },
      {
        countryCode: "ES",
        countryName: "Spain",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "ET",
        countryName: "Ethiopia",
        currencyCode: "ETB",
        continent: "AF"
      },
      {
        countryCode: "FI",
        countryName: "Finland",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "FJ",
        countryName: "Fiji",
        currencyCode: "FJD",
        continent: "OC"
      },
      {
        countryCode: "FK",
        countryName: "Falkland Islands",
        currencyCode: "FKP",
        continent: "SA"
      },
      {
        countryCode: "FM",
        countryName: "Micronesia",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "FO",
        countryName: "Faroe Islands",
        currencyCode: "DKK",
        continent: "EU"
      },
      {
        countryCode: "FR",
        countryName: "France",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "GA",
        countryName: "Gabon",
        currencyCode: "XAF",
        continent: "AF"
      },
      {
        countryCode: "GD",
        countryName: "Grenada",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "GE",
        countryName: "Georgia",
        currencyCode: "GEL",
        continent: "AS"
      },
      {
        countryCode: "GF",
        countryName: "French Guiana",
        currencyCode: "EUR",
        continent: "SA"
      },
      {
        countryCode: "GG",
        countryName: "Guernsey",
        currencyCode: "GBP",
        continent: "EU"
      },
      {
        countryCode: "GH",
        countryName: "Ghana",
        currencyCode: "GHS",
        continent: "AF"
      },
      {
        countryCode: "GI",
        countryName: "Gibraltar",
        currencyCode: "GIP",
        continent: "EU"
      },
      {
        countryCode: "GL",
        countryName: "Greenland",
        currencyCode: "DKK",
        continent: "NA"
      },
      {
        countryCode: "GM",
        countryName: "Gambia",
        currencyCode: "GMD",
        continent: "AF"
      },
      {
        countryCode: "GN",
        countryName: "Guinea",
        currencyCode: "GNF",
        continent: "AF"
      },
      {
        countryCode: "GP",
        countryName: "Guadeloupe",
        currencyCode: "EUR",
        continent: "NA"
      },
      {
        countryCode: "GQ",
        countryName: "Equatorial Guinea",
        currencyCode: "XAF",
        continent: "AF"
      },
      {
        countryCode: "GR",
        countryName: "Greece",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "GS",
        countryName: "South Georgia and the South Sandwich Islands",
        currencyCode: "GBP",
        continent: "AN"
      },
      {
        countryCode: "GT",
        countryName: "Guatemala",
        currencyCode: "GTQ",
        continent: "NA"
      },
      {
        countryCode: "GU",
        countryName: "Guam",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "GW",
        countryName: "Guinea-Bissau",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "GY",
        countryName: "Guyana",
        currencyCode: "GYD",
        continent: "SA"
      },
      {
        countryCode: "HK",
        countryName: "Hong Kong",
        currencyCode: "HKD",
        continent: "AS"
      },
      {
        countryCode: "HM",
        countryName: "Heard Island and McDonald Islands",
        currencyCode: "AUD",
        continent: "AN"
      },
      {
        countryCode: "HN",
        countryName: "Honduras",
        currencyCode: "HNL",
        continent: "NA"
      },
      {
        countryCode: "HR",
        countryName: "Croatia",
        currencyCode: "HRK",
        continent: "EU"
      },
      {
        countryCode: "HT",
        countryName: "Haiti",
        currencyCode: "HTG",
        continent: "NA"
      },
      {
        countryCode: "HU",
        countryName: "Hungary",
        currencyCode: "HUF",
        continent: "EU"
      },
      {
        countryCode: "ID",
        countryName: "Indonesia",
        currencyCode: "IDR",
        continent: "AS"
      },
      {
        countryCode: "IE",
        countryName: "Ireland",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "IL",
        countryName: "Israel",
        currencyCode: "ILS",
        continent: "AS"
      },
      {
        countryCode: "IM",
        countryName: "Isle of Man",
        currencyCode: "GBP",
        continent: "EU"
      },
      {
        countryCode: "IN",
        countryName: "India",
        currencyCode: "INR",
        continent: "AS"
      },
      {
        countryCode: "IO",
        countryName: "British Indian Ocean Territory",
        currencyCode: "USD",
        continent: "AS"
      },
      {
        countryCode: "IQ",
        countryName: "Iraq",
        currencyCode: "IQD",
        continent: "AS"
      },
      {
        countryCode: "IR",
        countryName: "Iran",
        currencyCode: "IRR",
        continent: "AS"
      },
      {
        countryCode: "IS",
        countryName: "Iceland",
        currencyCode: "ISK",
        continent: "EU"
      },
      {
        countryCode: "IT",
        countryName: "Italy",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "JE",
        countryName: "Jersey",
        currencyCode: "GBP",
        continent: "EU"
      },
      {
        countryCode: "JM",
        countryName: "Jamaica",
        currencyCode: "JMD",
        continent: "NA"
      },
      {
        countryCode: "JO",
        countryName: "Jordan",
        currencyCode: "JOD",
        continent: "AS"
      },
      {
        countryCode: "JP",
        countryName: "Japan",
        currencyCode: "JPY",
        continent: "AS"
      },
      {
        countryCode: "KE",
        countryName: "Kenya",
        currencyCode: "KES",
        continent: "AF"
      },
      {
        countryCode: "KG",
        countryName: "Kyrgyzstan",
        currencyCode: "KGS",
        continent: "AS"
      },
      {
        countryCode: "KH",
        countryName: "Cambodia",
        currencyCode: "KHR",
        continent: "AS"
      },
      {
        countryCode: "KI",
        countryName: "Kiribati",
        currencyCode: "AUD",
        continent: "OC"
      },
      {
        countryCode: "KM",
        countryName: "Comoros",
        currencyCode: "KMF",
        continent: "AF"
      },
      {
        countryCode: "KN",
        countryName: "Saint Kitts and Nevis",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "KP",
        countryName: "North Korea",
        currencyCode: "KPW",
        continent: "AS"
      },
      {
        countryCode: "KR",
        countryName: "South Korea",
        currencyCode: "KRW",
        continent: "AS"
      },
      {
        countryCode: "KW",
        countryName: "Kuwait",
        currencyCode: "KWD",
        continent: "AS"
      },
      {
        countryCode: "KY",
        countryName: "Cayman Islands",
        currencyCode: "KYD",
        continent: "NA"
      },
      {
        countryCode: "KZ",
        countryName: "Kazakhstan",
        currencyCode: "KZT",
        continent: "AS"
      },
      {
        countryCode: "LA",
        countryName: "Laos",
        currencyCode: "LAK",
        continent: "AS"
      },
      {
        countryCode: "LB",
        countryName: "Lebanon",
        currencyCode: "LBP",
        continent: "AS"
      },
      {
        countryCode: "LC",
        countryName: "Saint Lucia",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "LI",
        countryName: "Liechtenstein",
        currencyCode: "CHF",
        continent: "EU"
      },
      {
        countryCode: "LK",
        countryName: "Sri Lanka",
        currencyCode: "LKR",
        continent: "AS"
      },
      {
        countryCode: "LR",
        countryName: "Liberia",
        currencyCode: "LRD",
        continent: "AF"
      },
      {
        countryCode: "LS",
        countryName: "Lesotho",
        currencyCode: "LSL",
        continent: "AF"
      },
      {
        countryCode: "LT",
        countryName: "Lithuania",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "LU",
        countryName: "Luxembourg",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "LV",
        countryName: "Latvia",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "LY",
        countryName: "Libya",
        currencyCode: "LYD",
        continent: "AF"
      },
      {
        countryCode: "MA",
        countryName: "Morocco",
        currencyCode: "MAD",
        continent: "AF"
      },
      {
        countryCode: "MC",
        countryName: "Monaco",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "MD",
        countryName: "Moldova",
        currencyCode: "MDL",
        continent: "EU"
      },
      {
        countryCode: "ME",
        countryName: "Montenegro",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "MF",
        countryName: "Saint Martin",
        currencyCode: "EUR",
        continent: "NA"
      },
      {
        countryCode: "MG",
        countryName: "Madagascar",
        currencyCode: "MGA",
        continent: "AF"
      },
      {
        countryCode: "MH",
        countryName: "Marshall Islands",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "MK",
        countryName: "Macedonia",
        currencyCode: "MKD",
        continent: "EU"
      },
      {
        countryCode: "ML",
        countryName: "Mali",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "MM",
        countryName: "Myanmar [Burma]",
        currencyCode: "MMK",
        continent: "AS"
      },
      {
        countryCode: "MN",
        countryName: "Mongolia",
        currencyCode: "MNT",
        continent: "AS"
      },
      {
        countryCode: "MO",
        countryName: "Macao",
        currencyCode: "MOP",
        continent: "AS"
      },
      {
        countryCode: "MP",
        countryName: "Northern Mariana Islands",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "MQ",
        countryName: "Martinique",
        currencyCode: "EUR",
        continent: "NA"
      },
      {
        countryCode: "MR",
        countryName: "Mauritania",
        currencyCode: "MRO",
        continent: "AF"
      },
      {
        countryCode: "MS",
        countryName: "Montserrat",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "MT",
        countryName: "Malta",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "MU",
        countryName: "Mauritius",
        currencyCode: "MUR",
        continent: "AF"
      },
      {
        countryCode: "MV",
        countryName: "Maldives",
        currencyCode: "MVR",
        continent: "AS"
      },
      {
        countryCode: "MW",
        countryName: "Malawi",
        currencyCode: "MWK",
        continent: "AF"
      },
      {
        countryCode: "MX",
        countryName: "Mexico",
        currencyCode: "MXN",
        continent: "NA"
      },
      {
        countryCode: "MY",
        countryName: "Malaysia",
        currencyCode: "MYR",
        continent: "AS"
      },
      {
        countryCode: "MZ",
        countryName: "Mozambique",
        currencyCode: "MZN",
        continent: "AF"
      },
      {
        countryCode: "NA",
        countryName: "Namibia",
        currencyCode: "NAD",
        continent: "AF"
      },
      {
        countryCode: "NC",
        countryName: "New Caledonia",
        currencyCode: "XPF",
        continent: "OC"
      },
      {
        countryCode: "NE",
        countryName: "Niger",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "NF",
        countryName: "Norfolk Island",
        currencyCode: "AUD",
        continent: "OC"
      },
      {
        countryCode: "NG",
        countryName: "Nigeria",
        currencyCode: "NGN",
        continent: "AF"
      },
      {
        countryCode: "NI",
        countryName: "Nicaragua",
        currencyCode: "NIO",
        continent: "NA"
      },
      {
        countryCode: "NL",
        countryName: "Netherlands",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "NO",
        countryName: "Norway",
        currencyCode: "NOK",
        continent: "EU"
      },
      {
        countryCode: "NP",
        countryName: "Nepal",
        currencyCode: "NPR",
        continent: "AS"
      },
      {
        countryCode: "NR",
        countryName: "Nauru",
        currencyCode: "AUD",
        continent: "OC"
      },
      {
        countryCode: "NU",
        countryName: "Niue",
        currencyCode: "NZD",
        continent: "OC"
      },
      {
        countryCode: "NZ",
        countryName: "New Zealand",
        currencyCode: "NZD",
        continent: "OC"
      },
      {
        countryCode: "OM",
        countryName: "Oman",
        currencyCode: "OMR",
        continent: "AS"
      },
      {
        countryCode: "PA",
        countryName: "Panama",
        currencyCode: "PAB",
        continent: "NA"
      },
      {
        countryCode: "PE",
        countryName: "Peru",
        currencyCode: "PEN",
        continent: "SA"
      },
      {
        countryCode: "PF",
        countryName: "French Polynesia",
        currencyCode: "XPF",
        continent: "OC"
      },
      {
        countryCode: "PG",
        countryName: "Papua New Guinea",
        currencyCode: "PGK",
        continent: "OC"
      },
      {
        countryCode: "PH",
        countryName: "Philippines",
        currencyCode: "PHP",
        continent: "AS"
      },
      {
        countryCode: "PK",
        countryName: "Pakistan",
        currencyCode: "PKR",
        continent: "AS"
      },
      {
        countryCode: "PL",
        countryName: "Poland",
        currencyCode: "PLN",
        continent: "EU"
      },
      {
        countryCode: "PM",
        countryName: "Saint Pierre and Miquelon",
        currencyCode: "EUR",
        continent: "NA"
      },
      {
        countryCode: "PN",
        countryName: "Pitcairn Islands",
        currencyCode: "NZD",
        continent: "OC"
      },
      {
        countryCode: "PR",
        countryName: "Puerto Rico",
        currencyCode: "USD",
        continent: "NA"
      },
      {
        countryCode: "PS",
        countryName: "Palestine",
        currencyCode: "ILS",
        continent: "AS"
      },
      {
        countryCode: "PT",
        countryName: "Portugal",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "PW",
        countryName: "Palau",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "PY",
        countryName: "Paraguay",
        currencyCode: "PYG",
        continent: "SA"
      },
      {
        countryCode: "QA",
        countryName: "Qatar",
        currencyCode: "QAR",
        continent: "AS"
      },
      {
        countryCode: "RE",
        countryName: "Réunion",
        currencyCode: "EUR",
        continent: "AF"
      },
      {
        countryCode: "RO",
        countryName: "Romania",
        currencyCode: "RON",
        continent: "EU"
      },
      {
        countryCode: "RS",
        countryName: "Serbia",
        currencyCode: "RSD",
        continent: "EU"
      },
      {
        countryCode: "RU",
        countryName: "Russia",
        currencyCode: "RUB",
        continent: "EU"
      },
      {
        countryCode: "RW",
        countryName: "Rwanda",
        currencyCode: "RWF",
        continent: "AF"
      },
      {
        countryCode: "SA",
        countryName: "Saudi Arabia",
        currencyCode: "SAR",
        continent: "AS"
      },
      {
        countryCode: "SB",
        countryName: "Solomon Islands",
        currencyCode: "SBD",
        continent: "OC"
      },
      {
        countryCode: "SC",
        countryName: "Seychelles",
        currencyCode: "SCR",
        continent: "AF"
      },
      {
        countryCode: "SD",
        countryName: "Sudan",
        currencyCode: "SDG",
        continent: "AF"
      },
      {
        countryCode: "SE",
        countryName: "Sweden",
        currencyCode: "SEK",
        continent: "EU"
      },
      {
        countryCode: "SG",
        countryName: "Singapore",
        currencyCode: "SGD",
        continent: "AS"
      },
      {
        countryCode: "SH",
        countryName: "Saint Helena",
        currencyCode: "SHP",
        continent: "AF"
      },
      {
        countryCode: "SI",
        countryName: "Slovenia",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "SJ",
        countryName: "Svalbard and Jan Mayen",
        currencyCode: "NOK",
        continent: "EU"
      },
      {
        countryCode: "SK",
        countryName: "Slovakia",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "SL",
        countryName: "Sierra Leone",
        currencyCode: "SLL",
        continent: "AF"
      },
      {
        countryCode: "SM",
        countryName: "San Marino",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "SN",
        countryName: "Senegal",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "SO",
        countryName: "Somalia",
        currencyCode: "SOS",
        continent: "AF"
      },
      {
        countryCode: "SR",
        countryName: "Suriname",
        currencyCode: "SRD",
        continent: "SA"
      },
      {
        countryCode: "SS",
        countryName: "South Sudan",
        currencyCode: "SSP",
        continent: "AF"
      },
      {
        countryCode: "ST",
        countryName: "São Tomé and Príncipe",
        currencyCode: "STD",
        continent: "AF"
      },
      {
        countryCode: "SV",
        countryName: "El Salvador",
        currencyCode: "USD",
        continent: "NA"
      },
      {
        countryCode: "SX",
        countryName: "Sint Maarten",
        currencyCode: "ANG",
        continent: "NA"
      },
      {
        countryCode: "SY",
        countryName: "Syria",
        currencyCode: "SYP",
        continent: "AS"
      },
      {
        countryCode: "SZ",
        countryName: "Swaziland",
        currencyCode: "SZL",
        continent: "AF"
      },
      {
        countryCode: "TC",
        countryName: "Turks and Caicos Islands",
        currencyCode: "USD",
        continent: "NA"
      },
      {
        countryCode: "TD",
        countryName: "Chad",
        currencyCode: "XAF",
        continent: "AF"
      },
      {
        countryCode: "TF",
        countryName: "French Southern Territories",
        currencyCode: "EUR",
        continent: "AN"
      },
      {
        countryCode: "TG",
        countryName: "Togo",
        currencyCode: "XOF",
        continent: "AF"
      },
      {
        countryCode: "TH",
        countryName: "Thailand",
        currencyCode: "THB",
        continent: "AS"
      },
      {
        countryCode: "TJ",
        countryName: "Tajikistan",
        currencyCode: "TJS",
        continent: "AS"
      },
      {
        countryCode: "TK",
        countryName: "Tokelau",
        currencyCode: "NZD",
        continent: "OC"
      },
      {
        countryCode: "TL",
        countryName: "East Timor",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "TM",
        countryName: "Turkmenistan",
        currencyCode: "TMT",
        continent: "AS"
      },
      {
        countryCode: "TN",
        countryName: "Tunisia",
        currencyCode: "TND",
        continent: "AF"
      },
      {
        countryCode: "TO",
        countryName: "Tonga",
        currencyCode: "TOP",
        continent: "OC"
      },
      {
        countryCode: "TR",
        countryName: "Turkey",
        currencyCode: "TRY",
        continent: "AS"
      },
      {
        countryCode: "TT",
        countryName: "Trinidad and Tobago",
        currencyCode: "TTD",
        continent: "NA"
      },
      {
        countryCode: "TV",
        countryName: "Tuvalu",
        currencyCode: "AUD",
        continent: "OC"
      },
      {
        countryCode: "TW",
        countryName: "Taiwan",
        currencyCode: "TWD",
        continent: "AS"
      },
      {
        countryCode: "TZ",
        countryName: "Tanzania",
        currencyCode: "TZS",
        continent: "AF"
      },
      {
        countryCode: "UA",
        countryName: "Ukraine",
        currencyCode: "UAH",
        continent: "EU"
      },
      {
        countryCode: "UG",
        countryName: "Uganda",
        currencyCode: "UGX",
        continent: "AF"
      },
      {
        countryCode: "UM",
        countryName: "U.S. Minor Outlying Islands",
        currencyCode: "USD",
        continent: "OC"
      },
      {
        countryCode: "UY",
        countryName: "Uruguay",
        currencyCode: "UYU",
        continent: "SA"
      },
      {
        countryCode: "UZ",
        countryName: "Uzbekistan",
        currencyCode: "UZS",
        continent: "AS"
      },
      {
        countryCode: "VA",
        countryName: "Vatican City",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "VC",
        countryName: "Saint Vincent and the Grenadines",
        currencyCode: "XCD",
        continent: "NA"
      },
      {
        countryCode: "VE",
        countryName: "Venezuela",
        currencyCode: "VEF",
        continent: "SA"
      },
      {
        countryCode: "VG",
        countryName: "British Virgin Islands",
        currencyCode: "USD",
        continent: "NA"
      },
      {
        countryCode: "VI",
        countryName: "U.S. Virgin Islands",
        currencyCode: "USD",
        continent: "NA"
      },
      {
        countryCode: "VN",
        countryName: "Vietnam",
        currencyCode: "VND",
        continent: "AS"
      },
      {
        countryCode: "VU",
        countryName: "Vanuatu",
        currencyCode: "VUV",
        continent: "OC"
      },
      {
        countryCode: "WF",
        countryName: "Wallis and Futuna",
        currencyCode: "XPF",
        continent: "OC"
      },
      {
        countryCode: "WS",
        countryName: "Samoa",
        currencyCode: "WST",
        continent: "OC"
      },
      {
        countryCode: "XK",
        countryName: "Kosovo",
        currencyCode: "EUR",
        continent: "EU"
      },
      {
        countryCode: "YE",
        countryName: "Yemen",
        currencyCode: "YER",
        continent: "AS"
      },
      {
        countryCode: "YT",
        countryName: "Mayotte",
        currencyCode: "EUR",
        continent: "AF"
      },
      {
        countryCode: "ZA",
        countryName: "South Africa",
        currencyCode: "ZAR",
        continent: "AF"
      },
      {
        countryCode: "ZM",
        countryName: "Zambia",
        currencyCode: "ZMW",
        continent: "AF"
      },
      {
        countryCode: "ZW",
        countryName: "Zimbabwe",
        currencyCode: "ZWL",
        continent: "AF"
      }
    ];
  }

  public static getUsaStatesAsJson = (): Array<{ name: string, code: string }> => {
    return [
      { name: "Alabama", code: "AL" },
      { name: "Alaska", code: "AK" },
      { name: "American Samoa", code: "AS" },
      { name: "Arizona", code: "AZ" },
      { name: "Arkansas", code: "AR" },
      { name: "California", code: "CA" },
      { name: "Colorado", code: "CO" },
      { name: "Connecticut", code: "CT" },
      { name: "Delaware", code: "DE" },
      { name: "District of Columbia", code: "DC" },
      { name: "Florida", code: "FL" },
      { name: "Georgia", code: "GA" },
      { name: "Guam", code: "GU" },
      { name: "Hawaii", code: "HI" },
      { name: "Idaho", code: "ID" },
      { name: "Illinois", code: "IL" },
      { name: "Indiana", code: "IN" },
      { name: "Iowa", code: "IA" },
      { name: "Kansas", code: "KS" },
      { name: "Kentucky", code: "KY" },
      { name: "Louisiana", code: "LA" },
      { name: "Maine", code: "ME" },
      { name: "Maryland", code: "MD" },
      { name: "Massachusetts", code: "MA" },
      { name: "Michigan", code: "MI" },
      { name: "Minnesota", code: "MN" },
      { name: "Mississippi", code: "MS" },
      { name: "Missouri", code: "MO" },
      { name: "Montana", code: "MT" },
      { name: "Nebraska", code: "NE" },
      { name: "Nevada", code: "NV" },
      { name: "New Hampshire", code: "NH" },
      { name: "New Jersey", code: "NJ" },
      { name: "New Mexico", code: "NM" },
      { name: "New York", code: "NY" },
      { name: "North Carolina", code: "NC" },
      { name: "North Dakota", code: "ND" },
      { name: "Northern Mariana Islands", code: "MP" },
      { name: "Ohio", code: "OH" },
      { name: "Oklahoma", code: "OK" },
      { name: "Oregon", code: "OR" },
      { name: "Pennsylvania", code: "PA" },
      { name: "Puerto Rico", code: "PR" },
      { name: "Rhode Island", code: "RI" },
      { name: "South Carolina", code: "SC" },
      { name: "South Dakota", code: "SD" },
      { name: "Tennessee", code: "TN" },
      { name: "Texas", code: "TX" },
      { name: "Utah", code: "UT" },
      { name: "Vermont", code: "VT" },
      { name: "Virgin Islands", code: "VI" },
      { name: "Virginia", code: "VA" },
      { name: "Washington", code: "WA" },
      { name: "West Virginia", code: "WV" },
      { name: "Wisconsin", code: "WI" },
      { name: "Wyoming", code: "WY" },
    ];
  }
}
