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

interface Props {
  stage: VisitStage;
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

  const payload = stage.payload as Record<string, unknown>;

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
            {payload.name && <div><b>ФИО:</b> {String(payload.name)}</div>}
            {payload.position && <div><b>Должность:</b> {String(payload.position)}</div>}
            {payload.phone && <div><b>Телефон:</b> {String(payload.phone)}</div>}
          </div>
        )}
        {stage.stage_type === 'completion' && payload.outcome && (
          <Badge variant="secondary">{OUTCOME_LABEL[String(payload.outcome)] ?? String(payload.outcome)}</Badge>
        )}
        {stage.text_note && (
          <div className="text-sm whitespace-pre-wrap text-foreground/90 bg-muted/50 px-3 py-2 rounded">
            {stage.text_note}
          </div>
        )}
        {stage.photo_urls.length > 0 && (
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
        {!stage.text_note && stage.photo_urls.length === 0 && (
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
