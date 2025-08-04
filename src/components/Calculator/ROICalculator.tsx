import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';

interface ROICalculatorProps {
  language: 'ru' | 'en';
}

const ROICalculator = ({ language }: ROICalculatorProps) => {
  const [price, setPrice] = useState([100000]); // Equipment price in USD
  const [procedures, setProcedures] = useState([50]); // Procedures per month
  const [margin, setMargin] = useState([200]); // Profit per procedure in USD

  // Manual input states
  const [manualPrice, setManualPrice] = useState('100000');
  const [manualProcedures, setManualProcedures] = useState('50');
  const [manualMargin, setManualMargin] = useState('200');

  const content = {
    ru: {
      title: 'ROI Калькулятор',
      subtitle: 'Рассчитайте окупаемость медицинского оборудования',
      equipmentPrice: 'Стоимость оборудования',
      proceduresMonth: 'Процедур в месяц',
      profitProcedure: 'Прибыль с процедуры',
      paybackPeriod: 'Срок окупаемости',
      monthlyProfit: 'Месячная прибыль',
      yearlyProfit: 'Годовая прибыль',
      months: 'мес.',
      currency: '$',
      calculate: 'Рассчитать',
      excellent: 'Отличная окупаемость!',
      good: 'Хорошая окупаемость',
      acceptable: 'Приемлемая окупаемость',
      slow: 'Медленная окупаемость'
    },
    en: {
      title: 'ROI Calculator',
      subtitle: 'Calculate medical equipment return on investment',
      equipmentPrice: 'Equipment Price',
      proceduresMonth: 'Procedures per Month',
      profitProcedure: 'Profit per Procedure',
      paybackPeriod: 'Payback Period',
      monthlyProfit: 'Monthly Profit',
      yearlyProfit: 'Yearly Profit',
      months: 'months',
      currency: '$',
      calculate: 'Calculate',
      excellent: 'Excellent ROI!',
      good: 'Good ROI',
      acceptable: 'Acceptable ROI',
      slow: 'Slow ROI'
    }
  };

  const t = content[language];

  // Calculations
  const currentPrice = price[0];
  const currentProcedures = procedures[0];
  const currentMargin = margin[0];
  
  const monthlyProfit = currentProcedures * currentMargin;
  const months = monthlyProfit > 0 ? Math.ceil(currentPrice / monthlyProfit) : 0;
  const yearlyProfit = monthlyProfit * 12;

  // ROI Color coding
  const getROIColor = (months: number) => {
    if (months <= 6) return 'text-msc-accent';
    if (months <= 12) return 'text-amber-500';
    return 'text-red-500';
  };

  const getROIText = (months: number) => {
    if (months <= 6) return t.excellent;
    if (months <= 12) return t.good;
    if (months <= 24) return t.acceptable;
    return t.slow;
  };

  // Sync sliders with manual inputs
  useEffect(() => {
    const priceValue = parseFloat(manualPrice) || 0;
    if (priceValue >= 1000 && priceValue <= 500000) {
      setPrice([priceValue]);
    }
  }, [manualPrice]);

  useEffect(() => {
    const procValue = parseFloat(manualProcedures) || 0;
    if (procValue >= 1 && procValue <= 1000) {
      setProcedures([procValue]);
    }
  }, [manualProcedures]);

  useEffect(() => {
    const marginValue = parseFloat(manualMargin) || 0;
    if (marginValue >= 1 && marginValue <= 1000) {
      setMargin([marginValue]);
    }
  }, [manualMargin]);

  return (
    <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-sm border-2 border-msc-accent/20 shadow-xl">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Calculator className="w-8 h-8 text-msc-accent" />
          <CardTitle className="font-heading text-2xl text-msc-primary">
            {t.title}
          </CardTitle>
        </div>
        <p className="text-msc-text-light">{t.subtitle}</p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Equipment Price */}
          <div className="space-y-3">
            <Label className="text-msc-text font-medium">{t.equipmentPrice}</Label>
            <div className="space-y-2">
              <Slider
                value={price}
                onValueChange={setPrice}
                max={500000}
                min={1000}
                step={1000}
                className="w-full"
              />
              <div className="flex items-center space-x-2">
                <span className="text-msc-accent font-medium">{t.currency}</span>
                <Input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  min={1000}
                  max={500000}
                  className="border-msc-accent/30 focus:border-msc-accent"
                />
              </div>
            </div>
          </div>

          {/* Procedures per Month */}
          <div className="space-y-3">
            <Label className="text-msc-text font-medium">{t.proceduresMonth}</Label>
            <div className="space-y-2">
              <Slider
                value={procedures}
                onValueChange={setProcedures}
                max={1000}
                min={1}
                step={1}
                className="w-full"
              />
              <Input
                type="number"
                value={manualProcedures}
                onChange={(e) => setManualProcedures(e.target.value)}
                min={1}
                max={1000}
                className="border-msc-accent/30 focus:border-msc-accent"
              />
            </div>
          </div>

          {/* Profit per Procedure */}
          <div className="space-y-3">
            <Label className="text-msc-text font-medium">{t.profitProcedure}</Label>
            <div className="space-y-2">
              <Slider
                value={margin}
                onValueChange={setMargin}
                max={1000}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex items-center space-x-2">
                <span className="text-msc-accent font-medium">{t.currency}</span>
                <Input
                  type="number"
                  value={manualMargin}
                  onChange={(e) => setManualMargin(e.target.value)}
                  min={1}
                  max={1000}
                  className="border-msc-accent/30 focus:border-msc-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-msc-primary/5 to-msc-accent/5 rounded-lg">
          {/* Payback Period */}
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-msc-accent" />
            <h3 className="font-semibold text-msc-text mb-1">{t.paybackPeriod}</h3>
            <p className={`text-3xl font-bold ${getROIColor(months)}`}>
              {months} {t.months}
            </p>
            <p className={`text-sm mt-1 ${getROIColor(months)}`}>
              {getROIText(months)}
            </p>
          </div>

          {/* Monthly Profit */}
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-msc-accent" />
            <h3 className="font-semibold text-msc-text mb-1">{t.monthlyProfit}</h3>
            <p className="text-2xl font-bold text-msc-primary">
              {t.currency}{monthlyProfit.toLocaleString()}
            </p>
          </div>

          {/* Yearly Profit */}
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-msc-accent" />
            <h3 className="font-semibold text-msc-text mb-1">{t.yearlyProfit}</h3>
            <p className="text-2xl font-bold text-msc-primary">
              {t.currency}{yearlyProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ROICalculator;