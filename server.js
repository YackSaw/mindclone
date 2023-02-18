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



// 定数
const numberOfPlayers = 2;

// ゲームロジック部
var logic = require("./TheMindLogic.js");

var tmpRoomId;
var distributedCardList = new Array();
var openedCardList = new Array();
var cardPile = logic.createCardPile();
var roundNum = 0;

// ゲーム状態の初期化
function initializeGame(){
    logger.debug("server: initializeGame called");
    cardPile = logic.createCardPile();
    distributedCardList = new Array();
    openedCardList = new Array();
}

function distributeCard(users, numOfCards=1){
    for(let user of users){
        for(let i=0;i<numOfCards;i++){
            // カードを引く
            var newCardNum = cardPile.drawCard();
            logger.debug("call distributeCard(" + newCardNum +") to " + user.name);
            // ユーザに追加
            user.addCard(newCardNum);
            distributedCardList.push(newCardNum);
        }
    }

    // 配布カードを昇順にソート
    distributedCardList.sort((a,b)=>{return a - b;});
    logger.debug(distributedCardList);
}

// 接続後ソケットに対する処理
io.sockets.on('connection', function(socket){
    logger.debug("connection established!");
    socket.on('disconnect', function(){
        logger.debug("disconnect");
        usersMod.unregisterUser(socket.id);
        io.to(tmpRoomId).emit("updateUsersList", usersMod.getUsers());
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
        initializeGame();
        // カードの配布
        distributeCard(users, 2);
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
        // ログインするたびにユーザの生成
        usersMod.registerUser(usersMod.createNewUser(name, util.uuid(), socket.id));

        logger.debug("server:login called");
        if(users.length == numberOfPlayers){
            socket.join(tmpRoomId);

            // ゲームの初期化
            setupGame();
        }else{
            tmpRoomId = logic.createRoomId();
            socket.join(tmpRoomId);
        }

        // ログインしたら通知
        socket.emit("loginCompleted");
        io.to(tmpRoomId).emit("updateUsersList", users);
    });

    socket.on("openCard", function(card){
        logger.debug("server: openCard called");
        var user = usersMod.findUserBySocketId(socket.id);
        logger.info("user:[" + user.name + "] opened:" + user.openCard());

        // カードを山札に公開する
        openedCardList.push(card);
        io.to(tmpRoomId).emit("refreshBoard", openedCardList);
        logger.debug("cardOpened:" + card.text);

        var newCardNum = parseInt(card.text);
        var minimumCard = distributedCardList.shift();
        logger.debug("opened:" + newCardNum + "-----minimum:" + minimumCard);
        if(newCardNum == minimumCard){
            // OK
            logger.info("game succeeded!");
            if(distributedCardList.length==0){
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
        for(let card of openedCardList){
            cardListText += card.text + ", ";
        }
        logger.info("current opened: " + cardListText);
    });

    socket.on("sendMessage", function(msg){
        logger.debug("server: sendMessage called");
        io.to(tmpRoomId).emit("recvMessage", msg);
    });

    socket.on("goNextRound", function(){
        io.to(tmpRoomId).emit("recvMessage", "次のラウンドを開始します");
        io.to(tmpRoomId).emit("goNextRound");

        // ユーザ手札のクリア
        usersMod.clearUsersCards();

        // ゲームの初期化
        setupGame();
    });
});