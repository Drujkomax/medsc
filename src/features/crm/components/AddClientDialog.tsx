import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/types/crm';
import { toast } from 'sonner';

const clientSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientDialogProps {
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddClientDialog = ({ client, open, onOpenChange }: AddClientDialogProps) => {
  const { t } = useTranslation();
  const { addClient, updateClient } = useClients();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      company: client?.company || '',
      notes: client?.notes || '',
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (client) {
        await updateClient(client.id, {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          company: data.company || undefined,
          notes: data.notes || undefined,
        });
        toast.success(t('clients.updated'));
      } else {
        await addClient({
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          company: data.company || undefined,
          notes: data.notes || undefined,
        });
        toast.success(t('clients.added'));
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(t('common.error'));
      console.error('Error saving client:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {client ? t('clients.editClient') : t('clients.addClient')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clients.name')} *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя клиента" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clients.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="client@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clients.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+998 90 123 45 67" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clients.company')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Название компании" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Дополнительная информация..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {client ? t('common.save') : t('clients.addClient')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;