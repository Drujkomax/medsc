import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductImageUploadProps {
  images: {
    cover: string | null;
    gallery: string[];
  };
  onImagesChange: (images: { cover: string | null; gallery: string[] } | ((prev: { cover: string | null; gallery: string[] }) => { cover: string | null; gallery: string[] })) => void;
}

export const ProductImageUpload = ({ images, onImagesChange }: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState<{ cover?: boolean; gallery?: boolean }>({});
  const { toast } = useToast();

  const sanitizeFileName = (fileName: string): string => {
    // Remove file extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
    
    // Replace cyrillic and special characters with transliteration or remove them
    const sanitized = name
      .replace(/[а-яА-ЯёЁ\s]/g, '_') // Replace cyrillic and spaces with underscore
      .replace(/[^a-zA-Z0-9_-]/g, '') // Remove any other special characters
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    return sanitized + extension;
  };

  const uploadImage = async (file: File, type: 'cover' | 'gallery') => {
    console.log('Starting image upload:', { fileName: file.name, type, currentImages: images });
    setUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${sanitizedName}`;
      const filePath = `products/${type}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      if (type === 'cover') {
        onImagesChange((prev) => ({ ...prev, cover: publicUrl }));
        console.log('Updating cover image');
      } else {
        onImagesChange((prev) => ({ ...prev, gallery: [...prev.gallery, publicUrl] }));
        console.log('Adding to gallery');
      }

      toast({
        title: 'Успех!',
        description: 'Изображение загружено'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Ошибка загрузки'
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle>Обложка товара</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {images.cover ? (
            <div className="relative overflow-hidden rounded-lg">
              <img src={images.cover} alt="Обложка" className="w-full h-48 object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => onImagesChange({ ...images, cover: null })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <Button
                type="button"
                variant="outline"
                disabled={uploading.cover}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) uploadImage(file, 'cover');
                  };
                  input.click();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading.cover ? 'Загружаем...' : 'Загрузить обложку'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Галерея изображений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {images.gallery.map((url, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg">
                <img src={url} alt={`Галерея ${index + 1}`} className="w-full h-24 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1"
                  onClick={() => {
                    const newGallery = images.gallery.filter((_, i) => i !== index);
                    onImagesChange({ ...images, gallery: newGallery });
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={uploading.gallery}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.multiple = true;
              input.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                files.forEach(file => uploadImage(file, 'gallery'));
              };
              input.click();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading.gallery ? 'Загружаем...' : 'Добавить в галерею'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};