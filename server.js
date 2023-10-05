var logger = require('./logger.js').logger;

// サーバ起動～listen
logger.debug("requires");

var express = require("express");
var app = express();

logger.debug("start listen");
var server = app.listen(8080, "172.17.0.2", function(){
    logger.debug("Node server started on " + Date(Date.now()));
});

var io = require("socket.io")(server , {
    cors: {
        origin: '*',
    }
});

var usersMod = require("./usersModule.js");
var util = require("./util.js");

// ゲームロジック部
var {CCM, GameUser} = require("./ClientConnectionManager.js");
var gameManager = new CCM();
gameManager.createRoom("room1");
gameManager.createRoom("room2");
gameManager.createRoom("room3");
gameManager.createRoom("room4");
gameManager.createRoom("room5");
gameManager.rooms["room1"].resetRoom();
gameManager.rooms["room2"].resetRoom();
gameManager.rooms["room3"].resetRoom();
gameManager.rooms["room4"].resetRoom();
gameManager.rooms["room5"].resetRoom();


// 接続後ソケットに対する処理
io.sockets.on('connection', function(socket){
    logger.debug("connection established!");
    socket.on('disconnect', function(){
        logger.debug("disconnect");
        var roomID = gameManager.getRoomIDbyUser(socket.id);
        gameManager.unregisterUser(socket.id, roomID);
        io.to(roomID).emit("updateUsersList", gameManager.getUsers(roomID));

        if(gameManager.getUsers(roomID).length == 0){
            gameManager.resetGame(roomID);
            gameManager.initializeGameRound(roomID);
        }
    });

    // カードを配布する
    notifyDistributeCard = function(users){
        for(let user of users){
            for(let cardNum of user.handCards){
                logger.debug("distribute "+String(cardNum)+" to " +user.name);
                io.to(user.socketId).emit("distributeCard", String(cardNum) );
            }
        }
    };

    setupGame = function(roomID){
        logger.info("[" + roomID + "]" + "setup round[" + gameManager.rooms[roomID].roundNum + "]");
        var users = gameManager.getUsersInRoom(roomID);
        // ゲームの初期化
        gameManager.resetGame(roomID);
        // カードの配布
        gameManager.distributeCard(roomID);
        notifyDistributeCard(users);

        // ユーザの手札をロギング
        for(let user of users){
            logger.info("[" + roomID + "]" + "user:[" + user.name + "] has " + user.handCards);
        }

        io.to(roomID).emit("battle");
        gameManager.startRound();
        gameManager.rooms[roomID].roundNum++;
    };

    socket.on('login', function(name, roomID){
        if(name != "admin"){
            // ログインするたびにユーザの生成
            gameManager.registerUser(new GameUser(name, util.uuid(), socket.id), roomID);
        }

        logger.debug("[" + roomID +"]" + "server:login called"+gameManager.getUsersInRoom(roomID).length);
        if(gameManager.getUsersInRoom(roomID).length > 1){
            socket.join(roomID);
            io.to(roomID).emit("showNextRoundButton");
        }else{
            socket.join(roomID);
        }

        // ログインしたら通知
        socket.emit("loginCompleted");
        io.to(roomID).emit("updateUsersList", gameManager.getUsersInRoom(roomID));
        if(name == "admin"){
            socket.emit("showAdminUI");
        }
    });

    socket.on("openCard", function(card){
        var user = gameManager.findUserBySocketId(socket.id);
        var roomID = gameManager.getRoomIDbyUser(socket.id);
        logger.debug("[" + roomID + "]" + "server: openCard called");
        logger.info("[" + roomID + "]" + "user:[" + user.name + "] opened:" + user.openCard());

        // カードを山札に公開する
        gameManager.openCard(roomID, card);
        io.to(roomID).emit("refreshBoard", gameManager.rooms[roomID].tableDeck);
        logger.debug("[" + roomID + "]" + "cardOpened:" + card.text);

        var newCardNum = parseInt(card.text);
        var minimumCard = gameManager.rooms[roomID].cardDeck.shift();
        logger.debug("[" + roomID + "]" + "opened:" + newCardNum + "-----minimum:" + minimumCard);
        if(newCardNum == minimumCard){
            // OK
            if(gameManager.rooms[roomID].cardDeck.length==0){
                logger.info("[" + roomID + "]" + "game completed!");
                // 配布されたカードの全てが場に出たらcompleted
                io.to(roomID).emit("completed");
                io.to(roomID).emit("recvMessage", "成功！");
            }
        }else{
            // NG
            logger.info("[" + roomID + "]" + "game failed!");
            io.to(roomID).emit("failed");
            io.to(roomID).emit("recvMessage", "失敗！");
        }

        var cardListText = "";
        for(let card of gameManager.rooms[roomID].tableDeck){
            cardListText += card.text + ", ";
        }
        logger.info("[" + roomID + "]" + "current opened: " + cardListText);
    });

    socket.on("sendMessage", function(msg){
        var roomID = gameManager.getRoomIDbyUser(socket.id);
        logger.debug("[" + roomID + "]" + "server: sendMessage called");
        io.to(roomID).emit("recvMessage", msg);
    });

    socket.on("goNextRound", function(){
        var roomID = gameManager.getRoomIDbyUser(socket.id);
        io.to(roomID).emit("recvMessage", "ラウンド[" + gameManager.rooms[roomID].roundNum + "]を開始します");
        io.to(roomID).emit("goNextRound");

        // ユーザ手札のクリア
        gameManager.clearUsersCards(roomID);

        // ゲームの初期化
        setupGame(roomID);
    });

    // 管理者用関数
    socket.on("onChangeCardNumber", function(num){
        logger.debug("server: onChangeCardNumber called");
        io.to("room1").emit("setCardCount", num);
    });

    socket.on("setCardCount", function(num){
        logger.debug("server: setCardCount called");
        //logic.setCardCount(num);
    });
});












