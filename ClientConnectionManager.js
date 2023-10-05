var PRand = require('./PseudoRandom.js');
var logger = require('./logger.js').logger;
const MAX_NUM = 100;

class CardPile{
    constructor(randomGen){
        this.cardPile = new Array();
        this.randomGen = randomGen;
    }
    drawCard(){
        return 0;
    }
    reset(){
        this.cardPile = new Array();
    }
    shuffleCardPile(){
        this.cardPile = new Array();
    }
}

class RandomCardPile extends CardPile{
    constructor(randomGen){
        super(randomGen);
        for(let i=0;i<MAX_NUM;i++){
            this.cardPile.push({"num": i+1, "used": false});
        }
    }
    drawCard(){
        // ランダムに使用していないカードを見つけてドロー
        var id = this.randomGen.nextInt(1, MAX_NUM);
        while(true){
            if(this.cardPile[id].used == false){
                this.cardPile[id].used = true;
                break;
            }
            id = this.randomGen.nextInt(1, MAX_NUM);
        }
        return this.cardPile[id].num;
    }
}

class RandomDevCardPile extends CardPile{
    constructor(randomGen){
        super(randomGen);
        for(let i=0;i<MAX_NUM;i++){
            this.cardPile.push({"num": i+1, "used": false});
        }
    }

    setDeviation(dev){
        this.deviation = dev;
        this.baseCardNum = this.randomGen.nextInt(this.deviation, MAX_NUM-this.deviation);
    }

    drawCard(){
        // ランダムに使用していないカードを見つけてドロー
        var id = this.randomGen.nextInt(this.baseCardNum-this.deviation, this.baseCardNum+this.deviation);
        while(true){
            if(this.cardPile[id].used == false){
                this.cardPile[id].used = true;
                break;
            }
            id = this.randomGen.nextInt(this.baseCardNum-this.deviation, this.baseCardNum+this.deviation);
        }
        return this.cardPile[id].num;
    }
}

class GameUser{
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

class GameRoom{
    constructor(roomID){
        // 2023/04/14実験・および2023/05/27実験で使用
        this.cardPile = null;
        this.cardDeck = new Array();        //配布した全カード
        this.tableDeck = new Array();       //山札
        this.roomID = roomID;
        this.users = new Array();
        this.numOfCards = 1;
        this.roundNum = 0;
        this.randomGen = new PRand.Random();
    }

    createCardPile(roundNum){
        this.cardPile = new RandomCardPile(this.randomGen);

        // 2023/05/27実験で使用
        /*
        var ret = new RandomDevCardPile();
        var dev = parseInt((MAX_NUM*0.4)/Math.pow(2, roundNum));
        if(dev<8){
            dev=8;
        }
        ret.setDeviation(dev);
        this.cardPile = ret;
        */
    }

    shuffleCardPile(roundNum){
        this.cardPile.shuffleCardPile();

        /*
        var dev = parseInt((MAX_NUM*0.4)/Math.pow(2, roundNum));
        if(dev<8){
            dev=8;
        }
        this.cardPile.setDeviation(dev);
        */
    }

    addUser(gameUser){
        this.users.push(gameUser);
    }

    deleteUser(userSocketId){
        var id = -1;
        for(let i=0;i<this.users.length;i++){
            logger.debug("[" + this.roomID + "]" + "disconnected:" + userSocketId + "  user:" + this.users[i].socketId)
            if(this.users[i].socketId == userSocketId){
                logger.debug("unregister user:" + this.users[i].name);
                id = i;
                break;
            }
        }
    
        if(id>=0){
            this.users.splice(id, 1);
        }    
    }

    clearUsersCards(){
        for(let user of this.users){
            user.clearCards();
        }
    }

    distributeCard(){
        for(let user of this.users){
            for(let i=0;i<this.numOfCards;i++){
                // カードを引く
                var newCardNum = this.cardPile.drawCard();
                logger.debug("[" + this.roomID + "]" + "call distributeCard(" + newCardNum +") to " + user.name);
                // ユーザに追加
                user.addCard(newCardNum);
                this.cardDeck.push(newCardNum);
            }
        }
    
        // 配布カードを昇順にソート
        this.cardDeck.sort((a,b)=>{return a - b;});
        logger.debug(this.cardDeck);
    }

    resetRoom(){
        this.createCardPile(this.roundNum);
        this.cardDeck = new Array();
        this.tableDeck = new Array();
    }

    findUserBySocketId(userSocketId){
        for(let user of this.users){
            if(user.socketId == userSocketId){
                return user;
            }
        }
        return null;
    }

    hasUser(userSocketId){
        return this.findUserBySocketId(userSocketId) != null;
    }

    initializeGameRound(){
        this.randomGen = new PRand.Random();
        this.roundNum = 0;
        this.numOfCards = 1;
    }

    startRound(){
        this.roundNum++;
    }

    openCard(card){
        this.tableDeck.push(card);
    }
}

class ClientConnectionManager{
    constructor(){
        this.rooms = {};
    }

    createRoom(roomID){
        this.rooms[roomID] = new GameRoom(roomID);
        this.rooms[roomID].createCardPile(0);
    }

    registerUser(gameUser, roomID){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].addUser(gameUser);
        }
    }

    unregisterUser(gameUserSocketId, roomID){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].deleteUser(gameUserSocketId);
        }
    }

    getRoomIDbyUser(gameUserSocketId){
        for (let roomID in this.rooms) {
            if(this.rooms[roomID].hasUser(gameUserSocketId)){
                return roomID;
            }
        }
        return null;
    }

    getUsersInRoom(roomID){
        if(this.rooms[roomID]!=null){
            return this.rooms[roomID].users;
        }
        return new Array();
    }

    clearUsersCards(roomID){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].clearUsersCards();
        }
    }

    getNumberOfUsers(roomID){
        if(this.rooms[roomID]!=null){
            return this.rooms[roomID].users.length;
        }
        return 0;
    }

    getUsers(roomID){
        if(this.rooms[roomID]!=null){
            return this.rooms[roomID].users;
        }
        return new Array();
    }

    resetGame(roomID){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].resetRoom();
        }
    }

    initializeGameRound(roomID){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].initializeGameRound();
        }
    }

    distributeCard(roomID){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].distributeCard();
        }
    }

    startRound(roomID){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].startRound();
        }
    }

    findUserBySocketId(gameUserSocketId){
        for (let roomID in this.rooms) {
            var user = this.rooms[roomID].findUserBySocketId(gameUserSocketId);
            if(user != null){
                return user;
            }
        }
        return null;
    }

    openCard(roomID, card){
        if(this.rooms[roomID]!=null){
            this.rooms[roomID].openCard(card);
        }
    }

    setupGame(roomID){
        this.rooms[roomID].resetRoom();
    }
}

module.exports = {
    CCM: ClientConnectionManager,
    GameUser: GameUser,
}
