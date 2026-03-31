/**
 * Country utilities - Reusable country list and helper functions
 * Uses world-countries package for complete country data
 */

import countries from "world-countries"

/**
 * Country interface matching world-countries structure
 */
export interface Country {
  name: string
  code: string
  flag: string
}

/**
 * Get all countries as a sorted list
 * Returns array of { name, code, flag }
 */
export function getAllCountries(): Country[] {
  return countries
    .map((country) => ({
      name: country.name.common,
      code: country.cca2,
      flag: country.flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get country by name (case-insensitive partial match)
 */
export function getCountryByName(name: string): Country | undefined {
  const normalizedName = name.toLowerCase().trim()
  return getAllCountries().find(
    (country) => country.name.toLowerCase() === normalizedName
  )
}

/**
 * Get country by code (ISO 2-letter code)
 */
export function getCountryByCode(code: string): Country | undefined {
  const normalizedCode = code.toUpperCase().trim()
  return getAllCountries().find(
    (country) => country.code.toUpperCase() === normalizedCode
  )
}

/**
 * Search countries by name or code
 */
export function searchCountries(query: string): Country[] {
  if (!query) return getAllCountries()

  const normalizedQuery = query.toLowerCase().trim()
  return getAllCountries().filter(
    (country) =>
      country.name.toLowerCase().includes(normalizedQuery) ||
      country.code.toLowerCase().includes(normalizedQuery)
  )
}

/**
 * Get country name from code
 */
export function getCountryName(code: string): string | undefined {
  return getCountryByCode(code)?.name
}

/**
 * Get country code from name
 */
export function getCountryCode(name: string): string | undefined {
  return getCountryByName(name)?.code
}

/**
 * Check if a country name exists
 */
export function isValidCountryName(name: string): boolean {
  return !!getCountryByName(name)
}

/**
 * Check if a country code exists
 */
export function isValidCountryCode(code: string): boolean {
  return !!getCountryByCode(code)
}

// Export the sorted country list for direct use
export const countryList = getAllCountries()

// Export default country list for backward compatibility
export default countryList

