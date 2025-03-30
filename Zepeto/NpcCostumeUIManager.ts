import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Transform, RectTransform, Mathf, Vector2, Vector3, WaitUntil, Input, KeyCode, Texture2D, Resources, Texture, Time, WaitForSeconds, Quaternion, Sprite } from 'UnityEngine';
import { ShopService } from 'ZEPETO.Module.Shop';
import CostumeButton from './CostumeButton';
import { Button, InputField ,RawImage,Text,Toggle, Slider, Image } from 'UnityEngine.UI';
import NpcCostumeManager from './NpcCostumeManager';
import NpcCostumeData from './NpcCostumeData';
import GetTextTable from './TextTable/GetTextTable';
import NpcCostumeFeedController from './NpcCostumeFeedController';
import UILocalizeText from './UILocalizeText';
import tutorialManager from './tutorialManager';
import NpcIdol from './NpcIdol';
import { ZepetoPlayers, ZepetoCharacter } from 'ZEPETO.Character.Controller';
import GestureManager from './GestureManager';
import { RoundedRectangle } from 'ZEPETO.World.Gui';

export default class NpcCostumeUIManager extends ZepetoScriptBehaviour {

    @Header("Popup")
    public costume_popup:GameObject;
    public personnel_popup:GameObject;
    public nickName_popup:GameObject;
    public activity_popup:GameObject;
    public formation_popup:GameObject;  //none
    public gesture_popup:GameObject;    //none
    public score_popup:GameObject;
    public info_popup:GameObject;
    public keyword_popup:GameObject;    //none
    public activity_per_popup:GameObject;
    public guide_popup:GameObject;

    @Header("MainButton")
    category_toggles:Toggle[];
    npcselect_button:Button;

    @Header("Personnel")    //none
    personnel_button_3:Button;
    personnel_button_5:Button;
    personnel_button_selects:GameObject[];
    personnel_complete_button:Button;

    // private current_personnel:number;

    @Header("UISetting")
    @Space(10)
    public buttonPrefab:GameObject;
    public viewContent:Transform;
    public viewRectTrans:RectTransform;


    @Space(10)//RectTransform
    public rectDefaultScale:Vector2;
    public rectDefaultPos:Vector2;

    public defaultPos:Vector2;

    public buttonXSiz:number;//120, 120/
    public buttonYSiz:number;

    private isButton:CostumeButton[] = [];

    @Space(10)
    public toggle_formation:Toggle;
    public toggle_gesture:Toggle;

    @Header("CostumeData")
    public isStringData:string[] = [];//testData

    @Header("UIState")
    public x_count:number;
    public y_count:number;

    public isSetting:bool = false;
    public pageIndex:number = -1;
    public lastPageIndex:number = 0;
    public category_num:number = 0;

    @Header("Costume")
    current_costume_data:NpcCostumeData[];
    current_costume_wear:NpcCostumeData[];
    costume_info:NpcCostumeInfo[];
    public next_Npc_button:Button;
    public init_costume_button:Button;
    public refresh_costume_button:Button;


    @Header("NickName")
    title_input:InputField;
    nickName_input:InputField;
    nickName_button:Button;

    @Header("Formation")
    formation_buttons:Button[];
    position_slider:Slider;

    @Header("Gesture")
    gesture_buttons:Button[];
    pose_buttons:Button[];


    @Header("Score")
    concept_socre_text:Text;
    ability_socre_text:Text;
    color_socre_text:Text;
    total_socre_text:Text;
    score_confirm_button:Button;
    score_share_button:Button;
    concept_score:number;
    ability_score:number;
    color_score:number;
    total_score:number;
    result_selected_obj:GameObject[];
    result_selected_icon:RawImage[];


    @Header("Info")
    concept_text_obj:GameObject;
    ability_text_obj:GameObject;
    color_text_obj:GameObject;
    concept_loclize:UILocalizeText
    ability_loclize:UILocalizeText
    color_loclize:UILocalizeText
    concept_local_key:number[];
    ability_local_key:number[];
    color_local_key:number[];


    @Header("KeyWord")
    keyword_concept_text:Text;
    keyword_ability_text:Text;
    keyword_color_text:Text;
    keyword_total_text:Text;

    @Header("Background")
    // backimage:RawImage;
    backimage_array:Texture[];

