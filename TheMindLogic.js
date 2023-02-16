exports.createRoomId = function(){
    return "ABCDEFG";
}

exports.createDto = function(tmpRoomId, nameList){
    return {"tmpRoomId": tmpRoomId,
            "nameList": nameList};
}

// 場に出たカードが昇順かどうかチェックする
exports.isAscent = function(cardNumList){
    for(let i=1;i<cardNumList.length;i++){
        if(cardNumList[i-1]>cardNumList[i]){
            return false;
        }
    }
    return true;
}

class CardPile{
    constructor(){
        this.cardPile = new Array();
    }
    drawCard(){
        return 0;
    }
    reset(){
        this.cardPile = new Array();
    }
}

class RandomCardPile extends CardPile{
    constructor(){
        super();
        for(let i=0;i<100;i++){
            this.cardPile.push({"num": i+1, "used": false});
        }
    }
    drawCard(){
        // ランダムに使用していないカードを見つけてドロー
        var id = Math.floor(Math.random()*100);
        while(true){
            if(this.cardPile[id].used == false){
                this.cardPile[id].used = true;
                break;
            }
            id = Math.floor(Math.random()*100);
        }
        return this.cardPile[id].num;
    }
}

exports.createCardPile = function(){
    return new RandomCardPile();
}