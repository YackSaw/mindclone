var logger = require('./logger.js').logger;
var users = new Array();

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

exports.registerUser = function(newUser){
    users.push(newUser);
}

exports.unregisterUser = function(userSocketId){
    var id = -1;
    for(let i=0;i<users.length;i++){
        logger.debug("disconnected:" + userSocketId + "  user:" + users[i].socketId)
        if(users[i].socketId == userSocketId){
            logger.debug("unregister user:" + users[i].name);
            id = i;
            break;
        }
    }

    if(id>=0){
        users.splice(id, 1);
    }
}

exports.clearUsersCards = function(){
    for(let user of users){
        user.clearCards();
    }
}

exports.findUserBySocketId = function(socketId){
    for(let user of users){
        if(user.socketId == socketId){
            return user;
        }
    }
    return null;
}

exports.getNumberOfUsers = function(){
    return users.length;
}

exports.getUsers = function(){
    return users;
}