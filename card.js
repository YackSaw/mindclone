class Card{
    constructor(ctx, cardColor){
        this.ctx = ctx;
        this.width = 80;
        this.height = 120;
        this.text = "0";
        this.x = 0;
        this.y = 0;
        this.cardColor = cardColor;
    }

    setColor(color){
        this.cardColor = color;
    }

    setContext(ctx){
        this.ctx = ctx;
    }

    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    setNumberText(text){
        this.text = text;
    }

    draw(scale=1){
        this.ctx.clearRect(this.x, this.y, this.width, this.height);
        this.ctx.beginPath();
        this.ctx.fillStyle = this.cardColor;
        this.ctx.fillRect(this.x, this.y, this.width * scale, this.height * scale);

        this.ctx.beginPath();
        this.ctx.lineWidth = "5";
        this.ctx.strokeStyle = "black";
        this.ctx.rect(this.x, this.y, this.width * scale, this.height * scale);
        this.ctx.stroke();
        this.ctx.font = "24px Serif";
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.fillText(this.text, this.x + this.width/2-24, this.y + this.height/2);
    }
}
