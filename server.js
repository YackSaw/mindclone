// log4js設定
var log4js = require('log4js');
log4js.configure({
    appenders: {
      logFile: { type: 'file', filename: 'error.log' },
      out: { type: 'stdout'},
    },
    categories: {
      //default: { appenders: [ 'logFile' ], level: 'error' }
      default: { appenders: [ 'out' ], level: 'trace' },
      errLog: { appenders: ['logFile'], level: 'error'}
    }
  });
var logger = log4js.getLogger();
logger.level = 'all';

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

var usersMod = require("./users.js");
var util = require("./util.js");



// 定数
const numberOfPlayers = 4;
var loggedinPlayers = 0;

// ゲームロジック部
var logic = require("./TheMindLogic.js");
var waitPlayer = "0";

var tmpRoomId;
var users = new Array();
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

function registerUser(newUser){
    users.push(newUser);
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

function findUserBySocketId(users, socketId){
    for(let user of users){
        if(user.socketId == socketId){
            return user;
        }
    }
    return null;
}

// 接続後ソケットに対する処理
io.sockets.on('connection', function(socket){
    logger.debug("connection established!");
    socket.on('disconnect', function(){
        logger.debug("disconnect");
    });

    // カードを配布する
    notifyDistributeCard = function(users){
        for(let user of users){
            for(let cardNum of user.handCards){
                io.to(user.socketId).emit("distributeCard", String(cardNum) );
            }
        }
    };

    setupGame = function(roundNum){
        logger.info("setup round[" + roundNum + "]");
        // ゲームの初期化
        initializeGame();
        // カードの配布
        distributeCard(users, 2);
        notifyDistributeCard(users);

        roundNum++;
    };

    socket.on('login', function(name){
        // ログインするたびにユーザの生成
        registerUser(usersMod.createNewUser(name, util.uuid(), socket.id));

        logger.debug("server:login called");
        if(waitPlayer == "1"){
            socket.join(tmpRoomId);

            waitPlayer = "0";
            logger.debug("emit battle!");
            socket.to(tmpRoomId).emit("battle");
            
            // ゲームの初期化
            setupGame(roundNum);
            for(let user of users){
                logger.info("user:[" + user.name + "] has " + user.handCards);
            }
        }else{
            waitPlayer = "1";
            tmpRoomId = logic.createRoomId();
            socket.join(tmpRoomId);
        }
    });

    socket.on("openCard", function(card){
        logger.debug("server: openCard called");
        var user = findUserBySocketId(users, socket.id);
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
            logger.debug("OK");
            if(distributedCardList.length==0){
                // 配布されたカードの全てが場に出たらcompleted
                io.to(tmpRoomId).emit("completed");
                io.to(tmpRoomId).emit("recvMessage", "成功！");
            }
        }else{
            // NG
            logger.debug("NG");
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
        for(let user of users){
            user.clearCards();
        }

        // ゲームの初期化
        setupGame(roundNum);
    });
});