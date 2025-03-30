import {Sandbox, SandboxOptions, SandboxPlayer} from "ZEPETO.Multiplay";
import {DataStorage} from "ZEPETO.Multiplay.DataStorage";
import { HttpBodyType, HttpContentType, HttpResponse, HttpService } from "ZEPETO.Multiplay.HttpService";
import { gachamessage, Gestures, Items, levelExp, my_bool, Player, seatState, simplecarState, simpleinfo, SimpleRide, Transform, treasure, Vector3} from "ZEPETO.Multiplay.Schema";

//items =>> 자동차 

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: number,
    gestureType:number,
    gestureloop:boolean
}

interface RoleFreezeInfo {
    sessionId: string,
    time: number,
    userId: string
}
interface RoleBreakInfo {
    sessionId: string,
    breaker_sessionId: string,
    time: number
}

interface BombInfo {
    userId: string,
    time: number,
    index: number,
}

export default class extends Sandbox {
    /*//보스관련
    public _bossGhostHPValue:number = 20000 // 40000
    public _bossGhostMaintainTime:number = 600; // 600
    public _bossGhostRezenTime:number = 180;
    public _gunTyepDamage:number[] = [0 , 150 , 70 , 100]; // 60
    public _onLineGhost:string[] = [];
    public _bossRewardValue:number = 200;
    public _EventCoin:string = "starCoin_0";
    public _AchievementsKey:string = "Achievements";
    public _bossMoveIndex:number = 0;
    public _bossMovePatternIndex:number = 0;
    
    public EventSavedMaxValue:number =300;

    //*/
    public _tutorialKey:string ="tutorial_new3";


    public roleFreezeInfos:RoleFreezeInfo[] = [];
    public _freeze_duration:number = 7;
    public roleBreakInfos:RoleBreakInfo[] = [];
    public _break_duration:number = 1.5;
    public _police_line_time:number = 0;
    public _police_line__break_duration:number = 10;
    public _bomb_infos:BombInfo[] = [];
    public _bomb_duration:number = 3;
    public _is_bank_safe_open:boolean = false;

    public _role_random_box_time:number = 0;
    public _role_random_box_reset_time:number = 15;

    public _role_portal_time:number = 0;
    public _role_portal_reset_time:number = 15;
    public _role_portal_index:number = -1;

    public _role_staticitem_bombcnt:number = 4;
    
    // public _dessert_infos:number[] = [];

    MESSAGE_TYPE = {
        OnChangeGesture: "OnChangeGesture"
    }
    storageMap:Map<string,DataStorage> = new Map<string, DataStorage>();

    constructor() {
        super();
    }

    public check : string = "";
    


    onCreate(options: SandboxOptions) {
        // Room 객체가 생성될 때 호출됩니다.
        // Room 객체의 상태나 데이터 초기화를 처리 한다.
        this.state.timer.count = 0; 
        this.state.timer.playtime = 0;

        //state
        this.onMessage("onChangedState", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            player.state = message.state;
            player.subState = message.subState; // Character Controller V2
        }); 


        this.onMessage("ChangePosition", (client,message)=>{
            const player = this.state.players.get(message.sessionId);

            const transform = new Transform();

            transform.position = new Vector3();
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;
            
            if(player !== null && player !== undefined){
                player.transform = transform;
            }
            
        });

