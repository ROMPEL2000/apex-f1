# APEX — Formula 1

Независимый русскоязычный фан-проект. [Опубликованная версия](https://rompel2000.github.io/apex-f1/) работает на GitHub Pages. Кинематографичная переработка подготовлена в ветке `redesign/cinematic`.

## Запуск и публикация

Требуются Node.js 24 и npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview -- --base /apex-f1/
```

Приложение на React, TypeScript, Vite и Motion. Production-сборка использует относительные пути, а навигация и ссылки на пилотов работают через фрагменты URL. После одобрения предпросмотра обновление `main` запускает существующий workflow GitHub Pages. Последняя опубликованная до переработки версия сохранена в коммите [`0eaadca`](https://github.com/ROMPEL2000/apex-f1/commit/0eaadcaaf310c5aa30690924b79fcd15708958fe).

## Сцены и спортивные данные

- 11 сцен команд и 22 портрета сезона 2026. Положение прокрутки управляет движением слоёв в обоих направлениях. На небольших экранах используется короткая вертикальная композиция. Годы болидов и составов подписаны отдельно от выбранного сезона зачёта.
- Календарь, личный зачёт, Кубок конструкторов и классификации сессий читают разные конечные точки [Jolpica F1](https://api.jolpi.ca/docs/). Сезон общий для спортивных разделов. Сцены берут места, очки и победы из того же командного зачёта. Команды пилотов и места берутся из классификации источника.
- 19 ноября 2026 проверены CORS, полнота текущих зачётов и получение результатов гонок и спринтов. [Условия Jolpica](https://github.com/jolpica/jolpica-f1/blob/main/TERMS.md) разрешают некоммерческое использование под [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). [Лимиты](https://github.com/jolpica/jolpica-f1/blob/main/docs/rate_limits.md) составляют 4 запроса в секунду и 500 в час на IP. Вкладка проверяет используемые данные каждые 15 минут и при возвращении к просмотру с минимальным интервалом в минуту. Запросы к источнику распределяются во времени.
- Дата проверки соединения отделена от номера этапа, на котором заканчивается зачёт. Источник не гарантирует срок появления классификации. Пустой результат после старта не считается опубликованным. Даты уик-энда показаны по времени трассы, время сессий переключается между поясами посетителя и трассы.
- При сбое используется последняя проверенная копия из браузера или резервные JSON за 2025–2026. Обновить файлы можно командой `node scripts/refresh-sport.mjs`. Сезон 2027 доступен в переключателе, но на дату проверки Jolpica ещё не отдавал его календарь и зачёты. В интерфейсе есть ссылка на официальный календарь Formula 1.
- [Составы пилотов](https://www.formula1.com/en/drivers), [пилоты Haas на Лас-Вегас](https://www.formula1.com/en/latest/article/haas-confirm-camara-to-race-for-the-team-in-las-vegas-as-hirakawa-returns-for-fp1-appearance.2as7TuSF4UHgXczZlu4245), [личный титул Кими Антонелли](https://www.formula1.com/en/latest/article/antonelli-crowned-youngest-ever-f1-champion-as-verstappen-wins-eventful-mexico-city-grand-prix.xpMMeef0KmRURs9IDs3LH) и [Кубок конструкторов Mercedes](https://www.formula1.com/en/latest/article/norris-beats-verstappen-in-wet-sao-paulo-gp-thriller-as-mercedes-win-constructors-championship.7JN7MXLZf5lk5l0C3gfKGI) сверены 19 ноября 2026. В карточках Red Bull Racing и Racing Bulls стоят текстовые обозначения.

## Контуры трасс

26 уникальных схем покрывают все этапы 2025 и 2026. Сопоставление использует `circuitId` Jolpica и год, а не название Гран-при. Например, этап «Бахрейн» в 2026 году использует [Sepang в Малайзии](https://www.formula1.com/en/racing/2026/bahrain). Схемы, размер круга и число поворотов воспроизводятся командой `python scripts/prepare-tracks.py`.

- Основные SVG выполнены Jules Roy и [получены из архива F1DB](https://github.com/f1db/f1-circuits-svg/tree/c1bcd6fcb1b6fdb662136daa6bc19f3a2f870f65). Лицензия [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). При импорте переокрашены отметки старта/финиша и направления.
- Длины, повороты и направление взяты из [F1DB](https://github.com/f1db/f1db/tree/7731345ffc121487d73afbf6dd3896718862b157/src/data/circuits), лицензия CC BY 4.0. Для Мадрида используется [длина, указанная организатором гонки](https://www.formula1.com/en/latest/article/need-to-know-the-most-important-facts-stats-and-trivia-ahead-of-the-2026-spanish-grand-prix-madrid-madring.0VbYQHCnrBCibxbkwygP0).
- Имола и Сепанг построены по [GeoJSON Tomislav Bacinger](https://github.com/bacinger/f1-circuits/tree/8094e957b8d6aa8b9f4510c93968556cccd30e02), лицензия [MIT](public/tracks/LICENSE-bacinger.md). Начало и направление показаны схематически по последовательности координат.

## Медиа и фоновая заставка

Источники, авторы и лицензии фотографий перечислены в [реестре медиа](src/media.json) и на сайте. Портреты с естественным фоном кадрированы и замаскированы средствами CSS. Исходные файлы сохранены в WebP.

Полноэкранная заставка использует [Red Bull RB22 Live Wallpaper от Rekai](https://www.youtube.com/watch?v=aYdrQp5l-zA) и [векторный знак Formula 1 с отметкой ™](https://commons.wikimedia.org/wiki/File:F1.svg). Владелец проекта подтвердил разрешение на публикацию обоих материалов. Логотип — товарный знак Formula One Licensing B.V. APEX является независимым фан-проектом.

Для ролика подготовлен зацикленный фрагмент без звука. Версии 2160p (AV1), 1080p и 480p (H.264) перечислены в [манифесте заставки](src/hero-video.json). Ролик загружает один вариант с учётом размера экрана, декодера и экономии трафика. При уменьшенном движении и ошибках остаётся обложка.
