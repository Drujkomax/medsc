import type { Metadata } from "next";
import { SITE_URL } from "~/shared/config/site";
import { socialMeta } from "~/shared/config/seo";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Med Service Centre",
  description:
    "Политика конфиденциальности Med Service Centre. Информация о сборе, обработке и защите персональных данных пользователей.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  robots: { index: true, follow: true },
  ...socialMeta({
    title: "Политика конфиденциальности — Med Service Centre",
    description:
      "Политика конфиденциальности Med Service Centre. Информация о сборе, обработке и защите персональных данных пользователей.",
    url: `${SITE_URL}/privacy-policy`,
  }),
};

export default function PrivacyPolicyPage() {
  const canonical = `${SITE_URL}/privacy-policy`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Политика конфиденциальности — Med Service Centre",
      description:
        "Политика конфиденциальности Med Service Centre. Информация о сборе, обработке и защите персональных данных пользователей.",
      url: canonical,
      inLanguage: "ru",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Политика конфиденциальности", item: canonical },
      ],
    },
  ];
  return (
    <div className="bg-background py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">
          Политика конфиденциальности Med Service Centre
        </h1>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">1. Общие положения</h2>
            <p>
              Настоящая политика обработки персональных данных составлена в соответствии с требованиями
              законодательства Республики Узбекистан и определяет порядок обработки персональных данных и меры по
              обеспечению безопасности персональных данных, предпринимаемые компанией Med Service Centre (далее —
              Оператор).
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Сбор персональных данных</h2>
            <p className="mb-4">
              Оператор может собирать следующие персональные данные Пользователя через формы заявки в социальных
              сетях (Facebook, Instagram) и на сайте:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>Фамилия, Имя, Отчество;</li>
              <li>Номер телефона;</li>
              <li>Город проживания;</li>
              <li>Название клиники или организации;</li>
              <li>Должность.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">3. Цели обработки персональных данных</h2>
            <p className="mb-4">Сбор данных осуществляется исключительно для следующих целей:</p>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Предоставление Пользователю информации о медицинском оборудовании (коммерческие предложения,
                прайс-листы);
              </li>
              <li>Консультация по техническим характеристикам и условиям рассрочки;</li>
              <li>Заключение договоров на поставку и сервисное обслуживание оборудования.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Передача данных третьим лицам</h2>
            <p>
              Оператор обязуется не передавать полученные персональные данные третьим лицам, за исключением случаев,
              предусмотренных законодательством Республики Узбекистан (например, по запросу государственных органов),
              или если это необходимо для исполнения обязательств перед Пользователем (например, доставка
              оборудования логистической компанией).
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Безопасность данных</h2>
            <p>
              Оператор принимает необходимые организационные и технические меры для защиты персональной информации
              Пользователя от неправомерного или случайного доступа, уничтожения, изменения, блокирования,
              копирования, распространения.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Контактная информация</h2>
            <p>
              По вопросам, касающимся обработки персональных данных, Пользователь может обратиться к Оператору по
              электронной почте:{" "}
              <a href="mailto:info@medsc.uz" className="font-medium text-primary hover:underline">
                info@medsc.uz
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
