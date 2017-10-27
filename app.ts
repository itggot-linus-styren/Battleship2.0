/// <reference path="Photon/Photon-Javascript_SDK.d.ts"/> 
/// <reference path="battleshipai.ts"/> 
/// <reference path="battleshipmap.ts"/> 
/// <reference path="cloud-app-info.ts"/>

// fetching app info global variable while in global context
let UseWss = AppInfo && AppInfo["Wss"];
let AppId = AppInfo && AppInfo["AppId"] ? AppInfo["AppId"] : "<no-app-id>";
let AppVersion = AppInfo && AppInfo["AppVersion"] ? AppInfo["AppVersion"] : "1.0";

let ConnectOnStart = true;

// Changing these will not be compatible with the AI
let GameWidth = 10,
    GameHeight = 10;

//2 2 2 2 3 3 3 4 4 6
let ships = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5, 5],
    [6, 6, 6],
    [7, 7, 7],
    [8, 8, 8, 8],
    [9, 9, 9, 9],
    [10, 10, 10, 10, 10, 10]
];

enum Messages {
    Ready,
    Gamestarted,
    Doneturn,
    Gameover,
    Attack,
};

class Battleship extends Photon.LoadBalancing.LoadBalancingClient {

    private canMove : boolean = false;

    private ignoreInput : boolean = false;

    private canChangePlacement : boolean = false;

    private gameStarted : boolean = false;

    private gameOver : boolean = false;

    private hasSelectedShip : boolean = false;

    private selectedShip : number = -1;

    private selectedShipSegment : number = -1;

    private shipOrigin : Point = undefined;

    private selectionOrigin : Point = undefined;

    private selectionPos : Point = undefined;

    private selectionRot : boolean = false;

    private otherPlayer : Photon.LoadBalancing.Actor = undefined;

    private offlinePlacement : number[][];

    private offlineBoard : number[][];

    private prevPlacement : number[][];

    private playVsAI : boolean = false;

    private winner : number = -1;

    private aiPlacement : number[][];

    private aiBoard : number[][];

    private ai : BattleshipAI = undefined;

    private canvas : HTMLCanvasElement;

    private ctx : CanvasRenderingContext2D;

    private map : BattleshipMap = undefined;

    private BS : typeof BattleshipMap.NodeState = BattleshipMap.NodeState;

    constructor() {
        super(UseWss ? Photon.ConnectionProtocol.Wss : Photon.ConnectionProtocol.Ws, AppId, AppVersion);
        this.canvas = <HTMLCanvasElement>document.querySelector("#gamecanvas");
        this.ctx = this.canvas.getContext('2d');
        this.map = new BattleshipMap(this.canvas, this.ctx);        
        this.gameLoop();
    }

    private fps = 30;
    private now;
    private then = Date.now();
    private interval = 1000/this.fps;
    private delta;

    /* the () => syntax is required to keep the this context when using requestAnimationFrame */
    gameLoop = () => {
        requestAnimationFrame(this.gameLoop);
       
        this.now = Date.now();
        this.delta = this.now - this.then;
        
        if (this.delta > this.interval) {
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(0, 0, 400, 400);
            if (this.gameStarted) {
                if (this.canMove || this.gameOver) {
                    this.map.renderOtherBoard();
                } else {
                    this.map.renderMyBoard();
                }
            } else if (this.canChangePlacement) {
                this.map.renderPlacement();
            } else {
                this.map.renderMyBoard();
            }
            this.map.renderGrid();

            this.then = this.now - (this.delta % this.interval);
        }                       
    }

