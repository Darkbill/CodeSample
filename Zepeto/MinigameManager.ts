import { GameObject, Resources, Texture2D, WaitUntil } from 'UnityEngine';
import { Button, RawImage } from 'UnityEngine.UI';
import { Room } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Starter from '../ZepetoScripts/ClientStarter';
import CanvasChoice from './CanvasChoice';
import CharacterTeleportController from './CharacterTeleportController';
import FigureManager from './FigureManager';
import NewXXIcon from './NewXXIcon';
import tutorialManager from './tutorialManager';
import UILocalizeText from './UILocalizeText';
import CinematicManager from './CinematicManager';
import RoleGameUIManager from './RoleGameUIManager';

export default class MinigameManager extends ZepetoScriptBehaviour {

    @NonSerialized() isFirst:bool;
    @NonSerialized() room:Room;
    @NonSerialized() MiniGameAmount:number = 1;
    @NonSerialized() isExpZero:bool[] = [];
    @NonSerialized() _targetIndex:number = -1;

    @Header("Ready_minigameState")
    figure_ready:bool = false;
    // dessert_ready:bool = false;


    //입
    @Header("Minigame_Welcome")
    Welcome_Button:Button;
    Welcome_Image:RawImage;
    Welcome_Popup:GameObject;
    Welcome_UILocalize_index:number[];
    Welcome_Text:GameObject;
    Welcome_UILocalizeText:UILocalizeText;
    OnNavigation_Minigame_Welcome:bool = false;
    Navigation_Target_Minigame:GameObject[];

    MiniGame_Notice_Button:Button;

    isPlayDessert:bool = false;

    teleport_buttons:Button[];
    content_images:RawImage[];
    cancel_button:Button;

    guide_buttons:Button[];
    guideIsFirst:bool;

    dessert_trigger:GameObject;
    figure_trigger:GameObject;

    public static myInstance:MinigameManager;
    public static Instacne():MinigameManager{
        if(null === this.myInstance || undefined === this.myInstance){
            return null;
        }
        return this.myInstance;
    }

