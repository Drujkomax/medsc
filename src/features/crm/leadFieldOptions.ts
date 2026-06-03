/**
 * Единый источник опций для квалификационных полей лида.
 *
 * Раньше AddLeadDialog, EditLeadModal, EditLeadForm и UnifiedLeadModal держали
 * РАЗНЫЕ наборы значений для budget_range / timeline / equipment_interest. Из-за
 * этого лид, созданный в одной форме, в другой показывался пустым Select'ом, а
 * при сохранении значение терялось. Здесь — общий супермножественный список,
 * покрывающий все исторические значения, чтобы данные всегда «ходили» туда-обратно.
 */
export interface FieldOption {
  value: string;
  label: string;
}

// Бюджет — объединение всех значений, что когда-либо использовали формы.
export const BUDGET_RANGES: FieldOption[] = [
  { value: "under_50k", label: "До $50,000" },
  { value: "3k_5k", label: "$3,000 - $5,000" },
  { value: "5k_10k", label: "$5,000 - $10,000" },
  { value: "10k_50k", label: "$10,000 - $50,000" },
  { value: "50k_100k", label: "$50,000 - $100,000" },
  { value: "100k_500k", label: "$100,000 - $500,000" },
  { value: "500k_1m", label: "$500,000 - $1,000,000" },
  { value: "over_500k", label: "Свыше $500,000" },
  { value: "over_1m", label: "Свыше $1,000,000" },
  { value: "not_specified", label: "Не указан" },
  { value: "not_disclosed", label: "Не раскрыт" },
];

export const TIMELINES: FieldOption[] = [
  { value: "immediate", label: "Немедленно" },
  { value: "1_month", label: "В течение месяца" },
  { value: "within_month", label: "В течение месяца" },
  { value: "3_months", label: "В течение 3 месяцев" },
  { value: "within_quarter", label: "В течение квартала" },
  { value: "6_months", label: "В течение 6 месяцев" },
  { value: "half_year", label: "В течение полугода" },
  { value: "1_year", label: "В течение года" },
  { value: "within_year", label: "В течение года" },
  { value: "over_year", label: "Более года" },
  { value: "research", label: "Пока изучаем рынок" },
  { value: "not_specified", label: "Не указан" },
];

export const EQUIPMENT_TYPES: FieldOption[] = [
  { value: "mrt_mskt", label: "МРТ и МСКТ оборудование" },
  { value: "mri", label: "МРТ оборудование" },
  { value: "ct", label: "КТ оборудование" },
  { value: "ultrasound", label: "УЗИ оборудование" },
  { value: "xray", label: "Рентген оборудование" },
  { value: "gynecology", label: "Гинекологическое оборудование" },
  { value: "laboratory", label: "Лабораторное оборудование" },
  { value: "surgical", label: "Хирургическое оборудование" },
  { value: "physiotherapy", label: "Физиотерапевтическое оборудование" },
  { value: "resuscitation", label: "Реанимационное оборудование" },
  { value: "anesthesia", label: "Оборудование для анестезии" },
  { value: "monitoring", label: "Мониторинговое оборудование" },
  { value: "rehabilitation", label: "Реабилитационное оборудование" },
  { value: "other", label: "Другое" },
];

// Этапы лида — единый список и цвета, общие для таблицы и модалок (раньше
// расходились цвета и подписи «Отказ»/«Потерян», «Успешно/Отказ» и т.п.).
export interface StageOption extends FieldOption {
  color: string; // классы фона/текста для бейджа/триггера
  dot: string; // класс цвета точки в статистике
}

export const LEAD_STAGES: StageOption[] = [
  { value: "new", label: "Новый", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  { value: "contacted", label: "Связались", color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  { value: "qualified", label: "Квалифицирован", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  { value: "proposal", label: "Отправил КП", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  { value: "negotiation", label: "Переговоры", color: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-500" },
  { value: "closed", label: "Успешно", color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  { value: "lost", label: "Отказ", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
];

export const stageLabel = (value?: string | null): string =>
  LEAD_STAGES.find((s) => s.value === value)?.label ?? value ?? "";

export const stageColor = (value?: string | null): string =>
  LEAD_STAGES.find((s) => s.value === value)?.color ?? "bg-gray-100 text-gray-800 border-gray-200";

export const labelFor = (options: FieldOption[], value?: string | null): string =>
  options.find((o) => o.value === value)?.label ?? value ?? "";

/**
 * Гарантирует, что текущее (возможно «легаси») значение присутствует в списке
 * опций Select — иначе Radix Select показал бы пусто и при сохранении значение
 * молча потерялось бы.
 */
export const withCurrentValue = (options: FieldOption[], value?: string | null): FieldOption[] => {
  if (!value || options.some((o) => o.value === value)) return options;
  return [...options, { value, label: value }];
};

/**
 * Локальная "yyyy-MM-ddTHH:mm" строка для <input type="datetime-local">.
 * new Date().toISOString() даёт UTC и сдвигает время на часовой пояс
 * (для Узбекистана −5 часов) — этот хелпер берёт ЛОКАЛЬНое время.
 */
export const toDatetimeLocal = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};