    isValidPlacementLocation() {
        let ship;
        ships.forEach(element => {
            if (element[0] == this.selectedShip) {
                ship = element;
            }
        });
        let y = this.selectionPos.y;
        let x = this.selectionPos.x;
        for (let i = 0; i < ship.length; i++) {
            if (this.selectionRot) {
                if (y < 0 ||
                    x < 0 ||
                    y + i >= GameHeight ||
                    x >= GameWidth ||
                    (this.prevPlacement[y + i][x] != 0 &&
                    this.prevPlacement[y + i][x] != this.selectedShip)) return false;
            } else {
                if (y < 0 ||
                    x < 0 ||
                    y >= GameHeight ||
                    x + i >= GameWidth ||
                    (this.prevPlacement[y][x + i] != 0 &&
                    this.prevPlacement[y][x + i] != this.selectedShip)) return false;
            }
        }
        return true;
    }

    GetShipOrigin() {
        let placement = this.offlinePlacement;
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                if (placement[y][x] == this.selectedShip) {
                    if (y - 1 < 0 || placement[y - 1][x] != this.selectedShip &&
                        x + 1 >= GameWidth || placement[y][x+1] != this.selectedShip) {
                        return new Point(x, y);
                    }
                    if (y - 1 < 0 || placement[y - 1][x] != this.selectedShip &&
                        x + 1 >= GameWidth || placement[y][x+1] == this.selectedShip) {
                        return new Point(x, y);
                    }
                }
            }
        }
        return new Point(0, 0);
    }

    CheckBounds(y : number, x : number) : boolean {
        return !(y < 0 || x < 0 || y >= GameHeight || x >= GameWidth);
    }

    UpdateSelectionPlacement() {
        this.offlinePlacement = JSON.parse(JSON.stringify(this.prevPlacement));
        let ship;
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                if (this.offlinePlacement[y][x] == this.selectedShip) this.offlinePlacement[y][x] = 0;
            }
        }
        ships.forEach(element => {
            if (element[0] == this.selectedShip) {
                ship = element;
            }
        });
        let y = this.selectionPos.y;
        let x = this.selectionPos.x;
        for (let i = 0; i < ship.length; i++) {
            if (this.selectionRot) {
                if (this.CheckBounds(y+i, x))
                    this.offlinePlacement[y+i][x] = ship[i];
            } else {
                if (this.CheckBounds(y, x+i))
                    this.offlinePlacement[y][x+i] = ship[i];
            }
        }
        let shipBoard = JSON.parse(JSON.stringify(this.offlinePlacement));     
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                shipBoard[y][x] = shipBoard[y][x] > 0 ? 1 : 0;
            }
        }
        this.offlineBoard = shipBoard;
        {
            for (let y = 0; y < GameHeight; y++) {
                for (let x = 0; x < GameWidth; x++) {
                    let node = this.map.mygame[y][x];
                    node.value = this.offlinePlacement[y][x];
                    node.state = this.BS.NodeNormal;
                    if (this.hasSelectedShip && this.offlinePlacement[y][x] == this.selectedShip) {
                        node.state = this.isValidPlacementLocation() ? this.BS.NodeSelected : this.BS.NodeInvalidSelected;
                    }
                }
            }
        }
    }

    ResetMap() {
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                let node = this.map.mygame[y][x];
                node.value = 0;
                node.state = this.BS.NodeNormal;
            }
        }

        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                let node = this.map.othergame[y][x];
                node.value = 0;
                node.state = this.BS.NodeNormal;
            }
        }

        this.offlineBoard = [];
        this.offlinePlacement = [];
        this.aiBoard = [];
        this.aiPlacement = [];        
    }

    AiAttack(pos : Point) {
        let board = this.aiBoard;
        let placement = this.aiPlacement;
        let y = pos.y;
        let x = pos.x;
        let node = this.map.othergame[y][x];
        if (board[y][x] == 1) {
            board[y][x] = 2;
            if (!this.CheckSunken(y, x, 0, board, placement)) {
                node.state = this.BS.ShipHit;
            }
        } else if (board[y][x] == 0) {
            board[y][x] = -1;
            node.state = this.BS.ShipMiss;
        }
        this.aiBoard = board;
        this.aiPlacement = placement;
    }

    ClampSelection() {
        let dx1 = this.selectionRot ? 0 : this.selectedShipSegment;
        let dy1 = this.selectionRot ? this.selectedShipSegment : 0;
        let dx2 = this.selectionRot ? 0 : ships[this.selectedShip - 1].length - this.selectedShipSegment;
        let dy2 = this.selectionRot ? ships[this.selectedShip - 1].length - this.selectedShipSegment : 0;
        if (this.selectionPos.y < 0) this.selectionPos.y = 0;
        if (this.selectionPos.x < 0) this.selectionPos.x = 0;
        if (this.selectionPos.y > GameHeight - dy2) this.selectionPos.y = GameHeight - dy2;
        if (this.selectionPos.x > GameWidth - dx2) this.selectionPos.x = GameWidth - dx2;
    }

    IsShipRotated(placement : number[][], pos : Point) : boolean {
        if (pos.x < GameWidth - 1) {
            return placement[pos.y][pos.x+1] != this.selectedShip;
        } else {
            return placement[pos.y][pos.x-1] != this.selectedShip;
        }
    }

    GetCursorPosition(canvas : HTMLCanvasElement, event : MouseEvent) : Point {
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        return new Point(x, y);
    }

    Start() {

        document.querySelector("#playvsai").addEventListener("click", () => {
            this.playVsAI = true;
            this.ai = new BattleshipAI();
            this.gameOver = false;
            this.gameStarted = false;
            this.disconnect();
            this.ResetMap();
            this.StartGamePlacement();            
        });

        document.addEventListener("mousemove", (event : MouseEvent) => {
            if (!this.canChangePlacement || !this.hasSelectedShip) return;
            let cP = this.GetCursorPosition(this.canvas, event);
            let yy = Math.floor(cP.y / (this.canvas.height / GameHeight));
            let xx = Math.floor(cP.x / (this.canvas.width / GameWidth));
            let ny = this.shipOrigin.y - (this.selectionOrigin.y - yy);
            let nx = this.shipOrigin.x - (this.selectionOrigin.x - xx);                   
            this.selectionPos = new Point(nx, ny);
            this.ClampSelection();
            this.UpdateSelectionPlacement();
        });

        document.querySelector("body").addEventListener("wheel", (event : MouseWheelEvent) => {
            if (this.hasSelectedShip) {
                this.selectionRot = !this.selectionRot;
                this.shipOrigin = this.GetShipOrigin();
                this.selectionOrigin.y = this.selectionRot ? this.shipOrigin.y + this.selectedShipSegment : this.shipOrigin.y;
                this.selectionOrigin.x = this.selectionRot ? this.shipOrigin.x : this.shipOrigin.x + this.selectedShipSegment;
                let cP = this.GetCursorPosition(this.canvas, event);
                let my = Math.floor(cP.y / (this.canvas.height / GameHeight));
                let mx = Math.floor(cP.x / (this.canvas.width / GameWidth));
                let ny = this.shipOrigin.y - (this.selectionOrigin.y - my);
                let nx = this.shipOrigin.x - (this.selectionOrigin.x - mx);
                this.selectionPos = new Point(nx, ny);
                this.ClampSelection();
                this.UpdateSelectionPlacement();
                return false;
            }
        });
        
        document.addEventListener("click", (event) => {
            let cP = this.GetCursorPosition(this.canvas, event);
            let my = Math.floor(cP.y / (this.canvas.height / GameHeight));
            let mx = Math.floor(cP.x / (this.canvas.width / GameWidth));

            if (my < 0 || mx < 0 || my >= GameHeight || mx >= GameWidth) return;

            if (this.gameStarted) {
                if (!this.canMove || this.gameOver || this.ignoreInput) return;
                if (event.button == 0) {
                    if (!this.playVsAI) {
                        let value = this.otherPlayer.getCustomProperty("board")[my][mx];
                        if (value > 1 || value < 0) return;
                        this.SendGameEvent(Messages.Attack, my + "/" + mx);
                    } else {
                        let value = this.aiBoard[my][mx];
                        if (value > 1 || value < 0) return;
                        this.AiAttack(new Point(mx, my));
                    }
                    this.DoneWithTurn();
                }                
            } else if (this.canChangePlacement) {
                if (event.button == 0 && this.hasSelectedShip) {
                    if (this.isValidPlacementLocation()) {
                        this.hasSelectedShip = false;
                        this.UpdateSelectionPlacement();
                    }
                } else if (event.button == 0) {
                    let placement = this.offlinePlacement;
                    if (placement[my][mx] > 0) {
                        this.prevPlacement = JSON.parse(JSON.stringify(this.offlinePlacement));
                        this.hasSelectedShip = true;               
                        this.selectedShip = placement[my][mx];
                        this.shipOrigin = this.GetShipOrigin();
                        this.selectionPos = new Point(this.shipOrigin.x, this.shipOrigin.y);
                        this.selectionRot = this.IsShipRotated(placement, this.shipOrigin);
                        this.selectedShipSegment = this.selectionRot ? Math.abs(my - this.shipOrigin.y) :
                                                    Math.abs(mx - this.shipOrigin.x);
                        this.selectionOrigin = new Point(mx, my);
                        this.UpdateSelectionPlacement();
                    }
                }
            }
        });

        if (ConnectOnStart) {
            this.connectToRegionMaster("EU");
        }
    }
    onError(errorCode: number, errorMsg: string) {
        super.onError(errorCode, errorMsg);
    }

    onOperationResponse(errorCode: number, errorMsg: string, code: number, content: any) {
        let LBCE = Photon.LoadBalancing.Constants.ErrorCode;
        switch (errorCode) {
            case LBCE.NoRandomMatchFound:
                this.createRoom(undefined, {maxPlayers: 2});
                break;                
            default:
            break;
        }
    }

    CheckSunken(y : number, x : number, who : number, board : any, placement : any) {
        let shipId = placement[y][x];
        let nodes = [];
        for (let yy = 0; yy < GameHeight; yy++) {
            for (let xx = 0; xx < GameWidth; xx++) {
                if (placement[yy][xx] == shipId && board[yy][xx] <= 1) {
                    return false;
                } else if (placement[yy][xx] == shipId) {
                    let node;
                    if (!this.playVsAI) {
                        if (who == this.myActor().actorNr) {                            
                            node = this.map.mygame[yy][xx];
                        } else {
                            node = this.map.othergame[yy][xx];
                        }
                    } else {
                        if (who == 0) {
                            node = this.map.othergame[yy][xx];
                        } else {
                            node = this.map.mygame[yy][xx];
                        }
                    }                    
                    nodes.push([node, yy, xx]);
                }
            }
        }
        let coordinates : Array<Point> = [];
        nodes.forEach((value) => {
            let node = value[0];            
            let y = value[1];
            let x = value[2];
            node.value = placement[y][x];
            node.state = this.BS.ShipSunk;
            board[y][x] = 3;
            coordinates.push(new Point(x, y));
        });
        if (this.playVsAI && who != 0) {
            this.ai.MarkSunk(coordinates, shipId);
        }
        return nodes.length > 0;
    }

    StartGame() {
        this.map.gameover = false;
        this.SendGameEvent(Messages.Gamestarted, null);
        this.SendGameEvent(Messages.Doneturn, null);
    }

    SetStateOfMap(board, placement, game) {
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                let node = game[y][x];
                node.value = placement[y][x];
                switch (board[y][x]) {
                    case -1:
                        node.state = this.BS.ShipMiss;
                        break;
                    case 0:
                    case 1:
                        node.state = this.BS.NodeNormal;
                        break;
                    case 2:
                        node.state = this.BS.ShipHit
                        break;
                    case 3:
                        node.state = this.BS.ShipSunk;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    OfflineVictory() {
        this.canMove = false;
        this.gameOver = true;
        if (this.winner == 1) {
            document.querySelector("#msg").innerHTML = "You won! :D";
        } else {
            document.querySelector("#msg").innerHTML = "You lost! :(";
        }
        this.SetStateOfMap(this.aiBoard, this.aiPlacement, this.map.othergame);
        this.SetStateOfMap(this.offlineBoard, this.offlinePlacement, this.map.mygame);
    }

    DoneWithTurn() {
        this.ignoreInput = true;        
        setTimeout(() => {
            this.canMove = false;
            if (this.playVsAI) {
                if (!this.HasWon()) {
                    setTimeout(() => {
                        let move = this.ai.Move(false, -1, -1, this.offlinePlacement);
                        let board = this.offlineBoard;
                        let placement = this.offlinePlacement;
                        let y = move.y;
                        let x = move.x;
                        let node = this.map.mygame[y][x];
                        if (board[y][x] == 1) {
                            board[y][x] = 2;
                            if (!this.CheckSunken(y, x, -1, board, placement)) {
                                node.state = this.BS.ShipHit;
                                this.ai.MarkHit(new Point(x, y));
                            }
                        } else if (board[y][x] == 0) {
                            board[y][x] = -1;
                            node.state = this.BS.ShipMiss;
                        }            
                        this.offlineBoard = board;
                        this.offlinePlacement = placement;
                        if (this.HasWon()) {
                            this.OfflineVictory();
                        } else {
                            setTimeout(() => {
                                this.canMove = true;
                                this.ignoreInput = false;
                            }, 1000);                        
                        }
                    }, 1000);                
                } else {
                    this.OfflineVictory();
                }            
            } else {
                this.myRoomActorsArray().forEach(element => {
                    if (element.actorNr == this.myActor().actorNr) {
                        element.setCustomProperty("myturn", false);
                    } else {
                        element.setCustomProperty("myturn", true);
                    }
                });
                this.SendGameEvent(Messages.Doneturn, null)
            }
        }, 1000);        
    }

    HasWon() : boolean {
        let board;
        let placement;
        if (this.playVsAI) {
            board = this.offlineBoard;
            placement = this.offlinePlacement;

            let aiWin : boolean = true;
            for (let yy = 0; yy < GameHeight; yy++) {
                for (let xx = 0; xx < GameWidth; xx++) {
                    if (placement[yy][xx] > 0 && board[yy][xx] < 3) aiWin = false;
                }
            }

            if (aiWin) {
                this.winner = 2;

                return true;
            } else {
                board = this.aiBoard;
                placement = this.aiPlacement;

                for (let yy = 0; yy < GameHeight; yy++) {
                    for (let xx = 0; xx < GameWidth; xx++) {
                        if (placement[yy][xx] > 0 && board[yy][xx] < 3) return false;
                    }
                }

                this.winner = 1;

                return true;
            }
        } else {
            board = this.otherPlayer.getCustomProperty("board");
            placement = this.otherPlayer.getCustomProperty("placement");

            for (let yy = 0; yy < GameHeight; yy++) {
                for (let xx = 0; xx < GameWidth; xx++) {
                    if (placement[yy][xx] > 0 && board[yy][xx] < 3) return false;
                }
            }

            return true;
        }
    }
    
    onEvent(code: number, content: any, actorNr: number) {
        switch(code) {
            case Messages.Ready:
                if (this.myActor().actorNr == actorNr) {
                    document.querySelector("#msg").innerHTML = "Waiting for other player to become ready";
                } else {
                    document.querySelector("#msg").innerHTML = "Other player is ready!";
                }
                if (this.myActor().actorNr == this.myRoom().masterClientId) {
                    var readyCount = 0;
                    this.myRoomActorsArray().forEach(element => {
                        if (element.getCustomProperty("isReady")) readyCount++;
                    });
                    if (readyCount == 2) {
                        this.StartGame();
                        this.myRoomActorsArray().forEach(element => {
                            if (element.actorNr == this.myActor().actorNr) {
                                element.setCustomProperty("myturn", true);
                            } else {
                                element.setCustomProperty("myturn", false);
                            }
                        });
                    }
                }
                break;
            case Messages.Gamestarted:
                document.querySelector("#msg").innerHTML = "Game has started";
                this.gameStarted = true;
                break;
            case Messages.Doneturn:                       
                if (this.HasWon()) {
                    this.SendGameEvent(Messages.Gameover, null);
                } else {
                    if (!this.myActor().getCustomProperty("myturn")) {
                        this.ignoreInput = true;
                    }
                    setTimeout(() => {
                        if (this.gameOver) return;
                        this.canMove = this.myActor().getCustomProperty("myturn");
                        this.ignoreInput = !this.canMove;
                        document.querySelector("#msg").innerHTML = this.canMove ? "Your turn, make a move!" : "Wait for your turn...";
                    }, 1000);
                }
                break;
            case Messages.Gameover:
                this.canMove = false;
                this.gameOver = true;
                this.map.gameover = true;
                if (actorNr == this.myActor().actorNr) {
                    document.querySelector("#msg").innerHTML = "You won! :D";
                } else {
                    document.querySelector("#msg").innerHTML = "You lost! :(";
                }

                {
                    let board = this.otherPlayer.getCustomProperty("board");
                    let placement = this.otherPlayer.getCustomProperty("placement");
                    this.SetStateOfMap(board, placement, this.map.othergame);
                    board = this.myActor().getCustomProperty("board");
                    placement = this.myActor().getCustomProperty("placement");
                    this.SetStateOfMap(board, placement, this.map.mygame);
                }
                break;
            case Messages.Attack:
                if (actorNr == this.myActor().actorNr) {
                    let board = this.otherPlayer.getCustomProperty("board");
                    let placement = this.otherPlayer.getCustomProperty("placement");
                    let y = +content.split("/")[0];
                    let x = +content.split("/")[1];
                    let node = this.map.othergame[y][x];
                    if (board[y][x] == 1) {
                        board[y][x] = 2;
                        if (!this.CheckSunken(y, x, this.otherPlayer.actorNr, board, placement)) {
                            node.state = this.BS.ShipHit;
                        }
                    } else if (board[y][x] == 0) {
                        board[y][x] = -1;
                        node.state = this.BS.ShipMiss;
                    }
                    this.otherPlayer.setCustomProperty("placement", placement);
                    this.otherPlayer.setCustomProperty("board", board);
                } else {                                             
                    let board = this.myActor().getCustomProperty("board");
                    let placement = this.myActor().getCustomProperty("placement");
                    let y = +content.split("/")[0];
                    let x = +content.split("/")[1];
                    let node = this.map.mygame[y][x];
                    if (board[y][x] == 1) {
                        board[y][x] = 2;
                        if (!this.CheckSunken(y, x, this.myActor().actorNr, board, placement)) {                                    
                            node.state = this.BS.ShipHit;
                        }
                    } else if (board[y][x] == 0) {
                        board[y][x] = -1;
                        node.state = this.BS.ShipMiss;
                    }
                    this.myActor().setCustomProperty("placement", placement);
                    this.myActor().setCustomProperty("board", board);
                }
                break;
            }
    }

    onStateChange(state: number) {
        // "namespace" import for static members shorter acceess
        let LBC = Photon.LoadBalancing.LoadBalancingClient;
        let stateText = document.getElementById("statetxt");
        switch (state) {
            case LBC.State.JoinedLobby:
                this.joinRandomRoom();
                break;
            default:
                break;
        }
        stateText.textContent = LBC.StateToName(state);
    }

    PlaceShip(board : number[][], ship : number[], y : number, x : number, rot : boolean) : boolean {
        for (let i = 0; i < ship.length; i++) {
            if (rot) {
                if (y + i >= GameHeight ||
                    x >= GameWidth ||
                    board[y + i][x] > 0) return false;
            } else {
                if (y >= GameHeight ||
                    x + i >= GameWidth ||
                    board[y][x + i] > 0) return false;
            }
        }
        for (let i = 0; i < ship.length; i++) {
            if (rot) {
                board[y+i][x] = ship[i];
            } else {
                board[y][x+i] = ship[i];
            }
        }
        return true;
    }

    PlaceShips() : number[][] {
        let board = [];
        for (let y = 0; y < GameHeight; y++) {
            board.push([]);
            for (let x = 0; x < GameWidth; x++) {
                board[y].push(0);
            }
        }
        let shipsClone = JSON.parse(JSON.stringify(ships));
        let ship = shipsClone.pop();
        let attempts = 0;
        while (shipsClone.length + 1 > 0 || attempts++ > 10000) {
            for (let y = 0; y < GameHeight; y++) {
                for (let x = 0; x < GameWidth; x++) {
                    let rot = Math.random() > 0.5;
                    if (Math.random() < 0.1) {
                        if (this.PlaceShip(board, ship, y, x, rot)) {
                            if (shipsClone.length == 0) return board;
                            ship = shipsClone.pop();
                        }
                    }
                }
            }
        }
        return board;
    }

    StartGamePlacement() {
        if (this.playVsAI) {
            document.querySelector("#msg").innerHTML = "Playing vs AI";
        } else {
            document.querySelector("#msg").innerHTML = "Paired with other player";
        }
        document.querySelector("#ready").addEventListener("click", () => {
            if (this.gameStarted) return;
            this.canChangePlacement = false;
            if (!this.playVsAI) {
                this.myActor().setCustomProperty("placement", this.offlinePlacement);
                this.myActor().setCustomProperty("board", this.offlineBoard);
                this.myActor().setCustomProperty("isReady", true);
                this.SendGameEvent(Messages.Ready, null);
            } else {
                document.querySelector("#msg").innerHTML = "Your turn, make a move!";
                this.gameStarted = true;
                this.canMove = true;
            }
        });
        this.ResetMap();
        let placement = this.PlaceShips();
        this.canChangePlacement = true;
        if (this.playVsAI) {
            this.aiPlacement = this.PlaceShips();
            let shipBoard = JSON.parse(JSON.stringify(this.aiPlacement ));
            for (let y = 0; y < GameHeight; y++) {
                for (let x = 0; x < GameWidth; x++) {
                    shipBoard[y][x] = shipBoard[y][x] > 0 ? 1 : 0;
                }
            }
            this.aiBoard = shipBoard;
        } else {
            this.myActor().setCustomProperty("placement", placement);
        }        
        this.offlinePlacement = JSON.parse(JSON.stringify(placement));
        let shipBoard = JSON.parse(JSON.stringify(placement));
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                shipBoard[y][x] = shipBoard[y][x] > 0 ? 1 : 0;
            }
        }
        this.offlineBoard = JSON.parse(JSON.stringify(shipBoard));
        if (!this.playVsAI) {
            this.myActor().setCustomProperty("board", shipBoard);
        }        
        {
            let board;
            if (!this.playVsAI) {
                board = this.myActor().getCustomProperty("board");
            } else {
                board = this.offlineBoard;
            }
            for (let y = 0; y < GameHeight; y++) {
                for (let x = 0; x < GameWidth; x++) {
                    let node = this.map.mygame[y][x];
                    node.value = placement[y][x];
                    node.state = this.BS.NodeNormal;
                }
            }
        }
        if (!this.playVsAI) {
            if (this.myActor().actorNr == this.myRoom().masterClientId) {
                this.myRoom().setIsOpen(false);
            }
        }
    }

    onActorJoin(actor: Photon.LoadBalancing.Actor) {
        if (actor.actorNr > 1) {
            this.StartGamePlacement();

            this.myRoomActorsArray().forEach(element => {
                if (element.actorNr != this.myActor().actorNr) {
                    this.otherPlayer = element;
                }
            });
        }
    }

    SendGameEvent(event : Messages, data : any) {
        this.raiseEvent(event, data, {receivers: Photon.LoadBalancing.Constants.ReceiverGroup.All});
    }

}

let battleship : Battleship;
window.onload = () => {
    battleship = new Battleship();
    battleship.Start();
};