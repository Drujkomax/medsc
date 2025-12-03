import { useState, useEffect } from 'react';

interface CurrencyRate {
  USD: number;
  EUR: number;
  lastUpdated: string;
}

export const useCurrencyRates = () => {
  const [rates, setRates] = useState<CurrencyRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        // Fetch from Central Bank of Uzbekistan API
        const response = await fetch('https://cbu.uz/oz/arkhiv-kursov-valyut/json/');
        
        if (!response.ok) {
          throw new Error('Failed to fetch rates');
        }

        const data = await response.json();
        
        // Parse rates from CBU API
        const usdRate = data.find((item: any) => item.Ccy === 'USD');
        const eurRate = data.find((item: any) => item.Ccy === 'EUR');

        if (usdRate && eurRate) {
          setRates({
            USD: parseFloat(usdRate.Rate),
            EUR: parseFloat(eurRate.Rate),
            lastUpdated: new Date().toISOString()
          });
          setError(null);
        } else {
          throw new Error('Currency rates not found');
        }
      } catch (err) {
        console.error('Error fetching currency rates:', err);
        // Fallback rates if API fails
        setRates({
          USD: 12700,
          EUR: 13500,
          lastUpdated: new Date().toISOString()
        });
        setError(err instanceof Error ? err.message : 'Failed to fetch rates');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const convertToUZS = (priceString: string | number, currency: 'USD' | 'EUR' | 'UZS'): number => {
    if (currency === 'UZS') {
      const value = typeof priceString === 'string' ? priceString.replace(/\s+/g, '') : String(priceString);
      return parseFloat(value) || 0;
    }
    
    if (!rates) return 0;
    
    // Clean the price string - remove all spaces
    const cleanPrice = typeof priceString === 'string' ? priceString.replace(/\s+/g, '') : String(priceString);
    const priceNumber = parseFloat(cleanPrice);
    
    if (isNaN(priceNumber)) return 0;
    
    // Multiply by exchange rate
    const convertedAmount = priceNumber * rates[currency];
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  };

  const formatPrice = (amount: string | null, currency: 'USD' | 'EUR' | 'UZS'): string => {
    if (!amount) return '';
    // Remove spaces from price string before parsing
    const cleanAmount = amount.replace(/\s+/g, '');
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) return '';
    
    if (currency === 'UZS') {
      return numAmount.toLocaleString('ru-RU');
    }
    return numAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return {
    rates,
    loading,
    error,
    convertToUZS,
    formatPrice
  };
};