/*
var logic = require("./TheMindLogic.js");
var cardDeck;
var tableDeck;
var cardPile;
var roundNum = 0;

// ゲーム状態の初期化
function resetGame(){
    logger.debug("server: initializeGame called");
    cardPile = logic.createCardPile(roundNum);
    cardDeck = new Array();
    tableDeck = new Array();
}

resetGame();

function distributeCard(users, numOfCards=1){
    for(let user of users){
        for(let i=0;i<numOfCards;i++){
            // カードを引く
            var newCardNum = cardPile.drawCard();
            logger.debug("call distributeCard(" + newCardNum +") to " + user.name);
            // ユーザに追加
            user.addCard(newCardNum);
            cardDeck.push(newCardNum);
        }
    }

    // 配布カードを昇順にソート
    cardDeck.sort((a,b)=>{return a - b;});
    logger.debug(cardDeck);
}

// 接続後ソケットに対する処理
io.sockets.on('connection', function(socket){
    logger.debug("connection established!");
    socket.on('disconnect', function(){
        logger.debug("disconnect");
        var roomID = usersMod.findUserBySocketId(socket.id);
        usersMod.unregisterUser(socket.id);
        io.to(roomID).emit("updateUsersList", usersMod.getUsers());

        if(usersMod.getUsers().length == 0){
            resetGame();
            roundNum = 0;
            logic.setCardCount(1);
        }
    });

    // カードを配布する
    notifyDistributeCard = function(users){
        for(let user of users){
            for(let cardNum of user.handCards){
                io.to(user.socketId).emit("distributeCard", String(cardNum) );
            }
        }
    };

    setupGame = function(roomID){
        logger.info("setup round[" + roundNum + "]");
        var users = usersMod.getUsersInRoom(roomID);
        // ゲームの初期化
        resetGame();
        // カードの配布
        distributeCard(users, logic.getCardCount(roundNum));
        notifyDistributeCard(users);

        // ユーザの手札をロギング
        for(let user of users){
            logger.info("user:[" + user.name + "] has " + user.handCards);
        }

        io.to(roomID).emit("battle");

        roundNum++;
    };

    socket.on('login', function(name, roomID){
        var users = usersMod.getUsers();
        if(name != "admin"){
            // ログインするたびにユーザの生成
            usersMod.registerUser(usersMod.createNewUser(name, util.uuid(), socket.id, roomID));
        }

        logger.debug("server:login called@"+roomID+", "+usersMod.getUsersInRoom(roomID).length);
        if(usersMod.getUsersInRoom(roomID).length > 1){
            socket.join(roomID);
            io.to(roomID).emit("showNextRoundButton");
        }else{
            socket.join(roomID);
        }

        // ログインしたら通知
        socket.emit("loginCompleted");
        io.to(roomID).emit("updateUsersList", usersMod.getUsersInRoom(roomID));
        if(name == "admin"){
            socket.emit("showAdminUI");
        }
    });

    socket.on("openCard", function(card){
        logger.debug("server: openCard called");
        var user = usersMod.findUserBySocketId(socket.id);
        logger.info("user:[" + user.name + "] opened:" + user.openCard());

        // カードを山札に公開する
        tableDeck.push(card);
        io.to(user.roomID).emit("refreshBoard", tableDeck);
        logger.debug("cardOpened:" + card.text);

        var newCardNum = parseInt(card.text);
        var minimumCard = cardDeck.shift();
        logger.debug("opened:" + newCardNum + "-----minimum:" + minimumCard);
        if(newCardNum == minimumCard){
            // OK
            if(cardDeck.length==0){
                logger.info("game completed!");
                // 配布されたカードの全てが場に出たらcompleted
                io.to(user.roomID).emit("completed");
                io.to(user.roomID).emit("recvMessage", "成功！");
            }
        }else{
            // NG
            logger.info("game failed!");
            io.to(user.roomID).emit("failed");
            io.to(user.roomID).emit("recvMessage", "失敗！");
        }

        var cardListText = "";
        for(let card of tableDeck){
            cardListText += card.text + ", ";
        }
        logger.info("current opened: " + cardListText);
    });

    socket.on("sendMessage", function(msg){
        logger.debug("server: sendMessage called");
        var user = usersMod.findUserBySocketId(socket.id);
        io.to(user.roomID).emit("recvMessage", msg);
    });

    socket.on("goNextRound", function(){
        var user = usersMod.findUserBySocketId(socket.id);
        io.to(user.roomID).emit("recvMessage", "ラウンド[" + roundNum + "]を開始します");
        io.to(user.roomID).emit("goNextRound");

        if(roundNum==0){
            logic.initializeRandomGenerator();
        }

        // ユーザ手札のクリア
        usersMod.clearUsersCards(user.roomID);

        // ゲームの初期化
        setupGame(user.roomID);
    });

    // 管理者用関数
    socket.on("onChangeCardNumber", function(num){
        logger.debug("server: onChangeCardNumber called");
        io.to("room1").emit("setCardCount", num);
    });

    socket.on("setCardCount", function(num){
        logger.debug("server: setCardCount called");
        logic.setCardCount(num);
    });
});
*/