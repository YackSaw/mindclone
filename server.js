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
var logic = require("./TheMindLogic.js");

var tmpRoomId;
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
        usersMod.unregisterUser(socket.id);
        io.to(tmpRoomId).emit("updateUsersList", usersMod.getUsers());

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

    setupGame = function(){
        logger.info("setup round[" + roundNum + "]");
        var users = usersMod.getUsers();
        // ゲームの初期化
        resetGame();
        // カードの配布
        distributeCard(users, logic.getCardCount(roundNum));
        notifyDistributeCard(users);

        // ユーザの手札をロギング
        for(let user of users){
            logger.info("user:[" + user.name + "] has " + user.handCards);
        }

        io.to(tmpRoomId).emit("battle");

        roundNum++;
    };

    socket.on('login', function(name){
        var users = usersMod.getUsers();
        if(name != "admin"){
            // ログインするたびにユーザの生成
            usersMod.registerUser(usersMod.createNewUser(name, util.uuid(), socket.id));
        }

        logger.debug("server:login called");
        if(users.length > 1){
            socket.join(tmpRoomId);
            io.to(tmpRoomId).emit("showNextRoundButton");
        }else{
            tmpRoomId = logic.createRoomId();
            socket.join(tmpRoomId);
        }

        // ログインしたら通知
        socket.emit("loginCompleted");
        io.to(tmpRoomId).emit("updateUsersList", users);
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
        io.to(tmpRoomId).emit("refreshBoard", tableDeck);
        logger.debug("cardOpened:" + card.text);

        var newCardNum = parseInt(card.text);
        var minimumCard = cardDeck.shift();
        logger.debug("opened:" + newCardNum + "-----minimum:" + minimumCard);
        if(newCardNum == minimumCard){
            // OK
            if(cardDeck.length==0){
                logger.info("game completed!");
                // 配布されたカードの全てが場に出たらcompleted
                io.to(tmpRoomId).emit("completed");
                io.to(tmpRoomId).emit("recvMessage", "成功！");
            }
        }else{
            // NG
            logger.info("game failed!");
            io.to(tmpRoomId).emit("failed");
            io.to(tmpRoomId).emit("recvMessage", "失敗！");
        }

        var cardListText = "";
        for(let card of tableDeck){
            cardListText += card.text + ", ";
        }
        logger.info("current opened: " + cardListText);
    });

    socket.on("sendMessage", function(msg){
        logger.debug("server: sendMessage called");
        io.to(tmpRoomId).emit("recvMessage", msg);
    });

    socket.on("goNextRound", function(){
        io.to(tmpRoomId).emit("recvMessage", "ラウンド[" + roundNum + "]を開始します");
        io.to(tmpRoomId).emit("goNextRound");

        if(roundNum==0){
            logic.initializeRandomGenerator();
        }

        // ユーザ手札のクリア
        usersMod.clearUsersCards();

        // ゲームの初期化
        setupGame();
    });

    // 管理者用関数
    socket.on("onChangeCardNumber", function(num){
        logger.debug("server: onChangeCardNumber called");
        io.to(tmpRoomId).emit("setCardCount", num);
    });

    socket.on("setCardCount", function(num){
        logger.debug("server: setCardCount called");
        logic.setCardCount(num);
    });
});