    private Awake(){
        if(null === MinigameManager.myInstance || undefined === MinigameManager.myInstance){
            MinigameManager.myInstance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    //노티스
    Start() {    
        this.isFirst = true;
        this.guideIsFirst = true;
        this.Welcome_UILocalizeText = this.Welcome_Text.GetComponent<UILocalizeText>();
        this.StartCoroutine(this.SetRoom());
        // this.Welcome_Button.onClick.AddListener(()=>{
        //     this.Welcome_Image.texture = null;
        //     Resources.UnloadUnusedAssets();
        //     this.OnNavigation_Minigame_Welcome = true;
        //     tutorialManager.myInstance._navigation.SetActive(true);
        // })

        this.MiniGame_Notice_Button.onClick.AddListener(()=>{
            this.SetContentImage();
            this.Welcome_Popup.SetActive(true);
            // this.OnMinigameWelcome();
        })
        
        for(var i = 0 ; i<this.teleport_buttons.length;++i){
            this.SetTeleportButton(i,this.teleport_buttons);
        }

        for(var i = 0 ; i<this.guide_buttons.length;++i){
            this.SetGuideButton(i);
        }

        this.cancel_button.onClick.AddListener(()=>{
            this.Close();
            // console.log("미니게임매니저 close");
            //tutorialManager.myInstance.tutorialCategory_Max
            // if(tutorialManager.myInstance._targetIndex >= 6 &&true === this.guideIsFirst){
            //     CanvasChoice.myInstance.GuideButton.onClick.Invoke();
            //     CanvasChoice.myInstance.once_button.gameObject.SetActive(true);
            //     this.guideIsFirst = false;
            // }
        })
        this.SetExpZero();

        this.StartCoroutine(this.WaitLoadJobExp());
    }

    SetExpZero(){
        for(var i = 0 ; i < this.MiniGameAmount; i ++){
            this.isExpZero.push(true);
        }
    }

    *WaitLoadJobExp(){
        yield new WaitUntil(()=> FigureManager.myInstance._figureExp !== -1);

        this.OnMinigameWelcome(true);
    }

    public NoticeButtonSetActive(isbool:bool){
        this.MiniGame_Notice_Button.gameObject.SetActive(isbool);
    }


    *SetRoom(){
        
        yield new WaitUntil(()=>Starter.myInstance !== null && Starter.myInstance !== undefined);
        yield new WaitUntil(()=>Starter.myInstance.GetRoom() !== null && Starter.myInstance.GetRoom() !== undefined);
        this.isFirst = false;
        this.room = Starter.myInstance.GetRoom();

        this.StartCoroutine(this.SendLoadJobExp());

        this.room.AddMessageHandler("HistoryDataIsNull", ()=>{

            this.guideIsFirst = true;
            // console.log("histroy is  null");

            // for(var i = 0 ; i<4;i++){
            //     CinematicManager.myInstance.datas.push(false);
            // }

            // CinematicManager.myInstance.isInit = true;

        });

        // DataStorage 에 내용 있음
        this.room.AddMessageHandler("HistoryDataIsNotNull", (message)=>{


            var _data = JSON.parse(message.toString());
            var _guide = _data["guide"];
            if(_guide === null || _guide === undefined){
                this.guideIsFirst = true;
                // console.log("가이드 데이타 null&undefine");
            }   
            else{
                // console.log("simplecar_data : " + _data["guide"]);
                // console.log("가이드 데이터 : " + parseInt(_guide));
                this.guideIsFirst = parseInt(_guide) < 1;
                // this.Has_SimpleCar.push(parseInt(_data["s"+i]));
                // console.log("가이드 데이터 null 아님");
            }
            
            // for(var i = 0 ; i<4;i++){
            //     var _name = "cinematic_" + i;
            //     var _cinema_data = _data[_name];
            //     if(_cinema_data === null || _cinema_data === undefined){
            //         CinematicManager.myInstance.datas.push(false);
            //     }   
            //     else{
            //         var _isSaw = 0 < parseInt(_cinema_data);
            //         CinematicManager.myInstance.datas.push(_isSaw);
            //     }

            // }
            
            // CinematicManager.myInstance.isInit = true;
        });
        // this.room.Send("LoadHistory_Data", "");
    }


    *SendLoadJobExp(){//나중에 계속 추가해줘야됌
        yield new WaitUntil(()=> this.figure_ready === true);

        // this.room.Send("LoadJobExp");
    }

    SetMiniGameButton(){

    }

    // SetMinigameWelcome(){
    //     if (FigureManager.myInstance._figureLevel > 0){
    //         this.isExpZero[0] = false;
    //     }

    //     if(this.isPlayDessert === false){
    //         this.isExpZero[1] = true;
    //     }else{
    //         this.isExpZero[1] = false;
    //     }

    //     // 디저트
    //     // if ()


    //     for(var i = this.isExpZero.length -1; i >= 0 ; i --){
    //         if(this.isExpZero[i] === true){
    //             this._targetIndex = i;
    //             this.SetMinigameImageString();
    //             return;
    //         }
    //     }

    //     this._targetIndex = -1;
    //     this.SetMinigameImageString();
    // }

    SetMinigameImageString(){

        if(this._targetIndex === -1){
            return;
        }

        //image
        var _name = "Image_Minigame_Welcome_" + this._targetIndex.toString();

        var _texture2d = Resources.Load<Texture2D>(_name) as Texture2D;

        this.Welcome_Image.texture = _texture2d;

        //string
        // this.Welcome_UILocalizeText.key = this.Welcome_UILocalize_index[this._targetIndex];
        // this.Welcome_UILocalizeText.LocalizeUIText();

    }

    OnMinigameWelcome(isFirst?:bool){
        // this.SetMinigameWelcome();
        // console.log("")
        // if(this._targetIndex === -1){
        //     this.MiniGame_Notice_Button.gameObject.SetActive(false);

        //     return;
        // }

        if(this.MiniGame_Notice_Button.gameObject.activeSelf === false){
            this.MiniGame_Notice_Button.gameObject.SetActive(true);
        }

        // if(true === isFirst){
        //     this.SetContentImage();
        //     this.Welcome_Popup.SetActive(true);
        // }

        // NewXXIcon.SetNewNoticeIcon.Invoke();

    }

    SetTeleportButton(_index:number, _Buttons:Button[]){
        _Buttons[_index].onClick.AddListener(()=>{
            switch(_index){
                case 0:
                    RoleGameUIManager.myInstance.OnRoleBtn();
                    this.Close();
                    break;
                case 1:
                case 2:
                    var tp_index = this.GetIndex(_Buttons[_index].gameObject.name);
                    CharacterTeleportController.myInstance.MinimapTeleport(tp_index);
                    this.Close();
                    break;
                default:
                    break;
            }
            

            // if(tutorialManager.myInstance._targetIndex >= 6 &&true === this.guideIsFirst){
            //     CanvasChoice.myInstance.GuideButton.onClick.Invoke();
            //     CanvasChoice.myInstance.once_button.gameObject.SetActive(true);
            //     this.guideIsFirst = false;
            // }

        });
    }
    SetGuideButton(_index:number){
        this.guide_buttons[_index].onClick.AddListener(()=>{
            // this.Close();
 
            var index = 5 + _index;
            this.guideIsFirst = false
            CanvasChoice.myInstance.category_buttons[index].onClick.Invoke();
            CanvasChoice.myInstance.GuideObject.SetActive(true);
        });
    }
    SetContentImage(){
        for(var i = 0; i<this.content_images.length;++i){
            var _name = "Image_contents_guide_" + i;

            var _texture2d = Resources.Load<Texture2D>(_name) as Texture2D;
            if(null === _texture2d){
                continue;
            }
            this.content_images[i].texture = _texture2d;
        }
    }

    Close(){
        this.Welcome_Popup.SetActive(false);
        for(var i = 0; i<this.content_images.length;++i){
            this.content_images[i].texture = null;
        }
        Resources.UnloadUnusedAssets();
    }

    GetIndex(value:string)
    {
        var _index = value.lastIndexOf("_") + 1;
        var _v = value.substring(_index, value.length);

        //char _value = value[value.Length - 1];
        var v = 0;
        v = parseInt(_v);
        return v;
    }
}