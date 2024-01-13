import Character from '../Character'

export default class Vampire extends Character {
    constructor(level) {
        super(level);
        this.level = level;
        this.attack = 25;
        this.defence = 25;
        this.moveDist = 2;
        this.attackDist = 2;
        this.type = 'vampire';
    }
}