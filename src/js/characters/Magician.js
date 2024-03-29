import Character from '../Character'

export default class Magician extends Character {
    constructor(level) {
        super(level);
        this.level = level;
        this.attack = 10;
        this.defence = 40;
        this.moveDist = 1;
        this.attackDist = 4;
        this.type = 'magician';
    }
}