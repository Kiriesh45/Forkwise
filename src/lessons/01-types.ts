/**
 * УРОК 1. Типы в TypeScript.
 *
 * Это учебный файл. Он не часть продукта — мы удалим его позже.
 * Запуск:  npm run lesson
 *
 * Читай сверху вниз. В конце каждого блока есть строка "ПОПРОБУЙ" —
 * раскомментируй её, запусти, прочитай ошибку, закомментируй обратно.
 * Ошибки компилятора — это не наказание, а подсказки.
 */

// ─────────────────────────────────────────────────────────────
// БЛОК 1. Зачем вообще типы
// ─────────────────────────────────────────────────────────────

// В обычном JavaScript в переменную можно положить что угодно.
// TypeScript просит один раз сказать, что там будет лежать.

const repoName: string = 'react';   // : string — это "аннотация типа"
const starCount: number = 232000;
const isArchived: boolean = false;

console.log(`Блок 1: ${repoName}, звёзд ${starCount}, архив: ${isArchived}`);

// ПОПРОБУЙ: раскомментируй строку ниже и запусти npm run typecheck
//const broken = 'сто';

// Важно: аннотацию часто можно НЕ писать. TypeScript сам догадается:
const inferred = 'react';           // он уже знает, что это string
// Это называется "вывод типов" (type inference).
// Правило на будущее: не пиши аннотацию там, где она очевидна.

// ─────────────────────────────────────────────────────────────
// БЛОК 2. Объекты и interface
// ─────────────────────────────────────────────────────────────

// Объект — это набор полей. Его тип можно описать заранее и переиспользовать.
// Такое описание называется interface.

interface Book {
  title: string;
  author: string;
  pages: number;
  isFinished: boolean;
}

const book: Book = {
  title: 'The Pragmatic Programmer',
  author: 'Hunt & Thomas',
  pages: 352,
  isFinished: false,
};

console.log(`Блок 2: "${book.title}", ${book.pages} стр.`);

// ПОПРОБУЙ по очереди (каждый раз npm run typecheck):
//   1. убери строку с pages из объекта book       → "поле обязательно"
//   2. добавь в объект строку  price: 30,         → "лишнее поле"
//   3. напиши  pages: '352',                      → "не тот тип"

// ─────────────────────────────────────────────────────────────
// БЛОК 3. Необязательные поля  ?
// ─────────────────────────────────────────────────────────────

// Знак ? означает "поля может не быть вообще".

interface Movie {
  title: string;
  year: number;
  subtitle?: string;   // может быть, а может и не быть
}

const movie1: Movie = { title: 'Dune', year: 2021 };
const movie2: Movie = { title: 'Dune', year: 2021, subtitle: 'Part One' };

console.log(`Блок 3: ${movie1.title} / ${movie2.subtitle}`);

// Тип movie1.subtitle — это  string | undefined.
// Поэтому TypeScript не даст сразу вызвать у него строковый метод:
// ПОПРОБУЙ:
// console.log(movie1.subtitle.toUpperCase());
//
// Чтобы это исправить, надо сначала проверить:
if (movie2.subtitle !== undefined) {
  console.log(`Блок 3: ${movie2.subtitle.toUpperCase()}`);
}
// Такая проверка называется "сужение типа" (narrowing).
// Внутри if компилятор уже знает, что там точно строка.

// ─────────────────────────────────────────────────────────────
// БЛОК 4. null против undefined — разница смысла
// ─────────────────────────────────────────────────────────────

// undefined = "мы не знаем / поля нет"
// null      = "мы точно знаем, что значения нет"
//
// Для нашего проекта это принципиально:
//   licenseId?: string        → "мы не проверяли лицензию"
//   licenseId: string | null  → "мы проверили: лицензии НЕТ"
// Второе — совсем другое утверждение, и именно оно нам нужно.

interface Employee {
  name: string;
  manager: string | null;   // у директора начальника нет — это факт, не пробел
}

const boss: Employee = { name: 'Ada', manager: null };
console.log(`Блок 4: ${boss.name}, начальник: ${boss.manager ?? 'нет'}`);
// ?? читается как "если слева null или undefined, возьми то, что справа"

// ─────────────────────────────────────────────────────────────
// БЛОК 5. Литеральные типы и union
// ─────────────────────────────────────────────────────────────

// Тип может быть не только "какая-то строка", но и "вот эта конкретная строка".

type Answer = 'yes';        // сюда можно положить ТОЛЬКО строку 'yes'
const a: Answer = 'yes';

// Само по себе бесполезно. Но литералы можно объединять через | — это union.
// Читается как "или".

type TrafficLight = 'red' | 'yellow' | 'green';

const light: TrafficLight = 'red';
console.log(`Блок 5: ${a}, светофор ${light}`);

// ПОПРОБУЙ:
// const wrong: TrafficLight = 'blue';
//
// Вот ради чего это нужно: опечатка ловится компилятором, а не пользователем.
// Это и есть замена "магическим строкам" и константам из других языков.

// Union работает и с обычными типами:
type Id = string | number;
const id1: Id = 'abc';
const id2: Id = 42;
console.log(`Блок 5: ${id1} ${id2}`);

// ─────────────────────────────────────────────────────────────
// БЛОК 6. Массивы
// ─────────────────────────────────────────────────────────────

const tags: string[] = ['security', 'devtools'];      // массив строк
const scores: number[] = [87, 42, 100];

// Массив объектов — тип элемента в квадратных скобках:
const library: Book[] = [book];

console.log(`Блок 6: ${tags.join(', ')}, книг: ${library.length}, ${scores[0]}`);

// Помнишь опцию noUncheckedIndexedAccess в tsconfig.json?
// Из-за неё tags[99] имеет тип  string | undefined  — потому что массив
// может оказаться короче. TypeScript заставляет об этом помнить.
// ПОПРОБУЙ:
// const t: string = tags[99];

// ─────────────────────────────────────────────────────────────
// БЛОК 7. Собираем всё вместе
// ─────────────────────────────────────────────────────────────

// Тут использованы сразу: interface, union литералов, необязательное поле,
// null, вложенный массив объектов. Ровно те же кирпичи, что понадобятся
// тебе для CheckResult.

type OrderStatus = 'new' | 'paid' | 'shipped' | 'cancelled';

interface OrderItem {
  sku: string;
  quantity: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  discountCode: string | null;   // скидки нет — это известный факт
  comment?: string;              // комментарий покупатель мог не оставить
}

const order: Order = {
  id: 'A-1001',
  status: 'paid',
  items: [
    { sku: 'BOOK-1', quantity: 2 },
    { sku: 'MUG-7', quantity: 1 },
  ],
  discountCode: null,
};

console.log(`Блок 7: заказ ${order.id} (${order.status}), позиций: ${order.items.length}`);
