export default class GameState {
  constructor() {
    this.charactersCount = 4;
    this.positions = [];
    this.currentMove = 'player';
    this.level = {
      count: 1,
      area: null
    }
    this.selected = {
      cell: null,
      coordinates: null,
      index: null,
      character: null
    }
    this.isAvailable = {
      toMove: false,
      toAttack: false
    }
    this.types = {
      good: ['bowman', 'swordsman', 'magician'],
      bad: ['vampire', 'undead', 'daemon']
    }
    this.team = {
      good: [],
      bad: []
    }
    // TODO: create object
  }
}
