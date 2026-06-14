import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string | null) => void;
  productId?: string;
  imageType: 'cover' | 'gallery';
  galleryIndex?: number;
}

export const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  productId, 
  imageType, 
  galleryIndex 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
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

  const uploadImage = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Create structured folder path
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${sanitizedName}`;
      const folderPath = productId
        ? `products/${productId}/${imageType === 'cover' ? 'cover' : `gallery/${galleryIndex || 0}`}`
        : `temp/products/${imageType === 'cover' ? 'cover' : `gallery/${galleryIndex || 0}`}`;
      
      const filePath = `${folderPath}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      
      toast({
        title: "Изображение загружено",
        description: "Изображение успешно загружено",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async () => {
    if (!value) return;

    try {
      // Extract file path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('product-images') + 1).join('/');

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) throw error;

      onChange(null);
      
      toast({
        title: "Изображение удалено",
        description: "Изображение успешно удалено",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить изображение",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Неверный тип файла",
          description: "Пожалуйста, выберите изображение",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер файла: 5MB",
          variant: "destructive",
        });
        return;
      }

      uploadImage(file);
    }
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      {value ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <img 
                src={value} 
                alt="Uploaded image" 
                className="w-full h-32 object-cover rounded-md"
              />
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={deleteImage}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить изображение
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <Label htmlFor={`image-${imageType}-${galleryIndex || 0}`} className="cursor-pointer">
                <Button variant="outline" disabled={uploading} asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Загрузка...' : 'Выбрать изображение'}
                  </span>
                </Button>
              </Label>
              <Input
                id={`image-${imageType}-${galleryIndex || 0}`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                Максимальный размер: 5MB<br />
                Форматы: JPG, PNG, WEBP
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};