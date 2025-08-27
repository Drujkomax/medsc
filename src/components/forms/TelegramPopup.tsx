import React from 'react';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TelegramPopupProps {
  onClose: () => void;
}

const TelegramPopup: React.FC<TelegramPopupProps> = ({ onClose }) => {
  const { t } = useTranslation();

  const handleTelegramClick = () => {
    window.open('https://t.me/medservice_centre/7', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">
              {t('telegram.title')}
            </h2>
            <p className="text-blue-100 text-sm">
              {t('telegram.subtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('telegram.description')}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {t('telegram.description')}
            </p>
          </div>

          {/* Telegram Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Med Service Centre</div>
                <div className="text-xs text-gray-500">@medservice_centre</div>
              </div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              📊 {t('telegram.description')}
              <br />
              💡 Экспертный анализ для принятия правильного решения
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleTelegramClick}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 text-base transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('telegram.button')}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-3 text-gray-600 hover:text-gray-800 border-gray-300"
            >
              {t('telegram.skip')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramPopup;