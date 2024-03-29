import GameState from './GameState'
import { characterGenerator, generateTeam, genPosGood, genPosBad } from './generators'
import { getInfo, getCoordinates, randomIndex, randomBoard } from './utils';
import GamePlay from './GamePlay'
import PositionedCharacter from './PositionedCharacter';
import Team from './Team'
import Character from './Character'
import Bowman from './characters/Bowman'
import Daemon from './characters/Daemon'
import Magician from './characters/Magician'
import Swordsman from './characters/Swordsman'
import Undead from './characters/Undead'
import Vampire from './characters/Vampire'
import cursors from './cursors'

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gameState = new GameState();
    this.goodtypes = [Bowman, Swordsman, Magician];
    this.badtypes = [Vampire, Undead, Daemon];
    this.curCellindx = null;
  }

  init() {
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
    this.begin();

    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
  }

  begin() {
    this.gameState.level.area = randomBoard();
    this.createTeams();
    this.drawBoard();
  }

  onNewGameClick() {
    this.blockBoard();
    this.gameState = new GameState();
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.currentCellIdx = null;
    this.gameState.level.area = randomBoard();
    this.createTeams();
    this.drawBoard();
  }

  onSaveGameClick() {
    this.stateService.save(this.gameState);
  }

  onLoadGameClick() {
    if (this.stateService.storage.length > 0/* сохраненная игра */) {
      const loadedGame = this.stateService.load();
      this.gameState = new GameState();
      this.gameState.level.area = loadedGame.level.area;
      this.gameState.level.count = loadedGame.level.count;
      this.gameState.charactersCount = loadedGame.charactersCount;
      this.gameState.positions = loadedGame.positions;
      this.gameState.currentMove = loadedGame.currentMove;
      this.gameState.selected.cell = loadedGame.selected.cell;
      this.gameState.selected.index = loadedGame.selected.index;
      this.gameState.selected.character = loadedGame.selected.character;
      this.gameState.selected.coordinates = loadedGame.selected.coordinates;
      this.gameState.isAvailable.toMove = loadedGame.isAvailable.toMove;
      this.gameState.isAvailable.toAttack = loadedGame.isAvailable.toAttack;
      const goodChars = [];
      const badChars = [];
      this.gameState.positions.forEach((pos) => {
        Object.setPrototypeOf(pos.character, Character.prototype);
        if (this.gameState.types.good.some((item) => item === pos.character.type)) {
          goodChars.push(pos.character);
        }
        if (this.gameState.types.bad.some((item) => item === pos.character.type)) {
          badChars.push(pos.character);
        }
      });
      this.gameState.team.good = new Team(goodChars);
      this.gameState.team.bad = new Team(badChars);
      this.drawBoard();
    }
  }

  createTeams() {
    if (this.gameState.level.count === 1) {
      this.gameState.team.good = generateTeam(this.goodtypes, this.gameState.level.count, this.gameState.charactersCount);
      this.gameState.team.bad = generateTeam(this.badtypes, this.gameState.level.count, this.gameState.charactersCount);
    } else {
      const countForGoods = this.numberOfCharactersToAdd(this.gameState.team.good.characters);
      const countForBads = this.numberOfCharactersToAdd(this.gameState.team.bad.characters);
      const goodChars = [];
      const badChars = [];
      for (let i = 1; i <= countForGoods; i += 1) {
        goodChars.push(characterGenerator(this.goodtypes, this.gameState.level.count).next().value);
      }
      for (let i = 1; i <= countForBads; i += 1) {
        badChars.push(characterGenerator(this.badtypes, this.gameState.level.count).next().value);
      }
      goodChars.forEach((item) => this.gameState.team.good.characters.push(item));
      badChars.forEach((item) => this.gameState.team.bad.characters.push(item));
    }
    const posgood = genPosGood(this.gameState.charactersCount);
    const posbad = genPosBad(this.gameState.charactersCount);
    this.gameState.team.good.characters.forEach((item) => {
      this.gameState.positions.push(new PositionedCharacter(item, posgood.next().value));
    });
    this.gameState.team.bad.characters.forEach((item) => {
      this.gameState.positions.push(new PositionedCharacter(item, posbad.next().value));
    });
  }

  drawBoard() {
    this.gamePlay.drawUi(this.gameState.level.area);
    this.gamePlay.redrawPositions(this.gameState.positions);
  }

  async onCellClick(index) {
    const currentCell = this.gamePlay.cells[index];
    const currentCellWithChar = currentCell.firstChild;
    let isEnemy;
    let isAvailableToMove;
    let isAvailableToAttack;

    if (currentCellWithChar) {
      isEnemy = this.gameState.team.bad.characters.some(item => 
        currentCellWithChar.classList.contains(item.type));
    }

    if (this.gameState.selected.cell) {
      let coordinates = this.gameState.selected.coordinates;
      let attackDist = this.gameState.selected.character.attackDist;
      let moveDist = this.gameState.selected.character.moveDist;
      isAvailableToMove = this.availableTo(index, coordinates, moveDist);
      isAvailableToAttack = this.availableTo(index, coordinates, attackDist);
    }

    // выбрать персонажа (есть персонаж в клетке && персонаж свой)
    if (currentCellWithChar && !isEnemy) {
      this.gamePlay.deselectCell(this.gameState.selected.index);
      this.gamePlay.selectCell(index);
      this.gameState.selected = {
        cell: currentCell,
        index: index,
        character: this.findCharacter(index),
        coordinates: getCoordinates(index, this.gamePlay.boardSize)
      };
    }

    // переместить персонажа в пустую клетку (в клетке нет персонажа && клетка в зоне хода)
    if (!currentCellWithChar && isAvailableToMove) {
      this.gamePlay.deselectCell(this.gameState.selected.index);
      this.gamePlay.deselectCell(this.currentCellIdx);
      this.moveToAnEmptyCell(index);
      if (this.gameState.currentMove === 'player') {
        await this.badMove();
      }
    }

    if (currentCellWithChar && isEnemy) {
      if (isAvailableToAttack) {
        this.gamePlay.deselectCell(this.gameState.selected.index);
        this.gamePlay.deselectCell(this.currentCellIdx);
        const badCharacter = this.findCharacter(index);
        await this.attack(this.gameState.selected.character, badCharacter, index);
        if (this.gameState.team.bad.characters.length === 0) {
          this.gameLevelUp();
          return;
        }
        if (this.gameState.currentMove === 'player') {
          await this.badMove();
        }
      } else {
        GamePlay.showError('Этот игрок противника недоступен для атаки!');
      }
    }
    // TODO: react to click
  }

  onCellEnter(index) {
    if (typeof this.currentCellIdx === 'number' && !this.gamePlay.cells[this.currentCellIdx].classList.contains('selected-yellow')) {
      this.gamePlay.deselectCell(this.currentCellIdx);
    }
    const currentCell = this.gamePlay.cells[index];
    const currentCellWithChar = currentCell.firstChild;
    let isBad;
    let isAvailableToMove;
    let isAvailableToAttack;

    // показать инфу (есть персонаж в клетке)
    if (currentCellWithChar) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.showCellTooltip(getInfo(this.findCharacter(index)), index);
      isBad = this.gameState.types.bad.some((item) => currentCellWithChar.classList.contains(item));
    }

    if (this.gameState.selected.cell) {
      let coordinates = this.gameState.selected.coordinates;
      let attackDist = this.gameState.selected.character.attackDist;
      let moveDist = this.gameState.selected.character.moveDist;
      isAvailableToMove = this.availableTo(index, coordinates, moveDist);
      isAvailableToAttack = this.availableTo(index, coordinates, attackDist);
    }

    if (this.gameState.selected.cell) {
      // если наведенная клетка в зоне хода
      if (isAvailableToMove) {
        // если наведенная клетка пустая
        if (!currentCellWithChar) {
          this.gamePlay.setCursor(cursors.pointer);
          this.gamePlay.selectCell(index, 'green');
        }
      // если наведенная клетка НЕ в зоне хода
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }

      // если в клетке персонаж противника
      if (currentCellWithChar && isBad) {
        // если в зоне атаки
        if (isAvailableToAttack) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
        } else {
          this.gamePlay.setCursor(cursors.notallowed);
        }
      }
    }

    if (currentCellWithChar && !isBad) {
      this.gamePlay.setCursor(cursors.pointer);
    }

    this.currentCellIdx = index;
    // TODO: react to mouse enter
  }

  onCellLeave(index) {
    this.gamePlay.setCursor(cursors.auto);
    this.gamePlay.hideCellTooltip(index);
    // TODO: react to mouse leave
  }

  // ОПРЕДЕЛЕНИЕ СКОЛЬКО ПЕРСОНАЖЕЙ НУЖНО ДОБАВИТЬ НА СЛЕД. УРОВНЕ
  numberOfCharactersToAdd(team) {
    return this.gameState.charactersCount - team.length;
  }
    // АТАКА
    async attack(attacker, target, targetIndex) {
    const damage = Math.floor(Math.max(attacker.attack - target.defence, attacker.attack * 0.2));
    // eslint-disable-next-line no-param-reassign
    target.health -= damage;
    await this.gamePlay.showDamage(targetIndex, damage);
    this.checkDeath(target);
    this.gamePlay.redrawPositions(this.gameState.positions);
    this.clearSelectedCell();
  }

    // ПЕРЕХОД НА СЛЕД. УРОВЕНЬ
  gameLevelUp() {
    if (this.gameState.currentMove === 'enemy') {
      // Проигрыш
      // eslint-disable-next-line
      alert('Вы проиграли.\nЧтобы начать новую игру нажмите "New game".');
      this.blockBoard();
      return;
    }
    this.gameState.level.count += 1;
    if (this.gameState.level.count > 4) {
      // Победа
      this.blockBoard();
      // eslint-disable no-alert
      alert('Поздравляю! Вы победили!');
    } else {
      // Переход на следующий уровень
      /* eslint-disable no-alert */
      alert(`Уровень пройден! Переход на уровень ${this.gameState.level.count}`);
      this.gameState.team.good.characters.forEach((char) => char.levelUp());
      this.gameState.charactersCount += 1;
      this.gameState.positions = [];
      this.gameState.level.area = randomBoard();
      this.createTeams();
      this.drawBoard();
    }
  }

  // ПРОВЕРКА НА СМЕРТЬ
  checkDeath(character) {
    if (character.health <= 0) {
      let idx = this.gameState.positions.findIndex((item) => item.character.health <= 0);
      this.gameState.positions.splice(idx, 1);
      idx = this.gameState.team.bad.characters.findIndex((item) => item.health <= 0);
      this.gameState.team.bad.characters.splice(idx, 1);
    }
  }

  clearSelectedCell() {
    Object.assign(this.gameState, {
      selectedCellIndex: null,
      selectedCharacter: null,
      selectedCellCoordinates: null,
      isAvailableToMove: false,
      isAvailableToAttack: false
    });
  }

  moveToAnEmptyCell(index) {
    // находим индекс выделенного персонажа в массиве this.gameState.positions
    const idx = this.gameState.positions.findIndex((item) => item.position === this.gameState.selected.index);
    this.gameState.positions[idx].position = index;
    this.gamePlay.redrawPositions(this.gameState.positions);
    this.clearSelectedCell();
  }

  findCharacter(index) {
    const findIdx = this.gameState.positions.findIndex((item) => item.position === index);
    return this.gameState.positions[findIdx].character;
  }

    // БЛОКИРОВКА ПОЛЯ
    blockBoard() {
      this.gamePlay.cellClickListeners = [];
      this.gamePlay.cellEnterListeners = [];
      this.gamePlay.cellLeaveListeners = [];
      this.gamePlay.setCursor(cursors.auto);
    }

  async badMove() {
    this.gameState.currentMove = 'enemy';
    const { good } = this.gameState.team;
    const { bad } = this.gameState.team;
    let isAvailableToAttack;
    const arrOfBadPos = [];
    // меняем местами команды, теперь противник становится игроком и наоборот
    this.gameState.team.good = bad;
    this.gameState.team.bad = good;

    // перебираем индексы персонажей в позициях; если персонаж противника, то переводим его индекс в координаты и добавляем в массив
    this.gameState.positions.forEach((item) => {
      if (this.gameState.team.bad.characters.some((char) => char.type === item.character.type)) {
        arrOfBadPos.push(item.position);
      }
    });

    // перебираем персонажей в команде для определения возможности атаки
    for (const char of this.gameState.team.good.characters) {
      // если ход противника (компьютера)
      if (this.gameState.currentMove === 'enemy') {
        // то находим индекс персонажа в позициях
        const idx = this.gameState.positions.findIndex((pos) => pos.character === char);
        // выделяем его
        await this.onCellClick(this.gameState.positions[idx].position);
        // перебираем позиции противника
        for (const pos of arrOfBadPos) {
          let coordinates = this.gameState.selected.coordinates;
          let attackDist = this.gameState.selected.character.attackDist;
          // определяем возможна ли атака
          isAvailableToAttack = this.availableTo(pos, coordinates, attackDist);
          // если возможна, то атакуем и передаем ход
          if (isAvailableToAttack) {
            await this.onCellClick(pos);
            this.gameState.currentMove = 'player';
            this.gameState.team.good = good;
            this.gameState.team.bad = bad;
            break;
          }
        }
      }
    }
    // если атака невозможна, то перемещаем последнего из предыдущей итерации персонажа в пустую клетку
    if (this.gameState.currentMove === 'enemy') {
      let coordinates = this.gameState.selected.coordinates;
      let moveDist = this.gameState.selected.character.moveDist;
      await this.onCellClick(randomIndex(coordinates, moveDist, this.gamePlay.boardSize));
      this.gameState.currentMove = 'player';
      this.gameState.team.good = good;
      this.gameState.team.bad = bad;
    }
  }

  availableTo(index, selectedCoordinates, distance) {
    const currentCoordinates = getCoordinates(index, this.gamePlay.boardSize);
    const differenceX = Math.abs(currentCoordinates.x - selectedCoordinates.x);
    const differenceY = Math.abs(currentCoordinates.y - selectedCoordinates.y);
    if (differenceX <= distance && differenceY <= distance
    && (differenceX === differenceY || differenceX === 0 || differenceY === 0)) {
      return true;
    }
  }
}
