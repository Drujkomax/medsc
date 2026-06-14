"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';

export function RoiCalculator({ lang }: { lang: import("~/shared/config/site").Lang }) {
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
      subtitle: 'ROI (Return on Investment) — показатель возврата инвестиций, который помогает оценить прибыльность и сроки окупаемости медицинского оборудования',
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
      subtitle: 'ROI (Return on Investment) is a profitability metric that helps evaluate the financial return and payback period of medical equipment investments',
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
    },
    uz: {
      title: 'ROI Kalkulyatori',
      subtitle: 'ROI (Return on Investment) - bu investitsiya rentabellik ko\'rsatkichi bo\'lib, tibbiy asbob-uskunalardan foydalanish daromadliligi va o\'zini oqlash muddatini baholashga yordam beradi',
      equipmentPrice: 'Uskunalar narxi',
      proceduresMonth: 'Oylik protseduralar',
      profitProcedure: 'Prоtseduradan foyda',
      paybackPeriod: 'O\'zini oqlash muddati',
      monthlyProfit: 'Oylik foyda',
      yearlyProfit: 'Yillik foyda',
      months: 'oy',
      currency: '$',
      calculate: 'Hisoblash',
      excellent: 'A\'lo darajada foydali!',
      good: 'Yaxshi foydalanish',
      acceptable: 'Qabul qilinadigan foyda',
      slow: 'Sekin foydalanish'
    }
  };

  const t = content[lang];

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

  // Two-way synchronization is handled inline in onChange and onValueChange handlers.


  return (
    <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-sm border-2 border-msc-accent/20 shadow-xl animate-fade-in hover-scale transition-all duration-300 hover:shadow-2xl hover:border-msc-accent/40 hover:bg-white">
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
           <div className="group/ctrl space-y-3 rounded-lg p-4 border border-transparent hover:border-msc-accent/30 hover:bg-msc-accent/5 transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
            <Label className="text-msc-text font-medium transition-colors group-hover/ctrl:text-msc-primary">{t.equipmentPrice}</Label>
            <div className="space-y-2">
              <Slider
                value={price}
                onValueChange={(v) => {
                  setPrice(v);
                  setManualPrice(String(v[0] ?? 0));
                }}
                max={500000}
                min={0}
                step={1000}
                className="w-full transition-all duration-300 hover:scale-[1.02]"
              />
              <div className="flex items-center space-x-2">
                <span className="text-msc-accent font-medium">{t.currency}</span>
                <Input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualPrice(val);
                    const n = parseFloat(val);
                    if (isNaN(n)) {
                      setPrice([0]);
                    } else {
                      const clamped = Math.min(500000, Math.max(0, n));
                      setPrice([clamped]);
                    }
                  }}
                  min={0}
                  max={500000}
                   className="border-msc-accent/30 focus:border-msc-accent focus-visible:ring-2 focus-visible:ring-msc-accent/40 hover:border-msc-accent/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Procedures per Month */}
           <div className="group/ctrl space-y-3 rounded-lg p-4 border border-transparent hover:border-msc-accent/30 hover:bg-msc-accent/5 transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
            <Label className="text-msc-text font-medium transition-colors group-hover/ctrl:text-msc-primary">{t.proceduresMonth}</Label>
            <div className="space-y-2">
              <Slider
                value={procedures}
                onValueChange={(v) => {
                  setProcedures(v);
                  setManualProcedures(String(v[0] ?? 0));
                }}
                max={1000}
                min={0}
                step={1}
                className="w-full transition-all duration-300 hover:scale-[1.02]"
              />
              <Input
                type="number"
                value={manualProcedures}
                onChange={(e) => {
                  const val = e.target.value;
                  setManualProcedures(val);
                  const n = parseFloat(val);
                  if (isNaN(n)) {
                    setProcedures([0]);
                  } else {
                    const clamped = Math.min(1000, Math.max(0, n));
                    setProcedures([clamped]);
                  }
                }}
                min={0}
                max={1000}
                className="border-msc-accent/30 focus:border-msc-accent focus-visible:ring-2 focus-visible:ring-msc-accent/40 hover:border-msc-accent/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm"
              />
            </div>
          </div>

          {/* Profit per Procedure */}
          <div className="group/ctrl space-y-3 rounded-lg p-4 border border-transparent hover:border-msc-accent/30 hover:bg-msc-accent/5 transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
            <Label className="text-msc-text font-medium transition-colors group-hover/ctrl:text-msc-primary">{t.profitProcedure}</Label>
            <div className="space-y-2">
              <Slider
                value={margin}
                onValueChange={(v) => {
                  setMargin(v);
                  setManualMargin(String(v[0] ?? 0));
                }}
                max={1000}
                min={0}
                step={1}
                className="w-full transition-all duration-300 hover:scale-[1.02]"
              />
              <div className="flex items-center space-x-2">
                <span className="text-msc-accent font-medium">{t.currency}</span>
                <Input
                  type="number"
                  value={manualMargin}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualMargin(val);
                    const n = parseFloat(val);
                    if (isNaN(n)) {
                      setMargin([0]);
                    } else {
                      const clamped = Math.min(1000, Math.max(0, n));
                      setMargin([clamped]);
                    }
                  }}
                  min={0}
                  max={1000}
                  className="border-msc-accent/30 focus:border-msc-accent focus-visible:ring-2 focus-visible:ring-msc-accent/40 hover:border-msc-accent/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-msc-primary/5 to-msc-accent/5 rounded-lg">
          {/* Payback Period */}
           <div className="group text-center p-4 bg-white rounded-lg shadow-sm hover-scale transition-all duration-300 border border-transparent hover:border-msc-accent/30 hover:bg-msc-accent/5 hover:shadow-md">
            <Clock className="w-8 h-8 mx-auto mb-2 text-msc-accent transition-all duration-300 group-hover:scale-110 group-hover:text-msc-primary" />
            <h3 className="font-semibold text-msc-text mb-1 transition-colors group-hover:text-msc-primary">{t.paybackPeriod}</h3>
            <p className={`text-3xl font-bold transition-colors ${getROIColor(months)}`}>
              {months} {t.months}
            </p>
            <p className={`text-sm mt-1 transition-colors ${getROIColor(months)}`}>
              {getROIText(months)}
            </p>
          </div>

          {/* Monthly Profit */}
           <div className="group text-center p-4 bg-white rounded-lg shadow-sm hover-scale transition-all duration-300 border border-transparent hover:border-msc-accent/30 hover:bg-msc-accent/5 hover:shadow-md">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-msc-accent transition-all duration-300 group-hover:scale-110 group-hover:text-msc-primary" />
            <h3 className="font-semibold text-msc-text mb-1 transition-colors group-hover:text-msc-primary">{t.monthlyProfit}</h3>
             <p className="text-2xl font-bold text-msc-primary transition-colors group-hover:text-msc-accent">
              {t.currency}{monthlyProfit.toLocaleString('ru-RU')}
            </p>
          </div>

          {/* Yearly Profit */}
          <div className="group text-center p-4 bg-white rounded-lg shadow-sm hover-scale transition-all duration-300 border border-transparent hover:border-msc-accent/30 hover:bg-msc-accent/5 hover:shadow-md">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-msc-accent transition-all duration-300 group-hover:scale-110 group-hover:text-msc-primary" />
            <h3 className="font-semibold text-msc-text mb-1 transition-colors group-hover:text-msc-primary">{t.yearlyProfit}</h3>
            <p className="text-2xl font-bold text-msc-primary transition-colors group-hover:text-msc-accent">
              {t.currency}{yearlyProfit.toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
