declare module "react-select-country-list" {
  export default function countryList(): {
    getData(): { label: string; value: string }[]
  }
}