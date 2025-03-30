import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Animator, WaitForSeconds, Transform, TextureFormat, Screen , Vector3, WaitUntil } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Button } from 'UnityEngine.UI';
import { Room } from 'ZEPETO.Multiplay';
import Starter from '../ZepetoScripts/ClientStarter';
import StageClearpopup from './StageClearpopup';

enum FeedScreenShotEnum{ GhostBoss = 0, Figure = 1, Valentine = 2, Default = 3 }

export default class FeedScreenShotManager extends ZepetoScriptBehaviour {

    public feedPopupObject:     GameObject;
    private feedPopupScript:    StageClearpopup;

    public static myInstance:   FeedScreenShotManager;

    @NonSerialized() public room:   Room;
    private playerName:             GameObject;

    public FeedPrefab:              GameObject;
    private FeedObject:              GameObject;

    public static Instacne():FeedScreenShotManager{
        if(this.myInstance === null || this.myInstance === undefined){
            return null;
        }
        return this.myInstance;
    }

    Awake(){
        if(FeedScreenShotManager.myInstance === null || FeedScreenShotManager.myInstance === undefined){
            FeedScreenShotManager.myInstance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
            console.log("Success Singleton");
        }    
    }

    Start(){
        if(this.feedPopupObject === null || this.feedPopupObject === undefined){
            console.log("Warning: FeedScreenShotManager is Not FeedObject!!!");
            return;
        } 
        this.feedPopupScript = this.feedPopupObject.GetComponent<StageClearpopup>();

        this.StartCoroutine(this.SetRoom());
    }

    *SetRoom(){
        yield new WaitUntil(()=>Starter.myInstance !== null && Starter.myInstance !== undefined);
        yield new WaitUntil(()=>Starter.myInstance.GetRoom() !== null && Starter.myInstance.GetRoom() !== undefined);

        this.room = Starter.myInstance.GetRoom();
        console.log("FeedScreenShotManager Room Success Create!");

        this.room.AddMessageHandler(("Rev_HideCharacter_FeedEnding"), (message)=>{
            console.log("Character Hide!");
            var _msg = message.toString();
            var player = ZepetoPlayers.instance.GetPlayer(_msg);
            player.character.gameObject.SetActive(false);
        });

        this.room.AddMessageHandler(("Rev_Cancel_HideCharacter_FeedEnding"), (message)=>{
            console.log("Character Hide Cancel!");
            var _msg = message.toString();
            var player = ZepetoPlayers.instance.GetPlayer(_msg);
            player.character.gameObject.SetActive(true);
        });
    }

    public CallFeedScreenShotMessage(_num:number, _button:Button){
        console.log("CallFeedScreenShotMessage");
        this.feedPopupObject.SetActive(true);
        this.feedPopupScript.BossClearFeedMessage(_num, _button);
    }

    public CallFeedScreenShotExit(){
        this.feedPopupScript.ResetBaseSetting();
    }

    public CallFeedScreenShotCustomAni(_index:number, _strInteger:string, _strBool:string, _time:number){
        var _animator:Animator; 

        _animator = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.ZepetoAnimator;
        _animator.SetInteger(_strInteger, _index);
        _animator.SetBool(_strBool, true);

        this.StartCoroutine(this.customEndAni(_index, _animator, _strBool, _time));
    }

    *customEndAni(index:number, _animator:Animator, _strbool:string, _time:number){
        yield new WaitForSeconds(_time);
        _animator.SetBool(_strbool, false);
    }

    public CallFeedScreenShotObjectSetting(_obj:GameObject){
        this.feedPopupScript.ItemFeedSetting(_obj);
    }

    //SwapPos Reset
    public CallFeedPastPositionReset(_playerTrans:Transform, _cameraTrans:Transform){
        this.feedPopupScript.PastPositionReset(_playerTrans, _cameraTrans);
    }

    public CalllCustomRenderer(){
        this.feedPopupScript.CustomRenderer();
    }

    public CallFeedObjectSetting(){
        if(this.FeedPrefab === null || this.FeedPrefab === undefined){
            console.log("FeedPrefab is null");
            return;
        }

        if(this.FeedObject === null || this.FeedObject === undefined){
            this.FeedObject = GameObject.Instantiate(this.FeedPrefab) as GameObject;
            this.FeedObject.SetActive(false);
        }
        this.feedPopupScript.GetFeedMessageObject(this.FeedObject);
    }

    public CallFeedMessageDelete(){
        if(this.FeedObject === null || this.FeedObject === undefined){
            return;
        }
        GameObject.Destroy(this.FeedObject);
        this.FeedObject = null;
    }

    public CallFeedPlayerHandAnimationCheck(_bool:bool){
        this.feedPopupScript.OnPlayerHandAnimationCheck(_bool);
    }
}