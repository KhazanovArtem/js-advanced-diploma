import Team from './Team'


/**
 * Формирует экземпляр персонажа из массива allowedTypes со
 * случайным уровнем от 1 до maxLevel
 *
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @returns генератор, который при каждом вызове
 * возвращает новый экземпляр класса персонажа
 *
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  while (true) {
    const lev = Math.floor((Math.random() * (maxLevel - 1)) + 1);
    const randomIndex = Math.floor(Math.random() * allowedTypes.length);
    yield new allowedTypes[randomIndex](lev);
  }
  // TODO: write logic here
}

export function* genPosGood(characterCount) {
  const left = [];
  const positions = new Set();
  for (let i = 0; i < 8 ** 2; i += 1) {
    if (i === 0 || i === 1 || i % 8 === 0 || i % 8 === 1) {
      left.push(i);
    }
  }
  while (positions.size < characterCount) {
    positions.add(left[Math.floor(Math.random() * left.length)]);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const pos of positions) {
    yield pos;
  }
}

export function* genPosBad(characterCount) {
  const right = [];
  const positions = new Set();
  for (let i = 0; i < 8 ** 2; i += 1) {
    if (i === 8 - 2 || i === 8 - 1 || (i + 2) % 8 === 0 || (i + 1) % 8 === 0) {
      right.push(i);
    }
  }
  while (positions.size < characterCount) {
    positions.add(right[Math.floor(Math.random() * right.length)]);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const pos of positions) {
    yield pos;
  }
}

/**
 * Формирует массив персонажей на основе characterGenerator
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @param characterCount количество персонажей, которое нужно сформировать
 * @returns экземпляр Team, хранящий экземпляры персонажей. Количество персонажей в команде - characterCount
 * */
export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const characters = [];
  const generator = characterGenerator(allowedTypes, maxLevel);
  for(let i = 0; i < characterCount; i++) {
    let character = generator.next().value;
    characters.push(character);
  }
  return new Team(characters);
  // TODO: write logic here
}


