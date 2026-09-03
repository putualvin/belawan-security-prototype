import type { DeviceMode } from '../types'

/** Detect the real device class used to open the application. */
export function detectDeviceMode(): DeviceMode {
  if (typeof window === 'undefined') return 'desktop'
  return window.matchMedia('(max-width: 767px)').matches ? 'phone' : 'desktop'
}
