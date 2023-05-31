var PRand = require('./PseudoRandom.js');
var randomGen = new PRand.Random();
var cardNumber = 1;
const MAX_NUM = 100;

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
        for(let i=0;i<MAX_NUM;i++){
            this.cardPile.push({"num": i+1, "used": false});
        }
    }
    drawCard(){
        // ランダムに使用していないカードを見つけてドロー
        var id = randomGen.nextInt(1, MAX_NUM);
        while(true){
            if(this.cardPile[id].used == false){
                this.cardPile[id].used = true;
                break;
            }
            id = randomGen.nextInt(1, MAX_NUM);
        }
        return this.cardPile[id].num;
    }
}

class RandomDevCardPile extends CardPile{
    constructor(){
        super();
        for(let i=0;i<MAX_NUM;i++){
            this.cardPile.push({"num": i+1, "used": false});
        }
    }

    setDeviation(dev){
        this.deviation = dev;
        this.baseCardNum = randomGen.nextInt(this.deviation, MAX_NUM-this.deviation);
    }

    drawCard(){
        // ランダムに使用していないカードを見つけてドロー
        var id = randomGen.nextInt(this.baseCardNum-this.deviation, this.baseCardNum+this.deviation);
        while(true){
            if(this.cardPile[id].used == false){
                this.cardPile[id].used = true;
                break;
            }
            id = randomGen.nextInt(this.baseCardNum-this.deviation, this.baseCardNum+this.deviation);
        }
        return this.cardPile[id].num;
    }
}
/*
// 2023/05/27実験で使用
exports.createCardPile = function(roundNum){
    var ret = new RandomDevCardPile();
    var dev = parseInt((MAX_NUM*0.4)/Math.pow(2, roundNum));
    if(dev<8){
        dev=8;
    }
    ret.setDeviation(dev);
    return ret;
}
*/

// 2023/04/14実験・および2023/05/27実験で使用
exports.createCardPile = function(roundNum){
    return new RandomCardPile();
}
