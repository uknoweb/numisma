'use client'

import { useEffect, useState } from 'react'

interface PriceData {
  price: number
  priceForContract: number
  timestamp: number
  source: string
  error?: string
}

/**
 * Hook para obtener el precio de WLD en tiempo real desde el API
 * Se actualiza cada segundo
 */
export function useWLDPrice() {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/prices/wld')
        if (!response.ok) {
          throw new Error('Failed to fetch price')
        }
        const data = await response.json()
        setPriceData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error fetching WLD price:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch inicial
    fetchPrice()

    // Actualizar cada 1 segundo
    const interval = setInterval(fetchPrice, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    price: priceData?.price ?? 2.5, // Fallback a 2.5 USD
    priceForContract: priceData?.priceForContract ?? 2500000,
    timestamp: priceData?.timestamp ?? Date.now(),
    source: priceData?.source ?? 'fallback',
    isLoading,
    error: error || priceData?.error,
  }
}

/**
 * Hook para obtener el precio de NUMA/WLD
 * Usa la tasa fija del contrato: 10 NUMA = 1 WLD
 */
export function useNUMAPrice() {
  const NUMA_WLD_RATE = 10 // 10 NUMA = 1 WLD (tasa fija del contrato)
  
  return {
    price: 1 / NUMA_WLD_RATE, // 0.1 WLD por NUMA
    priceInUSD: 0.25, // Aproximado, calculado como WLD_PRICE / NUMA_WLD_RATE
    rate: NUMA_WLD_RATE,
  }
}
