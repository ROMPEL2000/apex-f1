export const editorialDate = '19 ноября 2026'
export const driversSource = 'https://www.formula1.com/en/drivers'
export const standingSource = 'https://www.formula1.com/en/results/2026/team'
export const driversTitleSource = 'https://www.formula1.com/en/latest/article/antonelli-crowned-youngest-ever-f1-champion-as-verstappen-wins-eventful-mexico-city-grand-prix.xpMMeef0KmRURs9IDs3LH'
export const teamTitleSource = 'https://www.formula1.com/en/latest/article/norris-beats-verstappen-in-wet-sao-paulo-gp-thriller-as-mercedes-win-constructors-championship.7JN7MXLZf5lk5l0C3gfKGI'

interface Driver {
  id: string
  name: string
  number: number
  country: string
  bio: string
  slug: string
  champion?: number
}

function driver(id: string, name: string, number: number, country: string, bio: string, slug: string, champion?: number): Driver {
  return { id, name, number, country, bio, slug, champion }
}

export interface Team {
  id: string
  label: string
  name: string
  mark: string
  accent: string
  scene: string
  base: string
  car: string
  points: number
  history: string
  fact: string
  drivers: [Driver, Driver]
  source: string
  champion?: number
}

export const teams: Team[] = [
  {
    id: 'mercedes', label: 'Mercedes', name: 'Mercedes-AMG Petronas F1 Team', mark: 'AMG', accent: '#54f6d3', scene: '#08282b', base: 'Бракли, Великобритания', car: 'W17', points: 652,
    history: 'Заводская команда Mercedes вернулась на решётку в 2010 году после покупки Brawn GP. В гибридную эпоху она выиграла восемь Кубков конструкторов подряд, с 2014 по 2021 год, а в 2026-м взяла девятый.',
    fact: 'Mercedes оформил Кубок конструкторов 2026 в Сан-Паулу, за три этапа до конца сезона.',
    drivers: [
      driver('russell', 'George Russell', 63, 'Великобритания', 'Выиграл Формулу-2 в 2018-м, начал карьеру в F1 в Williams и перешёл в Mercedes в 2022-м. Первую победу в Гран-при одержал в Сан-Паулу в том же году.', 'george-russell'),
      driver('antonelli', 'Kimi Antonelli', 12, 'Италия', 'Дебютировал за Mercedes в 2025 году. Третье место в Мехико в 2026-м принесло ему первый титул и сделало самым молодым чемпионом мира в истории F1.', 'kimi-antonelli', 2026),
    ],
    source: 'mercedes', champion: 2026,
  },
  {
    id: 'ferrari', label: 'Ferrari', name: 'Scuderia Ferrari HP', mark: 'SF', accent: '#ff775c', scene: '#3e1118', base: 'Маранелло, Италия', car: 'SF-26', points: 510,
    history: 'Scuderia выступает в чемпионате мира с 1950 года. Команда выиграла 16 Кубков конструкторов, включая серию из шести подряд с 1999 по 2004 год.',
    fact: 'Первую победу Ferrari в чемпионате мира принёс Хосе Фройлан Гонсалес на Гран-при Великобритании 1951 года.',
    drivers: [
      driver('leclerc', 'Charles Leclerc', 16, 'Монако', 'Дебютировал в F1 с Sauber в 2018 году и перешёл в Ferrari год спустя. В 2024-м выиграл домашний Гран-при Монако.', 'charles-leclerc'),
      driver('hamilton', 'Lewis Hamilton', 44, 'Великобритания', 'Семикратный чемпион мира. Первый титул выиграл с McLaren, следующие шесть — с Mercedes. Присоединился к Ferrari в 2025 году.', 'lewis-hamilton'),
    ],
    source: 'ferrari',
  },
  {
    id: 'red-bull', label: 'Red Bull Racing', name: 'Oracle Red Bull Racing', mark: 'RBR', accent: '#8da4ff', scene: '#131b45', base: 'Милтон-Кинс, Великобритания', car: 'RB22', points: 415,
    history: 'Red Bull купил Jaguar Racing и вышел на старт под собственным именем в 2005 году. Команда взяла четыре Кубка конструкторов подряд в 2010–2013 годах и ещё два в 2022–2023-м.',
    fact: 'Себастьян Феттель принёс Red Bull первую победу в Гран-при Китая 2009 года.',
    drivers: [
      driver('verstappen', 'Max Verstappen', 3, 'Нидерланды', 'Четырежды подряд стал чемпионом мира с Red Bull в 2021–2024 годах. Выиграл свой первый Гран-при за команду сразу после перехода в 2016-м.', 'max-verstappen'),
      driver('hadjar', 'Isack Hadjar', 6, 'Франция', 'Вице-чемпион Формулы-2 2024 года. В дебютном сезоне F1 поднялся на подиум с Racing Bulls в Зандворте, а в 2026-м перешёл в Red Bull Racing.', 'isack-hadjar'),
    ],
    source: 'red-bull-racing',
  },
  {
    id: 'mclaren', label: 'McLaren', name: 'McLaren Mastercard Formula 1 Team', mark: 'McL', accent: '#ffad52', scene: '#412106', base: 'Уокинг, Великобритания', car: 'MCL40', points: 398,
    history: 'Брюс Макларен основал команду в 1963 году, а её дебют в F1 состоялся в 1966-м. McLaren выиграл десять Кубков конструкторов, включая сезоны 2024 и 2025.',
    fact: 'В 1988 году Айртон Сенна и Ален Прост выиграли 15 из 16 Гран-при на McLaren MP4/4.',
    drivers: [
      driver('norris', 'Lando Norris', 1, 'Великобритания', 'Вышел на старт F1 с McLaren в 2019 году, выиграл первую гонку в Майами в 2024-м и взял личный титул сезона 2025.', 'lando-norris'),
      driver('piastri', 'Oscar Piastri', 81, 'Австралия', 'Выиграл Формулу-3 и Формулу-2 в двух сезонах подряд. Дебютировал в F1 за McLaren в 2023-м и одержал первую победу в Венгрии в 2024-м.', 'oscar-piastri'),
    ],
    source: 'mclaren',
  },
  {
    id: 'racing-bulls', label: 'Racing Bulls', name: 'Visa Cash App Racing Bulls Formula One Team', mark: 'VCARB', accent: '#a8baff', scene: '#182750', base: 'Фаэнца, Италия', car: 'VCARB 03', points: 114,
    history: 'Проект в Фаэнце вырос из Minardi. После покупки Red Bull команда выступала как Toro Rosso, затем как AlphaTauri и RB, прежде чем принять имя Racing Bulls.',
    fact: 'Обе победы предшественников пришлись на Монцу. В 2008-м выиграл Toro Rosso с Себастьяном Феттелем, в 2020-м — AlphaTauri с Пьером Гасли.',
    drivers: [
      driver('lawson', 'Liam Lawson', 30, 'Новая Зеландия', 'Впервые вышел на старт F1 в 2023 году, заменив Даниэля Риккардо в AlphaTauri. В 2025-м вернулся в коллектив из Фаэнцы после двух гонок за Red Bull Racing.', 'liam-lawson'),
      driver('lindblad', 'Arvid Lindblad', 41, 'Великобритания', 'Выпускник юниорской программы Red Bull. После Формулы-3 и Формулы-2 получил место в Racing Bulls на сезон 2026.', 'arvid-lindblad'),
    ],
    source: 'racing-bulls',
  },
  {
    id: 'alpine', label: 'Alpine', name: 'BWT Alpine Formula One Team', mark: 'A', accent: '#ff8bc8', scene: '#322143', base: 'Энстон, Великобритания', car: 'A526', points: 69,
    history: 'Имя Alpine появилось в F1 в 2021 году при переименовании заводской команды Renault. База в Энстоне также связана с Benetton и Lotus. Renault выиграла Кубок конструкторов в 2005 и 2006 годах.',
    fact: 'Первую победу под именем Alpine принёс Эстебан Окон на Гран-при Венгрии 2021 года.',
    drivers: [
      driver('gasly', 'Pierre Gasly', 10, 'Франция', 'Чемпион GP2 2016 года. Выиграл Гран-при Италии 2020 за AlphaTauri и присоединился к Alpine в 2023-м.', 'pierre-gasly'),
      driver('colapinto', 'Franco Colapinto', 43, 'Аргентина', 'Дебютировал в F1 с Williams в 2024 году и набрал первые очки уже во второй гонке. В 2025-м перешёл в Alpine.', 'franco-colapinto'),
    ],
    source: 'alpine',
  },
  {
    id: 'haas', label: 'Haas', name: 'TGR Haas F1 Team', mark: 'H', accent: '#ff8e92', scene: '#311a28', base: 'Каннаполис, США', car: 'VF-26', points: 31,
    history: 'Команда Джина Хааса дебютировала в 2016 году. Её лучший командный результат — пятое место в Кубке конструкторов 2018 года.',
    fact: 'В первой же гонке Haas заработал очки: Ромен Грожан финишировал шестым в Австралии в 2016 году.',
    drivers: [
      driver('bearman', 'Oliver Bearman', 87, 'Великобритания', 'Дебютировал в F1 за Ferrari в Саудовской Аравии в 2024 году и финишировал седьмым. В 2025-м стал основным пилотом Haas.', 'oliver-bearman'),
      driver('camara', 'Rafael Câmara', 51, 'Бразилия', 'Гонщик программы Ferrari дебютировал за Haas на домашнем этапе в Сан-Паулу в 2026 году. Команда подтвердила его участие и в Лас-Вегасе.', 'rafael-camara'),
    ],
    source: 'haas',
  },
  {
    id: 'audi', label: 'Audi', name: 'Audi Revolut F1 Team', mark: 'AUDI', accent: '#ffa08a', scene: '#302327', base: 'Хинвиль, Швейцария', car: 'R26', points: 28,
    history: 'Audi дебютировала как заводская команда в 2026 году после приобретения Sauber. Швейцарская база продолжила работу над шасси, а силовую установку разработала Audi в Нойбурге.',
    fact: 'Победа Роберта Кубицы в Канаде в 2008 году относится к BMW Sauber, предшественнику проекта Audi.',
    drivers: [
      driver('hulkenberg', 'Nico Hülkenberg', 27, 'Германия', 'Дебютировал в F1 за Williams в 2010-м. Завоевал первый подиум в Великобритании в 2025-м за Sauber и остался в составе после перехода к Audi.', 'nico-hulkenberg'),
      driver('bortoleto', 'Gabriel Bortoleto', 5, 'Бразилия', 'Выиграл Формулу-3 в 2023-м и Формулу-2 в 2024-м, оба раза в дебютном сезоне. В F1 начал с Sauber в 2025 году.', 'gabriel-bortoleto'),
    ],
    source: 'audi',
  },
  {
    id: 'williams', label: 'Williams', name: 'Atlassian Williams F1 Team', mark: 'W', accent: '#8dc3ff', scene: '#102b4c', base: 'Гроув, Великобритания', car: 'FW48', points: 12,
    history: 'Фрэнк Уильямс и Патрик Хэд основали Williams Grand Prix Engineering в 1977 году. Команда выиграла девять Кубков конструкторов, последний — в 1997 году.',
    fact: 'Первый Кубок конструкторов Williams взял в 1980-м, когда Алан Джонс выиграл и личный зачёт.',
    drivers: [
      driver('sainz', 'Carlos Sainz', 55, 'Испания', 'Начинал в Toro Rosso, затем выступал за Renault, McLaren и Ferrari. Первую победу взял в Сильверстоуне в 2022-м, в Williams перешёл в 2025-м.', 'carlos-sainz'),
      driver('albon', 'Alex Albon', 23, 'Таиланд', 'Дебютировал в F1 в 2019 году и дважды поднимался на подиум за Red Bull в 2020-м. В Williams выступает с 2022-го.', 'alexander-albon'),
    ],
    source: 'williams',
  },
  {
    id: 'aston-martin', label: 'Aston Martin', name: 'Aston Martin Aramco Formula One Team', mark: 'AM', accent: '#b8e77a', scene: '#122d23', base: 'Сильверстоун, Великобритания', car: 'AMR26', points: 7,
    history: 'Современный Aston Martin появился в 2021 году после переименования Racing Point. История этого коллектива в Сильверстоуне восходит к Jordan, дебютировавшей в 1991-м.',
    fact: 'Победа Серхио Переса в Сахире в 2020-м была одержана под именем Racing Point.',
    drivers: [
      driver('alonso', 'Fernando Alonso', 14, 'Испания', 'Двукратный чемпион мира с Renault в 2005 и 2006 годах. В Aston Martin перешёл в 2023-м и в первом сезоне восемь раз финишировал на подиуме.', 'fernando-alonso'),
      driver('stroll', 'Lance Stroll', 18, 'Канада', 'В дебютном сезоне F1 поднялся на подиум в Баку за Williams. За Racing Point взял поул на дождевой квалификации в Турции в 2020 году.', 'lance-stroll'),
    ],
    source: 'aston-martin',
  },
  {
    id: 'cadillac', label: 'Cadillac', name: 'Cadillac Formula 1 Team', mark: 'CAD', accent: '#eacc91', scene: '#302725', base: 'Сильверстоун, Великобритания', car: 'MAC-26', points: 0,
    history: 'Cadillac вышла на старт в 2026-м как новая, одиннадцатая команда чемпионата. Проект поддерживает General Motors.',
    fact: 'В дебютном сезоне Cadillac использует силовые установки Ferrari, пока General Motors готовит собственный двигатель.',
    drivers: [
      driver('perez', 'Sergio Pérez', 11, 'Мексика', 'Выиграл первый Гран-при с Racing Point в 2020 году и стал вице-чемпионом с Red Bull в 2023-м. Присоединился к Cadillac в её дебютном сезоне.', 'sergio-perez'),
      driver('bottas', 'Valtteri Bottas', 77, 'Финляндия', 'Выиграл десять Гран-при за Mercedes и дважды стал вице-чемпионом. После выступлений за Sauber присоединился к Cadillac в 2026-м.', 'valtteri-bottas'),
    ],
    source: 'cadillac',
  },
]

