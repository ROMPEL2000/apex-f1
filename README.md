# APEX — Formula 1

Русскоязычный независимый фан-проект о Формуле-1. [Открыть сайт](https://rompel2000.github.io/apex-f1/).

- Календарь с отсчётом до ближайшей сессии, расписанием уик-эндов и переключением между часовым поясом посетителя и трассы.
- 11 команд и 22 пилота. Команды переключаются кнопками, клавишами ←/→ при фокусе в разделе или горизонтальным свайпом по сцене. Ссылка на команду или пилота работает после перезагрузки.
- Адаптивная вёрстка, поддержка уменьшенного движения, оптимизированные фотографии и видео по нажатию.

## Локальный запуск

Требуются Node.js 24 и npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

React, TypeScript, Vite и Motion. Приложение статическое. Относительная база Vite обслуживает корень и подпапки GitHub Pages, маршруты используют URL-фрагменты. GitHub Actions собирает и публикует `dist/` при изменениях в ветке `main`. В Settings → Pages выбран источник **GitHub Actions**.

## Источники и обновление

- **Расписание** — [Jolpica F1](https://api.jolpi.ca/ergast/f1/2026/races/), [условия](https://github.com/jolpica/jolpica-f1/blob/main/TERMS.md), [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). 19 ноября 2026 проверены 23 этапа, времена ближайших сессий и браузерный доступ с заголовком CORS. Лимиты общей службы — [4 запроса в секунду и 500 в час на IP](https://github.com/jolpica/jolpica-f1/blob/main/docs/rate_limits.md). Сайт проверяет API при открытии, каждые 15 минут на видимой вкладке и при возврате на вкладку с интервалом не менее минуты. При ошибке сохраняет последнее успешное расписание. Встроенная копия сезона 2026 получена 19 ноября в 06:32 UTC. Календарь показывает время проверки и статус копии. Показанные данные — расписание сессий.
- **Сверка** — [календарь Formula 1](https://www.formula1.com/en/racing/2026), [Лас-Вегас](https://www.formula1.com/en/racing/2026/las-vegas), [Катар](https://www.formula1.com/en/racing/2026/qatar), [Абу-Даби](https://www.formula1.com/en/racing/2026/united-arab-emirates).
- **Составы и статистика** — [пилоты](https://www.formula1.com/en/drivers), [команды](https://www.formula1.com/en/teams), [Кубок конструкторов](https://www.formula1.com/en/results/2026/team) и [состав Haas на Лас-Вегас](https://www.formula1.com/en/latest/article/haas-confirm-camara-to-race-for-the-team-in-las-vegas-as-hirakawa-returns-for-fp1-appearance.2as7TuSF4UHgXczZlu4245). Снимок на 19 ноября 2026. Ссылки на профили и исторические источники есть в каждом разделе команды. Для следующего сезона редакционный раздел потребует обновления.
- **Титулы** — [Кими Антонелли, Мехико](https://www.formula1.com/en/latest/article/antonelli-crowned-youngest-ever-f1-champion-as-verstappen-wins-eventful-mexico-city-grand-prix.xpMMeef0KmRURs9IDs3LH) и [Mercedes, Сан-Паулу](https://www.formula1.com/en/latest/article/norris-beats-verstappen-in-wet-sao-paulo-gp-thriller-as-mercedes-win-constructors-championship.7JN7MXLZf5lk5l0C3gfKGI), оба титула 2026 года.

## Медиа

Исходные файлы, авторы, лицензии и изменения перечислены в [реестре медиа](src/media.json) и в подвале сайта. Фотографии Wikimedia Commons оптимизированы в WebP. [Видео прогревочного круга](https://commons.wikimedia.org/wiki/File:2021_Russian_Grand_Prix_-_start_for_warm-up.webm) — rubin16, CC BY-SA 4.0. Локальный ролик обрезан и перекодирован без звука под той же лицензией. Некоторые портреты сделаны в предыдущих сезонах. Товарные знаки принадлежат их владельцам.

