import { useTranslation } from 'react-i18next';
import SEOHead from '@/components/SEO/SEOHead';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead
        title="Политика конфиденциальности — Med Service Centre"
        description="Политика конфиденциальности Med Service Centre. Информация о сборе, обработке и защите персональных данных пользователей."
        noindex={true}
      />
      <div className="bg-background min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-8">
            Политика конфиденциальности Med Service Centre
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Общие положения</h2>
              <p>
                Настоящая политика обработки персональных данных составлена в соответствии с требованиями 
                законодательства Республики Узбекистан и определяет порядок обработки персональных данных 
                и меры по обеспечению безопасности персональных данных, предпринимаемые компанией 
                Med Service Centre (далее – Оператор).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Сбор персональных данных</h2>
              <p className="mb-4">
                Оператор может собирать следующие персональные данные Пользователя через формы заявки 
                в социальных сетях (Facebook, Instagram) и на сайте:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Фамилия, Имя, Отчество;</li>
                <li>Номер телефона;</li>
                <li>Город проживания;</li>
                <li>Название клиники или организации;</li>
                <li>Должность.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Цели обработки персональных данных</h2>
              <p className="mb-4">Сбор данных осуществляется исключительно для следующих целей:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Предоставление Пользователю информации о медицинском оборудовании (коммерческие предложения, прайс-листы);</li>
                <li>Консультация по техническим характеристикам и условиям рассрочки;</li>
                <li>Заключение договоров на поставку и сервисное обслуживание оборудования.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Передача данных третьим лицам</h2>
              <p>
                Оператор обязуется не передавать полученные персональные данные третьим лицам, 
                за исключением случаев, предусмотренных законодательством Республики Узбекистан 
                (например, по запросу государственных органов), или если это необходимо для исполнения 
                обязательств перед Пользователем (например, доставка оборудования логистической компанией).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Безопасность данных</h2>
              <p>
                Оператор принимает необходимые организационные и технические меры для защиты персональной 
                информации Пользователя от неправомерного или случайного доступа, уничтожения, изменения, 
                блокирования, копирования, распространения.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Контактная информация</h2>
              <p>
                По вопросам, касающимся обработки персональных данных, Пользователь может обратиться 
                к Оператору по электронной почте:{' '}
                <a href="mailto:info@medsc.uz" className="text-msc-accent hover:underline">
                  info@medsc.uz
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
