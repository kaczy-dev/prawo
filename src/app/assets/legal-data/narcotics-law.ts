import { PenalArticle } from '../../models/legal.model';

export const narcoticsLawArticles: PenalArticle[] = [
  {
    id: 'art-53-uopn',
    number: 53,
    codePrefix: 'UoPN',
    title: 'Wytwarzanie, przetwarzanie lub przerabianie środków odurzających',
    chapter: 'Przepisy karne (Ustawa o przeciwdziałaniu narkomanii)',
    chapterNumber: 'Rozdział 7 (UoPN)',
    content: `Art. 53. 1. Kto, wbrew przepisom ustawy, wytwarza, przetwarza albo przerabia środki odurzające lub substancje psychotropowe albo przetwarza słomę makową, podlega karze pozbawienia wolności do lat 3.
2. Jeżeli przedmiotem czynu jest znaczna ilość środków odurzających, substancji psychotropowych albo słomy makowej, lub czyn ten został popełniony w celu osiągnięcia korzyści majątkowej lub osobistej, sprawca podlega karze pozbawienia wolności na czas nie krótszy od lat 3 (zbrodnia, do lat 20).`,
    plainSummary: 'Produkcja, wytwarzanie chemiczne (np. metamfetamina, mefedron) lub ekstrakcja narkotyków. Wytwarzanie znacznej ilości to zbrodnia z dolną granicą 3 lat pozbawienia wolności.',
    penalties: {
      fine: false,
      restrictionOfLiberty: false,
      imprisonmentMinMonths: 1,
      imprisonmentMaxMonths: 36,
      summary: 'Kara do 3 lat pozbawienia wolności. Typ kwalifikowany (znaczna ilość / korzyść majątkowa) – zbrodnia: od 3 do 20 lat więzienia.',
    },
    additionalSanctions: [
      'Przepadek aparatury i prekursorów',
      'Nawiązka na cele zapobiegania narkomanii do 50 000 zł',
    ],
    isFelony: false,
    keywords: ['produkcja narkotyków', 'wytwarzanie', 'laboratorium', 'zbrodnia', 'art 53 uopn', 'mefedron'],
    isOfflinePinned: false,
  },
  {
    id: 'art-55-uopn',
    number: 55,
    codePrefix: 'UoPN',
    title: 'Nielegalny przywóz, wywóz lub przewóz narkotyków (Przemyt)',
    chapter: 'Przepisy karne (Ustawa o przeciwdziałaniu narkomanii)',
    chapterNumber: 'Rozdział 7 (UoPN)',
    content: `Art. 55. 1. Kto, wbrew przepisom ustawy, dokonuje przywozu, wywozu, wewnątrzwspólnotowego nabycia, wewnątrzwspólnotowej dostawy lub przewozu środków odurzających, substancji psychotropowych, nowych substancji psychoaktywnych lub słomy makowej, podlega grzywnie i karze pozbawienia wolności do lat 5.
2. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.
3. Jeżeli przedmiotem czynu jest znaczna ilość (...) sprawca podlega karze pozbawienia wolności na czas nie krótszy od lat 3 (zbrodnia).`,
    plainSummary: 'Przemyt narkotyków przez granicę państwową, także w ramach UE (nawet zamówienie pocztowe z zagranicy lub przewóz z Holandii/Czech). Przy znacznej ilości stanowi zbrodnię.',
    penalties: {
      fine: true,
      restrictionOfLiberty: true,
      imprisonmentMinMonths: 1,
      imprisonmentMaxMonths: 60,
      summary: 'Grzywna i pozbawienie wolności do 5 lat. Mniejsza waga: grzywna, ograniczenie lub do 1 roku. Znaczna ilość: zbrodnia od 3 do 20 lat.',
    },
    additionalSanctions: [
      'Przepadek przemycanych substancji oraz środków transportu',
      'Nawiązka do 50 000 zł na zapobieganie narkomanii',
    ],
    isFelony: false,
    keywords: ['przemyt', 'przewóz', 'granica', 'import', 'paczka z zagranicy', 'art 55 uopn', 'czechy', 'holandia'],
    isOfflinePinned: false,
  },
  {
    id: 'art-58-uopn',
    number: 58,
    codePrefix: 'UoPN',
    title: 'Udzielanie środka odurzającego (Nieodpłatne poczęstowanie / nakłanianie)',
    chapter: 'Przepisy karne (Ustawa o przeciwdziałaniu narkomanii)',
    chapterNumber: 'Rozdział 7 (UoPN)',
    content: `Art. 58. 1. Kto, wbrew przepisom ustawy, udziela innej osobie środka odurzającego, substancji psychotropowej lub nowej substancji psychoaktywnej, ułatwia albo umożliwia ich użycie albo nakłania do użycia takiego środka lub substancji, podlega karze pozbawienia wolności do lat 3.
2. Jeżeli sprawca czynu (...) udziela (...) małoletniemu, ułatwia albo umożliwia mu użycie albo nakłania go do użycia (...) podlega karze pozbawienia wolności od 6 miesięcy do lat 8.`,
    plainSummary: 'Częstowanie narkotykami, podanie skręta znajomemu na imprezie, udostępnienie lokalu do zażywania. Jeśli osobą częstowaną jest małoletni, sankcja rośnie do 8 lat.',
    penalties: {
      fine: false,
      restrictionOfLiberty: false,
      imprisonmentMinMonths: 1,
      imprisonmentMaxMonths: 36,
      summary: 'Pozbawienie wolności do lat 3. Wobec małoletniego: od 6 miesięcy do 8 lat.',
    },
    additionalSanctions: [
      'Nawiązka na cele zwalczania narkomanii',
      'Przepadek substancji',
    ],
    isFelony: false,
    keywords: ['poczęstunek', 'udzielanie', 'skręt', 'impreza', 'małoletni', 'ułatwianie', 'art 58 uopn'],
    isOfflinePinned: false,
  },
  {
    id: 'art-59-uopn',
    number: 59,
    codePrefix: 'UoPN',
    title: 'Udzielanie narkotyków w celu osiągnięcia korzyści majątkowej (Dilerka / handel detaliczny)',
    chapter: 'Przepisy karne (Ustawa o przeciwdziałaniu narkomanii)',
    chapterNumber: 'Rozdział 7 (UoPN)',
    content: `Art. 59. 1. Kto, w celu osiągnięcia korzyści majątkowej lub osobistej, udziela innej osobie środka odurzającego, substancji psychotropowej lub nowej substancji psychoaktywnej, ułatwia użycie albo umożliwia użycie takiego środka lub substancji, podlega karze pozbawienia wolności od roku do lat 10.
2. Jeżeli sprawca czynu (...) udziela (...) małoletniemu (...) podlega karze pozbawienia wolności na czas nie krótszy od lat 3 (zbrodnia).
3. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do lat 2.`,
    plainSummary: 'Odpłatna sprzedaż porcji narkotyków bezpośrednio konsumentom („dilerka”). W typie podstawowym grozi od 1 roku do 10 lat więzienia. Sprzedaż małoletniemu to zbrodnia z minimalną karą 3 lat więzienia.',
    penalties: {
      fine: true,
      restrictionOfLiberty: true,
      imprisonmentMinMonths: 12,
      imprisonmentMaxMonths: 120,
      summary: 'Kara pozbawienia wolności od 1 roku do 10 lat. Małoletni: zbrodnia od 3 do 20 lat. Mniejsza waga: do 2 lat, grzywna lub ograniczenie.',
    },
    additionalSanctions: [
      'Obligatoryjny przepadek korzyści majątkowej (art. 45 § 1 k.k.)',
      'Nawiązka do 50 000 zł na rzecz zwalczania narkomanii',
    ],
    isFelony: false,
    keywords: ['diler', 'sprzedaż narkotyków', 'korzyść majątkowa', 'handel detaliczny', 'małoletni', 'art 59 uopn', 'dealer'],
    isOfflinePinned: true,
  },
  {
    id: 'art-63-uopn',
    number: 63,
    codePrefix: 'UoPN',
    title: 'Nielegalna uprawa maku, konopi lub krzewu koki',
    chapter: 'Przepisy karne (Ustawa o przeciwdziałaniu narkomanii)',
    chapterNumber: 'Rozdział 7 (UoPN)',
    content: `Art. 63. 1. Kto, wbrew przepisom ustawy, uprawia mak (...) konopie (inne niż włókniste) lub krzew koki, podlega karze pozbawienia wolności do lat 3.
2. Tej samej karze podlega, kto, wbrew przepisom ustawy, zbiera mleczko makowe, opium, słomę makową, liście koki, żywicę lub ziele konopi innych niż włókniste.
3. Jeżeli uprawa może dostarczyć znacznej ilości ziela konopi innych niż włókniste, żywicy lub słomy makowej, sprawca podlega karze pozbawienia wolności od 6 miesięcy do lat 8.`,
    plainSummary: 'Nielegalna uprawa konopi indyjskich (tzw. plantacja lub nawet pojedyncza roślina w doniczce) albo maku wysokomorfinowego. Gdy plantacja może dostarczyć znacznej ilości ziela – grozi do 8 lat.',
    penalties: {
      fine: false,
      restrictionOfLiberty: false,
      imprisonmentMinMonths: 1,
      imprisonmentMaxMonths: 36,
      summary: 'Pozbawienie wolności do lat 3. Uprawa mogąca dostarczyć znacznej ilości: od 6 miesięcy do 8 lat.',
    },
    additionalSanctions: [
      'Przepadek roślin, lamp, filtrów, namiotów i sprzętu do uprawy (growbox)',
      'Nawiązka na zapobieganie narkomanii',
    ],
    isFelony: false,
    keywords: ['uprawa konopi', 'krzak', 'growbox', 'plantacja', 'sadzonka', 'mak', 'art 63 uopn', 'marihuana roślina'],
    isOfflinePinned: false,
  },
];
