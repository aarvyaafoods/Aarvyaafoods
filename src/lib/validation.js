export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

export function cleanPhone(value = '') {
  return String(value).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
}

export function normalizeIndianPhone(value = '') {
  const digits = cleanPhone(value)
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : value.trim()
}

export function isValidIndianPhone(value = '') {
  return /^[6-9]\d{9}$/.test(cleanPhone(value))
}

export function isValidIndianPincode(value = '') {
  return /^[1-9]\d{5}$/.test(String(value).trim())
}

export function passwordChecks(password = '') {
  return [
    { key: 'length', label: '8+ characters', ok: password.length >= 8 },
    { key: 'upper', label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { key: 'lower', label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { key: 'number', label: 'Number', ok: /\d/.test(password) },
    { key: 'special', label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function isStrongPassword(password = '') {
  return passwordChecks(password).every((check) => check.ok)
}

export function validateAddress(form) {
  const errors = {}
  if (!form.fullName?.trim() || form.fullName.trim().length < 2) errors.fullName = 'Enter recipient name'
  if (!isValidIndianPhone(form.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number'
  if (!form.addressLine1?.trim() || form.addressLine1.trim().length < 8) errors.addressLine1 = 'Enter house number, building and street'
  if (!form.city?.trim() || form.city.trim().length < 2) errors.city = 'Enter city'
  if (!form.state?.trim()) errors.state = 'Select state'
  if (!isValidIndianPincode(form.pincode)) errors.pincode = 'Enter a valid 6-digit PIN'
  return errors
}

export function validateSignup(form) {
  const errors = {}
  if (!form.name?.trim() || form.name.trim().length < 2) errors.name = 'Enter your full name'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '')) errors.email = 'Enter a valid email'
  if (!isValidIndianPhone(form.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number'
  if (!isStrongPassword(form.password)) errors.password = 'Complete all password rules'
  return errors
}
