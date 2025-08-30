"use client"

import React, { useState, useEffect, useRef, forwardRef } from 'react'
import { AsYouType, getCountries, getCountryCallingCode } from 'libphonenumber-js'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconComponent } from '@repo/ui/components/icons'
import { 
  validatePhoneNumber, 
  formatToE164, 
  getExamplePhoneNumber,
  isSupportedPhoneCountry 
} from '@repo/utils/common/phone-validation'
import type { PhoneFieldConfig } from '@repo/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
  config?: PhoneFieldConfig
  error?: boolean
  currentLanguage?: string
}

// Country data interface
interface CountryData {
  code: string
  name: string
  dialCode: string
  flag: string
}

// Sample country data - in a real implementation, you might want to load this from a separate file
const getCountryData = (): CountryData[] => {
  const countries = getCountries()
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'MM': 'Myanmar (Burma)',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'AU': 'Australia',
    'CA': 'Canada',
    'IN': 'India',
    'CN': 'China',
    'KR': 'South Korea',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'BD': 'Bangladesh',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'PK': 'Pakistan',
    'AF': 'Afghanistan',
    'IR': 'Iran',
    'IQ': 'Iraq',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'QA': 'Qatar',
    'KW': 'Kuwait',
    'BH': 'Bahrain',
    'OM': 'Oman',
    'YE': 'Yemen',
    'JO': 'Jordan',
    'LB': 'Lebanon',
    'SY': 'Syria',
    'IL': 'Israel',
    'PS': 'Palestine',
    'TR': 'Turkey',
    'EG': 'Egypt',
    'LY': 'Libya',
    'TN': 'Tunisia',
    'DZ': 'Algeria',
    'MA': 'Morocco',
    'SD': 'Sudan',
    'ET': 'Ethiopia',
    'KE': 'Kenya',
    'UG': 'Uganda',
    'TZ': 'Tanzania',
    'RW': 'Rwanda',
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'GH': 'Ghana',
    'CI': 'Ivory Coast',
    'SN': 'Senegal',
    'ML': 'Mali',
    'BF': 'Burkina Faso',
    'NE': 'Niger',
    'TD': 'Chad',
    'CM': 'Cameroon',
    'CF': 'Central African Republic',
    'GA': 'Gabon',
    'CG': 'Congo',
    'CD': 'Democratic Republic of Congo',
    'AO': 'Angola',
    'ZM': 'Zambia',
    'ZW': 'Zimbabwe',
    'BW': 'Botswana',
    'NA': 'Namibia',
    'SZ': 'Eswatini',
    'LS': 'Lesotho',
    'MZ': 'Mozambique',
    'MW': 'Malawi',
    'MG': 'Madagascar',
    'MU': 'Mauritius',
    'RE': 'Reunion',
    'YT': 'Mayotte',
    'KM': 'Comoros',
    'SC': 'Seychelles',
    'DJ': 'Djibouti',
    'SO': 'Somalia',
    'ER': 'Eritrea',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'PE': 'Peru',
    'CO': 'Colombia',
    'VE': 'Venezuela',
    'UY': 'Uruguay',
    'PY': 'Paraguay',
    'BO': 'Bolivia',
    'EC': 'Ecuador',
    'GY': 'Guyana',
    'SR': 'Suriname',
    'GF': 'French Guiana',
    'MX': 'Mexico',
    'GT': 'Guatemala',
    'BZ': 'Belize',
    'SV': 'El Salvador',
    'HN': 'Honduras',
    'NI': 'Nicaragua',
    'CR': 'Costa Rica',
    'PA': 'Panama',
    'CU': 'Cuba',
    'JM': 'Jamaica',
    'HT': 'Haiti',
    'DO': 'Dominican Republic',
    'PR': 'Puerto Rico',
    'TT': 'Trinidad and Tobago',
    'GD': 'Grenada',
    'VC': 'Saint Vincent and the Grenadines',
    'LC': 'Saint Lucia',
    'DM': 'Dominica',
    'AG': 'Antigua and Barbuda',
    'KN': 'Saint Kitts and Nevis',
    'BS': 'Bahamas',
    'BB': 'Barbados',
    'RU': 'Russia',
    'UA': 'Ukraine',
    'BY': 'Belarus',
    'MD': 'Moldova',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'GR': 'Greece',
    'CY': 'Cyprus',
    'MK': 'North Macedonia',
    'AL': 'Albania',
    'ME': 'Montenegro',
    'RS': 'Serbia',
    'BA': 'Bosnia and Herzegovina',
    'HR': 'Croatia',
    'SI': 'Slovenia',
    'SK': 'Slovakia',
    'CZ': 'Czech Republic',
    'AT': 'Austria',
    'HU': 'Hungary',
    'PL': 'Poland',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
    'FI': 'Finland',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'IS': 'Iceland',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'ES': 'Spain',
    'AD': 'Andorra',
    'MC': 'Monaco',
    'SM': 'San Marino',
    'VA': 'Vatican City',
    'MT': 'Malta',
    'IT': 'Italy',
    'CH': 'Switzerland',
    'LI': 'Liechtenstein',
    'LU': 'Luxembourg',
    'BE': 'Belgium',
    'NL': 'Netherlands',
  }

  const flags: Record<string, string> = {
    'US': '🇺🇸', 'MM': '🇲🇲', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵',
    'AU': '🇦🇺', 'CA': '🇨🇦', 'IN': '🇮🇳', 'CN': '🇨🇳', 'KR': '🇰🇷', 'TH': '🇹🇭',
    'VN': '🇻🇳', 'SG': '🇸🇬', 'MY': '🇲🇾', 'PH': '🇵🇭', 'ID': '🇮🇩', 'BD': '🇧🇩',
    'LK': '🇱🇰', 'NP': '🇳🇵', 'PK': '🇵🇰', 'AF': '🇦🇫', 'IR': '🇮🇷', 'IQ': '🇮🇶',
    'SA': '🇸🇦', 'AE': '🇦🇪', 'QA': '🇶🇦', 'KW': '🇰🇼', 'BH': '🇧🇭', 'OM': '🇴🇲',
    'YE': '🇾🇪', 'JO': '🇯🇴', 'LB': '🇱🇧', 'SY': '🇸🇾', 'IL': '🇮🇱', 'PS': '🇵🇸',
    'TR': '🇹🇷', 'EG': '🇪🇬', 'LY': '🇱🇾', 'TN': '🇹🇳', 'DZ': '🇩🇿', 'MA': '🇲🇦',
    'RU': '🇷🇺', 'BR': '🇧🇷', 'MX': '🇲🇽', 'ES': '🇪🇸', 'IT': '🇮🇹', 'PT': '🇵🇹',
    'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴',
    'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'SK': '🇸🇰',
    'RO': '🇷🇴', 'BG': '🇧🇬', 'GR': '🇬🇷', 'HR': '🇭🇷', 'SI': '🇸🇮', 'RS': '🇷🇸',
    'BA': '🇧🇦', 'ME': '🇲🇪', 'AL': '🇦🇱', 'MK': '🇲🇰', 'UA': '🇺🇦', 'BY': '🇧🇾',
    'MD': '🇲🇩', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪', 'IE': '🇮🇪', 'IS': '🇮🇸',
    'LU': '🇱🇺', 'MT': '🇲🇹', 'CY': '🇨🇾', 'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪',
    'CO': '🇨🇴', 'VE': '🇻🇪', 'UY': '🇺🇾', 'PY': '🇵🇾', 'BO': '🇧🇴', 'EC': '🇪🇨',
  }

  return countries
    .filter(country => isSupportedPhoneCountry(country))
    .map(country => ({
      code: country,
      name: countryNames[country] || country,
      dialCode: `+${getCountryCallingCode(country)}`,
      flag: flags[country] || '🏳️'
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ 
    value = '', 
    onChange, 
    onBlur, 
    disabled = false, 
    placeholder, 
    className = '', 
    config = {},
    error = false,
    currentLanguage = 'en',
    ...props 
  }, ref) => {
    const {
      defaultCountry = 'MM',
      preferredCountries = ['MM', 'US', 'GB'],
      onlyCountries,
      excludeCountries = [],
      showDialingCode = true,
      showCountryFlag = true,
      format = 'international',
      autoFormat = true,
      validateOnChange = false,
      enableSearch = true
    } = config

    const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
    const [phoneNumber, setPhoneNumber] = useState(value)
    const [isValid, setIsValid] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const asYouType = useRef<AsYouType>()
    
    // Get all countries
    const allCountries = getCountryData()
    
    // Filter countries based on config
    const availableCountries = allCountries.filter(country => {
      if (onlyCountries && !onlyCountries.includes(country.code)) return false
      if (excludeCountries.includes(country.code)) return false
      return true
    })
    
    // Sort countries with preferred ones first
    const sortedCountries = [
      ...availableCountries.filter(country => preferredCountries.includes(country.code)),
      ...availableCountries.filter(country => !preferredCountries.includes(country.code))
    ]
    
    // Filter countries by search query
    const filteredCountries = enableSearch 
      ? sortedCountries.filter(country => 
          country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.dialCode.includes(searchQuery) ||
          country.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sortedCountries

    // Initialize AsYouType formatter
    useEffect(() => {
      if (selectedCountry) {
        asYouType.current = new AsYouType(selectedCountry.code)
      } else {
        asYouType.current = new AsYouType()
      }
    }, [selectedCountry])

    // Sync internal phone number state with external value prop
    useEffect(() => {
      setPhoneNumber(value || '')
    }, [value])

    // Detect country from phone number (prioritize this over default country)
    useEffect(() => {
      if (value) {
        const validation = validatePhoneNumber(value)
        if (validation.country) {
          const country = availableCountries.find(c => c.code === validation.country)
          if (country) {
            // Always update if we can detect a country from the phone number
            console.log(`🌍 PhoneInput: Detected country ${country.code} (${country.name}) from phone number: ${value}`)
            setSelectedCountry(country)
            return
          }
        } else {
          console.log(`⚠️ PhoneInput: Could not detect country from phone number: ${value}`)
        }
      }
      
      // Only fall back to default country if no phone number and no country is currently selected
      if (!value && defaultCountry) {
        const country = availableCountries.find(c => c.code === defaultCountry)
        if (country) {
          console.log(`🇲🇲 PhoneInput: Using default country ${country.code} (${country.name})`)
          setSelectedCountry(prevSelected => prevSelected || country)
        }
      }
    }, [value, availableCountries, defaultCountry])

    // Handle phone number input
    const handlePhoneChange = (inputValue: string) => {
      let formattedValue = inputValue

      if (autoFormat && asYouType.current) {
        // Reset formatter for new input
        asYouType.current.reset()
        formattedValue = asYouType.current.input(inputValue)
      }

      setPhoneNumber(formattedValue)

      // Auto-detect country when user types a phone number
      if (formattedValue) {
        const validation = validatePhoneNumber(formattedValue)
        if (validation.country) {
          const detectedCountry = availableCountries.find(c => c.code === validation.country)
          if (detectedCountry && detectedCountry.code !== selectedCountry?.code) {
            console.log(`🔄 PhoneInput: Country changed from ${selectedCountry?.code} to ${detectedCountry.code} while typing`)
            setSelectedCountry(detectedCountry)
          }
        }
      }

      // Validate if enabled
      if (validateOnChange) {
        const validation = validatePhoneNumber(formattedValue, {
          defaultCountry: selectedCountry?.code
        })
        setIsValid(validation.isValid)
      }

      // Call onChange with E.164 format if possible, otherwise raw value
      if (onChange) {
        const e164 = formatToE164(formattedValue, selectedCountry?.code)
        onChange(e164 || formattedValue)
      }
    }

    // Handle country selection
    const handleCountrySelect = (country: CountryData) => {
      setSelectedCountry(country)
      setIsOpen(false)
      setSearchQuery('')
      
      // If there's a phone number, reformat it for the new country
      if (phoneNumber && asYouType.current) {
        asYouType.current = new AsYouType(country.code)
        const reformatted = asYouType.current.input(phoneNumber.replace(/\D/g, ''))
        setPhoneNumber(reformatted)
        
        if (onChange) {
          const e164 = formatToE164(reformatted, country.code)
          onChange(e164 || reformatted)
        }
      }
    }

    // Handle blur event
    const handleBlur = () => {
      if (onBlur) onBlur()
      
      // Final validation on blur
      if (phoneNumber) {
        const validation = validatePhoneNumber(phoneNumber, {
          defaultCountry: selectedCountry?.code
        })
        setIsValid(validation.isValid)
      }
    }

    // Get placeholder text
    const getPlaceholder = () => {
      if (placeholder) return placeholder
      
      if (selectedCountry) {
        const example = getExamplePhoneNumber(selectedCountry.code)
        if (example) return example
      }
      
      return currentLanguage === 'mm' 
        ? 'ဖုန်းနံပါတ် ထည့်ပါ' 
        : 'Enter phone number'
    }

    return (
      <div className={`flex ${className}`}>
        {/* Country Selector */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={`flex items-center gap-2 rounded-r-none border-r-0 px-3 ${
                error ? 'border-destructive' : ''
              }`}
            >
              {showCountryFlag && selectedCountry && (
                <span className="text-lg">{selectedCountry.flag}</span>
              )}
              {showDialingCode && selectedCountry && (
                <span className="text-sm font-mono">{selectedCountry.dialCode}</span>
              )}
              <IconComponent name="ChevronDown" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 max-h-64 overflow-y-auto">
            {enableSearch && (
              <div className="p-2 border-b">
                <Input
                  placeholder={currentLanguage === 'mm' ? 'နိုင်ငံရှာပါ...' : 'Search countries...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
            )}
            {filteredCountries.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="flex items-center gap-3 cursor-pointer"
              >
                {showCountryFlag && (
                  <span className="text-lg">{country.flag}</span>
                )}
                <span className="flex-1 text-sm">{country.name}</span>
                {showDialingCode && (
                  <span className="text-sm font-mono text-muted-foreground">
                    {country.dialCode}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            {filteredCountries.length === 0 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                {currentLanguage === 'mm' 
                  ? 'နိုင်ငံမတွေ့ရှိပါ' 
                  : 'No countries found'}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Phone Number Input */}
        <Input
          ref={ref}
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={getPlaceholder()}
          className={`rounded-l-none ${error || !isValid ? 'border-destructive focus:ring-destructive' : ''}`}
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'