const State = {
    WAITING : 0,
    PLAYING : 1,
    COMPLETED : 2,
    FAILED : 3,
};

const Event = {
    LOGIN : 0,
    OPEN_CARD : 1, 
};
module.exports = class GameManager{
    constructor(){
        this.state = State.WAITING;    
    }

    invokeEvent(event, args){
        switch(event){
            case Event.LOGIN:
                handleLogin();
                break;
            case Event.OPEN_CARD:
                handleOpenCard();
                break;
        }
    }

    handleLogin(){
        switch(this.state){
            case State.WAITING:
                break;
            case State.PLAYING:
                break;
            case State.COMPLETED:
                break;
            case State.FAILED:
                break;
        }
    }

    handleOpenCard(){
        switch(this.state){
            case State.WAITING:
                break;
            case State.PLAYING:
                break;
            case State.COMPLETED:
                break;
            case State.FAILED:
                break;
        }
    }
}