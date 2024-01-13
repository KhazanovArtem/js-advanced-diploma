/**
 * Базовый класс, от которого наследуются классы персонажей
 * @property level - уровень персонажа, от 1 до 4
 * @property attack - показатель атаки
 * @property defence - показатель защиты
 * @property health - здоровье персонажа
 * @property type - строка с одним из допустимых значений:
 * swordsman
 * bowman
 * magician
 * daemon
 * undead
 * vampire
 */
export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 100;
    this.type = type;
    if (new.target == Character) {
      throw new Error('Объект класса Character не может создаваться конструкцией new');
    }
    // TODO: выбросите исключение, если кто-то использует "new Character()"
  }

  levelUp() {
    this.level += 1;

    const life = (1.8 - (1 - this.health / 100));
    this.attack = Math.floor(Math.max(this.attack, this.attack * life));
    this.defence = Math.floor(Math.max(this.defence, this.defence * life));

    this.health += 80;
    if (this.health > 100) {
      this.health = 100;
    }
  }
}
