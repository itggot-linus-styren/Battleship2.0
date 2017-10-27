type NodeState = BattleshipMap.NodeState;

class BattleshipMapNode {
    public value : number;
    public state : NodeState;

    constructor(value : number, state : NodeState) {
        this.value = value;
        this.state = state;
    }
}

class BattleshipMap {

    public mygame : BattleshipMapNode[][];
    public othergame : BattleshipMapNode[][];

    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;

    private BS : typeof BattleshipMap.NodeState = BattleshipMap.NodeState;

    private grid : HTMLCanvasElement;

    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mygame = [];
        this.othergame = [];
        for (let y = 0; y < GameHeight; y++) {
            this.mygame[y] = [];
            this.othergame[y] = [];
            for (let x = 0; x < GameWidth; x++) {
                this.mygame[y][x] = new BattleshipMapNode(0, this.BS.NodeNormal);
                this.othergame[y][x] = new BattleshipMapNode(0, this.BS.NodeNormal);
            }            
        }
        
        this.grid = this.renderGridToBuffer();
    }

    renderGridToBuffer() {
        let dx = this.canvas.width / GameWidth;
        let dy = this.canvas.height / GameHeight;

        let x = 0;
        let y = 0;
        let w = this.canvas.width;
        let h = this.canvas.height;

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

        let bufferCanvas = document.createElement('canvas');
        bufferCanvas.width  = w;
        bufferCanvas.height = h;
        bufferCanvas.getContext('2d').drawImage( this.canvas, 0, 0, w, h, 0, 0, w, h );
        return bufferCanvas;
    }

    renderMyBoard() {
        let dx = this.canvas.width / GameWidth;
        let dy = this.canvas.height / GameHeight;

        console.log("rendering my board");
        
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                let fontColour = "black";
                let overrideValue = true;
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
                        fontColour = "white";
                        break;
                    default:
                        console.error("i don't know about: " + this.othergame[y][x].state);
                        break;                        
                }
                if (this.mygame[y][x].value > 0 || overrideValue) {
                    this.ctx.fillRect(x * dx, y * dy, dx, dy);
                    this.ctx.fillStyle = fontColour;
                    this.ctx.font = '11px Arial';
                    
                    let textString = ""+this.mygame[y][x].value;
                    let textWidth = this.ctx.measureText(textString).width;
                    let textHeight = this.ctx.measureText('M').width; // see https://stackoverflow.com/a/13318387
                    
                    
                    this.ctx.fillText(textString , x * dx + dx / 2 - (textWidth / 2), y * dy + dy / 2 + (textHeight / 2));                    
                }
            }
        }
    }

    renderOtherBoard() {
        let dx = this.canvas.width / GameWidth;
        let dy = this.canvas.height / GameHeight;

        console.log("rendering other board");
        
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                let showValue = false;
                let fontColour = "black";
                let overrideValue = true;                
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
                        
                        let textString = ""+this.othergame[y][x].value;
                        let textWidth = this.ctx.measureText(textString).width;
                        let textHeight = this.ctx.measureText('M').width; // see https://stackoverflow.com/a/13318387
                        
                        
                        this.ctx.fillText(textString , x * dx + dx / 2 - (textWidth / 2), y * dy + dy / 2 + (textHeight / 2));
                    }
                }
            }
        }
    }

    renderPlacement() {
        let dx = this.canvas.width / GameWidth;
        let dy = this.canvas.height / GameHeight;

        //console.log(JSON.stringify(this.mygame));
        
        for (let y = 0; y < GameHeight; y++) {
            for (let x = 0; x < GameWidth; x++) {
                let fontColour = "black";
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
                    
                    let textString = ""+this.mygame[y][x].value;
                    let textWidth = this.ctx.measureText(textString).width;
                    let textHeight = this.ctx.measureText('M').width; // see https://stackoverflow.com/a/13318387
                    
                    
                    this.ctx.fillText(textString , x * dx + dx / 2 - (textWidth / 2), y * dy + dy / 2 + (textHeight / 2));
                }
            }
        }
    }

    renderGrid() {
        let w = this.canvas.width;
        let h = this.canvas.height;
        this.canvas.getContext('2d').drawImage( this.grid, 0, 0, w, h, 0, 0, w, h );    
    }

}

module BattleshipMap {
    export enum NodeState {
        NodeNormal = 0,
        ShipHit = 1,
        ShipSunk = 2,
        ShipMiss = 3,
        NodeSelected = 4,
        NodeInvalidSelected = 5
    }
}