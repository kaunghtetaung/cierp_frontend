// Simple toast implementation - you can replace this with your preferred toast library
// For now, using browser alert as fallback, but you should integrate with sonner or react-hot-toast

export const toast = {
  success: (message: string) => {
    // In a real app, use a proper toast library like sonner
    console.log('✅ Success:', message)
    if (typeof window !== 'undefined') {
      // Simple fallback for now
      window.alert(`✅ ${message}`)
    }
  },
  
  error: (message: string) => {
    console.error('❌ Error:', message)
    if (typeof window !== 'undefined') {
      // Simple fallback for now  
      window.alert(`❌ ${message}`)
    }
  },
  
  info: (message: string) => {
    console.info('ℹ️ Info:', message)
    if (typeof window !== 'undefined') {
      // Simple fallback for now
      window.alert(`ℹ️ ${message}`)
    }
  },
  
  warning: (message: string) => {
    console.warn('⚠️ Warning:', message)
    if (typeof window !== 'undefined') {
      // Simple fallback for now
      window.alert(`⚠️ ${message}`)
    }
  }
}