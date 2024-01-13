export default class GameState {
  constructor() {
    this.countlevel = 1;
    this.level = null;
    this.charactersCount = 4;
    this.positions = [];
    this.currentMove = 'player';
    this.selectedCell = null;
    this.selectedCellIndex = null;
    this.selectedCharacter = null;
    this.selectedCellCoordinates = null;
    this.isAvailableToMove = false;
    this.isAvailableToAttack = false;
    this.goodTypes = ['bowman', 'swordsman', 'magician'];
    this.badTypes = ['vampire', 'undead', 'daemon'];
    this.goodTeam = [];
    this.badTeam = [];
    // TODO: create object
  }
}