    @Header("Other")
    complete_button:Button;
    npc_rawImage:RoundedRectangle;
    // cancelgesturePer_button:Button; //none
    // changePopup_button:Button;
    // private changePopup_bool:bool = false;
    // cancelgestureGro_button:Button;//not
    selectNpcChange_button_left:Button;
    selectNpcChange_button_right:Button;


    private feedController:NpcCostumeFeedController;
    private costumes_texture:Map<string, Texture2D>;
    character:ZepetoCharacter;

    public static myInstance:NpcCostumeUIManager;
    public static Instacne():NpcCostumeUIManager{
        if(null == this.myInstance){
            return null;
        }
        return this.myInstance;
    }

    private Awake(){
        if(null == NpcCostumeUIManager.myInstance){
            NpcCostumeUIManager.myInstance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    private Start() {   
        // this.SetPages();
        this.current_costume_data = [];
        this.current_costume_wear = [];

        this.costume_info = [];
        this.feedController = this.gameObject.GetComponent<NpcCostumeFeedController>();
        this.concept_loclize = this.concept_text_obj.GetComponent<UILocalizeText>();
        this.ability_loclize = this.ability_text_obj.GetComponent<UILocalizeText>();
        this.color_loclize = this.color_text_obj.GetComponent<UILocalizeText>();

        this.costumes_texture = new Map<string, Texture2D>();

        this.StartCoroutine(this.SetPages());

        // this.toggle_formation.onValueChanged.AddListener(() => {
        //     if(this.toggle_formation.isOn === true){
        //         this.formation_popup.SetActive(true);
        //         this.gesture_popup.SetActive(false);
        //     }
        // });

        // this.toggle_gesture.onValueChanged.AddListener(() => {
        //     if(this.toggle_gesture.isOn === true){
        //         this.formation_popup.SetActive(false);
        //         this.gesture_popup.SetActive(true);
        //     }
        // });
        // for(var i = 0;i<this.gesture_buttons.length;i++){
        //     this.SetGestureButton(i);
        // }
        for(var i = 0;i<this.pose_buttons.length;++i){
            this.SetPoseButton(i);
        }
        for(var i = 0;i<this.formation_buttons.length;i++){
            this.SetFormationButton(i);
        }
        for(var i = 0;i<this.category_toggles.length;i++){
            this.SetCategoryButton(i);
        }
        // this.personnel_button_3.onClick.AddListener(()=>{

        //     this.PersonnelButton(3,0);

        // });
        // this.personnel_button_5.onClick.AddListener(()=>{

        //     this.PersonnelButton(5,1);
        // });

        this.next_Npc_button.onClick.AddListener(() => {//옷입히고 완료버튼
            // this.next_Npc_button.gameObject.SetActive(false);
            // NpcCostumeManager.myInstance.current_npc.GetComponent<NpcIdol>().canDrag = false;

            this.costume_popup.SetActive(false);
            this.info_popup.SetActive(false);
            this.activity_popup.SetActive(true);
            NpcCostumeManager.myInstance.IsResult();

            // this.costume_popup.SetActive(false);
            // this.info_popup.SetActive(false);
            // this.activity_per_popup.SetActive(false);

            // this.StartCoroutine(this.SetResult());
        });
        this.init_costume_button.onClick.AddListener(() => {
            this.InitNpcCostume();
        });
        this.refresh_costume_button.onClick.AddListener(() => {
            this.RefreshCostume();
        });
        this.nickName_button.onClick.AddListener(() => {

            var _title = this.title_input.text;
            var _nickname = this.nickName_input.text;

            NpcCostumeManager.myInstance.OnNickNameSetting(_title,_nickname);
            this.nickName_popup.SetActive(false);
            this.title_input.text = "";
            this.nickName_input.text = "";
            // this.costume_popup.SetActive(true);
            // this.info_popup.SetActive(true);
        });


        
        this.score_share_button.onClick.AddListener(() => {
            // this.feedController.SceneCapture(2);
            //공유하기
        });

        this.score_confirm_button.onClick.AddListener(() => {
            this.score_popup.SetActive(false);
            NpcCostumeManager.myInstance.SelectNpcCostume();

            this.npc_rawImage.gameObject.SetActive(false);

            // this.next_Npc_button.gameObject.SetActive(false);
            // this.score_popup.SetActive(false);
            // this.score_confirm_button.gameObject.SetActive(false);
            // this.score_share_button.gameObject.SetActive(false);
            // NpcCostumeManager.myInstance.OnNextNpc();
        });

        // this.personnel_complete_button.onClick.AddListener(() => {
        //     NpcCostumeManager.myInstance.OnSetMemberCount(this.current_personnel);
        //     this.personnel_popup.SetActive(false);
        // });

        this.complete_button.onClick.AddListener(() => {//프리셋 창 off
            this.activity_popup.SetActive(false);
            
            this.SavedNpcCostume(NpcCostumeManager.myInstance.select_npcnum);
            this.StartCoroutine(this.SetResult());
            // this.StartCoroutine(this.SetCompleteButton());
        });

        // this.cancelgesturePer_button.onClick.AddListener(() => {
        //     this.character.CancelGesture();
        // });

        // this.cancelgestureGro_button.onClick.AddListener(() => {
        //     for(var i = 0; i < NpcCostumeManager.myInstance.npc_characters.length; ++i){
        //         NpcCostumeManager.myInstance.npc_characters[i].CancelGesture();
        //     }
        // });
        // this.changePopup_button.onClick.AddListener(() => {
        //     // var isbool = this.changePopup_bool === true ? false : true;

        //     this.costume_popup.SetActive(!isbool);
        //     this.activity_per_popup.SetActive(isbool);
        //     this.changePopup_bool = isbool;
        // });
        this.npcselect_button.onClick.AddListener(() => {//npc 3명 선택후 확인버튼
            if(2 >= NpcCostumeManager.myInstance.preview_select_count){
                return;
            }
            NpcCostumeManager.myInstance.SelectComplete();
            this.npcselect_button.gameObject.SetActive(false);
        })
        // this.npccomplete_button.onClick.AddListener(() => {
        //     this.costume_popup.SetActive(false);
        //     this.info_popup.SetActive(false);
        //     this.SavedNpcCostume(NpcCostumeManager.myInstance.select_npcnum);
        //     this.StartCoroutine(this.SetResult());
        //     NpcCostumeManager.myInstance.IsResult();
        //     // NpcCostumeManager.myInstance.SelectNpcCostume();
        // })
        this.selectNpcChange_button_left.onClick.AddListener(() => {//옷입히기 좌 버튼
            var index = NpcCostumeManager.myInstance.select_npcnum;
            this.SavedNpcCostume(index);
            this.CallNpcCostume(index + 1);
            NpcCostumeManager.myInstance.SelectNpc_Change(index + 1);
            if(index + 1 >= NpcCostumeManager.myInstance.npc_characters.length - 1){
                this.selectNpcChange_button_left.gameObject.SetActive(false);
            }
            this.selectNpcChange_button_right.gameObject.SetActive(true);
        });
        this.selectNpcChange_button_right.onClick.AddListener(() => {//옷입히기 우 버튼
            var index = NpcCostumeManager.myInstance.select_npcnum;
            this.SavedNpcCostume(index);
            this.CallNpcCostume(index - 1);
            NpcCostumeManager.myInstance.SelectNpc_Change(index - 1);
            if(index - 1 <= 0){
                this.selectNpcChange_button_right.gameObject.SetActive(false);
            }
            this.selectNpcChange_button_left.gameObject.SetActive(true);
        });
    }

    OnPersonnelPopup(){
        NpcCostumeManager.myInstance.SelectNpcSetting();
        NpcCostumeManager.myInstance.SetRandomKeyWord();
        this.guide_popup.SetActive(true);

        // this.current_personnel = 0;
        // this.personnel_complete_button.interactable = false;
        // for(var i = 0; i<this.personnel_button_selects.length;i++){
        //     this.personnel_button_selects[i].SetActive(false);
        // }
        // this.personnel_popup.SetActive(true);

    }

    BackgroundImage(_index:number):Texture{
        this.npc_rawImage.gameObject.SetActive(true);
        return this.backimage_array[_index];
    }
    // PersonnelButton(_count:number,_index:number){

    //     // this.costume_popup.SetActive(true);
    //     if(_count === this.current_personnel){
    //         return;
    //     }
    //     this.personnel_complete_button.interactable = true;

    //     this.current_personnel = _count;
    //     for(var i = 0; i<this.personnel_button_selects.length;i++){
    //         this.personnel_button_selects[i].SetActive(false);
    //     }
    //     this.personnel_button_selects[_index].SetActive(true);
    // }

    SetGestureButton(_index:number){
        this.gesture_buttons[_index].onClick.AddListener(() => {
            // var _gesture = this.gesture_buttons[_index].gameObject.name;
            // NpcCostumeManager.myInstance.NpcGesture(_gesture);
            NpcCostumeManager.myInstance.SelectNpcPose_Button(_index);
        })
    }
    SetPoseButton(_index:number){
        this.pose_buttons[_index].onClick.AddListener(() => {
            var _pose = this.pose_buttons[_index].gameObject.name;
            if(this.character !== null && this.character !== undefined){
                GestureManager.myInstance._loadGestureScript.LoadAnimationClip_Pose(_pose, NpcCostumeManager.myInstance.current_npc);
            }
        });
    }
    *SetCompleteButton(){
        var wfs = new WaitForSeconds(0.5);
        yield wfs;
        this.feedController.SceneCapture(2);
        yield wfs;

        tutorialManager.myInstance.SetUIActive(true);
        NpcCostumeManager.myInstance.NpcCharacterComplete();
    }

    SetFormationButton(_index:number){
        this.formation_buttons[_index].onClick.AddListener(() => {
            // NpcCostumeManager.myInstance.OnIdolFormationSetting(_index);
            NpcCostumeManager.myInstance.SelectNpcPose_Button(_index);
        })
    }

    SetCategoryButton(_index:number){
        this.category_toggles[_index].onValueChanged.AddListener(() => {
            
            if(this.category_toggles[_index].isOn === false){
                return;
            }
            var _data = NpcCostumeManager.myInstance.OnGetCostumeData(_index);
            this.current_costume_data = _data;
            this.viewRectTrans.sizeDelta = new Vector2(0, (Mathf.Floor(this.current_costume_data.length / this.x_count) + 1) * this.buttonYSiz);
            this.viewContent.localPosition = new Vector3(this.rectDefaultPos.x, this.rectDefaultPos.y, 0);
            this.lastPageIndex = -1;
            this.category_num = _index;
        })
    }
    *SetPages(){

        yield new WaitUntil(()=> GetTextTable.myInstance.isReady_NpcCostume === true);
        var _data = NpcCostumeManager.myInstance.OnGetCostumeData(0);
        this.current_costume_data = _data;
        //x count값
        this.x_count = Mathf.Floor(Mathf.Abs(this.rectDefaultScale.x) / this.buttonYSiz);
        this.y_count = Mathf.Floor(Mathf.Abs(this.rectDefaultScale.y) / this.buttonYSiz);//스크롤 사용 시 + 1

        for(let i = 0; i < this.y_count; ++i){
            for(let j = 0; j < this.x_count; ++j){
                var newbuton:GameObject = GameObject.Instantiate(this.buttonPrefab, this.viewContent) as GameObject;
                var button_script = newbuton.GetComponent<CostumeButton>();
                this.isButton.push(button_script);
            }
        }
        this.viewRectTrans.sizeDelta = new Vector2(0, (Mathf.Floor(this.current_costume_data.length / this.x_count) + 1) * this.buttonYSiz);
        this.viewContent.localPosition = new Vector3(this.rectDefaultPos.x, this.rectDefaultPos.y, 0);
        this.ChangePage(0, this.current_costume_data);
        this.isSetting = true;
    }

    ChangePage(page:number, costumeIdData:NpcCostumeData[]){
        var count:number = 0;
        var select_costume:NpcCostumeData = null;

        for(var i = 0; i < this.current_costume_wear.length; ++i){
            if(this.category_num === this.current_costume_wear[i].category){
                select_costume = this.current_costume_wear[i];
                break;
            }
        }

        for(let i = 0; i < this.y_count; ++i){
            for(let j = 0; j < this.x_count; ++j){
                if((page + i) * this.x_count + j >= costumeIdData.length){
                    this.isButton[count].mainButton.gameObject.SetActive(false);
                    ++count;
                    continue;
                }
                var _index = (page + i) * this.x_count + j;
                this.StartCoroutine(this.ButtonSetting(_index,costumeIdData[_index].id, count, i, j, page, select_costume))
                ++count;
            }
        }
    }

    *ButtonSetting(_index:number,id:string, count:number, i:number, j:number, page:number, select:NpcCostumeData){

        var istexture = this.costumes_texture.has(id);
        var texture:Texture2D = null;

        if( istexture === false ){
            var request = ShopService.DownloadItemThumbnail(id);
            yield new WaitUntil(() => request.keepWaiting === false);
            if(!request.responseData.isSuccess){
                this.isButton[count].mainButton.gameObject.SetActive(false);
                return;
            }
            texture = request.responseData.texture;
            this.costumes_texture.set(id, texture);
            request = null;//임시조치
        } else{
            texture = this.costumes_texture.get(id);
        }

        if(select !== null){
            this.isButton[count].SelectedButton(id === select.id);
        } else{
            this.isButton[count].SelectedButton(false);
        }

        this.isButton[count].mainButton.gameObject.SetActive(true);
        this.isButton[count].image.texture = texture;
        this.isButton[count].gameObject.name = _index.toString();

        this.isButton[count].mainButton.gameObject.transform.localPosition = new Vector3(j * this.buttonXSiz + this.defaultPos.x, -((i + page) * this.buttonYSiz) +this.defaultPos.y, 0);
    }

    SelectAndReleaseButton(_data:NpcCostumeData){
        for(var i = 0; i < this.current_costume_wear.length; ++i){
            if(this.current_costume_wear[i].category == _data.category){
                this.current_costume_wear.splice(i, 1);
                break;
            }
        }
        this.current_costume_wear.push(_data);
        if(1 === _data.category){
            this.current_costume_wear = this.current_costume_wear.filter(x=>(2 !== x.category) && (3 !== x.category));
        }
        else if(2 === _data.category){
            this.current_costume_wear = this.current_costume_wear.filter(x=>(1 !== x.category))
        }else if(3 === _data.category){
            this.current_costume_wear =this.current_costume_wear.filter(x=> (1 !== x.category) )
        }
        this.ChangePage(this.pageIndex, this.current_costume_data);
    }

    ChangeNpcCharacter(_add:bool, _npc_index?:number){
        if(_add === false){
            this.costume_info.forEach(element => {
                if(_npc_index === element.npc_index){
                    this.current_costume_wear = element.costume_data;
                    this.ChangePage(this.pageIndex, this.current_costume_data);
                    return;
                }
            });
        }
        var npc_info:NpcCostumeInfo = new NpcCostumeInfo(this.current_costume_wear, this.costume_info.length);
        this.current_costume_wear = npc_info.costume_data;
        this.costume_info.push(npc_info);
        this.current_costume_wear.splice(0, this.current_costume_wear.length);
        this.ChangePage(this.pageIndex, this.current_costume_data);
    }

    NpcCostumePopup_exit(){
        this.costume_popup.SetActive(false);
        this.isButton.forEach(button => {
            button.image.texture = null;
        });
        this.costumes_texture.clear();
        Resources.UnloadUnusedAssets();
        NpcCostumeManager.myInstance.isPlaying = false;
        this.activity_popup.SetActive(true);

    }

    NpcActivity_Per(character:ZepetoCharacter){
        this.character = character;

        // this.changePopup_bool = false;
        // this.activity_popup.SetActive(false);        
        this.activity_per_popup.SetActive(false);        
    }

    RefreshCostume(){

        var _data = NpcCostumeManager.myInstance.OnRefreshCostumeData(this.category_num);
        this.current_costume_data = _data;
        this.viewRectTrans.sizeDelta = new Vector2(0, (Mathf.Floor(this.current_costume_data.length / this.x_count) + 1) * this.buttonYSiz);
        this.viewContent.localPosition = new Vector3(this.rectDefaultPos.x, this.rectDefaultPos.y, 0);
        this.lastPageIndex = -1;
    }
    InitNpcCostume(){
        NpcCostumeManager.myInstance.OnInitNpcCostume();
        this.current_costume_wear = [];
        this.ChangePage(this.pageIndex, this.current_costume_data);
    }
    SavedNpcCostume(_index:number){
        
        var datas = NpcCostumeManager.myInstance.npc_costumesDatas;
        if(datas.has(_index) === true){
            datas.delete(_index);
        }
        NpcCostumeManager.myInstance.npc_costumesDatas.set(_index, this.current_costume_wear);
        this.current_costume_wear = [];
    }

    CallNpcCostume(_index:number){
        this.guide_popup.SetActive(false);
        this.StartCoroutine(this.CallCostume(_index));
    }
    *CallCostume(_index:number){
        yield new WaitUntil(() => this.current_costume_wear.length <= 0 );
        var datas = NpcCostumeManager.myInstance.npc_costumesDatas;
        if(datas.has(_index) === true){
            this.current_costume_wear = datas.get(_index);
        }
        this.ChangePage(this.pageIndex, this.current_costume_data);
        NpcCostumeManager.myInstance.SelectNpc_Change(_index);
    }

    *SetResult(){
        this.concept_score = 0;
        this.ability_score = 0;
        this.color_score = 0;
        this.total_score = 0;
        this.score_confirm_button.gameObject.SetActive(false);
        this.score_share_button.gameObject.SetActive(false);
        this.concept_socre_text.text = "0/750";
        this.ability_socre_text.text = "0/600";
        this.color_socre_text.text = "0/300";
        this.total_socre_text.text = "0";

        // this.StartCoroutine(this.SetSelectedIcon());
        this.feedController.SceneCapture(0.2);
        yield new WaitForSeconds(0.5);

        yield this.StartCoroutine(this.GetScore());

        this.score_popup.SetActive(true);
        // NpcCostumeManager.myInstance.OnResult();
        yield this.StartCoroutine(this.gradualValue(this.concept_score,this.concept_socre_text,"/750"));

        yield this.StartCoroutine(this.gradualValue(this.ability_score,this.ability_socre_text,"/600"));

        yield this.StartCoroutine(this.gradualValue(this.color_score,this.color_socre_text,"/300"));

        yield this.StartCoroutine(this.gradualValue(this.total_score,this.total_socre_text,""));

        this.score_confirm_button.gameObject.SetActive(true);
        this.score_share_button.gameObject.SetActive(true);

    }
    *SetSelectedIcon(){
        
        for(var i = 0; i<this.result_selected_obj.length;i++){
            this.result_selected_icon[i].texture = null;
            this.result_selected_obj[i].SetActive(false);
        }
        for(var i = 0; i<this.result_selected_obj.length;i++){

            var _data = this.current_costume_wear.find(x=>x.category === i);
            if((null === _data)||(undefined === _data)){
                continue;
            }

            var id = _data.id;

            var istexture = this.costumes_texture.has(id);
            var texture:Texture2D = null;
    
            if( istexture === false ){
                var request = ShopService.DownloadItemThumbnail(id);
                yield new WaitUntil(() => request.keepWaiting === false);
                texture = request.responseData.texture;
                request = null;//임시조치
            } else{
                texture = this.costumes_texture.get(id);
            }

            
            this.result_selected_icon[i].texture = texture;
            this.result_selected_obj[i].SetActive(true);

        }
    }

    *gradualValue(_amountValue:number,score_text:Text,_max:string){
        // yield new WaitUntil(()=> this._resultExitButton.gameObject.activeInHierarchy === true);
        var _newvalue:string = "";
        var _time = 0;
        while(_time <0.5){
            _time += Time.deltaTime;
            var f = _time / 0.5;
            _newvalue = Mathf.Floor(_amountValue * f) + _max;
            score_text.text = _newvalue;
            yield null;
        }
        score_text.text = _amountValue + _max;
        // for(var i =0; i<_amountValue; i++){
        //     yield new WaitForSeconds(1.5 /_amountValue);
        //     _newvalue += 1;
        //     this._resultAmountValueText.text = _newvalue.toString();
        // }
    }

    *GetScore(){
        var _current_concept = NpcCostumeManager.myInstance.current_concept;
        var _current_ability = NpcCostumeManager.myInstance.current_ability;
        var _current_color = NpcCostumeManager.myInstance.color_data[NpcCostumeManager.myInstance.current_color];

        var mapdata = NpcCostumeManager.myInstance.npc_costumesDatas;
        for(var i = 0; i < mapdata.size; ++i){
            var costume_array = mapdata.get(i);
            if(costume_array === null){
                continue;
            }
            if(costume_array === undefined){
                continue;
            }

            for(var j = 0; j < costume_array.length; ++j){

                var _data = costume_array[j];
                var _grade_rate = _data.grade_rate;
                var _concept = _data.concept[_current_concept];
                var _concept_rate = _data.concept_rate;
    
    
                var _current_concept_score = Mathf.Pow(_concept * _concept_rate,_grade_rate);
                this.concept_score += Mathf.Round(_current_concept_score);

    
                var _ability = _data.ability[_current_ability];
                var _ability_rate = _data.ability_rate;
                var _current_ability_score = Mathf.Pow(_ability * _ability_rate,_grade_rate);
                this.ability_score += Mathf.Round(_current_ability_score);
                // _score += _current_score;
    
                // this.total_score += Mathf.Pow(_current_score,_data.grade_rate);
    
                var _costume_color = _data.color;
                // var _check_color = this.CheckColor(_current_color,_costume_color);
                var _color_score = this.Color_Score(_current_color,_costume_color);
    
                // var _ability_score = _data.ability[_current_ability];
                var _color_rate = _data.color_rate;
                var _current_color_score = Mathf.Pow(_color_score * _color_rate,_grade_rate);
    
                this.color_score += Mathf.Round(_current_color_score);
    
                // var _total = _current_concept_score + _current_ability_score + _current_color_score;
                // this.total_score += _total;
            }
        }
        this.total_score = this.concept_score + this.ability_score +  this.color_score;
        yield null;
    }

    // GetConceptScore(){

    //     var _current_concept = NpcCostumeManager.myInstance.current_concept;
    //     var _score = 0;

    //     for(var i = 0; i < this.current_costume_wear.length; ++i){
    //         var _data = this.current_costume_wear[i];
    //         var _concept_score = _data.concept[_current_concept];
    //         var _concept_rate = _data.concept_rate;
    //         var _current_score = _concept_score * _concept_rate;
    //         _score += _current_score;

    //         this.total_score += Mathf.Pow(_current_score,_data.grade_rate);
    //     }

    //     return _score;
    // }

    // GetAbilityScore(){

    //     var _current_ability = NpcCostumeManager.myInstance.current_ability;
    //     var _score = 0;

    //     for(var i = 0; i < this.current_costume_wear.length; ++i){
    //         var _data = this.current_costume_wear[i];
    //         var _ability_score = _data.ability[_current_ability];
    //         var _ability_rate = _data.ability_rate;
    //         var _current_score = _ability_score * _ability_rate;

    //         _score += _current_score;

    //         this.total_score += Mathf.Pow(_current_score,_data.grade_rate);
    //     }

    //     return _score;
    // }

    // GetColorScore(){
    //     var _current_color = NpcCostumeManager.myInstance.color_data[NpcCostumeManager.myInstance.current_color];

    //     var _score = 0;

    //     for(var i = 0; i < this.current_costume_wear.length; ++i){
    //         var _data = this.current_costume_wear[i];
    //         var _costume_color = _data.color;
    //         var _check_color = this.CheckColor(_current_color,_costume_color);
    //         var _color_score = Mathf.Floor(_check_color / 10);

    //         // var _ability_score = _data.ability[_current_ability];
    //         var _color_rate = _data.color_rate;
    //         var _current_score = Mathf.Round(_color_score * _color_rate);

    //         _score += _current_score;

    //         this.total_score += Mathf.Pow(_current_score,_data.grade_rate);
    //     }

    //     return _score;
    // }
    Color_Score(_current_color:Vector3,_costume_color:Vector3):number{
        var _score = this.CheckColor(_current_color, _costume_color);

        var scoreArray:number[] = [75, 50, 40, 30, 25, 20, 15, 10, 5, 0];

        var result_score:number = 10;

        for(var i = 0; i < scoreArray.length; ++i){
            if(_score > scoreArray[i]){
                return result_score;
            }
            --result_score;
        }
        return 0;
    }
    CheckColor(_current_color:Vector3,_costume_color:Vector3){
        var co_01:Vector3 = this.RgbToYuv(_current_color.x, _current_color.y, _current_color.z);
        var co_02:Vector3 = this.RgbToYuv(_costume_color.x, _costume_color.y, _costume_color.z);
        
        var _distance:number = Mathf.Floor(Vector2.Distance(new Vector2(co_01.y, co_01.z), new Vector2(co_02.y, co_02.z)));
        var message = ( 1 - _distance  / Mathf.Floor(Mathf.Sqrt(Mathf.Pow(222, 2) + Mathf.Pow(302, 2)))) * 100;
        var light = (1 - Vector2.Distance(new Vector2(co_01.x, 0), new Vector2(co_02.x, 0)) / 255) * 100;
        var total = (( light / 100 ) * ( message / 100 )) * 100;
        return Mathf.Floor(total);
    }
    RgbToYuv(red:number, green:number, blue:number):Vector3{//디지털

        var y:number = (0.299 * red) + (0.587 * green) + (0.114 * blue);
        var u:number = (-0.147 * red) + (-0.289 * green) + (0.436 * blue);
        var v:number = (0.615 * red) + (-0.515 * green) + (-0.100 * blue);

        var value:Vector3 = new Vector3(y, u, v);
        return value;
    }

    OnSetInfo(_concept_index:number,_ability_index:number,_color_index:number){
        var _concept_key = this.concept_local_key[_concept_index];
        var _ability_key = this.ability_local_key[_ability_index];
        var _color_key = this.color_local_key[_color_index];

        this.concept_loclize.key = _concept_key;
        this.ability_loclize.key = _ability_key;
        this.color_loclize.key = _color_key;
        this.StartCoroutine(this.WaitKeyWordPopup(_concept_key,_ability_key,_color_key));
    }

    *WaitKeyWordPopup(_concept_key:number,_ability_key:number,_color_key:number){

        var _concept_0 = GetTextTable.myInstance.GetText(_concept_key);
        var _ability_0 = GetTextTable.myInstance.GetText(_ability_key);
        var _color_0 = GetTextTable.myInstance.GetText(_color_key);

        var _concept_1 = GetTextTable.myInstance.GetText(497);
        var _ability_1 = GetTextTable.myInstance.GetText(498);
        var _color_1 = GetTextTable.myInstance.GetText(499);
        
        var _concept = _concept_0 + _concept_1;
        var _ability = _ability_0 + _ability_1;
        var _color = _color_0 + _color_1;

        // this.keyword_concept_text.text = _concept;
        // this.keyword_ability_text.text = _ability;
        // this.keyword_color_text.text = _color;

        var total = _concept + "\n" + _ability + "\n" + _color;
        this.keyword_total_text.text = total;
        // this.keyword_popup.SetActive(true);
        // yield new WaitForSeconds(3);
        
        // this.keyword_popup.SetActive(false);
        // NpcCostumeManager.myInstance.CreateNpc();

    }
    //test
    Update(){
        if(Input.GetKeyDown(KeyCode.Alpha0)){
            this.costume_popup.SetActive(true);
        }
        // if(Input.GetKeyDown(KeyCode.Alpha9)){
        //     this.gesture_popup.SetActive(true);
        // }
        // if(Input.GetKeyDown(KeyCode.Alpha8)){
        //     this.formation_popup.SetActive(true);
        // }
        // if(Input.GetKeyDown(KeyCode.Z)){
        //     this.feedController.SceneCapture(2);
        // }

        if(!this.isSetting){
            return;
        }

        var ypos:number = Mathf.Round(this.viewContent.localPosition.y);
        this.pageIndex = Mathf.Max(0, Math.floor((ypos + 20) / this.buttonYSiz));

        if(ypos < 0){
            return;
        }
        if(Mathf.Floor(this.current_costume_data.length / this.x_count) * this.buttonYSiz < ypos){
            return;
        }
        if(this.lastPageIndex !== this.pageIndex){
            this.ChangePage(this.pageIndex, this.current_costume_data);
            this.lastPageIndex = this.pageIndex;
        }
    }
}
export class NpcCostumeInfo{
    costume_data:NpcCostumeData[];
    npc_index:number;
    constructor(_costume_data:NpcCostumeData[],_npc_index:number){
        this.costume_data = _costume_data;
        this.npc_index = _npc_index;
    }
}