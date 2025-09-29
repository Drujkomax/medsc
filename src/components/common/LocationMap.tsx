import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LocationMap: React.FC = () => {
  const { i18n } = useTranslation();
  
  // Tashkent, Uzbekistan coordinates
  const latitude = 41.2995;
  const longitude = 69.2401;
  
  const content = {
    ru: {
      title: 'Med Service Centre',
      address: 'г. Ташкент, Узбекистан',
      description: 'Наш офис находится в центре Ташкента',
      openInMaps: 'Открыть в картах',
      getDirections: 'Построить маршрут'
    },
    en: {
      title: 'Med Service Centre', 
      address: 'Tashkent, Uzbekistan',
      description: 'Our office is located in the center of Tashkent',
      openInMaps: 'Open in Maps',
      getDirections: 'Get Directions'
    },
    uz: {
      title: 'Med Service Centre',
      address: 'Toshkent, O\'zbekiston', 
      description: 'Bizning ofisimiz Toshkent markazida joylashgan',
      openInMaps: 'Xaritada ochish',
      getDirections: 'Yo\'lni ko\'rsatish'
    }
  };
  
  const currentContent = content[i18n.language as 'ru' | 'en' | 'uz'] || content['ru'];

  const handleOpenInMaps = () => {
    // Try to open in user's preferred map app
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      // iOS devices - try Apple Maps first, fallback to Google Maps
      const appleUrl = `maps://maps.google.com/maps?q=${latitude},${longitude}`;
      const googleUrl = `https://yandex.uz/maps/10335/tashkent/house/YkAYdQdhTE0DQFprfX9wd35iZA==/?ll=69.301972%2C41.316221&z=19.32`;
      
      window.location.href = appleUrl;
      // Fallback to Google Maps if Apple Maps doesn't open
      setTimeout(() => {
        window.open(googleUrl, '_blank');
      }, 1000);
    } else {
      // Android and desktop - open Google Maps
      const url = `https://maps.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=16`;
      window.open(url, '_blank');
    }
  };

  const handleGetDirections = () => {
    // Get directions based on device
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      // iOS devices
      const appleUrl = `maps://maps.google.com/maps?daddr=${latitude},${longitude}&dirflg=d`;
      const googleUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}&dirflg=d`;
      
      window.location.href = appleUrl;
      setTimeout(() => {
        window.open(googleUrl, '_blank');
      }, 1000);
    } else {
      // Android and desktop
      const url = `https://maps.google.com/maps?daddr=${latitude},${longitude}&dirflg=d`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl border border-border/20 bg-background">
      {/* Map Container */}
      <div className="relative h-[400px] w-full">
        {/* Embedded OpenStreetMap */}
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          title="Med Service Centre Location"
          className="rounded-t-xl"
        />
        
        {/* Overlay with company info */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-border/20 max-w-xs">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground mb-1">
                {currentContent.title}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {currentContent.address}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentContent.description}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-6 bg-card border-t">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleOpenInMaps}
            className="flex-1 bg-msc-primary hover:bg-msc-accent text-white"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {currentContent.openInMaps}
          </Button>
          <Button 
            onClick={handleGetDirections}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {currentContent.getDirections}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;