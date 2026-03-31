"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import countries from "world-countries"

// Transform world-countries data to a simpler format
const countryList = countries
  .map((country) => ({
    name: country.name.common,
    code: country.cca2,
    flag: country.flag,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

interface CountrySelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
  name?: string
  id?: string
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country...",
  disabled = false,
  className,
  error = false,
  name,
  id,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedCountry = countryList.find(
    (country) => country.code === value || country.name === value
  )

  const handleSelect = (countryCode: string, countryName: string) => {
    // Use country name as value (maintains compatibility with existing data)
    const newValue = countryName
    onValueChange?.(newValue)
    setOpen(false)
    setSearchValue("")
  }

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!searchValue) return countryList

    const searchLower = searchValue.toLowerCase()
    return countryList.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower)
    )
  }, [searchValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !selectedCountry && "text-muted-foreground",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          id={id}
          name={name}
          type="button"
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        style={{ maxWidth: '100%' }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search country..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList 
            className="max-h-[300px] overflow-y-auto overflow-x-hidden"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => handleSelect(country.code, country.name)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      selectedCountry?.code === country.code ||
                        selectedCountry?.name === country.name
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{country.flag}</span>
                  <span>{country.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Export country list for use in other components
export { countryList }

