class User{
    constructor(name, uuid, socketId){
        this.name = name;
        this.uuid = uuid;
        this.socketId = socketId;
        this.handCards = new Array();
    }

    // カードの追加、毎回ソートする
    addCard(cardNum){
        this.handCards.push(cardNum);
        this.handCards.sort((a,b)=>{return a - b;});
    }

    // 山札に公開する
    openCard(){
        return this.handCards.shift();
    }

    clearCards(){
        this.handCards = new Array();
    }
}

exports.createNewUser = function(name, uuid, socketId){
    console.log("[" + name + "]" + socketId);
    return new User(name, uuid, socketId);
}