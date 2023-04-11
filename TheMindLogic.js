var PRand = require('./PseudoRandom.js');
var randomGen = new PRand.Random();
var cardNumber = 1;

exports.initializeRandomGenerator = function(){
    randomGen = new PRand.Random();
}

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


const cardsByRound = {
    0: 1,
    1: 1,
    2: 1,
    3: 1,

    4: 2,
    5: 2,
    6: 2,

    7: 3,
    8: 3,
    9: 3,
};
exports.getCardCount = function(roundNum){
    // if(roundNum in cardsByRound){
    //     return cardsByRound[roundNum];
    // }
    // else{
    //     return 1;
    // }
    return cardNumber;
}

exports.setCardCount = function(num){
    cardNumber = num;
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
        var id = randomGen.nextInt(1, 100);
        while(true){
            if(this.cardPile[id].used == false){
                this.cardPile[id].used = true;
                break;
            }
            id = randomGen.nextInt(1, 100);
        }
        return this.cardPile[id].num;
    }
}

exports.createCardPile = function(){
    return new RandomCardPile();
}