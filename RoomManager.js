class Room{
    constructor(roomId, maxMembers){
        this.roomId = roomId;
        this.maxMembers = maxMembers;
        this.users = new Array();
    }

    addWaitingUser(user){
        this.users.push(user);
    }

    removeWaitingUser(remUser){
        var id = -1;
        for(let i=0;i<this.users.length;i++){
            if(user.socketId == remUser.socketId){
                id = i;
                break;
            }
        }
        if(id >= 0){
            this.users.splice(id, 1);
        }
    }

    isFull(){
        return this.users.length == this.maxMembers;
    }
}

module.exports = class RoomManager{
    constructor(){
        this.rooms = new Dictionary();
    }

    generateRoomId(){
        // 生成する文字列の長さ
        var l = 8;

        // 生成する文字列に含める文字セット
        var c = "abcdefghijklmnopqrstuvwxyz0123456789";

        var cl = c.length;
        var r = "";
        for(var i=0; i<l; i++){
            r += c[Math.floor(Math.random()*cl)];
        }
        return r;
    }

    createRoom(maxMembers){
        var roomId = this.generateRoomId();
        var room = new Room(roomId, maxMembers);
        this.rooms[roomId] = room;
        return room;
    }
}