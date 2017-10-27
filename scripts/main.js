var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    return Point;
}());
var GridCoordinate = /** @class */ (function () {
    function GridCoordinate(x, y, xVal, yVal) {
        this.x = 0;
        this.y = 0;
        this.xVal = 0;
        this.yVal = 0;
        this.xValRev = 0;
        this.yValRev = 0;
        this.sumx = 0;
        this.sumy = 0;
        this.BC = BattleshipAI.Constants;
        this.x = x;
        this.y = y;
        this.xVal = xVal;
        this.yVal = yVal;
    }
    GridCoordinate.prototype.AddXY = function (xVal, yVal) {
        this.xValRev = xVal;
        this.yValRev = yVal;
        this.sumx = this.Sum(this.xVal, this.xValRev);
        this.sumy = this.Sum(this.yVal, this.yValRev);
    };
    GridCoordinate.prototype.GetScore = function () {
        var result = this.sumx * this.sumy;
        if (result < this.BC.MaxScore) {
            return result;
        }
        else {
            if (Math.random() < this.BC.ChanceOfPrime1) {
                return this.BC.Prime1;
            }
            else {
                return this.BC.Prime2;
            }
        }
    };
    GridCoordinate.prototype.Sum = function (a, b) {
        return ((a + b) - Math.abs(a - b));
    };
    return GridCoordinate;
}());
var BattleshipAI = /** @class */ (function () {
    function BattleshipAI() {
        this.dmSize = (10 - 1);
        this.enemyGrid = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        this.maxSize = 5;
        this.lastShot = new Point(0, 0);
        this.hitList = [];
        this.BC = BattleshipAI.Constants;
        this.BCI = this.BC.Internal;
        this.ships = JSON.parse(JSON.stringify(ships));
        this.dm = [];
        for (var y = 0; y < this.dmSize + 1; y++) {
            this.dm[y] = [];
            for (var x = 0; x < this.dmSize + 1; x++) {
                this.dm[y][x] = new GridCoordinate(0, 0, 0, 0);
            }
        }
    }
    BattleshipAI.prototype.Move = function (override, x, y, placement) {
        this.enemeyPlacement = placement;
        if (override) {
            this.lastShot = new Point(x, y);
        }
        else {
            if (this.hitList.length <= 0) {
                this.lastShot = this.FindNewTarget();
            }
            else {
                this.lastShot = this.SinkLastTarget();
            }
        }
        if (!this.lastShot) {
            this.lastShot = this.FindNewTarget();
        }
        this.enemyGrid[this.lastShot.y][this.lastShot.x] = this.BCI.ShotFired;
        return this.lastShot;
    };
    BattleshipAI.prototype.MarkHit = function (coordinates) {
        this.hitList.push(new Point(coordinates.x, coordinates.y));
        this.enemyGrid[coordinates.y][coordinates.x] = this.BCI.ShipHit;
    };
    BattleshipAI.prototype.MarkSunk = function (coordinates, shipId) {
        for (var i = 0; i < this.ships.length; i++) {
            if (this.ships[i][0] == shipId) {
                this.ships.splice(i, 1);
                console.log("SUNK SHIP " + shipId);
                break;
            }
        }
        for (var i = 0; i < coordinates.length; i++) {
            for (var j = 0; j < this.hitList.length; j++) {
                if ((this.hitList[j].x == coordinates[i].x) &&
                    (this.hitList[j].y == coordinates[i].y)) {
                    this.hitList.splice(j, 1);
                }
            }
        }
    };
    BattleshipAI.prototype.SinkLastTarget = function () {
        var x = 0, y = 0, xMin = 0, xMax = 0, yMin = 0, yMax = 0, goVert = false, goHorz = false, lastHit = undefined, prevHit = undefined;
        var possibleCoordinates = [];
        if (this.hitList[0]) {
            lastHit = this.hitList[0];
        }
        if (this.hitList[1]) {
            prevHit = this.hitList[1];
        }
        if (lastHit) {
            x = lastHit.x;
            y = lastHit.y;
        }
        else {
            x = 0;
            y = 0;
        }
        xMin = x - this.maxSize;
        xMax = x + this.maxSize;
        yMin = y - this.maxSize;
        yMax = y + this.maxSize;
        // clamp search boundaries
        if (xMin < 0)
            xMin = 0;
        if (xMax > this.dmSize)
            xMax = this.dmSize;
        if (yMin < 0)
            yMin = 0;
        if (yMax > this.dmSize)
            yMax = this.dmSize;
        if (prevHit) {
            if (prevHit.x == x) {
                if (Math.abs(prevHit.y - y) == 1) {
                    goVert = true;
                }
            }
            if (prevHit.y == y) {
                if (Math.abs(prevHit.x - x) == 1) {
                    goHorz = true;
                }
            }
        }
        for (var attempt = 0; attempt < 2; attempt++) {
            // go left
            if (!goVert) {
                for (var ix = x; ix >= xMin; ix--) {
                    if (this.enemyGrid[y][ix] == this.BCI.ShotFired)
                        break;
                    else {
                        if (this.enemyGrid[y][ix] != this.BCI.ShipHit) {
                            possibleCoordinates.push(new GridCoordinate(ix, y, 0, 0));
                        }
                    }
                }
            }
            // go up
            if (!goHorz) {
                for (var iy = y; iy >= yMin; iy--) {
                    if (this.enemyGrid[iy][x] == this.BCI.ShotFired)
                        break;
                    else {
                        if (this.enemyGrid[iy][x] != this.BCI.ShipHit) {
                            possibleCoordinates.push(new GridCoordinate(x, iy, 0, 0));
                        }
                    }
                }
            }
            // go right
            if (!goVert) {
                for (var ix = x; ix <= xMax; ix++) {
                    if (this.enemyGrid[y][ix] == this.BCI.ShotFired)
                        break;
                    else {
                        if (this.enemyGrid[y][ix] != this.BCI.ShipHit) {
                            possibleCoordinates.push(new GridCoordinate(ix, y, 0, 0));
                        }
                    }
                }
            }
            // go down
            if (!goHorz) {
                for (var iy = y; iy <= yMax; iy++) {
                    if (this.enemyGrid[iy][x] == this.BCI.ShotFired)
                        break;
                    else {
                        if (this.enemyGrid[iy][x] != this.BCI.ShipHit) {
                            possibleCoordinates.push(new GridCoordinate(x, iy, 0, 0));
                        }
                    }
                }
            }
            if (possibleCoordinates.length == 0) {
                if (goHorz) {
                    goHorz = false;
                    goVert = true;
                }
                else if (goVert) {
                    goVert = false;
                    goHorz = true;
                }
            }
            else {
                break;
            }
        }
        if (possibleCoordinates[0] == undefined) {
            console.warn("possibleCoordinates can't be undefined");
            console.log(possibleCoordinates);
            console.log(goVert);
            console.log(goHorz);
            console.log(xMin);
            console.log(xMax);
            console.log(yMin);
            console.log(yMax);
            console.log(x);
            console.log(y);
        }
        return possibleCoordinates[0];
    };
    BattleshipAI.prototype.CanPlaceShipAtSegment = function (y, x, ship, segment) {
        var canPlaceNormal = true, canPlaceRotated = true;
        for (var i = 0; i < ship.length; i++) {
            if (y < 0 ||
                (x - segment) < 0 ||
                y >= GameHeight ||
                (x - segment) + i >= GameWidth ||
                this.enemyGrid[y][(x - segment) + i] != 0) {
                //console.log("segment " + i + " doesn't fit at " + y + " and " + ((x - segment) + i));
                canPlaceNormal = false;
            }
        }
        for (var i = 0; i < ship.length; i++) {
            if ((y - segment) < 0 ||
                x < 0 ||
                (y - segment) + i >= GameHeight ||
                x >= GameWidth ||
                this.enemyGrid[(y - segment) + i][x] != 0) {
                //console.log("segment " + i + " doesn't fit at " + ((y - segment) + i) + " and " + x);
                canPlaceRotated = false;
            }
        }
        return canPlaceNormal || canPlaceRotated;
    };
    BattleshipAI.prototype.CanPlaceShip = function (y, x, ship) {
        for (var i = 0; i < ship.length; i++) {
            if (this.CanPlaceShipAtSegment(y, x, ship, i)) {
                return true;
            }
        }
        return false;
    };
    BattleshipAI.prototype.CanPlaceRemainingShips = function (y, x) {
        var _this = this;
        var canPlace = false;
        this.ships.forEach(function (ship) {
            if (_this.CanPlaceShip(y, x, ship)) {
                //console.log("able to place ship " + ship[0] + " at " + y + " , " + x);
                canPlace = true;
            }
            else {
                //console.log("not able to place ship " + ship[0] + " at " + y + " , " + x);
            }
        });
        return canPlace;
    };
    BattleshipAI.prototype.FindNewTarget = function () {
        var newXval = 0, newYval = 0, tmpScore = 0, highScoreN = (6 - 1), highScoreXs = [0, 0, 0, 0, 0, 0], highScoreYs = [0, 0, 0, 0, 0, 0], highScoreVals = [0, 0, 0, 0, 0, 0], shotCoordinates = new Point(0, 0), scorePicker = ~~(Math.random() * highScoreN);
        // down-right traversal
        for (var iy = 0; iy <= this.dmSize; iy++) {
            for (var ix = 0; ix <= this.dmSize; ix++) {
                if (!this.enemyGrid[iy][ix]) {
                    newXval = 0;
                    if (ix > 0 && this.dm[iy][ix - 1]) {
                        newXval = this.dm[iy][ix - 1].xVal;
                    }
                    newYval = 0;
                    if (iy > 0 && this.dm[iy - 1][ix]) {
                        newYval = this.dm[iy - 1][ix].yVal;
                    }
                }
                else {
                    newXval = -1;
                    newYval = -1;
                }
                this.dm[iy][ix] = new GridCoordinate(ix, iy, newXval + 1, newYval + 1);
            }
        }
        // up-left traversal
        for (var iy = this.dmSize; iy >= 0; iy--) {
            for (var ix = this.dmSize; ix >= 0; ix--) {
                if (!this.enemyGrid[iy][ix]) {
                    newXval = 0;
                    if (ix < this.dmSize && this.dm[iy][ix + 1]) {
                        newXval = this.dm[iy][ix + 1].xVal;
                    }
                    newYval = 0;
                    if (iy < this.dmSize && this.dm[iy + 1][ix]) {
                        newYval = this.dm[iy + 1][ix].yVal;
                    }
                }
                else {
                    newXval = -1;
                    newYval = -1;
                }
                this.dm[iy][ix].AddXY(newXval + 1, newYval + 1);
                tmpScore = this.dm[iy][ix].GetScore();
                if (this.enemyGrid[iy][ix] == 0 && !this.CanPlaceRemainingShips(iy, ix)) {
                    this.enemyGrid[iy][ix] = this.BCI.ShipPlacementInvalid; // dynamic programming!
                    if (this.enemeyPlacement[iy][ix] > 0) {
                        console.error("the algorithm doesn't work...");
                        console.log("cannot possibly be a ship at " + iy + " , " + ix);
                        console.log(JSON.stringify(this.ships));
                    }
                    tmpScore = 0;
                }
                if (tmpScore > highScoreVals[highScoreN]) {
                    for (var i = 0; i <= highScoreN; i++) {
                        if (tmpScore > highScoreVals[i]) {
                            highScoreXs.splice(i, 0, ix);
                            highScoreYs.splice(i, 0, iy);
                            highScoreVals.splice(i, 0, tmpScore);
                            break;
                        }
                    }
                }
                else if (tmpScore == highScoreVals[highScoreN]) {
                    if (Math.random() < this.BC.ChanceOfRecordIfEqual) {
                        for (var i = 0; i <= highScoreN; i++) {
                            if (tmpScore > highScoreVals[i]) {
                                highScoreXs.splice(i, 0, ix);
                                highScoreYs.splice(i, 0, iy);
                                highScoreVals.splice(i, 0, tmpScore);
                                break;
                            }
                        }
                    }
                }
            }
        }
        if (highScoreVals[scorePicker]) {
            shotCoordinates.x = highScoreXs[scorePicker];
            shotCoordinates.y = highScoreYs[scorePicker];
        }
        else {
            shotCoordinates.x = highScoreXs[0];
            shotCoordinates.y = highScoreYs[0];
        }
        if (shotCoordinates == undefined) {
            console.error("shot coordinates can't be undefined");
            console.log(scorePicker);
            console.log(highScoreVals);
            console.log(highScoreXs);
            console.log(highScoreYs);
        }
        return shotCoordinates;
    };
    return BattleshipAI;
}());
(function (BattleshipAI) {
    var Constants;
    (function (Constants) {
        var Internal;
        (function (Internal) {
            Internal[Internal["ShotFired"] = 1] = "ShotFired";
            Internal[Internal["ShipHit"] = 2] = "ShipHit";
            Internal[Internal["ShipPlacementInvalid"] = 3] = "ShipPlacementInvalid";
        })(Internal = Constants.Internal || (Constants.Internal = {}));
        Constants.MaxScore = 80;
        Constants.ChanceOfPrime1 = 0.2;
        Constants.Prime1 = 67;
        Constants.Prime2 = 61;
        Constants.ChanceOfRecordIfEqual = 1 / 7;
    })(Constants = BattleshipAI.Constants || (BattleshipAI.Constants = {}));
})(BattleshipAI || (BattleshipAI = {}));
var BattleshipMapNode = /** @class */ (function () {
    function BattleshipMapNode(value, state) {
        this.value = value;
        this.state = state;
    }
    return BattleshipMapNode;
}());
var BattleshipMap = /** @class */ (function () {
    function BattleshipMap(canvas, ctx) {
        this.BS = BattleshipMap.NodeState;
        this.canvas = canvas;
        this.ctx = ctx;
        this.mygame = [];
        this.othergame = [];
        for (var y = 0; y < GameHeight; y++) {
            this.mygame[y] = [];
            this.othergame[y] = [];
            for (var x = 0; x < GameWidth; x++) {
                this.mygame[y][x] = new BattleshipMapNode(0, this.BS.NodeNormal);
                this.othergame[y][x] = new BattleshipMapNode(0, this.BS.NodeNormal);
            }
        }
        this.grid = this.renderGridToBuffer();
    }
    BattleshipMap.prototype.renderGridToBuffer = function () {
        var dx = this.canvas.width / GameWidth;
        var dy = this.canvas.height / GameHeight;
        var x = 0;
        var y = 0;
        var w = this.canvas.width;
        var h = this.canvas.height;
        this.ctx.lineWidth = 1;
        while (y < h) {
            y = y + dy;
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }
        y = 0;
        while (x < w) {
            x = x + dx;
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        var bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = w;
        bufferCanvas.height = h;
        bufferCanvas.getContext('2d').drawImage(this.canvas, 0, 0, w, h, 0, 0, w, h);
        return bufferCanvas;
    };
    BattleshipMap.prototype.renderMyBoard = function () {
        var dx = this.canvas.width / GameWidth;
        var dy = this.canvas.height / GameHeight;
        console.log("rendering my board");
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                var fontColour = "black";
                var overrideValue = true;
                switch (this.mygame[y][x].state) {
                    case this.BS.NodeNormal:
                        this.ctx.fillStyle = "black";
                        fontColour = "white";
                        overrideValue = false;
                        break;
                    case this.BS.ShipMiss:
                        this.ctx.fillStyle = "blue";
                        break;
                    case this.BS.ShipHit:
                        this.ctx.fillStyle = "orange";
                        break;
                    case this.BS.ShipSunk:
                        this.ctx.fillStyle = "red";
                        break;
                    default:
                        console.error("i don't know about: " + this.othergame[y][x].state);
                        break;
                }
                if (this.mygame[y][x].value > 0 || overrideValue) {
                    this.ctx.fillRect(x * dx, y * dy, dx, dy);
                    this.ctx.fillStyle = fontColour;
                    this.ctx.font = '11px Arial';
                    var textString = "" + this.mygame[y][x].value;
                    var textWidth = this.ctx.measureText(textString).width;
                    var textHeight = this.ctx.measureText('M').width; // see https://stackoverflow.com/a/13318387
                    this.ctx.fillText(textString, x * dx + dx / 2 - (textWidth / 2), y * dy + dy / 2 + (textHeight / 2));
                }
            }
        }
    };
    BattleshipMap.prototype.renderOtherBoard = function () {
        var dx = this.canvas.width / GameWidth;
        var dy = this.canvas.height / GameHeight;
        console.log("rendering other board");
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                var showValue = false;
                var fontColour = "black";
                var overrideValue = true;
                switch (this.othergame[y][x].state) {
                    case this.BS.NodeNormal:
                        this.ctx.fillStyle = "black";
                        overrideValue = false;
                        break;
                    case this.BS.ShipMiss:
                        this.ctx.fillStyle = "blue";
                        break;
                    case this.BS.ShipHit:
                        this.ctx.fillStyle = "orange";
                        break;
                    case this.BS.ShipSunk:
                        this.ctx.fillStyle = "red";
                        fontColour = "white";
                        showValue = true;
                        break;
                    default:
                        console.error("i don't know about: " + this.othergame[y][x].state);
                        break;
                }
                if (this.othergame[y][x].value > 0 || overrideValue) {
                    this.ctx.fillRect(x * dx, y * dy, dx, dy);
                    if (showValue) {
                        this.ctx.fillStyle = fontColour;
                        this.ctx.font = '11px Arial';
                        var textString = "" + this.othergame[y][x].value;
                        var textWidth = this.ctx.measureText(textString).width;
                        var textHeight = this.ctx.measureText('M').width; // see https://stackoverflow.com/a/13318387
                        this.ctx.fillText(textString, x * dx + dx / 2 - (textWidth / 2), y * dy + dy / 2 + (textHeight / 2));
                    }
                }
            }
        }
    };
    BattleshipMap.prototype.renderPlacement = function () {
        var dx = this.canvas.width / GameWidth;
        var dy = this.canvas.height / GameHeight;
        //console.log(JSON.stringify(this.mygame));
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                var fontColour = "black";
                switch (this.mygame[y][x].state) {
                    case this.BS.NodeNormal:
                        this.ctx.fillStyle = "black";
                        fontColour = "white";
                        break;
                    case this.BS.NodeSelected:
                        this.ctx.fillStyle = "green";
                        break;
                    case this.BS.NodeInvalidSelected:
                        this.ctx.fillStyle = "purple";
                        fontColour = "white";
                        break;
                    default:
                        console.error("i don't know about: " + this.othergame[y][x].state);
                        break;
                }
                if (this.mygame[y][x].value > 0) {
                    this.ctx.fillRect(x * dx, y * dy, dx, dy);
                    this.ctx.fillStyle = fontColour;
                    this.ctx.font = '11px Arial';
                    var textString = "" + this.mygame[y][x].value;
                    var textWidth = this.ctx.measureText(textString).width;
                    var textHeight = this.ctx.measureText('M').width; // see https://stackoverflow.com/a/13318387
                    this.ctx.fillText(textString, x * dx + dx / 2 - (textWidth / 2), y * dy + dy / 2 + (textHeight / 2));
                }
            }
        }
    };
    BattleshipMap.prototype.renderGrid = function () {
        var w = this.canvas.width;
        var h = this.canvas.height;
        this.canvas.getContext('2d').drawImage(this.grid, 0, 0, w, h, 0, 0, w, h);
    };
    return BattleshipMap;
}());
(function (BattleshipMap) {
    var NodeState;
    (function (NodeState) {
        NodeState[NodeState["NodeNormal"] = 0] = "NodeNormal";
        NodeState[NodeState["ShipHit"] = 1] = "ShipHit";
        NodeState[NodeState["ShipSunk"] = 2] = "ShipSunk";
        NodeState[NodeState["ShipMiss"] = 3] = "ShipMiss";
        NodeState[NodeState["NodeSelected"] = 4] = "NodeSelected";
        NodeState[NodeState["NodeInvalidSelected"] = 5] = "NodeInvalidSelected";
    })(NodeState = BattleshipMap.NodeState || (BattleshipMap.NodeState = {}));
})(BattleshipMap || (BattleshipMap = {}));
var AppInfo = {
    //	Wss: true,
    AppId: "ac485b10-6820-4627-b28b-99364b5ea8fe",
    AppVersion: "1.0"
};
/// <reference path="Photon/Photon-Javascript_SDK.d.ts"/> 
/// <reference path="battleshipai.ts"/> 
/// <reference path="battleshipmap.ts"/> 
/// <reference path="cloud-app-info.ts"/>
// fetching app info global variable while in global context
var UseWss = AppInfo && AppInfo["Wss"];
var AppId = AppInfo && AppInfo["AppId"] ? AppInfo["AppId"] : "<no-app-id>";
var AppVersion = AppInfo && AppInfo["AppVersion"] ? AppInfo["AppVersion"] : "1.0";
var ConnectOnStart = true;
// Changing these will not be compatible with the AI
var GameWidth = 10, GameHeight = 10;
//2 2 2 2 3 3 3 4 4 6
var ships = [
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
var Messages;
(function (Messages) {
    Messages[Messages["Ready"] = 0] = "Ready";
    Messages[Messages["Gamestarted"] = 1] = "Gamestarted";
    Messages[Messages["Doneturn"] = 2] = "Doneturn";
    Messages[Messages["Gameover"] = 3] = "Gameover";
    Messages[Messages["Attack"] = 4] = "Attack";
})(Messages || (Messages = {}));
;
var Battleship = /** @class */ (function (_super) {
    __extends(Battleship, _super);
    function Battleship() {
        var _this = _super.call(this, UseWss ? Photon.ConnectionProtocol.Wss : Photon.ConnectionProtocol.Ws, AppId, AppVersion) || this;
        _this.canMove = false;
        _this.ignoreInput = false;
        _this.canChangePlacement = false;
        _this.gameStarted = false;
        _this.gameOver = false;
        _this.hasSelectedShip = false;
        _this.selectedShip = -1;
        _this.selectedShipSegment = -1;
        _this.shipOrigin = undefined;
        _this.selectionOrigin = undefined;
        _this.selectionPos = undefined;
        _this.selectionRot = false;
        _this.otherPlayer = undefined;
        _this.playVsAI = false;
        _this.winner = -1;
        _this.ai = undefined;
        _this.map = undefined;
        _this.BS = BattleshipMap.NodeState;
        _this.fps = 30;
        _this.then = Date.now();
        _this.interval = 1000 / _this.fps;
        /* the () => syntax is required to keep the this context when using requestAnimationFrame */
        _this.gameLoop = function () {
            requestAnimationFrame(_this.gameLoop);
            _this.now = Date.now();
            _this.delta = _this.now - _this.then;
            if (_this.delta > _this.interval) {
                _this.ctx.fillStyle = "white";
                _this.ctx.fillRect(0, 0, 400, 400);
                if (_this.gameStarted) {
                    if (_this.canMove || _this.gameOver) {
                        _this.map.renderOtherBoard();
                    }
                    else {
                        _this.map.renderMyBoard();
                    }
                }
                else if (_this.canChangePlacement) {
                    _this.map.renderPlacement();
                }
                else {
                    _this.map.renderMyBoard();
                }
                _this.map.renderGrid();
                _this.then = _this.now - (_this.delta % _this.interval);
            }
        };
        _this.canvas = document.querySelector("#gamecanvas");
        _this.ctx = _this.canvas.getContext('2d');
        _this.map = new BattleshipMap(_this.canvas, _this.ctx);
        _this.gameLoop();
        return _this;
    }
    Battleship.prototype.isValidPlacementLocation = function () {
        var _this = this;
        var ship;
        ships.forEach(function (element) {
            if (element[0] == _this.selectedShip) {
                ship = element;
            }
        });
        var y = this.selectionPos.y;
        var x = this.selectionPos.x;
        for (var i = 0; i < ship.length; i++) {
            if (this.selectionRot) {
                if (y < 0 ||
                    x < 0 ||
                    y + i >= GameHeight ||
                    x >= GameWidth ||
                    (this.prevPlacement[y + i][x] != 0 &&
                        this.prevPlacement[y + i][x] != this.selectedShip))
                    return false;
            }
            else {
                if (y < 0 ||
                    x < 0 ||
                    y >= GameHeight ||
                    x + i >= GameWidth ||
                    (this.prevPlacement[y][x + i] != 0 &&
                        this.prevPlacement[y][x + i] != this.selectedShip))
                    return false;
            }
        }
        return true;
    };
    Battleship.prototype.GetShipOrigin = function () {
        var placement = this.offlinePlacement;
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                if (placement[y][x] == this.selectedShip) {
                    if (y - 1 < 0 || placement[y - 1][x] != this.selectedShip &&
                        x + 1 >= GameWidth || placement[y][x + 1] != this.selectedShip) {
                        return new Point(x, y);
                    }
                    if (y - 1 < 0 || placement[y - 1][x] != this.selectedShip &&
                        x + 1 >= GameWidth || placement[y][x + 1] == this.selectedShip) {
                        return new Point(x, y);
                    }
                }
            }
        }
        return new Point(0, 0);
    };
    Battleship.prototype.UpdateSelectionPlacement = function () {
        var _this = this;
        this.offlinePlacement = JSON.parse(JSON.stringify(this.prevPlacement));
        var ship;
        for (var y_1 = 0; y_1 < GameHeight; y_1++) {
            for (var x_1 = 0; x_1 < GameWidth; x_1++) {
                if (this.offlinePlacement[y_1][x_1] == this.selectedShip)
                    this.offlinePlacement[y_1][x_1] = 0;
            }
        }
        ships.forEach(function (element) {
            if (element[0] == _this.selectedShip) {
                ship = element;
            }
        });
        var y = this.selectionPos.y;
        var x = this.selectionPos.x;
        for (var i = 0; i < ship.length; i++) {
            if (this.selectionRot) {
                this.offlinePlacement[y + i][x] = ship[i];
            }
            else {
                this.offlinePlacement[y][x + i] = ship[i];
            }
        }
        var shipBoard = JSON.parse(JSON.stringify(this.offlinePlacement));
        for (var y_2 = 0; y_2 < GameHeight; y_2++) {
            for (var x_2 = 0; x_2 < GameWidth; x_2++) {
                shipBoard[y_2][x_2] = shipBoard[y_2][x_2] > 0 ? 1 : 0;
            }
        }
        this.offlineBoard = shipBoard;
        {
            for (var y_3 = 0; y_3 < GameHeight; y_3++) {
                for (var x_3 = 0; x_3 < GameWidth; x_3++) {
                    var node = this.map.mygame[y_3][x_3];
                    node.value = this.offlinePlacement[y_3][x_3];
                    node.state = this.BS.NodeNormal;
                    if (this.hasSelectedShip && this.offlinePlacement[y_3][x_3] == this.selectedShip) {
                        node.state = this.isValidPlacementLocation() ? this.BS.NodeSelected : this.BS.NodeInvalidSelected;
                    }
                }
            }
        }
    };
    Battleship.prototype.ResetMap = function () {
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                var node = this.map.mygame[y][x];
                node.value = 0;
                node.state = this.BS.NodeNormal;
            }
        }
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                var node = this.map.othergame[y][x];
                node.value = 0;
                node.state = this.BS.NodeNormal;
            }
        }
        this.offlineBoard = [];
        this.offlinePlacement = [];
        this.aiBoard = [];
        this.aiPlacement = [];
    };
    Battleship.prototype.AiAttack = function (pos) {
        var board = this.aiBoard;
        var placement = this.aiPlacement;
        var y = pos.y;
        var x = pos.x;
        var node = this.map.othergame[y][x];
        if (board[y][x] == 1) {
            board[y][x] = 2;
            if (!this.CheckSunken(y, x, 0, board, placement)) {
                node.state = this.BS.ShipHit;
            }
        }
        else if (board[y][x] == 0) {
            board[y][x] = -1;
            node.state = this.BS.ShipMiss;
        }
        console.log(JSON.stringify(node));
        this.aiBoard = board;
        this.aiPlacement = placement;
    };
    Battleship.prototype.ClampSelection = function () {
        var dx1 = this.selectionRot ? 0 : this.selectedShipSegment;
        var dy1 = this.selectionRot ? this.selectedShipSegment : 0;
        var dx2 = this.selectionRot ? 0 : ships[this.selectedShip - 1].length - this.selectedShipSegment;
        var dy2 = this.selectionRot ? ships[this.selectedShip - 1].length - this.selectedShipSegment : 0;
        if (this.selectionPos.y < 0)
            this.selectionPos.y = 0;
        if (this.selectionPos.x < 0)
            this.selectionPos.x = 0;
        if (this.selectionPos.y > GameHeight - dy2)
            this.selectionPos.y = GameHeight - dy2;
        if (this.selectionPos.x > GameWidth - dx2)
            this.selectionPos.x = GameWidth - dx2;
    };
    Battleship.prototype.IsShipRotated = function (placement, pos) {
        if (pos.x < GameWidth - 1) {
            return placement[pos.y][pos.x + 1] != this.selectedShip;
        }
        else {
            return placement[pos.y][pos.x - 1] != this.selectedShip;
        }
    };
    Battleship.prototype.GetCursorPosition = function (canvas, event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        return new Point(x, y);
    };
    Battleship.prototype.Start = function () {
        var _this = this;
        document.querySelector("#playvsai").addEventListener("click", function () {
            _this.playVsAI = true;
            _this.ai = new BattleshipAI();
            _this.gameOver = false;
            _this.gameStarted = false;
            _this.disconnect();
            _this.ResetMap();
            _this.StartGamePlacement();
        });
        document.addEventListener("mousemove", function (event) {
            if (!_this.canChangePlacement || !_this.hasSelectedShip)
                return;
            var cP = _this.GetCursorPosition(_this.canvas, event);
            var yy = Math.floor(cP.y / (_this.canvas.height / GameHeight));
            var xx = Math.floor(cP.x / (_this.canvas.width / GameWidth));
            var ny = _this.shipOrigin.y - (_this.selectionOrigin.y - yy);
            var nx = _this.shipOrigin.x - (_this.selectionOrigin.x - xx);
            _this.selectionPos = new Point(nx, ny);
            _this.ClampSelection();
            _this.UpdateSelectionPlacement();
        });
        document.querySelector("body").addEventListener("wheel", function (event) {
            if (_this.hasSelectedShip) {
                _this.selectionRot = !_this.selectionRot;
                _this.shipOrigin = _this.GetShipOrigin();
                _this.selectionOrigin.y = _this.selectionRot ? _this.shipOrigin.y + _this.selectedShipSegment : _this.shipOrigin.y;
                _this.selectionOrigin.x = _this.selectionRot ? _this.shipOrigin.x : _this.shipOrigin.x + _this.selectedShipSegment;
                var cP = _this.GetCursorPosition(_this.canvas, event);
                var my = Math.floor(cP.y / (_this.canvas.height / GameHeight));
                var mx = Math.floor(cP.x / (_this.canvas.width / GameWidth));
                var ny = _this.shipOrigin.y - (_this.selectionOrigin.y - my);
                var nx = _this.shipOrigin.x - (_this.selectionOrigin.x - mx);
                _this.selectionPos = new Point(nx, ny);
                _this.ClampSelection();
                _this.UpdateSelectionPlacement();
                return false;
            }
        });
        document.addEventListener("click", function (event) {
            var cP = _this.GetCursorPosition(_this.canvas, event);
            var my = Math.floor(cP.y / (_this.canvas.height / GameHeight));
            var mx = Math.floor(cP.x / (_this.canvas.width / GameWidth));
            if (my < 0 || mx < 0 || my >= GameHeight || mx >= GameWidth)
                return;
            if (_this.gameStarted) {
                if (!_this.canMove || _this.gameOver || _this.ignoreInput)
                    return;
                if (event.button == 0) {
                    if (!_this.playVsAI) {
                        var value = _this.otherPlayer.getCustomProperty("board")[my][mx];
                        if (value > 1 || value < 0)
                            return;
                        _this.sendMessage("attack/" + my + "/" + mx);
                    }
                    else {
                        var value = _this.aiBoard[my][mx];
                        if (value > 1 || value < 0)
                            return;
                        _this.AiAttack(new Point(mx, my));
                    }
                    _this.DoneWithTurn();
                }
            }
            else if (_this.canChangePlacement) {
                if (event.button == 0 && _this.hasSelectedShip) {
                    if (_this.isValidPlacementLocation()) {
                        _this.hasSelectedShip = false;
                        _this.UpdateSelectionPlacement();
                    }
                }
                else if (event.button == 0) {
                    var placement = _this.offlinePlacement;
                    if (placement[my][mx] > 0) {
                        _this.prevPlacement = JSON.parse(JSON.stringify(_this.offlinePlacement));
                        _this.hasSelectedShip = true;
                        _this.selectedShip = placement[my][mx];
                        _this.shipOrigin = _this.GetShipOrigin();
                        _this.selectionPos = new Point(_this.shipOrigin.x, _this.shipOrigin.y);
                        _this.selectionRot = _this.IsShipRotated(placement, _this.shipOrigin);
                        _this.selectedShipSegment = _this.selectionRot ? Math.abs(my - _this.shipOrigin.y) :
                            Math.abs(mx - _this.shipOrigin.x);
                        _this.selectionOrigin = new Point(mx, my);
                        _this.UpdateSelectionPlacement();
                    }
                }
            }
        });
        if (ConnectOnStart) {
            this.connectToRegionMaster("EU");
        }
    };
    Battleship.prototype.onError = function (errorCode, errorMsg) {
        this.output("Error " + errorCode + ": " + errorMsg);
        _super.prototype.onError.call(this, errorCode, errorMsg);
    };
    Battleship.prototype.onOperationResponse = function (errorCode, errorMsg, code, content) {
        this.output("Error " + errorCode + ": " + errorMsg);
        var LBCE = Photon.LoadBalancing.Constants.ErrorCode;
        switch (errorCode) {
            case LBCE.NoRandomMatchFound:
                this.createRoom(undefined, { maxPlayers: 2 });
                break;
            default:
                break;
        }
    };
    Battleship.prototype.CheckSunken = function (y, x, who, board, placement) {
        var _this = this;
        var shipId = placement[y][x];
        var nodes = [];
        for (var yy = 0; yy < GameHeight; yy++) {
            for (var xx = 0; xx < GameWidth; xx++) {
                if (placement[yy][xx] == shipId && board[yy][xx] <= 1) {
                    return false;
                }
                else if (placement[yy][xx] == shipId) {
                    var node = void 0;
                    if (!this.playVsAI) {
                        if (who == this.myActor().actorNr) {
                            node = this.map.mygame[yy][xx];
                        }
                        else {
                            node = this.map.othergame[yy][xx];
                        }
                    }
                    else {
                        if (who == 0) {
                            node = this.map.othergame[yy][xx];
                        }
                        else {
                            node = this.map.mygame[yy][xx];
                        }
                    }
                    nodes.push([node, yy, xx]);
                }
            }
        }
        var coordinates = [];
        nodes.forEach(function (value) {
            var node = value[0];
            var y = value[1];
            var x = value[2];
            node.value = placement[y][x];
            node.state = _this.BS.ShipSunk;
            board[y][x] = 3;
            coordinates.push(new Point(x, y));
        });
        if (this.playVsAI && who != 0) {
            this.ai.MarkSunk(coordinates, shipId);
        }
        return nodes.length > 0;
    };
    Battleship.prototype.StartGame = function () {
        this.sendMessage("gamestarted");
        this.sendMessage("doneturn");
    };
    Battleship.prototype.SetStateOfMap = function (board, placement, game) {
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                var node = game[y][x];
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
                        node.state = this.BS.ShipHit;
                        break;
                    case 3:
                        node.state = this.BS.ShipSunk;
                        break;
                    default:
                        break;
                }
            }
        }
    };
    Battleship.prototype.OfflineVictory = function () {
        this.canMove = false;
        this.gameOver = true;
        if (this.winner == 1) {
            document.querySelector("#msg").innerHTML = "You won! :D";
        }
        else {
            document.querySelector("#msg").innerHTML = "You lost! :(";
        }
        this.SetStateOfMap(this.aiBoard, this.aiPlacement, this.map.othergame);
        this.SetStateOfMap(this.offlineBoard, this.offlinePlacement, this.map.mygame);
    };
    Battleship.prototype.DoneWithTurn = function () {
        var _this = this;
        this.ignoreInput = true;
        setTimeout(function () {
            _this.canMove = false;
            if (_this.playVsAI) {
                if (!_this.HasWon()) {
                    setTimeout(function () {
                        var move = _this.ai.Move(false, -1, -1, _this.offlinePlacement);
                        var board = _this.offlineBoard;
                        var placement = _this.offlinePlacement;
                        var y = move.y;
                        var x = move.x;
                        var node = _this.map.mygame[y][x];
                        if (board[y][x] == 1) {
                            board[y][x] = 2;
                            if (!_this.CheckSunken(y, x, -1, board, placement)) {
                                node.state = _this.BS.ShipHit;
                                _this.ai.MarkHit(new Point(x, y));
                            }
                        }
                        else if (board[y][x] == 0) {
                            board[y][x] = -1;
                            node.state = _this.BS.ShipMiss;
                        }
                        _this.offlineBoard = board;
                        _this.offlinePlacement = placement;
                        if (_this.HasWon()) {
                            _this.OfflineVictory();
                        }
                        else {
                            setTimeout(function () {
                                _this.canMove = true;
                                _this.ignoreInput = false;
                            }, 1000);
                        }
                    }, 1000);
                }
                else {
                    _this.OfflineVictory();
                }
            }
            else {
                _this.myRoomActorsArray().forEach(function (element) {
                    if (element.actorNr == _this.myActor().actorNr) {
                        element.setCustomProperty("myturn", false);
                    }
                    else {
                        element.setCustomProperty("myturn", true);
                    }
                });
                _this.sendMessage("doneturn");
            }
        }, 1000);
    };
    Battleship.prototype.HasWon = function () {
        var board;
        var placement;
        if (this.playVsAI) {
            board = this.offlineBoard;
            placement = this.offlinePlacement;
            var aiWin = true;
            for (var yy = 0; yy < GameHeight; yy++) {
                for (var xx = 0; xx < GameWidth; xx++) {
                    if (placement[yy][xx] > 0 && board[yy][xx] < 3)
                        aiWin = false;
                }
            }
            if (aiWin) {
                this.winner = 2;
                return true;
            }
            else {
                board = this.aiBoard;
                placement = this.aiPlacement;
                for (var yy = 0; yy < GameHeight; yy++) {
                    for (var xx = 0; xx < GameWidth; xx++) {
                        if (placement[yy][xx] > 0 && board[yy][xx] < 3)
                            return false;
                    }
                }
                this.winner = 1;
                return true;
            }
        }
        else {
            board = this.otherPlayer.getCustomProperty("board");
            placement = this.otherPlayer.getCustomProperty("placement");
            for (var yy = 0; yy < GameHeight; yy++) {
                for (var xx = 0; xx < GameWidth; xx++) {
                    if (placement[yy][xx] > 0 && board[yy][xx] < 3)
                        return false;
                }
            }
            return true;
        }
    };
    Battleship.prototype.onEvent = function (code, content, actorNr) {
        var _this = this;
        switch (code) {
            case 1:
                var mess = content.message;
                var sender = content.senderName;
                if (actorNr) {
                    if (mess == "ready") {
                        if (this.myActor().actorNr == actorNr) {
                            document.querySelector("#msg").innerHTML = "Waiting for other player to become ready";
                        }
                        else {
                            document.querySelector("#msg").innerHTML = "Other player is ready!";
                        }
                        if (this.myActor().actorNr == this.myRoom().masterClientId) {
                            var readyCount = 0;
                            this.myRoomActorsArray().forEach(function (element) {
                                if (element.getCustomProperty("isReady"))
                                    readyCount++;
                            });
                            if (readyCount == 2) {
                                this.StartGame();
                                this.myRoomActorsArray().forEach(function (element) {
                                    if (element.actorNr == _this.myActor().actorNr) {
                                        element.setCustomProperty("myturn", true);
                                    }
                                    else {
                                        element.setCustomProperty("myturn", false);
                                    }
                                });
                            }
                        }
                    }
                    else if (mess == "gamestarted") {
                        document.querySelector("#msg").innerHTML = "Game has started";
                        this.gameStarted = true;
                    }
                    else if (mess == "doneturn") {
                        if (this.HasWon()) {
                            this.sendMessage("gameover");
                        }
                        else {
                            if (!this.myActor().getCustomProperty("myturn")) {
                                this.ignoreInput = true;
                            }
                            setTimeout(function () {
                                _this.canMove = _this.myActor().getCustomProperty("myturn");
                                _this.ignoreInput = !_this.canMove;
                                document.querySelector("#msg").innerHTML = _this.canMove ? "Your turn, make a move!" : "Wait for your turn...";
                            }, 1000);
                        }
                    }
                    else if (mess == "gameover") {
                        this.canMove = false;
                        this.gameOver = true;
                        if (actorNr == this.myActor().actorNr) {
                            document.querySelector("#msg").innerHTML = "You won! :D";
                        }
                        else {
                            document.querySelector("#msg").innerHTML = "You lost! :(";
                        }
                        {
                            var board = this.otherPlayer.getCustomProperty("board");
                            var placement = this.otherPlayer.getCustomProperty("placement");
                            this.SetStateOfMap(board, placement, this.map.othergame);
                            board = this.myActor().getCustomProperty("board");
                            placement = this.myActor().getCustomProperty("placement");
                            this.SetStateOfMap(board, placement, this.map.mygame);
                        }
                    }
                    else if (mess.split("/")[0] == "attack") {
                        if (actorNr == this.myActor().actorNr) {
                            var board = this.otherPlayer.getCustomProperty("board");
                            var placement = this.otherPlayer.getCustomProperty("placement");
                            var y = +mess.split("/")[1];
                            var x = +mess.split("/")[2];
                            var node = this.map.othergame[y][x];
                            if (board[y][x] == 1) {
                                board[y][x] = 2;
                                if (!this.CheckSunken(y, x, this.otherPlayer.actorNr, board, placement)) {
                                    node.state = this.BS.ShipHit;
                                }
                            }
                            else if (board[y][x] == 0) {
                                board[y][x] = -1;
                                node.state = this.BS.ShipMiss;
                            }
                            this.otherPlayer.setCustomProperty("placement", placement);
                            this.otherPlayer.setCustomProperty("board", board);
                        }
                        else {
                            var board = this.myActor().getCustomProperty("board");
                            var placement = this.myActor().getCustomProperty("placement");
                            var y = +mess.split("/")[1];
                            var x = +mess.split("/")[2];
                            var node = this.map.mygame[y][x];
                            if (board[y][x] == 1) {
                                board[y][x] = 2;
                                if (!this.CheckSunken(y, x, this.myActor().actorNr, board, placement)) {
                                    node.state = this.BS.ShipHit;
                                }
                            }
                            else if (board[y][x] == 0) {
                                board[y][x] = -1;
                                node.state = this.BS.ShipMiss;
                            }
                            this.myActor().setCustomProperty("placement", placement);
                            this.myActor().setCustomProperty("board", board);
                        }
                    }
                }
                else
                    this.output(sender + ": " + mess);
                break;
            default:
        }
    };
    Battleship.prototype.onStateChange = function (state) {
        // "namespace" import for static members shorter acceess
        var LBC = Photon.LoadBalancing.LoadBalancingClient;
        var stateText = document.getElementById("statetxt");
        switch (state) {
            case LBC.State.JoinedLobby:
                this.output("Random Game...");
                this.joinRandomRoom();
                break;
            default:
                break;
        }
        console.log(LBC.StateToName(state));
        stateText.textContent = LBC.StateToName(state);
    };
    Battleship.prototype.onJoinRoom = function () {
        this.output("Game " + this.myRoom().name + " joined");
    };
    Battleship.prototype.PlaceShip = function (board, ship, y, x, rot) {
        for (var i = 0; i < ship.length; i++) {
            if (rot) {
                if (y + i >= GameHeight ||
                    x >= GameWidth ||
                    board[y + i][x] > 0)
                    return false;
            }
            else {
                if (y >= GameHeight ||
                    x + i >= GameWidth ||
                    board[y][x + i] > 0)
                    return false;
            }
        }
        for (var i = 0; i < ship.length; i++) {
            if (rot) {
                board[y + i][x] = ship[i];
            }
            else {
                board[y][x + i] = ship[i];
            }
        }
        return true;
    };
    Battleship.prototype.PlaceShips = function () {
        var board = [];
        for (var y = 0; y < GameHeight; y++) {
            board.push([]);
            for (var x = 0; x < GameWidth; x++) {
                board[y].push(0);
            }
        }
        var shipsClone = JSON.parse(JSON.stringify(ships));
        var ship = shipsClone.pop();
        var attempts = 0;
        while (shipsClone.length + 1 > 0 || attempts++ > 10000) {
            for (var y = 0; y < GameHeight; y++) {
                for (var x = 0; x < GameWidth; x++) {
                    var rot = Math.random() > 0.5;
                    if (Math.random() < 0.1) {
                        if (this.PlaceShip(board, ship, y, x, rot)) {
                            if (shipsClone.length == 0)
                                return board;
                            ship = shipsClone.pop();
                        }
                    }
                }
            }
        }
        return board;
    };
    Battleship.prototype.StartGamePlacement = function () {
        var _this = this;
        if (this.playVsAI) {
            document.querySelector("#msg").innerHTML = "Playing vs AI";
        }
        else {
            document.querySelector("#msg").innerHTML = "Paired with other player";
            // TODO: make sure this code is only executed once
        }
        document.querySelector("#ready").addEventListener("click", function () {
            _this.canChangePlacement = false;
            if (!_this.playVsAI) {
                _this.myActor().setCustomProperty("placement", _this.offlinePlacement);
                _this.myActor().setCustomProperty("board", _this.offlineBoard);
                _this.myActor().setCustomProperty("isReady", true);
                _this.sendMessage("ready");
            }
            else {
                document.querySelector("#msg").innerHTML = "Your turn, make a move!";
                _this.gameStarted = true;
                _this.canMove = true;
            }
        });
        var placement = this.PlaceShips();
        this.canChangePlacement = true;
        if (this.playVsAI) {
            this.aiPlacement = this.PlaceShips();
            var shipBoard_1 = JSON.parse(JSON.stringify(this.aiPlacement));
            for (var y = 0; y < GameHeight; y++) {
                for (var x = 0; x < GameWidth; x++) {
                    shipBoard_1[y][x] = shipBoard_1[y][x] > 0 ? 1 : 0;
                }
            }
            this.aiBoard = shipBoard_1;
        }
        else {
            this.myActor().setCustomProperty("placement", placement);
        }
        this.offlinePlacement = JSON.parse(JSON.stringify(placement));
        var shipBoard = JSON.parse(JSON.stringify(placement));
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                shipBoard[y][x] = shipBoard[y][x] > 0 ? 1 : 0;
            }
        }
        this.offlineBoard = JSON.parse(JSON.stringify(shipBoard));
        if (!this.playVsAI) {
            this.myActor().setCustomProperty("board", shipBoard);
        }
        {
            var board = void 0;
            if (!this.playVsAI) {
                board = this.myActor().getCustomProperty("board");
            }
            else {
                board = this.offlineBoard;
            }
            for (var y = 0; y < GameHeight; y++) {
                for (var x = 0; x < GameWidth; x++) {
                    var node = this.map.mygame[y][x];
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
    };
    Battleship.prototype.onActorJoin = function (actor) {
        var _this = this;
        this.output("actor " + actor.actorNr + " joined");
        if (actor.actorNr > 1) {
            this.StartGamePlacement();
            this.myRoomActorsArray().forEach(function (element) {
                if (element.actorNr != _this.myActor().actorNr) {
                    _this.otherPlayer = element;
                }
            });
        }
    };
    Battleship.prototype.onActorLeave = function (actor) {
        this.output("actor " + actor.actorNr + " left");
    };
    Battleship.prototype.sendMessage = function (message) {
        try {
            this.raiseEvent(1, { message: message, senderName: "user" + this.myActor().actorNr }, { receivers: Photon.LoadBalancing.Constants.ReceiverGroup.All });
        }
        catch (err) {
            this.output("error: " + err.message);
        }
    };
    Battleship.prototype.output = function (str, color) {
        console.log(str);
    };
    return Battleship;
}(Photon.LoadBalancing.LoadBalancingClient));
var battleship;
window.onload = function () {
    battleship = new Battleship();
    battleship.Start();
};
//# sourceMappingURL=main.js.map