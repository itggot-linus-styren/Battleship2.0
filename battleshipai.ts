class Point {
    x = 0;
    y = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class GridCoordinate {

    x : number  = 0;
    y : number  = 0;
    xVal : number  = 0;
    yVal : number  = 0;
    xValRev : number = 0;
    yValRev : number  = 0;

    private sumx : number = 0;
    private sumy : number = 0;

    private BC : any = BattleshipAI.Constants;

    constructor (x : number, y : number, xVal : number, yVal : number) {
        this.x = x;
        this.y = y;
        this.xVal = xVal;
        this.yVal = yVal;
    }

    AddXY(xVal : number, yVal : number) : void {
        this.xValRev = xVal;
        this.yValRev = yVal;
        this.sumx = this.Sum(this.xVal, this.xValRev);
        this.sumy = this.Sum(this.yVal, this.yValRev);
    }

    GetScore() : number {
        var result : number = this.sumx * this.sumy;
        if (result < this.BC.MaxScore) {
            return result;
        } else {     
            if (Math.random() < this.BC.ChanceOfPrime1) {
                return this.BC.Prime1;
            } else {
                return this.BC.Prime2;
            }
        }
    }

    Sum(a : number, b : number) : number {
        return ((a + b) - Math.abs(a - b));
    }

}

type gridcoord2D = Array<Array<GridCoordinate>>;

class BattleshipAI {    

    private dmSize = (10 - 1);

    private dm : gridcoord2D;

    private enemyGrid : number[][] = [
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0]
    ];

    private ships : number[][];

    private enemeyPlacement : any;
   
    private maxSize : number = 5;

    private lastShot : Point = new Point(0, 0);

    private hitList : Array<Point> = [];

    private BC : any = BattleshipAI.Constants;

    private BCI : any = this.BC.Internal;

    constructor() {
        this.ships = JSON.parse(JSON.stringify(ships));
        this.dm = [];
        for (let y = 0; y < this.dmSize + 1; y++) {
            this.dm[y] = [];
            for (let x = 0; x < this.dmSize + 1; x++) {
                this.dm[y][x] = new GridCoordinate(0, 0, 0, 0);
            }            
        }
    }

    Move(override : boolean, x : number, y : number, placement : any) : Point {
        this.enemeyPlacement = placement;
        if (override) {
            this.lastShot = new Point(x, y);
        } else {
            if (this.hitList.length <= 0) {
                this.lastShot = this.FindNewTarget();
            } else {
                this.lastShot = this.SinkLastTarget();
            }
        }

        if (!this.lastShot) {
            this.lastShot = this.FindNewTarget();
        }

        this.enemyGrid[this.lastShot.y][this.lastShot.x] = this.BCI.ShotFired;
        return this.lastShot;
    }

    MarkHit(coordinates : Point) : void {
        this.hitList.push(new Point(coordinates.x, coordinates.y));
        this.enemyGrid[coordinates.y][coordinates.x] = this.BCI.ShipHit;
    }

    MarkSunk(coordinates : Array<Point>, shipId : number) : void {
        for (let i = 0; i < this.ships.length; i++) {
            if (this.ships[i][0] == shipId) {
                this.ships.splice(i, 1);
                console.log("SUNK SHIP " + shipId)
                break;
            }
        }
        for (let i = 0; i < coordinates.length; i++) {
            for (let j = 0; j < this.hitList.length; j++) {
                if ((this.hitList[j].x == coordinates[i].x) &&
                    (this.hitList[j].y == coordinates[i].y)) {
                        this.hitList.splice(j, 1);
                }
            }
        }
    }
       
    private SinkLastTarget() : Point {
        let x : number = 0,
            y : number = 0,
            xMin : number = 0,
            xMax : number = 0,
            yMin : number = 0,
            yMax : number = 0,
            goVert : boolean = false,
            goHorz : boolean = false,
            lastHit : Point = undefined,
            prevHit : Point = undefined;
        let possibleCoordinates : Array<Point> = [];

        if (this.hitList[0]) {
            lastHit = this.hitList[0];
        }

        if (this.hitList[1]) {
            prevHit = this.hitList[1];
        }

        if (lastHit) {
            x = lastHit.x;
            y = lastHit.y;
        } else {
            x = 0;
            y = 0;
        }

        xMin = x - this.maxSize;
        xMax = x + this.maxSize;
        yMin = y - this.maxSize;
        yMax = y + this.maxSize;

        // clamp search boundaries
        if (xMin < 0) xMin = 0;
        if (xMax > this.dmSize) xMax = this.dmSize;
        if (yMin < 0) yMin = 0;
        if (yMax > this.dmSize) yMax = this.dmSize;

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

        for (let attempt = 0; attempt < 2; attempt++) {
            // go left
            if (!goVert) {
                for (let ix = x; ix >= xMin; ix--) {
                    if (this.enemyGrid[y][ix] == this.BCI.ShotFired) break;
                    else {
                        if (this.enemyGrid[y][ix] != this.BCI.ShipHit) {
                            possibleCoordinates.push(new GridCoordinate(ix, y, 0, 0));
                        }
                    }
                }
            }

            // go up
            if (!goHorz) {
                for (let iy = y; iy >= yMin; iy--) {
                    if (this.enemyGrid[iy][x] == this.BCI.ShotFired) break;
                    else {
                        if (this.enemyGrid[iy][x] != this.BCI.ShipHit) {
                            possibleCoordinates.push(new GridCoordinate(x, iy, 0, 0));
                        }
                    }
                }
            }

            // go right
            if (!goVert) {
                for (let ix = x; ix <= xMax; ix++) {
                    if (this.enemyGrid[y][ix] == this.BCI.ShotFired) break;
                    else {
                        if (this.enemyGrid[y][ix] != this.BCI.ShipHit) {
                            possibleCoordinates.push(new GridCoordinate(ix, y, 0, 0));
                        }
                    }
                }
            }

            // go down
            if (!goHorz) {
                for (let iy = y; iy <= yMax; iy++) {
                    if (this.enemyGrid[iy][x] == this.BCI.ShotFired) break;
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
                } else if (goVert) {
                    goVert = false;
                    goHorz = true;
                }
            } else {
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
    }

    private CanPlaceShipAtSegment(y : number, x : number, ship : number[], segment : number) : boolean {
        let canPlaceNormal = true,
            canPlaceRotated = true;
        for (let i = 0; i < ship.length; i++) {
            if (y < 0 ||
                (x - segment) < 0 ||
                y >= GameHeight ||
                (x - segment) + i >= GameWidth ||
                this.enemyGrid[y][(x - segment) + i] != 0) {
                    //console.log("segment " + i + " doesn't fit at " + y + " and " + ((x - segment) + i));
                    canPlaceNormal = false;
                }
        }
        for (let i = 0; i < ship.length; i++) {
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
    }

    private CanPlaceShip(y : number, x : number, ship : number[]) : boolean {
        for (let i = 0; i < ship.length; i++) {
            if (this.CanPlaceShipAtSegment(y, x, ship, i)) {
                return true;
            }
        }        
        return false;
    }

    private CanPlaceRemainingShips(y : number, x : number) : boolean {
        let canPlace : boolean = false;
        this.ships.forEach((ship) => {
            if (this.CanPlaceShip(y, x, ship)) {
                //console.log("able to place ship " + ship[0] + " at " + y + " , " + x);
                canPlace = true;
            } else {
                //console.log("not able to place ship " + ship[0] + " at " + y + " , " + x);
            }
        });
        return canPlace;
    }
     
    private FindNewTarget() : Point {
        let newXval : number = 0,
            newYval : number = 0,
            tmpScore : number = 0,
            highScoreN : number = (6 - 1),
            highScoreXs : Array<number> = [0, 0, 0, 0, 0, 0],
            highScoreYs : Array<number> = [0, 0, 0, 0, 0, 0],
            highScoreVals : Array<number> = [0, 0, 0, 0, 0, 0],
            shotCoordinates : Point = new Point(0, 0),
            scorePicker = ~~(Math.random() * highScoreN);

        // down-right traversal
        for (let iy = 0; iy <= this.dmSize; iy++) {
            for (let ix = 0; ix <= this.dmSize; ix++) {
                if (!this.enemyGrid[iy][ix]) {
                    newXval = 0;
                    if (ix > 0 && this.dm[iy][ix - 1]) {
                        newXval = this.dm[iy][ix - 1].xVal;
                    }
                    newYval = 0;
                    if (iy > 0 && this.dm[iy - 1][ix]) {
                        newYval = this.dm[iy - 1][ix].yVal;
                    }
                } else {
                    newXval = -1;
                    newYval = -1;
                }

                this.dm[iy][ix] = new GridCoordinate(ix, iy, newXval + 1, newYval + 1);
            }
        }

        // up-left traversal
        for (let iy = this.dmSize; iy >= 0; iy--) {
            for (let ix = this.dmSize; ix >= 0; ix--) {
                if (!this.enemyGrid[iy][ix]) {
                    newXval = 0;
                    if (ix < this.dmSize && this.dm[iy][ix + 1]) {
                        newXval = this.dm[iy][ix + 1].xVal;
                    }
                    newYval = 0;
                    if (iy < this.dmSize && this.dm[iy + 1][ix]) {
                        newYval = this.dm[iy + 1][ix].yVal;
                    }
                } else {
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
                    for (let i = 0; i <= highScoreN; i++) {
                        if (tmpScore > highScoreVals[i]) {
                            highScoreXs.splice(i, 0, ix);
                            highScoreYs.splice(i, 0, iy);
                            highScoreVals.splice(i, 0, tmpScore);
                            break;
                        }
                    }                    
                } else if (tmpScore == highScoreVals[highScoreN]) {
                    if (Math.random() < this.BC.ChanceOfRecordIfEqual) {
                        for (let i = 0; i <= highScoreN; i++) {
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
        } else {
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
    }

}
   
module BattleshipAI.Constants {
    export enum Internal {
        ShotFired = 1,
        ShipHit = 2,
        ShipPlacementInvalid = 3
    }
        
    export const MaxScore : number = 80;
    export const ChanceOfPrime1 : number = 0.2;
    export const Prime1 : number = 67;
    export const Prime2 : number = 61;

    export const ChanceOfRecordIfEqual : number = 1 / 7;
}