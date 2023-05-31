var logger = require('./logger.js').logger;
var users = new Array();

class User{
    constructor(name, uuid, socketId, roomID){
        this.name = name;
        this.uuid = uuid;
        this.roomID = roomID;
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

exports.createNewUser = function(name, uuid, socketId, roomID){
    console.log("[" + name + "]" + socketId);
    return new User(name, uuid, socketId, roomID);
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

exports.findUserBySocketId = function(socketId){
    for(let user of users){
        if(user.socketId == socketId){
            return user;
        }
    }
    return null;
}

exports.getUsersInRoom = function(roomID){
    var ret = Array();
    for(let user of users){
        //logger.debug("rID in list=" + user.roomID + ": rID "+roomID);
        if(user.roomID == roomID){
            ret.push(user);
        }
    }
    return ret;
}

exports.clearUsersCards = function(roomID){
    var usersInRoom = exports.getUsersInRoom(roomID);
    for(let user of usersInRoom){
        user.clearCards();
    }
}

exports.getNumberOfUsers = function(){
    return users.length;
}

exports.getUsers = function(){
    return users;
}