        this.onMessage("SetPlayerPosition", (client,message)=>{
            const player = this.state.players.get(client.sessionId);
            const transform = new Transform();
            transform.position = new Vector3();
            transform.position.x = message.pos.x;
            transform.position.y = message.pos.y;
            transform.position.z = message.pos.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rot.x;
            transform.rotation.y = message.rot.y;
            transform.rotation.z = message.rot.z;
            
            if(player !== null && player !== undefined){
                player.transform = transform;
                this.broadcast("SetPlayerPosition",player, {except:client});
            }

        });

        
        this.onMessage("onChangedTransform", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            
            const transform = new Transform();
            transform.position = new Vector3();
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            player.transform = transform;
        });


        //Turoial & Welcome
        
        // this.onMessage("Checktutorial", (client)=>{
        //     this.Checktutorial(client);

        // });

        // this.onMessage("CheckWelcome" , (client) =>{
        //     this.CheckWelcome(client);
        // });

        this.onMessage("Savetutorial", (client, message) =>{
           this.Savetutorial(client,message); 
        });



        this.onMessage("SaveWelcome" , (client) =>{
            this.SaveWelcome(client);
        });

        //Purchase

        this.onMessage("SavePurchase", (client, message)=>{
            this.SavePurchase(client, message);
        });

        this.onMessage("SaveFavorites", (client, message) => {
            this.SaveFavorites(client, message);
        })

        this.onMessage("DeleteFavorites", (client, message) => {
            this.DeleteFavorites(client, message);
        })

        //PlayableGesture

        this.onMessage("OnPlayableGesture", (client,message)=>{
            const player = this.state.players.get(client.sessionId);
            player.playablegesture.key = message;
            player.playablegesture.sessionId = client.sessionId;
            player.playablegesture.isplayable = true;
            this.broadcast("OnPlayableGesture", player.playablegesture, {except:client});
        });

        this.onMessage("CancelPlayableGesture", (client)=>{
            const player = this.state.players.get(client.sessionId);
            player.playablegesture.isplayable = false;
            this.broadcast("RecCancelPlayableGesture", player.playablegesture, {except:client});
            
            player.playablegesture.key = -1;
        });

        //ObjectTrigget TestOnMessage
        this.onMessage("ObjectTriggerOn", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            
            player.playablegesture.key = message["key"];
            player.playablegesture.isplayable = message["IsPlayable"];
            player.playablegesture.sessionId = client.sessionId;

            this.broadcast("ObjectTriggerOnCheck", player.playablegesture, {except:client});
        });

        this.onMessage("ObjectTriggerOff", (client, message)=>{
            const player = this.state.players.get(client.sessionId);


            player.playablegesture.key = message["key"];
            player.playablegesture.isplayable = message["IsPlayable"];
            player.playablegesture.sessionId = client.sessionId;
            
            this.broadcast("ObjectTriggerOffCheck", player.playablegesture, {except:client}); 

        });

        this.onMessage("SetItemAnimationClip", (client, message)=>{
            var gesture:PlayerGestureInfo = {
                sessionId: client.sessionId,
                gestureIndex: message["ClipNum"],
                gestureType: message["ClipNum"],
                gestureloop: false
            }
            console.log("index: " + gesture);
            this.broadcast("Re_SetItemAnimationClip", gesture);
        });
        
        this.onMessage("AttackAnimation", (client, message)=>{

            const player = this.state.players.get(client.sessionId);
            player.roleGame.isAttack = true;
            player.roleGame.item_index = message["ClipNum"];

            this.broadcast("Re_AttackAnimation", player.roleGame,{except:client});
        });

        this.onMessage("StopAttackAnimation", (client, message)=>{

            const player = this.state.players.get(client.sessionId);
            player.roleGame.isAttack = false;

            this.broadcast("Re_StopAttackAnimation", player.roleGame,{except:client});
        });

        this.onMessage("AttackedUsers", (client, message)=>{
            // var _sessionIds = message["SessionIds"];
            var _sessionIds = message["SessionIds"];
            var _msg = JSON.parse(_sessionIds) as string [] || [];
            var _isNpc = message["isNpc"] as boolean;

            for(var i = 0; i<_msg.length; i++){
                var _player = this.state.players.get(_msg[i]);
                if(true === _player.roleGame.isFreeze){
                    continue;
                }
                if(true === _player.roleGame.isJail){
                    continue;
                }
                // if(0 !== _player.roleGame.role_index){
                //     continue;
                // }
                if(false === _player.roleGame.isVillain){
                    continue;
                }
                _player.roleGame.hp -= 10;
                if(_player.roleGame.hp <= 0){
                    var _time = true === _isNpc ? this.state.timer.playtime - 2 : this.state.timer.playtime;
                    _player.roleGame.isFreeze = true;
                    _player.roleGame.freezeTime = _time;
                    
                this.broadcast("Re_freezeUser", _player.roleGame);
                    client.send("PoliceArrestMission", "");
                    var _info:RoleFreezeInfo = {
                        sessionId: _player.roleGame.sessionId,
                        time: _player.roleGame.freezeTime,
                        userId : _player.roleGame.userId
                    }
                    this.roleFreezeInfos.push(_info);

                    var _break_info = this.roleBreakInfos.find(x=>x.breaker_sessionId === _info.sessionId);
                    if(null !== _break_info || undefined !== _break_info){
                        this.broadcast("Re_IceBreakFail",_break_info);
                    
                        var _break_filter = this.roleBreakInfos.filter(x=>x.breaker_sessionId !== _info.sessionId);
                        this.roleBreakInfos = _break_filter;
                    }
                }else{
                    this.broadcast("Re_AttackedUsers", _player.roleGame);
                }

                return;
            }
            // this.broadcast("Re_AttackedUsers", message);
        });

        this.onMessage("AcquireItem", (client, message)=>{

            const player = this.state.players.get(client.sessionId);
            player.roleGame.steal_item_index = message["item_index"];

            this.broadcast("Re_AcquireItem", player.roleGame);
            player.roleGame.item_index = -1;

        });
        this.onMessage("TakeOutItem", (client, message)=>{
            const player = this.state.players.get(client.sessionId);

            const sendMessage = new gachamessage();
            sendMessage.sessionId = client.sessionId;
            sendMessage.index = player.roleGame.steal_item_index;
            sendMessage.index2 = message;

            player.roleGame.steal_item_index = -1;
            player.roleGame.dessert_index = -1;

            this.broadcast("Re_TakeOutItem", sendMessage);

        });
        this.onMessage("LoadRoleCounts", (client)=>{
            this.LoadRoleCounts(client);

        });
        this.onMessage("SetRole", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            player.roleGame.role_index = message;

            if(true === player.roleGame.isJail){
                //감옥상태에서 직업변경시 텔레포트
                const sendMessage = new gachamessage();
                sendMessage.index = 18;
                sendMessage.sessionId = client.sessionId;
    
                this.broadcast("Re_RandomTeleport", sendMessage);
            }

            if(0 === player.roleGame.role_index){
                player.roleGame.isVillain = true;
            }else{
                player.roleGame.isVillain = false;
            }

            player.roleGame.isJail = false;
            player.roleGame.hp = 100;
            // this.SetPrisoner();
            this.broadcast("Re_SetRole", player.roleGame);

        });
        this.onMessage("IceBreak", (client, message)=>{
            // const player = this.state.players.get(client.sessionId);

            var _info:RoleBreakInfo = {
                sessionId: message,
                breaker_sessionId:client.sessionId,
                time: this.state.timer.playtime,
            }
            this.roleBreakInfos.push(_info);

            this.broadcast("Re_IceBreak", _info);

        });

        this.onMessage("IceGesture", (client, message)=>{
            this.broadcast("Re_IceGesture", client.sessionId);          
        });
        this.onMessage("SpeedUpStart", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            this.broadcast("Re_SpeedUpStart", player.roleGame);
            player.roleGame.isAlreadySpeedUp = true;

        });
        this.onMessage("SpeedUpFinish", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            player.roleGame.isAlreadySpeedUp = false;

            this.broadcast("Re_SpeedUpFinish", player.roleGame);
        });
        this.onMessage("ThiefSpeedDownStart", (client, message)=>{

            this.broadcast("Re_PoliceWhistle", client.sessionId);
            
            this.state.players.forEach((element)=>{
                // if(0 === element.roleGame.role_index){
                //     this.broadcast("Re_ThiefSpeedDownStart", element.roleGame);
                //     element.roleGame.isAlreadySpeedDown = true;
                // }
                if(true === element.roleGame.isVillain){
                    this.broadcast("Re_ThiefSpeedDownStart", element.roleGame);
                    element.roleGame.isAlreadySpeedDown = true;
                }
            });
            
        });
        this.onMessage("ThiefSpeedDownFinish", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            player.roleGame.isAlreadySpeedDown = false;

            this.broadcast("Re_ThiefSpeedDownFinish", client.sessionId);
        });
        this.onMessage("HpRecovery", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            player.roleGame.hp += message;
            if(player.roleGame.hp > 100){
                player.roleGame.hp = 100;
            }

            this.broadcast("Re_HpRecovery", player.roleGame);
        });
        this.onMessage("RandomTeleport", (client, message)=>{

            const sendMessage = new gachamessage();
            sendMessage.index = message;
            sendMessage.sessionId = client.sessionId;

            this.broadcast("Re_RandomTeleport", sendMessage);
        });
        this.onMessage("HammerHitUsers", (client, message)=>{
            var _sessionIds = message["SessionIds"];
            var _msg = JSON.parse(_sessionIds) as string [] || [];


            for(var i = 0; i<_msg.length; i++){
                var _player = this.state.players.get(_msg[i]);
                this.broadcast("Re_HammerHitUsers", _player.roleGame);
            }
        });

        this.onMessage("PoliceLineStart", (client, message)=>{

            this._police_line_time =  this.state.timer.playtime;

            this.broadcast("Re_PoliceLineStart", "");
            
        });

        this.onMessage("SirenUser", (client, message)=>{
            // var _sessionId = message;
            // const player = this.state.players.get(_sessionId);

            var _msg = JSON.parse(message) as string [] || [];
            // var _role_index = message["role_index"];

            for(var i = 0; i<_msg.length; i++){
                var _player = this.state.players.get(_msg[i]);
                // if(0 !== _player.roleGame.role_index){
                //     continue;
                // }
                if(false === _player.roleGame.isVillain){
                    continue;
                }
                if(true === _player.roleGame.isFreeze){
                    continue;
                }
                if(true === _player.roleGame.isJail){
                    continue;
                }

                var _info:RoleBreakInfo = {
                    sessionId: _msg[i],
                    breaker_sessionId:client.sessionId,
                    time: 0,
                }
                this.broadcast("Re_SirenUser", _info);
                return;
            }
            
            var _info:RoleBreakInfo = {
                sessionId: "",
                breaker_sessionId:client.sessionId,
                time: 0,
            }
            this.broadcast("Re_SirenUser", _info);
            
        });

        this.onMessage("InstallBomb", (client, message)=>{

            var _info:BombInfo = {
                userId : client.userId,
                index : message,
                time : this.state.timer.playtime,
            }
            this._bomb_infos.push(_info);
            if(1 === message){
                this._is_bank_safe_open = true;
            }


            const sendMessage = new gachamessage();
            sendMessage.index = message;
            sendMessage.sessionId = client.sessionId;

            this.broadcast("Re_InstallBomb", sendMessage);
            
        });
        this.onMessage("BankSafeClose", (client, message)=>{

            this._is_bank_safe_open = false;
            this.broadcast("Re_BankSafeClose", "");
            
        });

        this.onMessage("Unlock_FreezenDoor", (client) =>{

            this.state.players.forEach((element)=>{
                // if((0 !== element.roleGame.role_index)&&(3 !== element.roleGame.role_index)){
                //     return;
                // }
                if(false === element.roleGame.isVillain){
                    return;
                }
                if(false === element.roleGame.isJail){
                    return;
                }
                element.roleGame.hp = 100;
                if(3 === element.roleGame.role_index){
                    element.roleGame.isVillain = false;
                    element.roleGame.isJail = false;
                    element.roleGame.isWanted = false;
                    this.broadcast("Re_VillainFinish", element.roleGame);
                    return;
                }

                this.broadcast("Re_HpRecovery", element.roleGame);
                element.roleGame.isJail = false;
                element.roleGame.isWanted = true;
                
                var _msg = "{ \"sessionId\" :\"" + element.roleGame.sessionId +"\", \"" + "isWanted" + "\":" + "\"" + true + "\", \"" + "userId" + "\":" + "\"" + element.roleGame.userId + "\" }";

                this.broadcast("Re_SetWanted", _msg);
            });
            this.broadcast("Re_Unlock_FreezenDoor", client.userId);
            // this.SetPrisoner();
        });

        this.onMessage("ThiefSkill", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            this.broadcast("Re_ThiefSkill", player.roleGame);
            player.roleGame.isThiefSkillOn = true;

        });
        this.onMessage("ThiefSkillFinish", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            player.roleGame.isThiefSkillOn = false;

            this.broadcast("Re_ThiefSkillFinish", player.roleGame);

        });

        this.onMessage("ObtainRandomBox", (client, message)=>{
            var _index:number = parseInt(message.toString());  
            if( this.state.roleRandomBox.completed[_index]._bool === true){
                client.send("FailRoleRandomBox", _index);
            }else{
                this.SuccessRoleRandomBox(client, _index);
            }
        });

        this.onMessage("ObtainStaticItem", (client, message)=>{
            var _option:string = message["Option"];  
            var _index:number = parseInt(message["Index"].toString());

            var isItem = this.state.roleStaticItem.get(_option);
            if( isItem.completed[_index]._bool === true){

                const sendMessage = new gachamessage();
                sendMessage.index = _index;
                sendMessage.index2 = parseInt(_option);

                client.send("FailRoleStaticItem", sendMessage);
            }else{
                this.SuccessRoleStaticItem(client, _index, _option);
            }
        });

        this.onMessage("SetWanted", (client, message)=>{

            const player = this.state.players.get(client.sessionId);
            player.roleGame.isWanted = message;

            var _msg = "{ \"sessionId\" :\"" + client.sessionId +"\", \"" + "isWanted" + "\":" + "\"" + message + "\", \"" + "userId" + "\":" + "\"" + player.roleGame.userId + "\" }";


            this.broadcast("Re_SetWanted", _msg);


        });

        this.onMessage("SetVillain", (client, message)=>{

            
            const _player = this.state.players.get(client.sessionId);
            if(3 !== _player.roleGame.role_index){
                return;
            }
            if(true === _player.roleGame.isVillain){
                return;
            }
            _player.roleGame.isVillain = true;

            _player.roleGame.hp = 100;
            
            var _msg = "{ \"sessionId\" :\"" + _player.roleGame.sessionId +"\", \"" + "isWanted" + "\":" + "\"" + true + "\", \"" + "userId" + "\":" + "\"" + _player.roleGame.userId + "\" }";
            this.broadcast("Re_Villain", _player.roleGame);
            this.broadcast("Re_SetWanted", _msg);


        });

        this.onMessage("VillainFinish", (client, message)=>{

            const player = this.state.players.get(client.sessionId);
            if(3 !== player.roleGame.role_index){
                return;
            }
            player.roleGame.isVillain = false;

            this.broadcast("Re_VillainFinish", player.roleGame);


        });
        this.onMessage("DeliverySteal", (client, message)=>{
            var _owner_sessionId =  message["Owner_SessionId"];

            const _owner = this.state.players.get(_owner_sessionId);
            var _msg = "{ \"sessionId\" :\"" + _owner_sessionId +"\", \"" + "isStolen" + "\":" + "\"" + true + "\"}";
            if(false === _owner.avatarInfo.isBagWear){
                client.send("Re_RestoreBag", _msg);
                return;
            }

            _owner.avatarInfo.isBagWear = false;
            this.broadcast("Re_RestoreBag",  _msg);


            var _sessionId =  message["SessionId"];
            const player = this.state.players.get(_sessionId);
            // var gesture:RoleBreakInfo = {
            //     sessionId: _sessionId,
            //     breaker_sessionId: _owner_sessionId,
            //     time: 0
            // }
            // console.log("index: " + gesture);
            player.roleGame.steal_item_index = 9;

            // this.broadcast("Re_AcquireItem", player.roleGame);
            this.broadcast("Re_DeliverySteal", player.roleGame);
            player.roleGame.item_index = -1;

        });

        // this.onMessage("AcquireDessert", (client, message)=>{

        //     const player = this.state.players.get(client.sessionId);
        //     player.roleGame.dessert_index = message;

        //     this.broadcast("Re_AcquireDessert", player.roleGame);

        // });

        // this.onMessage("SettingDessert", (client, message)=>{

        //     const player = this.state.players.get(client.sessionId);

        //     this._dessert_infos.push(player.roleGame.dessert_index);
        //     player.roleGame.dessert_index = -1;
        //     // this.broadcast("Re_SettingDessert",  JSON.stringify(this._dessert_infos));
        //     this.SendSettingDessert(client);

        // });

        // this.onMessage("EatDessert", (client, message)=>{

        //     const player = this.state.players.get(client.sessionId);

        //     if(this._dessert_infos.length <= 0){
        //         // this.broadcast("Re_SettingDessert",  JSON.stringify(this._dessert_infos));
        //         this.SendSettingDessert(client);

        //         return;
        //     }
        //     this._dessert_infos.pop();
        //     // this.broadcast("Re_SettingDessert",  JSON.stringify(this._dessert_infos));
        //     this.SendSettingDessert(client);

        //     var _role_index = message;
        //     if(-1 !== _role_index){
        //         this.broadcast("Re_DessertSpeedUp", player.roleGame);
        //         player.roleGame.dessert_speed_on = true;
        //     }
            
        //     // this.broadcast("Re_EatDessert", player.roleGame);

        // });
        // this.onMessage("DessertSpeedUp", (client, message)=>{
        //     const player = this.state.players.get(client.sessionId);
        //     this.broadcast("Re_DessertSpeedUp", player.roleGame);
        //     player.roleGame.dessert_speed_on = true;

        // });
        // this.onMessage("DessertSpeedUpFinish", (client, message)=>{
        //     const player = this.state.players.get(client.sessionId);
        //     player.roleGame.dessert_speed_on = false;
        //     this.broadcast("Re_DessertSpeedUpFinish", player.roleGame);

        // });
        this.onMessage("ItemAnimationForceQuit", (client)=>{
            this.broadcast("Re_ItemAnimationForceQuit", client.sessionId , {except:client} );
        });

        // this.onMessage("SetItemDrop", (client, message)=>{
        //     var gesture:PlayerGestureInfo = {
        //         sessionId: client.sessionId,
        //         gestureIndex: message["ClipNum"],
        //         gestureType: message["ClipNum"]
        //     }
        //     console.log("index: " + gesture);
        //     this.broadcast("Re_SetItemDrop", gesture);
        // });

        this.onMessage("MultyPlayObjectOn", (client, message)=>{
            const player = this.state.players.get(client.sessionId);

            player.playablegesture.key = message["key"];
            player.playablegesture.sessionId = client.sessionId;

            this.broadcast("MultyTriggerOnCheck", player.playablegesture, {except:client});
        });

        this.onMessage("MultyPlayObjectOff", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            
            player.playablegesture.key = message["key"];
            player.playablegesture.sessionId = client.sessionId;

            this.broadcast("MultyTriggerOffCheck", player.playablegesture, {except:client});
        });

        //star
        this.onMessage("SaveStar", (client,message)=>{
            this.SavemyStarData(client,message.toString());
        });



        //Figure
        this.onMessage("OnPlayFigure", (client, message)=>{
            const sendMessage = new gachamessage();
            var _msg = parseInt(message.toString());
            sendMessage.index = _msg;
            sendMessage.sessionId = client.sessionId;
            // this.broadcast("Test123" , message);
            // this.broadcast("Test123", JSON.stringify(client.sessionId));

            // this.broadcast("RevOnPlayFigure" , _sendMessage);
            this.broadcast("RevOnPlayFigure" , sendMessage , {except:client});

        });

        this.onMessage("addFigureExp", (client, message)=>{
            var _msg = parseInt(message.toString());

            this.addFigureExp(client, _msg);
        });
        
        this.onMessage("addPlayerExp", (client, message)=>{
            var _exp:number = message.exp;
            var _level:number = message.level;
            this.addPlayerExp(client, _exp, _level);
        });

        this.onMessage("setPlayerLevel", (client, message)=>{
            var _level:number = parseInt(message.toString());
            this.SetPlayerLevel(client, _level);
        });

        this.onMessage("HideCharacter_FigureEnding" , (client)=>{
            this.broadcast("Rev_HideCharacter_FigureEnding", client.sessionId , {except:client});
        });
        
        this.onMessage("Cancel_HideCharacter_FigureEnding", (client)=>{
            this.broadcast("Rev_Cancel_HideCharacter_FigureEnding", client.sessionId, {except:client});
        })

        this.onMessage("HideCharacter_FeedEnding" , (client)=>{
            this.broadcast("Rev_HideCharacter_FeedEnding", client.sessionId , {except:client});
        });
        
        this.onMessage("Cancel_HideCharacter_FeedEnding", (client)=>{
            this.broadcast("Rev_Cancel_HideCharacter_FeedEnding", client.sessionId, {except:client});
        })

        //avatar
        this.onMessage("SetBeginningAvatar", (client, message) => {
            // var _msg = parseInt(message.toString());
            // const player = this.state.players.get(client.sessionId);

            // player.simpleRideInfo.sessionId = client.sessionId;
            // player.simpleRideInfo.index = _msg;

            const player = this.state.players.get(client.sessionId);
            var _hair = message["hair"] as string;
            var _top = message["top"] as string;
            var _bottom = message["bottom"] as string;
            var _dress = message["dress"] as string;
            var _shoes = message["shoes"] as string;
            var _bag = message["bag"] as string;

            player.avatarInfo.hair = _hair;
            player.avatarInfo.top = _top;
            player.avatarInfo.bottom = _bottom;
            player.avatarInfo.dress = _dress;
            player.avatarInfo.shoes = _shoes;
            player.avatarInfo.sessionId = client.sessionId;
            player.avatarInfo.bag = _bag;
            player.avatarInfo.isBagWear = false;

            //player 에 저장해줘야됌
            this.broadcast("SetBeginningAvatarOther", player.avatarInfo , {except:client});
        });

        this.onMessage("WearAvatar", (client,message)=>{

            const player = this.state.players.get(client.sessionId);

            var _index = message["index"] as number;
            var _isMale = message["isMale"] as boolean;
            player.avatarInfo.index = _index;
            player.avatarInfo.isMale = _isMale;

            //player 에 저장해줘야됌
            this.broadcast("WearAvatarOther", player.avatarInfo , {except:client});
        });

        this.onMessage("RestoreAvatar", (client,message)=>{
            const player = this.state.players.get(client.sessionId);

            player.avatarInfo.index = null;
            this.broadcast("RestoreAvatarOther", client.sessionId , {except:client});
        });

        this.onMessage("WearBag", (client,message)=>{

            const player = this.state.players.get(client.sessionId);

            player.avatarInfo.isBagWear = true;
            this.broadcast("Re_WearBag",  client.sessionId );
        });
        this.onMessage("RestoreBag", (client,message)=>{

            const player = this.state.players.get(client.sessionId);

            player.avatarInfo.isBagWear = false;
            var _msg = "{ \"sessionId\" :\"" + client.sessionId +"\", \"" + "isStolen" + "\":" + "\"" + false + "\"}";
            this.broadcast("Re_RestoreBag",  _msg);
        });

        //Event (Ghost)
        // this.onMessage("LoadBoost" , (client)=>{
        //     // client.send("TestText", "TestText3");

        //     this.LoadmyBoostData(client);
        // })

        // this.onMessage("SaveBoost", (client,message)=>{
        //     this.SavemyBoostData(client, message.toString());
        // })
        

        /*//고스트코인 관련 코드
        this.onMessage("SaveEventPassData", (client, message)=>{
            var _msg:number = parseInt(message.toString());
            this.SaveEventPassData(client, _msg);
        })
        this.onMessage("SavePastEventPassData", (client, message)=>{
            var _index = message["index"] as number;
            var _event_version = message["event_version"] as string;
            // var _msg:number = parseInt(message.toString());
            this.SavePastEventPassData(client, _index,_event_version);
        })

        
        this.onMessage("BuyEventCoin", (client, message)=>{
            var _msg = message.toString();
            this.BuyEventCoin(client, _msg);
        });
        
        this.onMessage("TrySaveEventCoin" , (client, message)=>{
            this.TrySavemyEventCoinData(client, message.toString());
            // this.SavemyEventCoinData(client, message.toString());
        })

        //test
        this.onMessage("TrySaveEventCoin_Test", (client,message)=>{
            this.TrySavemyEventCoinData(client, message.toString(), true);
        })
        //*/



        //Simple Ride (1인승)

        this.onMessage("RideSimpleCar", (client, message) => {
            // var _msg = parseInt(message.toString());
            // const player = this.state.players.get(client.sessionId);

            // player.simpleRideInfo.sessionId = client.sessionId;
            // player.simpleRideInfo.index = _msg;

            const player = this.state.players.get(client.sessionId);
            var _index = message["index"] as number;
            if(message["isFoot"] !== null){
                var _isFoot = message["isFoot"] as boolean;
                player.simpleRideInfo.isFoot = _isFoot;
            }else{
                player.simpleRideInfo.isFoot = null;
            }
            if(message["figureLevel"] !== null){
                var _figureLevel = message["figureLevel"] as number;
                player.simpleRideInfo.figureLevel = _figureLevel;
            }else{
                player.simpleRideInfo.figureLevel = null;
            }
            player.simpleRideInfo.sessionId = client.sessionId;
            player.simpleRideInfo.index = _index;

            //player 에 저장해줘야됌
            this.broadcast("RideSimpleCarbyOther", player.simpleRideInfo , {except:client});
        });

        this.onMessage("CancelRideSimpleCar", (client,message)=>{
            const player = this.state.players.get(client.sessionId);

            var simpleinfo = new SimpleRide();
            simpleinfo.sessionId = client.sessionId;
            simpleinfo.index = player.simpleRideInfo.index;

            player.simpleRideInfo.sessionId = null;
            player.simpleRideInfo.index = null; 
            this.broadcast("CancelRideSimpleCarbyOther", simpleinfo , {except:client});
        });

        this.onMessage("SimpleCarRideOfWorld", (client,message)=>{
            this.broadcast("ReSimpleCarRideOfWorld", message , {except:client});
        });

        this.onMessage("SimpleCarCancelOfWorld", (client,message)=>{
            this.broadcast("ReSimpleCarCancelOfWorld", message , {except:client});
        });

        //simpleride_multy(다인승)

        this.onMessage("SimpleCar_enter", (client) => {
            this.state.simplecar.forEach((state:simpleinfo, keys:string, ismap:Map<string, simpleinfo>)=>{
                
                const siminfo = new simplecarState();
                const transform = new Transform();

                transform.position = new Vector3();
                transform.rotation = new Vector3();
    
                transform.position.x = state.transform.position.x;
                transform.position.y = state.transform.position.y;
                transform.position.z = state.transform.position.z;

                transform.rotation.x = state.transform.rotation.x;
                transform.rotation.y = state.transform.rotation.y;
                transform.rotation.z = state.transform.rotation.z;

                siminfo.carId = state.carId;
                siminfo.sessionId = keys;
                siminfo.transform = transform;
                siminfo.Rider = state.Rider;
                siminfo.Guestseat = state.Guestseat;

                client.send("CarSetting", siminfo);
        
                for(var i = 0;i < state.isSeatState.length; ++i){
                    if(state.isSeatState[i].isSeat === true){
                        var sendmessage = new simplecarState();
                        sendmessage.carId = keys;
                        sendmessage.sessionId = state.isSeatState[i].client_sessionId;
                        sendmessage.seatIndex = i;
                        sendmessage.Rider = state.Rider;

                        client.send("CarSetting_Player", sendmessage);
                    }
                }
            });
        });

        this.onMessage("CreateSimpleCar_Multy", (client, message) => {
            var iscar = this.state.simplecar.get(message["sessionId"]);
            if(undefined === iscar || null === iscar){
                iscar = new simpleinfo();
                for(var i = 0;i<4;++i){
                    var seatstate = new seatState();
                    seatstate.isSeat = false;
                    seatstate.client_sessionId = null;
                    seatstate.isNpcSeat = false;
                    iscar.isSeatState.push(seatstate);
                }
                iscar.carId = message["Index"].toString();
                iscar.Rider = false;
                iscar.Guestseat = 0;
                this.state.simplecar.set(message["sessionId"], iscar);
            }
            else{
                for(var i = 0;i<4;++i){
                    var seatstate = iscar.isSeatState[i];
                    seatstate.isSeat = false;
                    seatstate.client_sessionId = null;
                    seatstate.isNpcSeat = false;
                    iscar.isSeatState.push(seatstate);
                }

                iscar.carId = message["Index"].toString();
                iscar.Rider = false;
                iscar.Guestseat = 0;
            }
            const sendmessage = new simplecarState();

            sendmessage.carId = message["Index"].toString();
            sendmessage.sessionId = client.sessionId;

            message["sessionId"] === client.sessionId ? this.broadcast("ReCreateSimpleCar_Multy", sendmessage , {except:client}) : this.broadcast("ReCreateSimpleCar_Multy_Rider", sendmessage, {except:client});
        });

        this.onMessage("DeleteCar_CheckSit", (client, message) => {
            var iscar = this.state.simplecar.get(message["sessionId"]);
            if(undefined !== iscar && null !== iscar){
                for(var i = 0; i < 4; ++i){
                    if(iscar.isSeatState[i].isNpcSeat === true){
                        var simplestate = new simplecarState();
                        simplestate.carId = message["sessionId"];
                        simplestate.sessionId = client.sessionId;
                        simplestate.seatIndex = i;
                        simplestate.Rider = false;
                        this.broadcast("ReRoleGameTaxiNpcRide", simplestate);
                    }

                    if(iscar.isSeatState[i].isSeat === true){
                        var simplestate = new simplecarState();
                        simplestate.carId = message["sessionId"];
                        simplestate.sessionId = iscar.isSeatState[i].client_sessionId;
                        simplestate.seatIndex = i;
                        this.broadcast("LeaveCancelSimpleCar_Multy", simplestate, {except:client});

                        iscar.isSeatState[i].isSeat == false;
                        iscar.isSeatState[i].client_sessionId = null;
                    }
                }
            }
            const sendmessage = new simplecarState();

            sendmessage.carId = message["Index"].toString();
            sendmessage.sessionId = client.sessionId;

            message["sessionId"] === client.sessionId ?  client.send("IsCreateSimpleCar_Multy", sendmessage) :  client.send("IsCreateSimpleCar_Multy_Rider", sendmessage);
        });

        this.onMessage("Delete_RiderCar", (client, message) => {
            this.DeleteUserMultyCar_Role_Rider(client, true);
            
        });

        this.onMessage("RideSimpleCar_Multy", (client, message) => {
            var iscar = this.state.simplecar.get(message["carId"]);
            if(undefined === iscar || null === iscar){
                iscar = new simpleinfo();
                for(var i = 0;i<4;++i){
                    var seatstate = new seatState();
                    seatstate.isSeat = false;
                    seatstate.client_sessionId = null;
                    seatstate.isNpcSeat = false;
                    iscar.isSeatState.push(seatstate);
                }
                iscar.carId = message["carId"];
                iscar.Rider = false;
                iscar.Guestseat = 0;
                this.state.simplecar.set(message["carId"], iscar);
            }

            if(true === iscar.isSeatState[message["seatindex"]].isSeat){
                const recallmessage = new simplecarState();
                recallmessage.sessionId = client.sessionId;
                recallmessage.carId = message["carId"];
                recallmessage.seatIndex = message["seatindex"];
                recallmessage.Rider = parseInt(message["Rider"].toString()) === 1;
                recallmessage.Guestseat = iscar.Guestseat;

                client.send("ReCancelSimpleCar_Multy", recallmessage);
                return;
            }

            var pos = new Vector3();
            pos.x = message["position_x"];
            pos.y = message["position_y"];
            pos.z = message["position_z"];

            var rot = new Vector3();
            rot.x = message["rotationeuler_x"];
            rot.y = message["rotationeuler_y"];
            rot.z = message["rotationeuler_z"];

            iscar.transform.position = pos;
            iscar.transform.rotation = rot;

            iscar.isSeatState[message["seatindex"]].isSeat = true;
            iscar.isSeatState[message["seatindex"]].client_sessionId = client.sessionId;
            iscar.Rider = (parseInt(message["Rider"].toString()) === 1) ? true : iscar.Rider;

            var guestseat:number = 0;

            var option_num:number = message["Option_seat"] === true ? 4 : 2;

            if(parseInt(message["Rider"].toString()) === 1 && parseInt(message["seatindex"].toString()) === 0){
                for(var i = 1;i < option_num; ++i){
                    if( false === iscar.isSeatState[i].isSeat && false === iscar.isSeatState[i].isNpcSeat){
                        guestseat = i;
                        break;
                    }
                }
            }

            iscar.Guestseat = iscar.Guestseat !== 0 ? iscar.Guestseat : guestseat;

            const sendmessage = new simplecarState();
            sendmessage.sessionId = client.sessionId;
            sendmessage.carId = message["carId"];
            sendmessage.seatIndex = message["seatindex"];
            sendmessage.Rider = parseInt(message["Rider"].toString()) === 1;
            sendmessage.Guestseat = iscar.Guestseat;

            this.broadcast("ReRideSimpleCar_Multy", sendmessage , {except:client});
            client.send("ReRideSimpleCar_Multy_Rider", sendmessage);

        });

        this.onMessage("CancelSimpleCar_Multy", (client, message) => {
            var iscar = this.state.simplecar.get(message["carId"]);

            if(undefined === iscar || null === iscar){
                return;
            }
            
            var pos = new Vector3();
            pos.x = message["position_x"];
            pos.y = message["position_y"];
            pos.z = message["position_z"];

            var rot = new Vector3();
            rot.x = message["rotationeuler_x"];
            rot.y = message["rotationeuler_y"];
            rot.z = message["rotationeuler_z"];

            iscar.transform.position = pos;
            iscar.transform.rotation = rot;

            iscar.isSeatState[message["seatindex"]].isSeat = false;
            iscar.isSeatState[message["seatindex"]].client_sessionId = null;

            var ride = iscar.Rider;

            if(parseInt(message["Rider"].toString()) === 1 && parseInt(message["seatindex"].toString()) === 0){
                var _seat = iscar.Guestseat % 10;

                iscar.Rider = false;
                iscar.isSeatState[_seat].isSeat = iscar.Guestseat !== 0 ? false : iscar.isSeatState[_seat].isSeat;
            }

            var guestseat:number = 0;
            var option_num:number = message["Option_seat"] === true ? 4 : 2;

            if(true === iscar.isSeatState[0].isSeat && true === iscar.Rider){
                for(var i = 1;i < option_num; ++i){
                    if( false === iscar.isSeatState[i].isSeat){
                        guestseat = i * 10;
                        break;
                    }
                }
            }

            iscar.Guestseat = 0 === iscar.Guestseat ? guestseat : iscar.Guestseat;

            const sendmessage = new simplecarState();
            sendmessage.sessionId = client.sessionId;
            sendmessage.carId = message["carId"];
            sendmessage.seatIndex = message["seatindex"];
            sendmessage.Rider = parseInt(message["Rider"].toString()) === 1;
            sendmessage.Guestseat = iscar.Guestseat;

            this.broadcast("ReCancelSimpleCar_Multy", sendmessage , {except:client});

            sendmessage.sessionId = iscar.isSeatState[0].client_sessionId !== null ? iscar.isSeatState[0].client_sessionId : null;
            iscar.Guestseat = iscar.Guestseat >= 10 ? parseInt((iscar.Guestseat / 10).toString()) : 
                sendmessage.Rider !== true ? iscar.Guestseat : 
                    iscar.isSeatState[iscar.Guestseat].isNpcSeat === true ? iscar.Guestseat : 0 ;

            for(var i = 0; i < 4; ++i){
                if(iscar.isSeatState[i].isNpcSeat === true){
                    ride = false;
                    iscar.Rider = true;
                }
            }

            ride === true ? this.broadcast("ReCancelSimpleCar_Multy_Rider", sendmessage) : null;

        });


        this.onMessage("RoleGameTaxiRider_onoff", (client, message) =>{
            var iscar = this.state.simplecar.get(message["carId"]);
            if(undefined === iscar || null === iscar){
                return;
            }

            iscar.isSeatState[message["seatindex"]].isNpcSeat = message["isRide"] as boolean;
        });

        this.onMessage("InCrashEvent", (client,message)=>{
            var simpleinfo = new simplecarState();
            simpleinfo.sessionId = message["sessionId"];
            simpleinfo.carId = message["CarId"];

            this.broadcast("ReCrashEvent", simpleinfo , {except:client});

        });

        //서버체크
        this.onMessage("CheckServer", (client)=>{
            var _msg:string = "false";
            if(this.state.serverReady === true){
                _msg = "true";
            }
            client.send("revCheckServer", _msg);
        });

        //전체 로딩 테스트
        this.onMessage("Load_Test", (client)=>{
            //
            this.Checktutorial(client);
            //
            this.CheckItemButtonClick(client);

            this.CheckWelcome(client);
            //
            this.LoadSimpleCarDataStorage(client);
            //
            this.LoadmyDataStorage(client);
            
            this.LoadItem(client);
            //
            // this.LoadHistoryDataStorage(client);
            //
            this.loadJobeExp(client);
            //
            // this.LoadTreasure(client);
            //
            this.LoadFavoritesGesture(client);
            // this.LoadGhost(client);
            //
            this.LoadmyStarData(client);
            //

            const _player = this.state.players.get(client.sessionId);

            _player.roleGame.sessionId = client.sessionId;
            _player.roleGame.hp = 100;
            _player.roleGame.item_index = -1;
            _player.roleGame.role_index = -1;
            _player.roleGame.steal_item_index = -1;
            _player.roleGame.isAttack = false;
            _player.roleGame.isFreeze = false;
            _player.roleGame.isJail = false;
            _player.roleGame.isAlreadySpeedUp = false;
            _player.roleGame.isAlreadySpeedDown = false;
            _player.roleGame.isThiefSkillOn = false;
            _player.roleGame.userId = client.userId;
            _player.roleGame.isWanted = false;
            _player.roleGame.freezeTime = 0;
            _player.roleGame.dessert_index = -1;
            _player.roleGame.dessert_speed_on = false;
            _player.roleGame.isVillain = false;

            this.state.players.forEach((element)=>{
                if(element.avatarInfo.sessionId !== client.sessionId){
                    client.send("LoadAvatarInfo", element.avatarInfo);
                }
                if(element.simpleRideInfo.index !== null && element.simpleRideInfo.index !== undefined){
                    client.send("LoadSimpleCarInfo", element.simpleRideInfo);
                }
                if(element.sessionId !== client.sessionId){
                    client.send("LoadRoleGame",element.roleGame);
                }

            });

            this.LoadRoleCounts(client);
            //

            this.LoadRoleRandomBox(client);

            this.LoadPurchaseData(client);
            //
            // this.LoadmyEventCoinData(client);
            //
            if(true === this._is_bank_safe_open){
                var _info:BombInfo = {
                    userId : "",
                    index : 1,
                    time : this.state.timer.playtime,
                }
                client.send("Re_BombFinish",_info);
            }
            if(-1 !== this._role_portal_index){
                client.send("SetRolePortal" , this._role_portal_index);
            }
            this.LoadLaunchingGift(client);
            // this.SetPrisoner();

            var _user_count = this.state.players.size;
            client.send("User_Count", _user_count);


            // var _new_data = '{}';
            // var _json_data = JSON.parse(_new_data);

            
            // _json_data["sessionId"] = "";
            // _json_data["dessert_infos"] = this._dessert_infos;

            // if(0 === this._dessert_infos.length){
            //     _json_data["dessert_infos"] = null;
            // }

            // client.send("Re_SettingDessert",  _json_data);
        });

        this.onMessage("TaxiRider_Teleport", (client,message)=>{
            this.broadcast("ReTaxiRider_Teleport", message);
            client.send("TaxiRider_Teleport_Chcek", message);
        });


        //load
        // this.onMessage("LoadSimpleCar_Data" , (client)=>{
        //     this.LoadSimpleCarDataStorage(client);
        // });
        // this.onMessage("LoadItem_v2" , (client)=>{
        //     // client.send("TestText", "TestText1");

        //     this.LoadmyDataStorage(client);
        //     this.LoadItem(client);
        // });

        // this.onMessage("LoadHistory_Data" , (client)=>{
        //     this.LoadHistoryDataStorage(client);
        // });

        // this.onMessage("LoadJobExp" , (client)=>{
        //     this.loadJobeExp(client);
        // });

        // this.onMessage("LoadTreasure", (client)=>{
        //     // client.send("TestText", "TestText6");

        //     this.LoadTreasure(client);
        // });

        // this.onMessage("LoadStar", (client) =>{
        //     // client.send("TestText", "TestText2");

        //     this.LoadmyStarData(client);
        // });

        // this.onMessage("LoadAvatar", (client)=>{
        //     this.state.players.forEach((element)=>{
        //         if(element.avatarInfo.sessionId !== client.sessionId){
        //             client.send("LoadAvatarInfo", element.avatarInfo);
        //         }
        //     });
        // });

        // this.onMessage("LoadPurchase", (client)=>{
        //     // client.send("TestText", "TestText4");

        //     this.LoadPurchaseData(client);
        // });

        // this.onMessage("LoadEventCoin", (client)=>{
        //     // client.send("TestText", "TestText5");

        //     this.LoadmyEventCoinData(client);
        // });

        // this.onMessage("LoadSimpleCar", (client)=>{
        //     this.state.players.forEach((element)=>{
        //         if(element.simpleRideInfo.index !== null && element.simpleRideInfo.index !== undefined){
        //             client.send("LoadSimpleCarInfo", element.simpleRideInfo);
        //         }
        //     });


        // });

        //있어야됌
        //일반 고스트 로드 안씀
        // this.onMessage("LoadGhost", (client) => {
        //     //접속 시 player 의 고스트에 대한 data 초기화 및 클라이언트에 boss 유무 표시
        //     // client.send("TestText", "TestText7");    
        //     this.LoadGhost(client);

        // })


        this.onMessage("DifferentSimpleCarData" , (client,message)=>{
            var _msg = message.toString();
            this.DifferentSimpleCarData(client, _msg);
        })
        //Gacha Item


        this.onMessage("Set_History_Data", (client, message)=>{
            
            this.SetHistoryDataStorage(client, message);
        });
        this.onMessage("DifferentGachaData" , (client,message)=>{
            var _msg = message.toString();
            this.DifferentGachaData(client, _msg);
        })

        this.onMessage("UseItem_V2", (client,message)=>{
            var index = message["index"];
            var array_index = message["index_Part"];
            this.SetRoomState_Item(client, index, array_index);
            this.UseGachaSetDataStorage(client,index, array_index);
        });
        
        this.onMessage("DestroyItem_V2", (client,message)=>{
            const sendMessage = new gachamessage();
            sendMessage.sessionId = client.sessionId;
            sendMessage.index = message["index_item"];
            sendMessage.index2 = message["index_part"];
            
            var index_item = parseInt(message["index_item"].toString());
            var index_part = parseInt(message["index_part"].toString());

            const player = this.state.players.get(client.sessionId);
            
            
            this.broadcast("RevDestroyItem_V2", sendMessage , {except:client});

            if(index_item === 87){
                player.myGhost.myGunType = 0;
                if(player.myGhost.inGhost == true){
                    this.broadcast("GetCancelPlayGhostAnimation", client.sessionId);
                }
            }

            switch(index_part){
                case 0:{
                    player.ItemState.head= null;
                    break;
                }
                case 1:{
                    player.ItemState.body = null;
                    break;
                }
                case 2:{
                    player.ItemState.back= null;
                    break;
                }
                case 3:{
                    player.ItemState.hand= null;
                    break;
                }

                case 4:{
                    player.ItemState.hips= null;
                    break;
                }
            }
        });

        this.onMessage("GachaClick", (client,message) =>{

            this.GachaRandom(client,message);
        });

        //Event Item

        this.onMessage("UseEventTime", (client,message)=>{
            var index = message["index"];
            var array_index = message["arrayIndex"];
            this.UseEventItem(client,index, array_index);
        });

        this.onMessage("CancelEventItem", (client,message)=>{
            const player = this.state.players.get(client.sessionId);

            player.EventItems.hand = null;
            player.EventItems.head = null;
            player.EventItems.hips = null;
            player.EventItems.back = null;
        });

        
        
        //Car
        /*
        this.onMessage("UpdateCarStart", (client)=>{
            this.state.players.forEach((player: Player)=>{
                if(player.cars.isOn == true){

                    client.send("recUpdateCar", player.cars);
                }

            });
            

        });

        this.onMessage("CreateCar" , (client,message)=>{
            const player = this.state.players.get(client.sessionId);
            
            const transform = new Transform();

            transform.position = new Vector3();
            transform.rotation = new Vector3();

            transform.position.x = message.pos.x;            
            transform.position.y = message.pos.y;
            transform.position.z = message.pos.z;
            
            transform.rotation.x = message.rot.x;
            transform.rotation.y = message.rot.y;
            transform.rotation.z = message.rot.z;

            player.cars.sessionId = client.sessionId;
            player.cars.transform = transform;
            player.cars.isOn = true;
            player.cars.carCode = message.carCode.toString();

            this.state.players.set(client.sessionId, player);

            this.broadcast("RecCreateCar", player , {except:client});

        });

        this.onMessage("CarTeleport", (client,message)=>{
            const player = this.state.players.get(client.sessionId);
            
            const transform = new Transform();

            transform.position = new Vector3();
            transform.rotation = new Vector3();

            transform.position.x = message.position.x;            
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;
            
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            player.cars.transform = transform;

            this.broadcast("recUpdateCar" , player.cars , {except:client});
        });

        this.onMessage("CheckRide", (client)=>{
            this.state.players.forEach((player: Player)=>{
                if(player.ridestate.isRide == true){
                    
                    const sendmessage = new ridemessage();
                    sendmessage.client_sessionId = player.sessionId;
                    sendmessage.item_sessionId = player.ridestate.item_sessionId;
                    sendmessage.rideType = player.ridestate.rideType;
                    sendmessage.seat_number = player.ridestate.seat_number;
                    client.send("recCheckRide", sendmessage);
                }
                else if (player.ridestate.isRide === undefined || player.ridestate.isRide === null){
                    player.ridestate.isRide = false;

                }

            });
            
        });

        this.onMessage("CancelRideCar", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            const sendmessage = new ridemessage();
            sendmessage.client_sessionId = client.sessionId;
            sendmessage.item_sessionId = player.ridestate.item_sessionId;
            sendmessage.seat_number = player.ridestate.seat_number;
            player.ridestate.isRide = false; 
            player.ridestate.item_sessionId = null;
            player.ridestate.seat_number = null;
            this.broadcast("CancelRideCarbyOther",sendmessage, {except:client});
        });


        this.onMessage("CheckAndCancelCar", (client,message)=>{
            // const player = this.state.players.get(message);


            // if(player.ridestate.item_sessionId == client.sessionId){
            //     const sendmessage = new ridemessage();
            //     sendmessage.client_sessionId = message;
            //     sendmessage.item_sessionId = player.ridestate.item_sessionId;
            //     sendmessage.seat_number = player.ridestate.seat_number;
            //     player.ridestate.isRide = false; 
            //     player.ridestate.item_sessionId = null;
            //     player.ridestate.seat_number = null;

            //     this.broadcast("CancelRideCarbyOther",sendmessage);
            // }
            var count = 0;
            this.state.players.forEach((player:Player)=>{
                
                if(player.ridestate.item_sessionId == message){
                    const sendmessage = new ridemessage();
                    sendmessage.client_sessionId = player.sessionId;
                    sendmessage.item_sessionId = player.ridestate.item_sessionId;
                    sendmessage.seat_number = player.ridestate.seat_number;
                    player.ridestate.isRide = false; 
                    player.ridestate.item_sessionId = null;
                    player.ridestate.seat_number = null;
                    count +=1;
                    this.broadcast("CancelRideCarbyOther",sendmessage);
                }



            });
            //client.send("NoRide", count);
            if(count ==0){
                client.send("NoRide", count);
            }            

        });
        
        this.onMessage("UpdateCar", (client,message)=>{
            const item_sessionId = message.sessionId; 
            const player = this.state.players.get(item_sessionId);

            const transform = new Transform();
            transform.position = new Vector3();
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            const velocity = new Vector3();
            velocity.x = message.velocity.x;
            velocity.y = message.velocity.y;
            velocity.z = message.velocity.z;

            const angularVelocity = new Vector3();
            angularVelocity.x = message.angularVelocity.x;
            angularVelocity.y = message.angularVelocity.y;
            angularVelocity.z = message.angularVelocity.z;
            var _isforward =  message.isForward;
            if(player !== null && player !== undefined){
                player.cars.velocity = velocity;
                player.cars.angularVelocity = angularVelocity;
                //player.cars.Steer = parseInt(message.Steer.toString());
    
                player.cars.transform = transform;
                player.cars.sessionId = item_sessionId;
                player.cars.isOn = true;
                player.cars.isForward = _isforward;
                
                this.broadcast("recUpdateCar" , player.cars , {except:client});
            }

            //브로드 캐스팅
            
        });
        
        this.onMessage("isRide", (client,message)=>{
            const player = this.state.players.get(client.sessionId);
            player.ridestate.isRide = message.isRide;
            player.ridestate.item_sessionId = message.item_sessionId.toString();
            player.ridestate.rideType = message.rideType.toString();
            player.ridestate.seat_number = message.seat_number.toString();

            const sendmessage = new ridemessage();
            sendmessage.client_sessionId = client.sessionId;
            sendmessage.item_sessionId = message.item_sessionId;
            sendmessage.rideType = message.rideType;
            sendmessage.seat_number = message.seat_number;
            sendmessage.index_item_hand = player.ItemState.hand;
            this.broadcast("RideCarbyOther", sendmessage, {except:client});

            this.state.players.forEach((_player: Player)=>{
                if(_player.ridestate.item_sessionId === player.ridestate.item_sessionId && _player.ridestate.seat_number === player.ridestate.seat_number && player.sessionId !== _player.sessionId){
                    // client.send("CancelRideCarbyOther", sendmessage);      
                    this.broadcast("CancelRideCarbyOverLap", sendmessage);
                    player.ridestate.isRide = false; 
                    player.ridestate.item_sessionId = null;
                    player.ridestate.seat_number = null;
                    return;
                }
            });
  
        });//*/



        //Chair

        this.onMessage("SeatChair", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            
            const transform = new Transform();
            transform.position = new Vector3();
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;
            player.seatstate.isSeat = true;
            player.transform= transform;
            player.seatstate.seat_number = message.key;
            this.broadcast("SeatChairbyOther", player, {except:client});
        });



        this.onMessage("CancelSeatChair", (client, message)=>{
            const player = this.state.players.get(client.sessionId);
            player.seatstate.isSeat = false;
            
            this.broadcast("CancelSeatChairbyOther", player, {except:client});
            
            player.seatstate.seat_number = -1;
            player.seatstate.client_sessionId = "";
            player.seatstate.chair_transform = null;

        });


        

        //original
        // this.onMessage("onChangedState", (client, message) => {
        //     const player = this.state.players.get(client.sessionId);
        //     player.state = message.state;
            
        // });




        

        //WaterTest

        // this.onMessage("waterCanonUpdate", (client, message) => {
        //     const item_sessionId = message.sessionId;
        //     const player = this.state.players.get(item_sessionId);

        //     player.watercanon.onwatercanon = message.onWaterCanon;
        //     player.watercanon.watercanonrotation = message.rotation;
        //     player.watercanon.sessionId = message.sessionId;
        //     this.broadcast("recUpdateWaterCanon", player.watercanon, { except: client });
        // });

        this.onMessage("InWaterCanonCtrl", (client, message) => {
            this.broadcast("ReWaterCanonCtrl", message, { except: client });
        })


        //지울예정
        // this.onMessage("CreateItem", (client,message)=>{
        //     const player = this.state.players.get(client.sessionId);
        //     player.items.itemCode = message;
        //     if(message == 9999){
        //         player.myGhost.myGunType = 1;
        //         if(player.myGhost.inGhost == true){
        //             this.broadcast("GetPlayGhostAnimation" , client.sessionId);
        //         }
            
        //     }
        //     else{
        //         player.myGhost.myGunType = 0;
        //     }
        //     player.items.sessionId = client.sessionId;
        //     this.broadcast("CreateItemByOther", player.items, {except:client});
        // });

        // this.onMessage("DestroyItem" , (client,message)=>{
        //     const player = this.state.players.get(client.sessionId);
        //     this.broadcast("DestroyItemByOther" , player.items, {except:client});
        //     player.items.itemCode = null;
        //     player.items.sessionId = null;
        //     if(message == 25|| message == 26 || message == 27){
        //         player.myGhost.myGunType = 0;
        //         if(player.myGhost.inGhost == true){
        //             this.broadcast("GetCancelPlayGhostAnimation", client.sessionId);
        //         }
        //     }
            
        // });

        
        // this.onMessage("OnPlayItemAnimation", (client,message)=>{
        //     const sendmessage = new Items();
        //     sendmessage.itemCode = message;
        //     sendmessage.sessionId = client.sessionId;
        //     this.broadcast("RecOnPlayItemAnimation", sendmessage , {except:client});
        // });

        //Item Drop (World Item)

        this.onMessage("DropItem", (client, message) => {
            const sendmessage = new Items();
            const player = this.state.players.get(client.sessionId);
            player.items.itemCode = null;
            sendmessage.itemCode = message;
            sendmessage.sessionId = client.sessionId;
            this.broadcast("recDropItem", sendmessage, { except: client });
        });

        this.onMessage("DestroyTrashItem", (client, message) => {
            this.broadcast("RecDestroyTrashItem", message, { except: client });
        });

        //item_v2
        this.onMessage("Unlock_Item", (client, message)=>{
            var _index = parseInt(message.toString());
            this.Unlock_Item(client, _index);
        })

        this.onMessage("Unlock_SimpleCar", (client, message)=>{
            var _index = parseInt(message.toString());
            this.SetSimpleCarDataStorage(client, _index);
        });



        //ZepetoGesture

        // The server receives gesture change information from the client
        this.onMessage(this.MESSAGE_TYPE.OnChangeGesture, (client, message) => {
            let gestureInfo: PlayerGestureInfo = {
                sessionId: client.sessionId,
                gestureIndex: message.gestureIndex,
                gestureType: message.gestureType,
                gestureloop: message.gestureloop
            };
            console.log(gestureInfo);
            // Send gesture information to the entire client
            this.broadcast(this.MESSAGE_TYPE.OnChangeGesture, gestureInfo);
        });

        
        //Gesture
        
        this.onMessage("Gesture", (client,message)=>{
            const player = this.state.players.get(client.sessionId);
            player.gestures.GestureCode = message.index; 
            player.gestures.sessionId = client.sessionId;
            player.gestures.isLoop = message.isLoop;
            player.gestures.contentType = message.contentType;

            
          this.broadcast("RecGesture", player.gestures, {except:client});
        });

        this.onMessage("InteractionGesture_Loop", (client,message) =>{
            const sendMessage = new Gestures();
            sendMessage.GestureCode = message;
            sendMessage.sessionId = client.sessionId
            sendMessage.isLoop = true;

            this.broadcast("RecInteractionGesture_Loop" , sendMessage , {except:client});
        });

        this.onMessage("Cancel_InteractionGesture_Loop", (client,message) =>{
            const sendMessage = new Gestures();
            sendMessage.GestureCode = message;
            sendMessage.sessionId = client.sessionId
            sendMessage.isLoop = false;


            this.broadcast("RecCancel_InteractionGesture_Loop" , sendMessage , {except:client});
        });

        //Job



        this.onMessage("JobChange", (client,message)=>{
            const player = this.state.players.get(client.sessionId);
            player.jobs.JobCode = message;
            player.jobs.sessionId = client.sessionId;
            this.broadcast("RecJobChange", player.jobs);
        });

        // this.onMessage("JobsCheck", (client,message)=>{
        //     this.JobsCheck(client);
        // });

        //Treasure

        // this.onMessage("TryTreasure", (client, message)=>{
        //     var _index:number = parseInt(message.toString());  
        //     if( this.state.treasureValue.completed[_index]._bool === true){
        //         client.send("FailTreasure", _index);
        //     }else{
        //         this.CompletedTreasure(client, _index);
        //     }
        // });


        /*//고스트 보스 안씀
        this.onMessage("CheckBossGhost" , (client)=>{
            const _message = new BossGhostMoveInfo();
            _message.PatternIndex = this._bossMovePatternIndex;
            _message.PointIndex = this._bossMoveIndex;
            client.send("SetBossGhostPosState" , _message);

            client.send("SetBossGhost" , this._OnBossGhost);
            client.send("SetBossTime", this._OnBossTime);
            

        });

        this.onMessage("PlayerInBossGhost" , (client, message) =>{
            // this.SessionIdInGhost.forEach(element => {
            //     if(element == client.sessionId){
            //         return;
            //     }
            // });

            // if(!(client.sessionId in this.SessionIdInGhost)){
            //     this.SessionIdInGhost.push(client.sessionId);
            // }
            const player = this.state.players.get(client.sessionId);

            player.myGhost.inGhost = true;
            //get guntype on boost
            
            player.myGhost.onBoost = parseInt(message._onBoost);
            player.myGhost.myGunType = parseInt(message._myGunType);
            
        });

        
        this.onMessage("PlayGhostAnimation", (client, message)=>{
            if(message == true){
                this.broadcast("GetPlayGhostAnimation" , client.sessionId , {except:client})
            }else
            {
                this.broadcast("GetCancelPlayGhostAnimation" , client.sessionId, {except:client});
            }
            ;
        })

        this.onMessage("PlayerOutBossGhost", (client) =>{
            // for(var i = 0 ; i< this.SessionIdInGhost.length; i++){
            //     if(this.SessionIdInGhost[i] == client.sessionId){
            //         this.SessionIdInGhost.splice(i,1);
            //     }
            // }
            const player = this.state.players.get(client.sessionId);

            player.myGhost.inGhost = false;
            player.myGhost.onBoost = 0;

            // this.broadcast("" , "", {except:client});
        });
        //*/

        this.onMessage("SaveItemButtonClick", (client) =>{
            this.SaveItemButtonClick(client);
        });
        
        this.onMessage("LoadAchievements", (client)=>{
            this.LoadAchievements(client);
        })

        this.onMessage("AddAchievements", (client) =>{

        });

        this.onMessage("SetLaunchingGift", (client,message)=>{
            var _gift_index = message["gift_index"] as number;
            var _recieved_index = message["recieved_index"] as number;
            var _mission_value = message["mission_value"] as number;
            this.SetLaunchingGift(client,_gift_index,_recieved_index,_mission_value);
        });
        this.onMessage("GetLaunchingGift", (client,message)=>{

            var _index = message["index"] as number;
            var _itemId = message["itemId"];
            var _isPinokio = message["isPinokio"] as boolean;
            var _message = message["message"];
            // client: SandboxPlayer,itemId:string,_index:number,_receiver:string){
            this.RequestJWT(client,_itemId,_index,_message,_isPinokio);
        });

        this.state.serverReady = true;



    }

    async LoadAchievements(client:SandboxPlayer){
        // const storage = client.loadDataStorage();

        // const items  = await storage.get(this._AchievementsKey) as string;

        // if(items === undefined || items === null){
        //     client.send("RecChecktutorial" , "0");
        // }else{
        //     client.send("RecChecktutorial" , items);
        // }
    }

    // async LoadTreasure(client:SandboxPlayer){
    //     if(this.state.treasureValue.key === null || this.state.treasureValue.key === undefined){
    //         //no star                
    //     }else{
    //         var _msg = "{ \"key\" :";
    //         _msg += this.state.treasureValue.key;
    //         for(var i = 0; i< this.state.treasureValue.completed.length; i++){
    //             _msg += ", \"" + i + "\":" + "\"" + this.state.treasureValue.completed[i]._bool + "\"";
    //         }
            
    //         _msg += "}";
            
    //         client.send("SetTreasure2", _msg);
    //     }
    // }

    // async LoadGhost(client:SandboxPlayer){
    //     client.send("StartGhostEvent", "");
    //     if(this.state.treasureValue.key !== null && this.state.treasureValue.key !== undefined){
    //         client.send("SetGhost", this.state.treasureValue.key);
    //     }
    //     this.LoadEventPassData(client);
    //     const player = await this.state.players.get(client.sessionId);

    //     player.myGhost.onBoost = 0;
    //     player.myGhost.myDamage = 0;
    //     player.myGhost.myGunType = 0;
    //     player.myGhost.inGhost = false;
    // }

    async JobsCheck(client:SandboxPlayer){
        const player = await this.state.players.get(client.sessionId);
        player.jobs.JobCode = -1;
        
        this.state.players.forEach((player: Player)=>{
            if(player.jobs.JobCode != -1){
                client.send("RecJobChange", player.jobs);
            }

        });
    }

    async Checktutorial(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const items  = await storage.get(this._tutorialKey) as string;

        if(items === undefined || items === null){
            client.send("RecChecktutorial" , "0");
        }else{
            client.send("RecChecktutorial" , items);
        }
    }

    async SaveItemButtonClick(client:SandboxPlayer){
        const storage = client.loadDataStorage();
        storage.set("CheckItemButtonClick" , "true");
    }

    async CheckItemButtonClick(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const _check = await storage.get("CheckItemButtonClick") as string;

        if(_check === undefined || _check === null){
            client.send("CheckItemButtonClick", "false");
        }else{
            client.send("CheckItemButtonClick", _check);

        }
    }

    //boss State
    /*
    _OnBossGhost:boolean = false;
    _OnBossTime:number;
    _isDance:boolean;
    _bossHp: number = 0;
    _lastBossHp: number = 0;
    _updateBossPosTime:number = 0;
    _updateBossHpTime:number = 0;
    //*/
    /*//고스트관련 업뎃
    
    async SetBossGhost(_time:number){
        // this.broadcast("SetBossGhost", this._OnBossGhost);
        if(true === this._OnBossGhost){
            this._OnBossTime = _time;//this._bossGhostMaintainTime;
            this.broadcast("SetBossTime", this._OnBossTime);

            this._isDance = true;
            this._bossMoveIndex = 0;
            this._bossHp = this._bossGhostHPValue;
            this._lastBossHp = 0;
            //Test
            this.updateBossGhost();
            this.SetBossGhostHP();
            //this.SetBossGhostPosition();
            // this.SetBossGhostHP();
        }
        this.broadcast("StartGhostEvent", "");

    }

    updateBossGhost(){
        //dance

        if(true === this._isDance){
            this._updateBossPosTime = 1000;

            let _danceIndex: number = Math.floor(Math.random() * 10) % 7;
            this.broadcast("SetBossDanceIndex", _danceIndex);
        }else{
            this._updateBossPosTime = 1500;

            //move
            this._bossMoveIndex += 1;

            const _message = new BossGhostMoveInfo();
            _message.PatternIndex = this._bossMovePatternIndex;
            _message.PointIndex = this._bossMoveIndex;
    
            this.broadcast("SetBossGhostPosition", _message);
    
            if (this._bossMoveIndex > 10) {
                var _pattern: number = Math.floor(Math.random() * 10) % 3;
                this._bossMovePatternIndex = _pattern;
                this._bossMoveIndex = 0;
            }
        }

        this._isDance = !this._isDance;
    }

    // async SetBossGhostPosition(){
    //     // const _position = new Vector3();
    //     this._bossMoveIndex = 0;
    //     while(true){
    //         if(false === this._OnBossGhost){
    //             if(this._bossMoveIndex !== 0){
    //                 this._bossMoveIndex = 0;
    //             }
    //             return;
    //         }
    //         var _danceIndex:number = Math.floor(Math.random() * 10) % 7;
    //         this.broadcast("SetBossDanceIndex", _danceIndex);            

    //         // await this.delayTime(10000);

    //         setTimeout(() => {
    //             this._bossMoveIndex += 1;

    //             const _message = new BossGhostMoveInfo();
    //             _message.PatternIndex = this._bossMovePatternIndex;
    //             _message.PointIndex = this._bossMoveIndex;
    
    //             this.broadcast("SetBossGhostPosition", _message);
                
    //             if(this._bossMoveIndex > 10){
    //                 var _pattern:number = Math.floor(Math.random() * 10) % 3;
    //                 this._bossMovePatternIndex = _pattern;
    //                 this._bossMoveIndex = 0;
    //             }
    //         }, 10000);
    //         // this._bossMoveIndex += 1;

    //         // const _message = new BossGhostMoveInfo();
    //         // _message.PatternIndex = this._bossMovePatternIndex;
    //         // _message.PointIndex = this._bossMoveIndex;

    //         // this.broadcast("SetBossGhostPosition", _message);
            
    //         // if(this._bossMoveIndex > 10){
    //         //     var _pattern:number = Math.floor(Math.random() * 10) % 3;
    //         //     this._bossMovePatternIndex = _pattern;
    //         //     this._bossMoveIndex = 0;
    //         // }

    //         //
    //         // await this.delayTime(10000);
    //         // await this.delayTime(5000);

    //     }        
    // }

    async SetBossGhostHP() {
        this._updateBossHpTime = 100;


        if (this._OnBossGhost === false) {
            return;
        }
        this._onLineGhost = [];
        this.state.players.forEach(element => {
            if (element.myGhost.inGhost == true) {
                var _hitdamage = this._gunTyepDamage[element.myGhost.myGunType] * (element.myGhost.onBoost + 1);
                element.myGhost.myDamage += _hitdamage;
                this._bossHp -= _hitdamage;

            }
        });


        if (this._bossHp < 1) {
            this._OnBossGhost = false;

            // this.broadcast("SetBossGhost", this._OnBossGhost);
            this.broadcast("DeadBossGhost", this._OnBossGhost);

            //보상
            var _rewards: BossGhostReward[] = [];
            var _reward: number = 0;
            this.state.players.forEach(element => {
                if (element.myGhost.myDamage > 0) {
                    _reward = Math.floor(element.myGhost.myDamage / this._bossGhostHPValue * this._bossRewardValue);
                    var _r = new BossGhostReward;
                    _r.sessionId = element.sessionId;
                    _r.userId = element.zepetoUserId;
                    _r.reward = _reward;

                    _rewards.push(_r);
                }

                //초기화
                element.myGhost.myDamage = 0;
                element.myGhost.inGhost = false;
            });
            
            this.broadcast("RewardBossGhost", JSON.stringify(_rewards));

        }

        if (this._OnBossTime + this._bossGhostMaintainTime < this.state.timer.playtime) {
            this._OnBossGhost = false;

            this.broadcast("SetBossGhost", this._OnBossGhost);

            this.state.players.forEach(element => {
                element.myGhost.myDamage = 0;
                element.myGhost.inGhost = false;
            });


            return;
        }

        if (this._lastBossHp !== this._bossHp) {
            this._lastBossHp = this._bossHp;
            this.broadcast("SetBossGhostHp", this._bossHp);
        }
    }
    // async SetBossGhostHP(){
    //     var _bossHp = this._bossGhostHPValue;
    //     var _lastBossHp:number = 0;

    //     while(true){
    //         await this.delayTime(1000);  


    //         if(this._OnBossGhost == false){
    //             return;
    //         }
    //         this._onLineGhost = [];
    //         this.state.players.forEach(element => {
    //             if(element.myGhost.inGhost == true){
    //                 var _hitdamage = this._gunTyepDamage[element.myGhost.myGunType] * (element.myGhost.onBoost +1);
    //                 element.myGhost.myDamage += _hitdamage;
    //                 _bossHp -= _hitdamage;
                    
    //             }
    //         });


    //         if(_bossHp <1){
    //             this._OnBossGhost = false;

    //             this.broadcast("SetBossGhost", this._OnBossGhost);

    //             //보상
    //             var _rewards:BossGhostReward[] = [];
    //             var _reward:number = 0;
    //             this.state.players.forEach(element =>{
    //                 if(element.myGhost.myDamage > 0){
    //                     _reward = Math.floor(element.myGhost.myDamage/this._bossGhostHPValue * this._bossRewardValue) ;
    //                     var _r = new BossGhostReward;
    //                     _r.sessionId = element.sessionId;
    //                     _r.userId = element.zepetoUserId;
    //                     _r.reward = _reward;
                        
    //                     _rewards.push(_r);
    //                 }

    //                 //초기화
    //                 element.myGhost.myDamage = 0;
    //                 element.myGhost.inGhost = false;
    //                 return;
    //             });

    //             this.broadcast("RewardBossGhost", JSON.stringify( _rewards));
                
    //         }
        
    //         if(this._OnBossTime + this._bossGhostMaintainTime < this.state.timer.playtime){
    //             this._OnBossGhost = false;

    //             this.broadcast("SetBossGhost", this._OnBossGhost);
                
    //             this.state.players.forEach(element =>{
    //                 element.myGhost.myDamage = 0;
    //                 element.myGhost.inGhost = false;
    //             });


    //             return;
    //         }
            
    //         if(_lastBossHp !== _bossHp){
    //             _lastBossHp = _bossHp;
    //             this.broadcast("SetBossGhostHp", _bossHp);
    //         }
    //         // if(this.SessionIdInGhost.length > 0){
                
    //         //     if(this._OnBossTime + 720 < this.state.timer.playtime){
    //         //         //삭제
    //         //         this._OnBossGhost = false;
    //         //         this.broadcast("SetBossGhost", this._OnBossGhost);
    //         //         this.SessionIdInGhost = [];
    //         //         this.TypeInGhost = [];
    //         //         return;
    //         //     }

    //         //     if(_bossHp < 1){
    //         //         //보상
    //         //         this._OnBossGhost = false;
    //         //         this.broadcast("SetBossGhost", this._OnBossGhost);
    //         //         this.SessionIdInGhost = [];
    //         //         this.TypeInGhost = [];
    //         //         return;
    //         //     }
    //         //     this.broadcast("SetBossGhostHp", _bossHp);
    //         // }
    //     }
    // }
    //*/

    delayTime(ms:number){
        return new Promise( resolve => setTimeout(resolve, ms) );
        // setTimeout(()=>{}, ms);
    }



    async Savetutorial(client:SandboxPlayer, _msg:string){
        const storage = client.loadDataStorage();
        
        storage.set(this._tutorialKey , _msg);
    }

    async CheckWelcome(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const items = await storage.get("welcome_v2") as string;

        if(items === undefined || items === null){
            client.send("RecCheckWelcome" , "true");
        }else{
            client.send("RecCheckWelcome", items);
        }

    }

    async SaveWelcome(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        storage.set("welcome_v2" , "false");
    }

    async SaveFavorites(client:SandboxPlayer, _msg:number){
        const storage = client.loadDataStorage();
        const gestureArr = await storage.get("favoritesGesture") as string;

        if(gestureArr === undefined || gestureArr === null){
            var obj:number[] = [];
            obj.push(_msg);
            // var asda = obj.filter(x=>x != _msg);
            var jsonEncode = JSON.stringify(obj);
            storage.set("favoritesGesture", jsonEncode);
        }
        else{
            var jsonDecode = JSON.parse(gestureArr) as number [] || [];
            jsonDecode.push(_msg);

            var jsonEncode = JSON.stringify(jsonDecode);
            storage.set("favoritesGesture", jsonEncode);
        }
    }

    async DeleteFavorites(client:SandboxPlayer, _msg:number){
        const storage = client.loadDataStorage();
        const gestureArr = await storage.get("favoritesGesture") as string;

        if(gestureArr !== undefined && gestureArr !== null){
            var jsonDecode = JSON.parse(gestureArr) as number [] || [];
            jsonDecode = jsonDecode.filter(x => x != _msg);

            var jsonEncode = JSON.stringify(jsonDecode);
            storage.set("favoritesGesture", jsonEncode);
        }
    }

    async SavePurchase(client:SandboxPlayer, _msg:string){
        const storage = client.loadDataStorage();
        const itemsStr = await storage.get("items_v2") as string;
        // const items = JSON.parse(itemsStr) as string[] || [];
        
        if(itemsStr === undefined || itemsStr === null){
            var obj:string[] = [];
            obj.push(_msg);

            var jsonEncode = JSON.stringify(obj);

            storage.set("items_v2" , jsonEncode);
        }
        else{
            var jsonDecode = JSON.parse(itemsStr) as string [] || [];
            jsonDecode.push(_msg);

            var jsonEncode = JSON.stringify(jsonDecode);
            storage.set("items_v2", jsonEncode);
            
        }
        
    }

    async LoadPurchaseData(client:SandboxPlayer){
        const storage = client.loadDataStorage();
        const items = await storage.get("items_v2") as string;

        if(items === undefined || items === null){
            client.send("PurchaseDataisNull", null);
        }
        else{
            const _items = JSON.parse(items) as string[] || [];


            if(_items.length === 0){
                client.send("PurchaseDataisNull", null);
            }
            else{
                client.send("PurchaseDataisNotNull", items);
            }
        }

    }

    //아이템 로드
    async LoadItem(client:SandboxPlayer){
        this.state.players.forEach((element)=>{
            if(element.ItemState.hand !== null && element.ItemState.hand !== undefined){
                var sendMessage = new gachamessage();
                sendMessage.sessionId = element.sessionId;
                sendMessage.index = element.ItemState.hand;
                client.send("UseItem_V2_byOther", sendMessage);
            }

            if(element.ItemState.head !== null && element.ItemState.head !== undefined){
                var sendMessage = new gachamessage();
                sendMessage.sessionId = element.sessionId;
                sendMessage.index = element.ItemState.head;
                client.send("UseItem_V2_byOther", sendMessage);
            }

            if(element.ItemState.hips !== null && element.ItemState.hips !== undefined){
                var sendMessage = new gachamessage();
                sendMessage.sessionId = element.sessionId;
                sendMessage.index = element.ItemState.hips;
                client.send("UseItem_V2_byOther", sendMessage);
            }

            if(element.ItemState.back !== null && element.ItemState.back !== undefined){
                var sendMessage = new gachamessage();
                sendMessage.sessionId = element.sessionId;
                sendMessage.index = element.ItemState.back;
                client.send("UseItem_V2_byOther", sendMessage);
            }

            if(element.ItemState.body !== null && element.ItemState.body !== undefined){
                var sendMessage = new gachamessage();
                sendMessage.sessionId = element.sessionId;
                sendMessage.index = element.ItemState.body;
                client.send("UseItem_V2_byOther", sendMessage);
            }
        });
    }

    //안쓸듯

    async LoadmyDataStorage(client:SandboxPlayer){
        const storage = client.loadDataStorage();
        
        const items = await storage.get("citems_v2") as string;

        if(items === undefined || items === null){
            client.send("DataStorageisNull", null);
            var obj = {
                "i0": "0", "i1": "0", "i2": "0", "i3": "0","i4": "0", "i5": "0", "i6": "0", "i7": "0","i8": "0", "i9": "0",
                "i10": "0","i11": "0","i12": "0","i13": "0","i14": "0","i15": "0","i16": "0","i17": "0","i18": "0","i19": "0",
                "i20": "0","i21": "0","i22": "0","i23": "0","i24": "0","i25": "0","i26": "0","i27": "0","i28": "0","i29": "0",
                "i30": "0","i31": "0","i32": "0","i33": "0","i34": "0","i35": "0","i36": "0","i37": "0","i38": "0","i39": "0",
                "i40": "0","i41": "0","i42": "0","i43": "0","i44": "0","i45": "0","i46": "0","i47": "0","i48": "0","i49": "0",
                "i50": "0","i51": "0","i52": "0","i53": "0","i54": "0","i55": "0","i56": "0","i57": "0","i58": "0","i59": "0",
                "i60": "0","i61": "0","i62": "0","i63": "0","i64": "0","i65": "0","i66": "0","i67": "0","i68": "0","i69": "0",
                "i70": "0","i71": "0","i72": "0","i73": "0","i74": "0","i75": "0","i76": "0","i77": "0","i78": "0","i79": "0",
                "i80": "0","i81": "0","i82": "0","i83": "0","i84": "0","i85": "0","i86": "0","i87": "0","i88": "0","i89": "0",
                "i90": "0","i91": "0","i92": "0","i93": "0","i94": "0","i95": "0","i96": "0","i97": "0","i98": "0","i99": "0",
                "i100": "0","i101": "0","i102": "0","i103": "0","i104": "0","i105": "0","i106": "0","i107": "0","i108": "0","i109": "0",
                "i110": "0","i111": "0","i112": "0","i113": "0","i114": "0","i115": "0","i116": "0","i117": "0","i118": "0","i119": "0",
                "i120": "0","i121": "0","i122": "0","i123": "0","i124": "0","i125": "0"
            };
            var citem = JSON.parse(JSON.stringify(obj));
            storage.set("citems_v2" , JSON.stringify(citem));
        }else{
            client.send("DataStorageisNotNull", items);

        }
    }

    async LoadSimpleCarDataStorage(client:SandboxPlayer){
        const storage = client.loadDataStorage();
        
        const _simple = await storage.get("simpleCar_v2") as string;

        if(_simple === undefined || _simple === null){
            client.send("SimpleCarDataisNull", null);
            var obj = {
                "s0":"0","s1":"0"
            };
            
            var _simpleCar = JSON.parse(JSON.stringify(obj));
            storage.set("simpleCar_v2" , JSON.stringify(_simpleCar));
        }else{
            client.send("SimpleCarDataisNotNull", _simple);

        }
    }
    async LoadFavoritesGesture(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const _gesture = await storage.get("favoritesGesture") as string;
        if(_gesture === undefined || _gesture === null){
            client.send("GestureFavoritesList", null);
        }
        else{
            client.send("GestureFavoritesList", _gesture);
        }
    }

    async DifferentSimpleCarData(client:SandboxPlayer, message:string){
        const storage = client.loadDataStorage();

        const items = await storage.get("simpleCar_v2") as string;

        var  a=  items.substring(0, items.length -1);
        
        var _simpleCar = JSON.parse(a + message);
        storage.set("simpleCar_v2" , JSON.stringify(_simpleCar));
    }

    async DifferentGachaData(client:SandboxPlayer, message:string){
        const storage = client.loadDataStorage();

        const items = await storage.get("citems_v2") as string;

        var  a=  items.substring(0, items.length -1);
        
        var citem = JSON.parse(a + message);
        storage.set("citems_v2" , JSON.stringify(citem));
    }

    
    async Unlock_Item(client:SandboxPlayer, index:number){
        const storage = client.loadDataStorage();

        const items = await storage.get("citems_v2") as string;
        var i_index = "i"+index.toString();
        var citem = JSON.parse(items);
        var citemcount = parseInt(citem[i_index]);  

        citemcount += 1;

        citem[i_index] = citemcount.toString();

        storage.set("citems_v2" , JSON.stringify(citem));
        
    }


    async UseEventItem(client:SandboxPlayer, index:number, array_index:number){
        const player = this.state.players.get(client.sessionId);
        
        const sendMessage = new gachamessage();

        sendMessage.index = index;
        sendMessage.sessionId = client.sessionId;
        
        this.broadcast("LoadUsedEventItem" , sendMessage , {except:client});
        switch(array_index){
            case 0:{
                player.EventItems.hand= index;

                break;
            }
            case 1:{
                player.EventItems.head= index;

                break;
            }
            case 2:{
                player.EventItems.hips= index;

                break;
            }
            case 3:{
                player.EventItems.back= index;

                break;
            }
        }
    }

    async SetRoomState_Item(client:SandboxPlayer, index:number, index_Part:number){
        const player = this.state.players.get(client.sessionId);

        switch(index_Part){
            case 0:{
                player.ItemState.head = index;
                break;
            }case 1:{
                player.ItemState.body = index;

                break;
            }case 2:{
                player.ItemState.back = index;

                break;
            }case 3:{
                player.ItemState.hand = index;

                break;
            }case 4:{
                player.ItemState.hips = index;

                break;
            }default:{
                break;
            }
        }
    }

    async UseGachaSetDataStorage(client:SandboxPlayer, index:number, index_Part:number){
        const player = this.state.players.get(client.sessionId);

        const sendMessage = new gachamessage();

        sendMessage.index = index;
        sendMessage.sessionId = client.sessionId;

        this.broadcast("UseItem_V2_byOther" , sendMessage , {except:client});
        
        //특수 아이템 처리
        // if(index == 87){
        //     player.myGhost.myGunType = 1;
        //     if(player.myGhost.inGhost == true){
        //         this.broadcast("GetPlayGhostAnimation" , client.sessionId);
        //     }
        
        // }
        // else{
        //     player.myGhost.myGunType = 0;
        // }


        switch(index_Part){
            case 0:{
                player.ItemState.head = index;

                break;
            }
            case 1:{
                player.ItemState.body = index;

                break;
            }
            case 2:{
                player.ItemState.back = index;

                break;
            }
            case 3:{
                player.ItemState.hand = index;

                break;
            }
            case 4:{
                player.ItemState.hips = index;

                break;
            }
        }

    }
    
    async LoadmyStarData(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const _star = await storage.get("star_v2") as string;

        if(_star === undefined || _star === null){
            client.send("LoadStarData" , "0");
        }else{
            client.send("LoadStarData", _star);
        }
    }

    async SavemyStarData(client:SandboxPlayer, count:string){
        const storage = client.loadDataStorage();
        
        storage.set("star_v2" , count);
    }

    /*//이벤트코인
    async LoadmyEventCoinData(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const _coin = await storage.get(this._EventCoin) as number;

        const _daily = await storage.get("EventDailyCount") as number;

        const _date:number = await storage.get("EventDate") as number;

        var _day:Date = new Date();

        var _newDate:number = (10000 * _day.getFullYear())  + (100* _day.getMonth()) + _day.getDate();

        const _message =  new EventCoinMessage();
        // var _array:number[] = [];
        // client.send("MessageCheck", " 1");
        if(_coin === undefined || _coin === null){
            _message.coin = 0;
            _message.daily = 0;
            storage.set(this._EventCoin, 0);
            // _array.push(0);
            // _array.push(0);
        // client.send("MessageCheck", " 2");
            
        }else{
        // client.send("MessageCheck", " 3");
            _message.coin = _coin;
            // _array.push(_coin);
        // client.send("MessageCheck", " 4");

            if(_date === null || _date === undefined){
        // client.send("MessageCheck", " 5");
                _message.daily = 0;
                // _array.push(0);
        // client.send("MessageCheck", " 6");

            }else{
                // client.send("MessageCheck", " 7");
                // client.send("MessageCheck", _daily);
                // client.send("MessageCheck", _newDate);

                if(_date < _newDate){
        // client.send("MessageCheck", " 8");
                    _message.daily = 0;
                    
                    // _array.push(0);

                }else if (_date === _newDate){
                    // client.send("MessageCheck", " 9");

                    
                    if(_daily === null || _daily === undefined ){
        // client.send("MessageCheck", " 10");
                        _message.daily = 0;
                        // _array.push(0);
                    }else{
        // client.send("MessageCheck", " 11");
                        _message.daily = _daily;
                        // _array.push(_daily);
                    }
                }else{
                    _message.daily = _daily;
                }
            }

        }
        client.send("LoadEventCoin", _message);
        // client.send("LoadEventCoin", _array);
    }

    async LoadEventPassData(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        // const _passData = await storage.get("E1") as string;

        // if(_passData === undefined || _passData === null){
        //     var obj:boolean[] = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
        //     var _pass = JSON.stringify(obj);
        //     storage.set("E1", _pass);
            
        //     client.send("LoadEventPassData" , obj);
        // }else{
        //     var _SuccesPassData:boolean[] = JSON.parse(_passData) as boolean[];

        //     client.send("LoadEventPassData" , _SuccesPassData);
        // }

        this.LoadBeforeEventPassData(client , storage);
    }

    async LoadBeforeEventPassData(client:SandboxPlayer, _storage:DataStorage){
        

        const _passData = await _storage.get("E0") as string;
        const _passData2 = await _storage.get("E1") as string;

        if(_passData === undefined || _passData === null){

            //비어있으면 아무것도 안함
        }else{
            var _SuccesPassData:boolean[] = JSON.parse(_passData) as boolean[];

            client.send("LoadEventPassData_E0" , _SuccesPassData);

            // _storage.remove("E0");
        }

        if(_passData2 === undefined || _passData2 === null){

            //비어있으면 아무것도 안함
        }else{
            var _SuccesPassData:boolean[] = JSON.parse(_passData2) as boolean[];

            client.send("LoadEventPassData_E1" , _SuccesPassData);

            // _storage.remove("E1");
        }
    }

    async SaveEventPassData(client:SandboxPlayer, index:number){
        const storage = client.loadDataStorage();

        const _passData = await storage.get("E1") as string;

        var _pass:string;
        if(_passData === undefined || _passData === null){
            var obj:boolean[] = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
            obj[index] = true;

            _pass = JSON.stringify(obj);

        }else{
            var _SuccesPassData:boolean[] = JSON.parse(_passData) as boolean[];

            _SuccesPassData[index] = true;

            _pass = JSON.stringify(_SuccesPassData);

        }

        storage.set("E1", _pass);
    }

    async SavePastEventPassData(client:SandboxPlayer, index:number, _event_version:string){
        const storage = client.loadDataStorage();

        const _passData = await storage.get(_event_version) as string;

        var _pass:string;
        if(_passData === undefined || _passData === null){
            var obj:boolean[] = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
            obj[index] = true;

            _pass = JSON.stringify(obj);

        }else{
            var _SuccesPassData:boolean[] = JSON.parse(_passData) as boolean[];

            _SuccesPassData[index] = true;

            _pass = JSON.stringify(_SuccesPassData);

        }

        storage.set(_event_version, _pass);
    }
    //*/

    //유령코인 관련 코드
    /*
    async BuyEventCoin(client:SandboxPlayer, count:string){
        const storage = client.loadDataStorage();
        const _Savedcount:number = await storage.get(this._EventCoin) as number;
        var _count = parseInt(count);
        if(_Savedcount == null || _Savedcount == undefined){
            storage.set(this._EventCoin, _count);
        }else{
            storage.set(this._EventCoin, _Savedcount+ _count);
        }
    }

    async TrySavemyEventCoinData(client:SandboxPlayer, count:string, test?:boolean){
        const storage = client.loadDataStorage();
        const _date:number = await storage.get("EventDate") as number;
        const _Savedcount:number = await storage.get(this._EventCoin) as number;
        const _SavedDailycount:number = await storage.get("EventDailyCount") as number;
        var _count = parseInt(count);


        var _day:Date = new Date();
        var _newDate:number = (10000 * _day.getFullYear())  + (100* _day.getMonth()) + _day.getDate();

        if(test === true && _date !== undefined && _date !== null && _date >= _newDate && _SavedDailycount == this.EventSavedMaxValue){
            _newDate = _date + 1;
        }

        if(_date === undefined || _date === null ){
            // 신규 
            if(_Savedcount === undefined || _Savedcount === null){
                if(_count >= this.EventSavedMaxValue){
                    //최고치로 저장
                    this.SavemyEventCoinData(client, this.EventSavedMaxValue,_newDate, this.EventSavedMaxValue, _count);
                }else{
                    // 저장
                    this.SavemyEventCoinData(client, _count ,_newDate, _count, _count);
                }
            }else{
                if(_count >= this.EventSavedMaxValue){
                    //최고치로 저장
                    this.SavemyEventCoinData(client, this.EventSavedMaxValue + _Savedcount,_newDate, this.EventSavedMaxValue, _count);
                }else{
                    // 저장
                    this.SavemyEventCoinData(client, _Savedcount +_count ,_newDate, _count, _count);
                }
            }

        }else if(_date == _newDate) {
            //같은날
            if(_SavedDailycount >= this.EventSavedMaxValue){
                //실패
                client.send("FailSaveEventCoin", "");
            }
            
            else if((_count + _SavedDailycount) >= this.EventSavedMaxValue){
                //최고치로 저장
                this.SavemyEventCoinData(client, _Savedcount + (this.EventSavedMaxValue - _SavedDailycount) ,_newDate, this.EventSavedMaxValue, (this.EventSavedMaxValue - _SavedDailycount));

            }else
            {
                //저장
                this.SavemyEventCoinData(client,_count + _Savedcount ,_newDate, _count + _SavedDailycount, _count);

            }
        }
        else if(_date < _newDate){
            if(_count >= this.EventSavedMaxValue){
                //최고치로 저장
                this.SavemyEventCoinData(client, _Savedcount + this.EventSavedMaxValue,_newDate, this.EventSavedMaxValue, _count);
            }else{
                // 저장
                this.SavemyEventCoinData(client, _count + _Savedcount ,_newDate, _count, _count);
            }
        }
        else{
            //실패
            client.send("FailSaveEventCoin", "");

        }
    }

    async SavemyEventCoinData(client:SandboxPlayer, Coincount:number, _date:number, DailyCount:number, addValue:number){
        const storage = client.loadDataStorage();
        storage.set("EventDate", _date);

        storage.set(this._EventCoin, Coincount);
        storage.set("EventDailyCount", DailyCount);
        // var _array:number[] = [];
        // _array.push(Coincount);
        // _array.push(DailyCount);
        // _array.push(addValue);
        const _message = new EventCoinMessage();
        _message.coin = Coincount;
        _message.daily = DailyCount;
        _message.addValue = addValue;

        // client.send("SavedEventCoin", _array);
        client.send("SavedEventCoin", _message);

    }

    async LoadmyBoostData(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const _boost = await storage.get("Boost");
        
        if(_boost === undefined || _boost === null){
            client.send("LoadBoost", "0");
        }else{
            client.send("LoadBoost", _boost);
        }
    
    }

    async SavemyBoostData(client:SandboxPlayer, count:string){
        const storage = client.loadDataStorage();
        storage.set("Boost", count);
    }
    //*/

    async loadJobeExp(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const figure_exp = await storage.get("figureExp_v2") as number;

        if(figure_exp === undefined || figure_exp === null){
            storage.set("figureExp_v2", 0);
            client.send("loadFigureExp", 0);
            
        }else{
            client.send("loadFigureExp", figure_exp);
        }


        const player_exp = await storage.get("playerExp_v2") as number;
        const player_level = await storage.get("playerLevel_v2") as number;

        const player = this.state.players.get(client.sessionId);
        player.level.sessionId = client.sessionId;
        const _message = new levelExp();

        if(player_exp === undefined || player_exp === null){
            storage.set("playerExp_v2", 0);
            _message.exp = 0;
            
            
        }else{
            
            _message.exp = player_exp;
        }

        if(player_level === undefined || player_level === null){
            storage.set("playerLevel_v2", 1);
            _message.level = 1;   
            player.level.level = 1;        
        }else{
            
            _message.level = player_level;
            player.level.level = player_level;
        }
        client.send("loadPlayerExp", _message);

        this.state.players.forEach((element)=>{
            client.send("setPlayerNicknameFirst", element.level);
            if(element.level.sessionId === client.sessionId){
                this.broadcast("setPlayerNicknameFirst", element.level, {except:client});
            }
        });
    }
    async LoadRoleCounts(client:SandboxPlayer){
        var _thief = 0;
        var _police = 0;
        var _delivery_driver = 0;
        var _taxi_driver = 0;        
        
        // var _fire_fighter = 0;
        // var _patissier = 0;
        this.state.players.forEach((element)=>{
            if(0 ===element.roleGame.role_index){
                _thief++;
            }
            else if(1 ===element.roleGame.role_index){
                _police++;
            }else if(2 ===element.roleGame.role_index){
                _delivery_driver++;
            }
            else if(3 ===element.roleGame.role_index){
                _taxi_driver++;
            }
            // else if(2 ===element.roleGame.role_index){
            //     _fire_fighter++;
            // }
            // else if(3 ===element.roleGame.role_index){
            //     _patissier++;
            // }
            
        });
        // var _team_info = _thief + "," + _police + "," + _fire_fighter + "," + _patissier;
        var _team_info = _thief + "," + _police + "," + _delivery_driver + "," + _taxi_driver;
        //var _team_info = _thief + "," + _police + ",";

        client.send("Re_LoadRoleCounts",_team_info);
    }
    async addFigureExp(client:SandboxPlayer, addValue:number){
        const storage = client.loadDataStorage();

        const _exp = await storage.get("figureExp_v2") as number;

        
        if(_exp === undefined || _exp === null){
            storage.set("figureExp_v2", addValue);    

        }else{
            var _value = _exp + addValue;
            storage.set("figureExp_v2", _value);
        }
    }

    async addPlayerExp(client:SandboxPlayer, player_exp:number, player_level:number){ 
        const storage = client.loadDataStorage();

        storage.set("playerExp_v2", player_exp);
        storage.set("playerLevel_v2", player_level);
    }

    async SetPlayerLevel(client:SandboxPlayer, player_level:number){ 
        const player = this.state.players.get(client.sessionId);
        player.level.level = player_level;

        this.broadcast("setPlayerNickname", player.level);
    }


    async SetSimpleCarDataStorage(client:SandboxPlayer, index:number){
        const storage = client.loadDataStorage();

        const _simple = await storage.get("simpleCar_v2") as string;

        var s_index = "s"+index.toString();


        if(_simple === undefined || _simple === null){
        //비어있음 초기화    
            var obj = {
                "s0":"0","s1":"0"
            };


            var _simpleCar = JSON.parse(JSON.stringify(obj));
            // citem["c"+returnKey] = 1;
            _simpleCar[s_index] = 1;

            storage.set("simpleCar_v2" , JSON.stringify(_simpleCar));
        }else{
            var _simpleCar = JSON.parse(_simple);
            var _simpleCar_count = parseInt(_simpleCar[s_index]);
 
            if(_simpleCar_count <= 0){
                _simpleCar_count += 1;
                _simpleCar[s_index] = _simpleCar_count.toString();
                storage.set("simpleCar_v2" , JSON.stringify(_simpleCar));

            }
        }
    }


    async SetGachaDataStorage(client:SandboxPlayer, returnKey:string){
        const storage = client.loadDataStorage();
        
        const items = await storage.get("citems_v2") as string;

        if(items === undefined || items === null){
            
            // var obj = {"citem_0": "0", "citem_1": "0", "citem_2": "0", "citem_3": "0",
            // "citem_4": "0", "citem_5": "0", "citem_6": "0", "citem_7": "0",
            // "citem_8": "0", "citem_9": "0", "citem_10": "0", "citem_11": "0",
            // "citem_12": "0", "citem_13": "0", "citem_14": "0", "citem_15": "0",
            // "citem_16": "0"};

            //유령무기 87번
            var obj = {
                "i0": "0", "i1": "0", "i2": "0", "i3": "0","i4": "0", "i5": "0", "i6": "0", "i7": "0","i8": "0", "i9": "0",
                "i10": "0","i11": "0","i12": "0","i13": "0","i14": "0","i15": "0","i16": "0","i17": "0","i18": "0","i19": "0",
                "i20": "0","i21": "0","i22": "0","i23": "0","i24": "0","i25": "0","i26": "0","i27": "0","i28": "0","i29": "0",
                "i30": "0","i31": "0","i32": "0","i33": "0","i34": "0","i35": "0","i36": "0","i37": "0","i38": "0","i39": "0",
                "i40": "0","i41": "0","i42": "0","i43": "0","i44": "0","i45": "0","i46": "0","i47": "0","i48": "0","i49": "0",
                "i50": "0","i51": "0","i52": "0","i53": "0","i54": "0","i55": "0","i56": "0","i57": "0","i58": "0","i59": "0",
                "i60": "0","i61": "0","i62": "0","i63": "0","i64": "0","i65": "0","i66": "0","i67": "0","i68": "0","i69": "0",
                "i70": "0","i71": "0","i72": "0","i73": "0","i74": "0","i75": "0","i76": "0","i77": "0","i78": "0","i79": "0",
                "i80": "0","i81": "0","i82": "0","i83": "0","i84": "0","i85": "0","i86": "0","i87": "0","i88": "0","i89": "0",
                "i90": "0","i91": "0","i92": "0","i93": "0","i94": "0","i95": "0","i96": "0","i97": "0","i98": "0","i99": "0",
                "i100": "0","i101": "0","i102": "0","i103": "0","i104": "0","i105": "0","i106": "0","i107": "0","i108": "0","i109": "0",
                "i110": "0","i111": "0","i112": "0","i113": "0","i114": "0","i115": "0","i116": "0","i117": "0","i118": "0","i119": "0",
                "i120": "0","i121": "0","i122": "0","i123": "0","i124": "0","i125": "0"
            };
            var citem = JSON.parse(JSON.stringify(obj));
            // citem["c"+returnKey] = 1;
            citem[returnKey] = 1;

            storage.set("citems_v2" , JSON.stringify(citem));

        }else{
            const newItem = await storage.get("citems_v2") as string;
            var citem = JSON.parse(newItem);
            var citemcount = parseInt(citem[returnKey]);    

            // 없으면 추가
            if(citemcount <= 0){
                citemcount += 1;
                citem[returnKey] = citemcount.toString();
                storage.set("citems_v2" , JSON.stringify(citem));
            }

        }

    }

    GachaRandom(client:SandboxPlayer,message:any){
        var underline = Math.log10(message.LowestLineValue); 
        var amountline = 2;
        

        if(underline < 0){
            //자리수가 0.xx 인것
            amountline += (-1) * (Math.floor(underline));  

        }else{
            underline = 0;
        }

        var randomValue = Math.floor(Math.random() * Math.pow(10 , amountline));
        // var count = 0;
        // for(var i =0 ; i< message.length; i++){
        //     var a = parseFloat(message.items["item_" + i]);
        //     for(var j = 0; j< a * Math.pow(10, (-1) * underline) ; j++){
                
        //         if(count === randomValue){
        //             client.send("GachaReturn" , i);
        //             this.SetGachaDataStorage(client, i);
        //             return;
        //         }
        //         count += 1;
        //     }
            
        // }
        // if(count < 1 * amountline){
        //     client.send("Test123", "numbertest2");
        //     this.GachaRandom(client,message);
        //     return;
        // }
        var returnindex = Math.floor(randomValue%8);
        client.send("GachaReturn", returnindex);
        //client.send("Test123", message.items["item_" + returnindex]); 
        var itemsKeys = Object.keys(message.items) ;
        
        
        this.SetGachaDataStorage(client, itemsKeys[returnindex]);
    }

    async onJoin(client: SandboxPlayer) {
        await this.delayTime(1000);
        // schemas.json 에서 정의한 player 객체를 생성 후 초기값 설정.
        // console.log(`[OnJoin] sessionId : ${client.sessionId}, HashCode : ${client.hashCode}, userId : ${client.userId}`)
        // client.send("TestText", "TestText1_1");

        const player = new Player();
        player.sessionId = client.sessionId;
        // if (client.hashCode) {
        //     player.zepetoHash = client.hashCode;
            
        // }
        if (client.userId) {
            player.zepetoUserId = client.userId;
        }

        // client.send("TestText", "TestText1_2");

        // [DataStorage] 입장한 Player의 DataStorage Load
        const storage: DataStorage = client.loadDataStorage();

        this.storageMap.set(client.sessionId,storage);

        let visit_cnt = await storage.get("VisitCount") as number;
        if (visit_cnt == null) visit_cnt = 0;

        console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visit_cnt}`)

        // client.send("TestText", "TestText1_3");


        // [DataStorage] Player의 방문 횟수를 갱신한다음 Storage Save
        await storage.set("VisitCount", ++visit_cnt);

        // client.send("TestText", "TestText1_4");


        // client 객체의 고유 키값인 sessionId 를 사용해서 Player 객체를 관리.
        // set 으로 추가된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnAdd 이벤트를 추가하여 확인 할 수 있음.
        this.state.players.set(client.sessionId, player);
        // client.send("TestText", "TestText1_5");

        var _user_count = this.state.players.size;
        this.broadcast("User_Count", _user_count , {except:client});
    }

    // BossGhostSpawnTime:number = 1440;
    // BossGhostDeadTime:number = -1;


    onTick(deltaTime: number): void {
        //  서버에서 설정된 타임마다 반복적으로 호출되며 deltaTime 을 이용하여 일정한 interval 이벤트를 관리할 수 있음.
       
        this.state.timer.count +=1;
        if(this.state.timer.count%10 == 0){
            this.state.timer.playtime +=1;
            // if(30 == this.state.timer.playtime %480){
            //     this.SetTreasure();
            // }

            // if(!this._OnBossGhost && 30 == this.state.timer.playtime % 720){
            //     this._OnBossGhost = true;

            //     this.SetBossGhost(this.state.timer.playtime);
            // }

            var _random_box_time = this._role_random_box_reset_time + this._role_random_box_time;
            if(_random_box_time<=this.state.timer.playtime){
                if(15 === this._role_random_box_reset_time){
                    this._role_random_box_reset_time = 60;
                }
                this._role_random_box_time = this.state.timer.playtime; 
                this.SetRoleRandomBox();
            }

            var _portal_time = this._role_portal_time + this._role_portal_reset_time;
            if(_portal_time<=this.state.timer.playtime){
                if(15 === this._role_portal_reset_time){
                    this._role_portal_reset_time = 300;
                }
                this._role_portal_time = this.state.timer.playtime; 
                this.SetRolePortal();
            }
            //real
            // if(570 == this.state.timer.playtime % 1440){
            //     this.SetBossGhost(this.state.timer.playtime);
            // }

            // if(this._OnBossGhost){
            //     this._updateBossPosTime -= deltaTime;
            //     this._updateBossHpTime -= deltaTime;

            //     if(this._updateBossPosTime <= 0)
            //         this.updateBossGhost();
                
            //     if(this._updateBossHpTime <= 0)
            //         this.SetBossGhostHP();
            // }

            this.broadcast("RecTime", this.state.timer.playtime);

            if(0 !== this.roleBreakInfos.length){
                for(var i = 0; i < this.roleBreakInfos.length;i++){
                    var break_info = this.roleBreakInfos[i];
                    var _end_time = break_info.time + this._break_duration;
                    if(this.state.timer.playtime < _end_time){
                        continue;
                    }
                    var exist = this.state.players.has(break_info.sessionId);
                    if(false === exist){
                        // this.roleBreakInfos.splice(i,1);
                        // i--;
                        this.broadcast("Re_IceBreakFail", break_info);
                        this.roleBreakInfos = this.roleBreakInfos.filter(x=> x !==break_info );

                        continue;
                    }
                    var _player = this.state.players.get(break_info.sessionId);
                    _player.roleGame.isFreeze = false;
                    _player.roleGame.hp = 100;
    
                    
                    this.broadcast("Re_IceBreakComplete",break_info);
                    this.roleBreakInfos.splice(i,1);
                    this.roleBreakInfos = this.roleBreakInfos.filter(x=> x !==break_info );
                    var _filter = this.roleFreezeInfos.filter(x=>x.sessionId !== break_info.sessionId);
                    this.roleFreezeInfos = _filter;
                    // i--;
                }
            }


            if( 0 !== this._police_line_time){
                var _end_time = this._police_line_time + this._police_line__break_duration;
                if( this.state.timer.playtime > _end_time){
                    this._police_line_time = 0;
                    this.broadcast("Re_PoliceLineFinish",""); 
                }
            }

            if( 0 !== this._bomb_infos.length){
                for(var i = 0; i < this._bomb_infos.length;i++){
                    var bomb_info = this._bomb_infos[i];
                    var _end_time = bomb_info.time + this._bomb_duration;
                    if(this.state.timer.playtime < _end_time){
                        continue;
                    }

                    this.broadcast("Re_BombFinish",bomb_info);
                    if(0 === bomb_info.index){
                        this.state.players.forEach((element)=>{
                            // if((0 !== element.roleGame.role_index)&&(3 !== element.roleGame.role_index)){
                            //     return;
                            // }
                            if(false === element.roleGame.isVillain){
                                return;
                            }
                            if(false === element.roleGame.isJail){
                                return;
                            }
                            // element.roleGame.isJail = false;
                            element.roleGame.hp = 100;

                            if(3 === element.roleGame.role_index){
                                element.roleGame.isVillain = false;
                                element.roleGame.isJail = false;
                                element.roleGame.isWanted = false;
                                this.broadcast("Re_VillainFinish", element.roleGame);
                                return;
                            }
                            this.broadcast("Re_HpRecovery", element.roleGame);
                            element.roleGame.isJail = false;
                            element.roleGame.isWanted = true;
                            
                            var _msg = "{ \"sessionId\" :\"" + element.roleGame.sessionId +"\", \"" + "isWanted" + "\":" + "\"" + true + "\", \"" + "userId" + "\":" + "\"" + element.roleGame.userId + "\" }";


                            this.broadcast("Re_SetWanted", _msg);
                        });
                    }
                    this._bomb_infos.splice(i,1);
                    i--;
                    // this.SetPrisoner();

                    
                }

            }
            
            if(0 !== this.roleFreezeInfos.length){
                for(var i = 0; i < this.roleFreezeInfos.length;i++){
                    var _info = this.roleFreezeInfos[i];
                    var _end_time = _info.time + this._freeze_duration;
                    if(this.state.timer.playtime < _end_time){
                        continue;
                    }
                    var exist = this.state.players.has(_info.sessionId);
                    if(false === exist){
                        this.roleFreezeInfos = this.roleFreezeInfos.filter(x=>x !== _info);
                        continue;
                    }

                    var _player = this.state.players.get(_info.sessionId);
                    _player.roleGame.isFreeze = false;
                    _player.roleGame.isJail = true;
    
    
                    this.broadcast("Re_FreezeTimeOut",_info);
                    // this.SetPrisoner();
                    // this.roleFreezeInfos.splice(i,1);
                    this.roleFreezeInfos = this.roleFreezeInfos.filter(x=>x !== _info)

                    var _break_info = this.roleBreakInfos.find(x=>x.sessionId === _info.sessionId);
                    if(null !== _break_info || undefined !== _break_info){
                        this.broadcast("Re_IceBreakFail",_break_info);
                    
                        var _break_filter = this.roleBreakInfos.filter(x=>x.sessionId !== _info.sessionId);
                        this.roleBreakInfos = _break_filter;
                    }
        
                    // i--;
                }
            }

            
        }



        // this.state.timer.playtime +=1;
        // this.broadcast("RecTime", this.state.timer.playtime);
    }

    // SetTreasure(){
    //     this.state.treasureValue.key = (Math.floor(Math.random() * 100))% 30;
    //     if(this.state.treasureValue.completed.length == 0){
    //         for(var i = 0 ; i < 30 ; i++){
    //             var a = new my_bool;
    //             a._bool = false;
    //             this.state.treasureValue.completed.push(a);
    //         }
    //     }else{
    //         for(var i = 0 ; i < 30 ; i++){
    //             this.state.treasureValue.completed[i]._bool = false;
    //         }
    //     }
    //     // this.broadcast("SetGhost", this.state.treasureValue.key);
    //     this.broadcast("SetTreasure" , this.state.treasureValue.key);
    // }


    // CompletedTreasure(client: SandboxPlayer, index:number){
    //     this.state.treasureValue.completed[index]._bool = true;
    //     this.broadcast("CompletedTreasure" , index , {except:client});
    //     client.send("myCompletedTreasure", index);
    // }

    async LoadHistoryDataStorage(client:SandboxPlayer){
        const storage = client.loadDataStorage();
        
        const _data = await storage.get("history") as string;

        if(_data === undefined || _data === null){
            client.send("HistoryDataIsNull", null);
            var obj = {
                "guide":"0"
            };
            
            var _history = JSON.parse(JSON.stringify(obj));
            storage.set("history" , JSON.stringify(_history));
        }else{
            client.send("HistoryDataIsNotNull", _data);

        }
    }
        
    async SetHistoryDataStorage(client:SandboxPlayer, _name:string){
        const storage = client.loadDataStorage();

        const _data = await storage.get("history") as string;

        if(_data === undefined || _data === null){
        //비어있음 초기화    
            var obj = {
                "guide":"0"
            };


            var _history = JSON.parse(JSON.stringify(obj));
            // citem["c"+returnKey] = 1;
            _history[_name] = 1;

            storage.set("history" , JSON.stringify(_history));
        }else{
            var _history = JSON.parse(_data);
            var _v = _history[_name];
            
            if(null === _v || undefined === _v){
                
                var  a=  _data.substring(0, _data.length -1);
                var _add_data = ",\"" +_name+ "\":\"1\"}";
                var _change_history_data = JSON.parse(a + _add_data);
                storage.set("history" , JSON.stringify(_change_history_data));

            }else{
                var _history_count = parseInt(_v);

                if(_history_count <= 0){
                    _history_count += 1;
                    _history[_name] = _history_count.toString();
                    storage.set("history" , JSON.stringify(_history));
    
                }
            }
            
        }
    }

    //Achievements
    async SetAchievements(client:SandboxPlayer){


    }

    // async onPurchased(client:SandboxPlayer , receipt:IReceiptMessage){
    //     const storage = client.loadDataStorage(); 
    //     const itemId:string = receipt.itemId;
    //     var itemStr:string;
    //     if(itemId.includes("draw") === true){
    //         itemStr = await storage.get('items') as string;
        
    //     }else{
    //         itemStr = await storage.get('citems') as string;
    //     }
    //     const items = JSON.parse(itemStr) as string[] || [];
        
    //     const hasItem = items.find(item => item === receipt.itemId);

    //     if(receipt.worldId !== "com.bucketplay.zeptown"){
    //         throw new Error('not my Game');
    //     }
        
    //     //draw is gacha purchase , this can be repeated
    //     if(false === itemId.includes("draw") && hasItem){
    //         throw new Error('already prchased');
    //     }

    //     if(false === itemId.includes("draw") && !hasItem){
    //         // items.push(receipt.itemId);

    //         // await storage.set('items', items);
    //     }


    // }

    async onLeave(client: SandboxPlayer, consented?: boolean) {

        // allowReconnection 설정을 통해 순단에 대한 connection 유지 처리등을 할 수 있으나 기본 가이드에서는 즉시 정리.
        // delete 된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnRemove 이벤트를 추가하여 확인 할 수 있음.

        //??
        // var _num:number = 0;
        // await this.state.players.forEach((player: Player)=>{
        //     if(player.ridestate.item_sessionId == client.sessionId && player.sessionId != client.sessionId){
        //         const sendmessage = new ridemessage();
        //         sendmessage.client_sessionId = player.sessionId;
        //         sendmessage.item_sessionId = player.ridestate.item_sessionId;
        //         sendmessage.seat_number = player.ridestate.seat_number;
        //         // this.broadcast("LeavePlayerCar", sendmessage, {except:client});
        //         this.broadcast("LeavePlayerCar", sendmessage, {except:client});
                
        //         player.ridestate.isRide = false; 
        //         player.ridestate.item_sessionId = null;
        //         player.ridestate.seat_number = null;
        //         _num += 1;
        //         // this.broadcast("CancelRideCarbyOther",sendmessage, {except:client});
        //         // this.broadcast("DestroyCar", client.sessionId, {except:client});
        //     }
        // });

        // if(_num === 0){
        //     this.broadcast("DestroyCar" , client.sessionId , {except:client});
        // }

        this.DeleteUserMultyCar(client);
        this.DeleteUserMultyCar_Role_Rider(client, false);

        //car state
        // this.broadcast("LeavePlayer_Car", client.sessionId, {except:client});


        // this.broadcast("DestroyCar", client.sessionId, {except:client});
        this.state.players.delete(client.sessionId);

        this.roleFreezeInfos = this.roleFreezeInfos.filter(x=>x.sessionId !== client.sessionId);
        // this.roleBreakInfos = this.roleBreakInfos.filter(x=> x.sessionId !==client.sessionId );
        // this.SetPrisoner();

        var _user_count = this.state.players.size;
        this.broadcast("User_Count", _user_count);
    }

    DeleteUserMultyCar(client:SandboxPlayer){
        var userCar = this.state.simplecar.get(client.sessionId);

        this.state.simplecar.forEach((state:simpleinfo, keys:string, ismap:Map<string, simpleinfo>)=>{
            for(var i = 0;i<4;++i){
                // if(state.isSeatState[i].isNpcSeat === true){
                //     var simplestate = new simplecarState();
                //     simplestate.carId = keys;
                //     simplestate.sessionId = client.sessionId;
                //     simplestate.seatIndex = i;
                //     simplestate.Rider = false;
                //     this.broadcast("ReRoleGameTaxiNpcRide", simplestate);
                // }

                if(state.isSeatState[i].isSeat === true && client.sessionId === state.isSeatState[i].client_sessionId){
                    var simplestate = new simplecarState();
                    simplestate.carId = keys;
                    simplestate.sessionId = client.sessionId;
                    simplestate.seatIndex = i;

                    this.broadcast("LeaveCancelSimpleCar_Multy", simplestate, {except:client});

                    state.isSeatState[i].isSeat = false;
                    state.isSeatState[i].client_sessionId = null;
                    break;
                }
            }
        });

        var userCar = this.state.simplecar.get(client.sessionId);
        if(null !== userCar && undefined !== userCar){

            for(var i = 0;i<4;++i){
                if(userCar.isSeatState[i].isNpcSeat === true){
                    var simplestate = new simplecarState();
                    simplestate.carId = client.sessionId;
                    simplestate.sessionId = client.sessionId;
                    simplestate.seatIndex = i;
                    simplestate.Rider = false;
                    this.broadcast("ReRoleGameTaxiNpcRide", simplestate);
                }

                if(userCar.isSeatState[i].isSeat === true){
                    var simplestate = new simplecarState();
                    simplestate.carId = client.sessionId;
                    simplestate.sessionId = userCar.isSeatState[i].client_sessionId;
                    simplestate.seatIndex = i;
                    this.broadcast("LeaveCancelSimpleCar_Multy", simplestate, {except:client});
                }
            }
            var simple = new simplecarState();
            simple.sessionId = client.sessionId;
            this.broadcast("DeleteSimpleCar_Multy", simple, {except:client});
            this.state.simplecar.delete(client.sessionId);
        }
    }

    DeleteUserMultyCar_Role_Rider(client:SandboxPlayer, isend:boolean){
        var userCar = this.state.simplecar.get(client.sessionId + "_Rider");

        this.state.simplecar.forEach((state:simpleinfo, keys:string, ismap:Map<string, simpleinfo>)=>{
            for(var i = 0;i<4;++i){
                // if(state.isSeatState[i].isNpcSeat === true){
                //     var simplestate = new simplecarState();
                //     simplestate.carId = keys;
                //     simplestate.sessionId = client.sessionId;
                //     simplestate.seatIndex = i;
                //     simplestate.Rider = false;
                //     this.broadcast("ReRoleGameTaxiNpcRide", simplestate);
                // }

                if(state.isSeatState[i].isSeat === true && client.sessionId === state.isSeatState[i].client_sessionId){
                    var simplestate = new simplecarState();
                    simplestate.carId = keys;
                    simplestate.sessionId = client.sessionId;
                    simplestate.seatIndex = i;

                    isend === true ? this.broadcast("LeaveCancelSimpleCar_Multy", simplestate) : this.broadcast("LeaveCancelSimpleCar_Multy", simplestate, {except:client});

                    state.isSeatState[i].isSeat = false;
                    state.isSeatState[i].client_sessionId = null;
                    break;
                }
            }
        });

        var userCar = this.state.simplecar.get(client.sessionId + "_Rider");

        if(null !== userCar && undefined !== userCar){

            for(var i = 0;i<4;++i){
                if(userCar.isSeatState[i].isNpcSeat === true){
                    var simplestate = new simplecarState();
                    simplestate.carId = client.sessionId + "_Rider";
                    simplestate.sessionId = client.sessionId;
                    simplestate.seatIndex = i;
                    simplestate.Rider = false;
                    this.broadcast("ReRoleGameTaxiNpcRide", simplestate);
                }

                if(userCar.isSeatState[i].isSeat === true){
                    var simplestate = new simplecarState();
                    simplestate.carId = client.sessionId + "_Rider";
                    simplestate.sessionId = userCar.isSeatState[i].client_sessionId;
                    simplestate.seatIndex = i;

                    isend === true ? this.broadcast("LeaveCancelSimpleCar_Multy", simplestate) : this.broadcast("LeaveCancelSimpleCar_Multy", simplestate, {except:client});
                }
            }
            var simple = new simplecarState();
            simple.sessionId = client.sessionId + "_Rider";
            isend === true ? this.broadcast("DeleteSimpleCar_Multy", simple) : this.broadcast("DeleteSimpleCar_Multy", simple, );
            
            this.state.simplecar.delete(client.sessionId + "_Rider");
        }
    }


    async LoadRoleRandomBox(client:SandboxPlayer){
        if(this.state.roleRandomBox.key === null || this.state.roleRandomBox.key === undefined){
            //no star                
        }else{
            var _msg = "{ \"key\" :";
            _msg += this.state.roleRandomBox.key;
            for(var i = 0; i< this.state.roleRandomBox.completed.length; i++){
                _msg += ", \"" + i + "\":" + "\"" + this.state.roleRandomBox.completed[i]._bool + "\"";
            }
            
            _msg += "}";
            
            client.send("LoadRandomBox", _msg);
        }

        if(null === this.state.roleStaticItem || undefined === this.state.roleStaticItem){

        }else{
            this.state.roleStaticItem.forEach((_treasure:treasure, keys:string, ismap:Map<string, treasure>) =>{
                var _msg = "{ \"key\" :";
                _msg += _treasure.key;
                for(var j = 0; j < _treasure.completed.length; j++){
                    _msg += ", \"" + j + "\":" + "\"" + _treasure.completed[j]._bool + "\"";
                }   
                _msg += ", \"" + "count" + "\":" + "\"" + _treasure.completed.length + "\"" + "}";

                client.send("LoadStaticItem", _msg);
            });
        }
    }

    SetRoleRandomBox(){
        this.state.roleRandomBox.key = (Math.floor(Math.random() * 25))% 25;
        if(this.state.roleRandomBox.completed.length == 0){
            for(var i = 0 ; i < 30 ; i++){
              var a = new my_bool;
               a._bool = false;
               this.state.roleRandomBox.completed.push(a);
            }
        }else{
            for(var i = 0 ; i < 30 ; i++){
                this.state.roleRandomBox.completed[i]._bool = false;
            }
        }
        this.broadcast("SetRandomBox" , this.state.roleRandomBox.key);

        this.SetRoleStaticItem();
    }

    SuccessRoleRandomBox(client: SandboxPlayer, index:number){
        this.state.roleRandomBox.completed[index]._bool = true;

        const sendMessage = new gachamessage();
        sendMessage.index = index;
        sendMessage.sessionId = client.sessionId;


        this.broadcast("SuccessRoleRandomBox" , sendMessage);
        // client.send("myCompletedTreasure", index);
    }

    SuccessRoleStaticItem(client: SandboxPlayer, index:number, _option:string){

        var isItem = this.state.roleStaticItem.get(_option);
        isItem.completed[index]._bool = true;

        const sendMessage = new gachamessage();
        sendMessage.index = index;
        sendMessage.index2 = parseInt(_option);
        sendMessage.sessionId = client.sessionId;

        this.broadcast("SuccessRoleStaticItem" , sendMessage);
    }

    SetRolePortal(){
        this._role_portal_index = (Math.floor(Math.random() * 40))% 40;
        this.broadcast("SetRolePortal" , this._role_portal_index);
    }

    SetPrisoner(){
        // var _count = 0;

        // this.state.players.forEach((element)=>{
        //     if(0 !== element.roleGame.role_index){
        //         return;
        //     }
        //     if(false === element.roleGame.isJail){
        //         return;
        //     }

        //     _count += 1;
        // });

        // this.broadcast("Re_PrisonerCount", _count);
    }

    SetRoleStaticItem(){
        var isItem_bomb = this.state.roleStaticItem.get('0');
        if(undefined === isItem_bomb || null === isItem_bomb){
            var _treasure:treasure = new treasure;
            _treasure.key = 0;
            for(var i = 0;i < this._role_staticitem_bombcnt; ++i){
                var a = new my_bool;
                a._bool = false;
                _treasure.completed.push(a);
            }
            this.state.roleStaticItem.set('0', _treasure);
            isItem_bomb = _treasure;
        }else{
            for(var i = 0;i < this._role_staticitem_bombcnt; ++i){
                isItem_bomb.completed[i]._bool = false;
            }
        }

        this.broadcast("SetStaticItem" , isItem_bomb.completed.length);
    }

    RequestJWT(client: SandboxPlayer,itemId:string,_index:number,_message:string,isPinokio:boolean){
        var accessKey = "784NefffkE1y7DAEXJCPHLhv5UN6E7BxpobPNBNfxUKQ";
        var secretKey = "NnUPo90HzI62Nw65i8W2svVLzkoKqZf/hRpII8egRnJAr56nFPXTZFu37h8Oq/tDxOysrbY9LoTsqzqe93UvGA";
        var worldId = "com.bucketplay.zeptown";

        var uri = "/operation/v1/gift/send";
        // const key: string = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNzg0TmVmZmZrRTF5N0RBRVhKQ1BITGh2NVVONkU3Qnhwb2JQTkJOZnhVS1EiLCJub25jZSI6IjU0OWY3YjFmLTBlMzYtNDljMS1hYzk5LTE0YzFlNmQzZmY1OCIsInVyaV9oYXNoIjoiSExMUys4WEZoSWQrZXg0M1VnNU9NMWtSRStuUjlJYWdRemVRdzFrcFZkcz0ifQ.Em0GGti5tL9oSiuAxpkxzAVok4yGnmdV0Svg6gHpW5Y";
        var url: string = "https://zepeto.azurewebsites.net/api/ZEPETO_EVENTS?code=y8qopYq0sCFCWLkXIGwDZH8OUB3G21JiIhyp3lCQSGoqAzFuxpP-ig==";
        if(false === isPinokio){
            url = "https://zepeto.azurewebsites.net/api/PREVIEW_ZEPETO_EVENTS?code=tbpLxGJNKRNbUQOozqBo9lfOUYLwdtTOl3JH6x1so8MHAzFuKurSPg==";
        }
        const headers = {
            'Content-Type': 'application/json',
        };
    
        let body:HttpBodyType  = {
            "handler": "GET_JWT",
            "uri": uri,
            "param": {"itemId": itemId, "message": _message, "receiver": client.userId}
        }
        // "param": {"itemId": itemId, "message": "테스트 메시지", "receiver": client.userId}
    
        HttpService.postAsync(url, body, headers).then(
            (res: HttpResponse) => {
                console.log(`HTTP Result: ${JSON.stringify(res)}`);
                if (res.statusCode !== 200) {
                    //실패 보내기
                    client.send("RequestJWTFail", "");
                    return;
                }
                var _response = "Bearer " + res.response;
                
                this.GivingGift(client,itemId,_message,_index,_response);
            })
            .catch((reason) => {
                client.send("RequestJWTFail", "");

                    console.log("API Request error");
                    console.log(reason);
                });
            // 'Accept': 'application/json',

    }
    GivingGift(client: SandboxPlayer,itemId:string,_message:string,_index:number,JWT:string){

        // 'Content-Type': 'application/json',


        const url: string = "https://openapi.zepeto.zone/operation/v1/gift/send";
        const headers = {
            accept: HttpContentType.ApplicationJson,
            'content-type': HttpContentType.ApplicationJson,
            Authorization : JWT
        };
    
        let body:HttpBodyType  = {
            "itemId": itemId,
             "message": _message,
              "receiver": client.userId
        }
    
        HttpService.postAsync(url, body, headers).then(
            (res: HttpResponse) => {
                console.log(`HTTP Result: ${JSON.stringify(res)}`);
                //성공시 데이터 저장

                var _new_data = '{}';
                var _json_data = JSON.parse(_new_data);    
                _json_data["result"] = false;
                _json_data["index"] = _index;
    
                if (res.statusCode === 200) {
                    _json_data["result"] = true;
                    // client.send("Launching_Gift_Result", _json_data);
                }else{
                    
                    var _response = JSON.parse(res.response);
                    var _message = _response["message"];
                    if((null !== _message)||(undefined !== _message)){
                        _json_data["message"] = _message;
                    }
                    // client.send("Launching_Gift_Result", _message.toString());
                    // if("receiver already have" === _message.toString()){
                    //     console.log("dsadsdas");
                    //     this.SetLaunchingGift(client,-1,_index)
                    //     client.send("Launching_Gift_Result", _json_data);

                    // }
                }
                this.SetLaunchingGift(client,-1,_index,-1)

                client.send("Launching_Gift_Result", _json_data);
                
            })
            .catch((reason) => {
                    this.SetLaunchingGift(client,-1,_index,-1)
                    
                    client.send("GiftFail", "");
                    console.log("API Request error");
                    console.log(reason);
                });
    }
    async LoadLaunchingGift(client:SandboxPlayer){
        const storage = client.loadDataStorage();

        const _data = await storage.get("LaunchingGift") as string;

        if(_data === undefined || _data === null){
            var _new_data = '{}';
            var _json_data = JSON.parse(_new_data);

        
            _json_data["index"] = 0;
            _json_data["recieved"] = [false,false,false,false];
            _json_data["mission_value"] = 0;
            _json_data["version"] = 2;
            storage.set("LaunchingGift", _json_data);
            client.send("Load_Launching_Gift" , _json_data);
        }else{

            var _stringify = JSON.stringify(_data);
            var _json_data = JSON.parse(_stringify);
            
            var _version  = _json_data["version"];
            if(2 !== _version){
                _json_data["index"] = 0;
                _json_data["recieved"] = [false,false,false,false];
                _json_data["mission_value"] = 0;
                _json_data["version"] = 2;
                storage.set("LaunchingGift", _json_data);

            }

    

            client.send("Load_Launching_Gift", _json_data);
        }
    }
    async SetLaunchingGift(client:SandboxPlayer,_index:number,_recieved_index:number,_mission_value:number){
        const storage = client.loadDataStorage();
        const _data = await storage.get("LaunchingGift") as string;

        var _stringify = JSON.stringify(_data);
        var _json_data = JSON.parse(_stringify);

        if(-1 !== _index){
            _json_data["index"] = _index;
        }
        if(-1 !== _recieved_index){
            var _bools = _json_data["recieved"];
            _bools[_recieved_index] = true;
            _json_data["recieved"] = _bools;
        }
        if(-1 !== _mission_value){
            _json_data["mission_value"] =  _mission_value;
        }

        storage.set("LaunchingGift", _json_data);
        client.send("Load_Launching_Gift" , _json_data);

    }
    // SendSettingDessert(client: SandboxPlayer){

    //     var _new_data = '{}';
    //     var _json_data = JSON.parse(_new_data);

    //     _json_data["sessionId"] = client.sessionId;

        
    //     _json_data["dessert_infos"] = this._dessert_infos;

    //     if(0 === this._dessert_infos.length){
    //         _json_data["dessert_infos"] = null;
    //     }

    //     // client.send("Re_SettingDessert",  );
    //     this.broadcast("Re_SettingDessert",  _json_data);


    // }

}