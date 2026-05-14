import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon } from 'lucide-react';
import type { VisitStage } from './types';
import { getSignedPhotoUrl } from './useVisits';

const STAGE_LABELS: Record<string, string> = {
  arrival: '1. Подход к клинике',
  specialist: '2. Контакт со специалистом',
  briefing: '3. Брифинг',
  completion: '4. Завершение',
};

const OUTCOME_LABEL: Record<string, string> = {
  success: 'Успех',
  interested: 'Интерес',
  rejected: 'Отказ',
  postponed: 'Перенос',
};

const BRIEFING_CATEGORY_LABEL: Record<string, string> = {
  diagnostic: '🩺 Диагностика',
  laboratory: '🧪 Лаборатория',
  dental: '🦷 Стоматология',
};

const EQUIPMENT_LABEL: Record<string, string> = {
  mrt_mskt: 'МРТ/МСКТ',
  ultrasound: 'УЗИ',
  xray: 'Рентген',
  gynecology: 'Гинекология',
  laboratory: 'Лаборатория',
  surgical: 'Хирургия',
  physiotherapy: 'Физиотерапия',
  resuscitation: 'Реанимация',
  other: 'Другое',
};

const BUDGET_LABEL: Record<string, string> = {
  '3k_5k': '$3k–$5k',
  '5k_10k': '$5k–$10k',
  '10k_50k': '$10k–$50k',
  '50k_100k': '$50k–$100k',
  '100k_500k': '$100k–$500k',
  over_500k: 'Свыше $500k',
  not_specified: 'Не указано',
};

const TIMELINE_LABEL: Record<string, string> = {
  immediate: 'Срочно',
  '1_month': '1 месяц',
  '3_months': '3 месяца',
  '6_months': '6 месяцев',
  '1_year': '1 год',
  not_specified: 'Не указано',
};

const QUALITY_LABEL: Record<string, string> = {
  A: 'A — целевой',
  B: 'B — потенциальный',
  C: 'C — холодный',
};

interface Props {
  stage: VisitStage;
}

type BriefingAnswer = { q?: string; a?: string | null };

function hasPayloadContent(stageType: string, payload: Record<string, unknown>): boolean {
  if (stageType === 'specialist') {
    return [
      'name',
      'position',
      'phone',
      'email',
      'equipment_interest',
      'budget_range',
      'timeline',
      'lead_quality',
    ].some((k) => payload[k]);
  }
  if (stageType === 'briefing') {
    const answers = payload.answers;
    return Boolean(payload.category) || (Array.isArray(answers) && answers.length > 0);
  }
  if (stageType === 'completion') {
    return Boolean(payload.outcome);
  }
  return false;
}

export default function VisitStageCard({ stage }: Props) {
  const [urls, setUrls] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(stage.photo_urls.map((p) => getSignedPhotoUrl(p))).then((arr) => {
      if (!cancelled) setUrls(arr.filter(Boolean) as string[]);
    });
    return () => {
      cancelled = true;
    };
  }, [stage.photo_urls]);

  const time = new Date(stage.completed_at).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const payload = (stage.payload ?? {}) as Record<string, unknown>;
  const briefingAnswers = Array.isArray(payload.answers) ? (payload.answers as BriefingAnswer[]) : [];
  const showPhotos = stage.stage_type !== 'briefing' && stage.photo_urls.length > 0;
  const isEmpty =
    !stage.text_note &&
    !hasPayloadContent(stage.stage_type, payload) &&
    !showPhotos;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{STAGE_LABELS[stage.stage_type] ?? stage.stage_type}</span>
          <span className="text-xs text-muted-foreground font-normal">{time}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stage.stage_type === 'specialist' && (
          <div className="text-sm space-y-1">
            {payload.name && (
              <div>
                <b>ФИО:</b> {String(payload.name)}
              </div>
            )}
            {payload.position && (
              <div>
                <b>Должность:</b> {String(payload.position)}
              </div>
            )}
            {payload.phone && (
              <div>
                <b>Телефон:</b> {String(payload.phone)}
              </div>
            )}
            {payload.email && (
              <div>
                <b>Email:</b> {String(payload.email)}
              </div>
            )}
            {payload.equipment_interest && (
              <div>
                <b>Оборудование:</b>{' '}
                {EQUIPMENT_LABEL[String(payload.equipment_interest)] ?? String(payload.equipment_interest)}
              </div>
            )}
            {payload.budget_range && (
              <div>
                <b>Бюджет:</b>{' '}
                {BUDGET_LABEL[String(payload.budget_range)] ?? String(payload.budget_range)}
              </div>
            )}
            {payload.timeline && (
              <div>
                <b>Сроки:</b>{' '}
                {TIMELINE_LABEL[String(payload.timeline)] ?? String(payload.timeline)}
              </div>
            )}
            {payload.lead_quality && (
              <div>
                <b>Качество лида:</b>{' '}
                {QUALITY_LABEL[String(payload.lead_quality)] ?? String(payload.lead_quality)}
              </div>
            )}
          </div>
        )}

        {stage.stage_type === 'briefing' && (
          <div className="space-y-3">
            {typeof payload.category === 'string' && (
              <Badge variant="secondary">
                {BRIEFING_CATEGORY_LABEL[payload.category] ?? payload.category}
              </Badge>
            )}
            {briefingAnswers.length > 0 && (
              <ol className="space-y-2.5 text-sm list-decimal pl-5 marker:text-muted-foreground">
                {briefingAnswers.map((item, i) => (
                  <li key={i} className="space-y-0.5">
                    <div className="text-muted-foreground text-xs">
                      {item.q ?? `Вопрос ${i + 1}`}
                    </div>
                    <div
                      className={
                        item.a
                          ? 'text-foreground whitespace-pre-wrap'
                          : 'text-muted-foreground italic'
                      }
                    >
                      {item.a ? item.a : '— пропущено —'}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {stage.stage_type === 'completion' && payload.outcome && (
          <Badge variant="secondary">
            {OUTCOME_LABEL[String(payload.outcome)] ?? String(payload.outcome)}
          </Badge>
        )}

        {stage.text_note && (
          <div className="text-sm whitespace-pre-wrap text-foreground/90 bg-muted/50 px-3 py-2 rounded">
            {stage.text_note}
          </div>
        )}

        {showPhotos && (
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <ImageIcon className="w-3 h-3 mr-1" />
              {stage.photo_urls.length} фото
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {urls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightbox(url)}
                  className="aspect-square rounded overflow-hidden bg-muted hover:opacity-80 transition"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="text-xs text-muted-foreground italic">Заметок и фото нет.</div>
        )}
      </CardContent>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </Card>
  );
}
