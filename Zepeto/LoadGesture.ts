import { GameObject, Vector2, Vector3, Transform, WaitForSeconds, WaitUntil, AnimationClip, Mathf, Time, Coroutine, RectTransform, Texture2D } from 'UnityEngine';
import { Button, Scrollbar, Text, Toggle} from 'UnityEngine.UI';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { OfficialContentType, ZepetoWorldContent, Content, ZepetoWorldMultiplay } from 'ZEPETO.World';
import FigureManager from './FigureManager';
import SimpleRideManager from './SimpleRideManager';
import SimpleRideManager_Multy from './SimpleRideManager_Multy';
import ThumbnailButton from './ThumbnailButton';
import UILocalizeText from './UILocalizeText';

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: number,
    gestureType:OfficialContentType,
    gestureloop:bool,
}


const CancelMotion = -1 as const;

export default class LoadGesture extends ZepetoScriptBehaviour {
    public multiplay: ZepetoWorldMultiplay;
    private room: Room; 

    @SerializeField() private _contentsParent: Transform;
    @SerializeField() private _prefThumb: GameObject;
    // @SerializeField() private _quitButton: Button;
    @SerializeField() private _typeToggleGroup: Toggle[];
    @SerializeField() private _gestureCatelog: Button;
    @SerializeField() private _gestureCatelogText: Text;
    @SerializeField() private _gestureToggleGroup: Toggle[];
    @SerializeField() private _gestureToggleContent: GameObject;
    @SerializeField() private _loopToggle: Toggle;
    @SerializeField() private _favoritesToggle: Toggle;

    //Contents
    @NonSerialized() public _poseContents: Content[] = [];
    @NonSerialized() public _gestureContents: Content[] = [];
    @NonSerialized() public _gesture_DanceContent: Content[] = [];
    @NonSerialized() public _gesture_DenialContent: Content[] = [];
    @NonSerialized() public _gesture_AffirmationContent: Content[] = [];
    @NonSerialized() public _gesture_GreetingContent: Content[] = [];
    // private _poseObj: GameObject[] = [];    //불필요
    // private _gestureObj: GameObject[] = []; //안쓰는거
    private _myCharacter: ZepetoCharacter;
    private _contentlocalize: UILocalizeText;
    private _contentsRectTransform:RectTransform;

    private _FavoritesContents: Content[] = [];

    public _saveFavorotes:number[] = []; 

    private _thumbnailButton:ThumbnailButton[] = [];

    public _scroll:Scrollbar;
    public lastIndex:number;
    public _prefPage:GameObject;
    public nowPage:GameObject;

    private pages:GameObject[] = [];

    public pageIndex:number = 0;

    private lastPageIndex:number = -1;
    // private LoadPages:bool[] = [] ;
    @NonSerialized() public isReady:bool = false;
    private isReady2:bool = false;
    private isPoseReady:bool = false;

    @NonSerialized() private LoadGestureCount:number = 2; //12

    isloopGesture:bool;

    gestureScroll:GameObject;

    public contentnum:number = 1;
    private savecontent:number = 12;

    public commToolButton:Button;
    public commToolExitButton:Button;
    private gestureCoroutine:Coroutine = null;

    private Start() {
        this.lastIndex = 0;
        this.contentnum = 1;
        this.isloopGesture = false;
        this._contentsRectTransform = this._contentsParent.gameObject.GetComponent<RectTransform>();
        //켜져있을때만으로 수정해야됌
        // this.StartCoroutine(this.CheckScrollBar());
        
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this.ContentRequest();
            this.StartCoroutine(this.SetPages());
        });
        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
            // 서버로부터 유저의 제스쳐 정보를 받음
            this.room.AddMessageHandler("OnChangeGesture", (message: PlayerGestureInfo) => {
                let playerGestureInfo: PlayerGestureInfo = {
                    sessionId: message.sessionId,
                    gestureIndex: message.gestureIndex,
                    gestureType:message.gestureType,
                    gestureloop:message.gestureloop
                };

                // var isCheck = playerGestureInfo.gestureIndex === CancelMotion ? false : true;

                var contentnum = this.ContentArrayEnum(playerGestureInfo.gestureType);

                var idnum = contentnum * 1000 + (this.ContentArrayIndex(contentnum).length - playerGestureInfo.gestureIndex);
                var idnum2 = playerGestureInfo.gestureIndex === CancelMotion ? 0 : idnum ;
                ZepetoPlayers.instance.GetPlayer(playerGestureInfo.sessionId).character.ZepetoAnimator.SetInteger("PlayGesture", idnum2);

                this.LoadAnimation(playerGestureInfo);
            });
            this.room.AddMessageHandler("GestureFavoritesList", (message) => {
                this.StartCoroutine(this.GestureFavoritesListLoad(message));
            });
        };  

        //UI Listener
        this._contentlocalize = this._gestureCatelogText.gameObject.GetComponent<UILocalizeText>();

        this._typeToggleGroup[0].onValueChanged.AddListener(() => {
            this.SetCategoryUI(OfficialContentType.All);
        });
        this._typeToggleGroup[1].onValueChanged.AddListener(() => {
            this._gestureCatelog.gameObject.SetActive(true);
            this._loopToggle.gameObject.SetActive(true);
            // this._gestureCatelog.value = 0;
            this.SetCategoryUI(OfficialContentType.Gesture);
        });
        this._typeToggleGroup[2].onValueChanged.AddListener(() => {
            this._gestureCatelog.gameObject.SetActive(false);
            this._loopToggle.gameObject.SetActive(false);
            this.SetCategoryUI(OfficialContentType.Pose);
        });

        this._gestureCatelog.onClick.AddListener(() => {
            var isbool = this._gestureToggleContent.activeSelf === false ? true : false;
            this._gestureToggleContent.SetActive(isbool);
        })

        this._gestureToggleGroup[0].onValueChanged.AddListener(() => {this.DropdownValueChanged(0);});
        this._gestureToggleGroup[1].onValueChanged.AddListener(() => {this.DropdownValueChanged(1);});
        this._gestureToggleGroup[2].onValueChanged.AddListener(() => {this.DropdownValueChanged(2);});
        this._gestureToggleGroup[3].onValueChanged.AddListener(() => {this.DropdownValueChanged(3);});
        this._gestureToggleGroup[4].onValueChanged.AddListener(() => {this.DropdownValueChanged(4);});

        this._loopToggle.onValueChanged.AddListener(() => {
            this.isloopGesture = this._loopToggle.isOn;
        });

        this._favoritesToggle.onValueChanged.AddListener(() => {

            if(this._favoritesToggle.isOn === true){
                this.SetCategoryUI(OfficialContentType.All, true);
            }
            else if(this._favoritesToggle.isOn === false){
                this.SetCategoryUI(this.savecontent);
            }
        })

        this.ChangeDropdownString();
        this.SetCommToolButtonListener();
        
    }

    private SetCommToolButtonListener() {

        this.commToolButton.onClick.AddListener(() => {
            if(this.gestureCoroutine !== null){
                this.StopCoroutine(this.gestureCoroutine);
                this.gestureCoroutine = null;
            }
            this.gestureCoroutine = this.StartCoroutine(this.CheckScrollBar());
        });

        this.commToolExitButton.onClick.AddListener(() => {
            this.StopCoroutine(this.gestureCoroutine);
            this.gestureCoroutine = null;
        });
    }

    DropdownValueChanged(change:number){
        this._gestureToggleContent.SetActive(false);
        if(this._gestureToggleGroup[change].isOn === false) return;

        this._gestureCatelogText.gameObject.SetActive(false);
        this._contentlocalize.key = 369 + change;
        // this._gestureCatelogText.text =  GetTextTable.myInstance.UImap[369 + change];
        switch(change){
            case 0: this.SetCategoryUI(OfficialContentType.Gesture); break;//gesture
            case 1: this.SetCategoryUI(OfficialContentType.GestureDancing); break;//gesture
            case 2: this.SetCategoryUI(OfficialContentType.GestureGreeting); break;//gesture
            case 3: this.SetCategoryUI(OfficialContentType.GestureDenial); break;//gesture
            case 4: this.SetCategoryUI(OfficialContentType.GestureAffirmation); break;//gesture
        }
        this._gestureCatelogText.gameObject.SetActive(true);
    }

    //제스쳐 페이지 세팅 해주는 코드
    *SetPages(){
        yield new WaitUntil(()=> this.isReady === true);
        yield new WaitUntil(()=> this.isPoseReady === true);
        for(let i = this.lastIndex; i< 3 * this.LoadGestureCount/*this._gestureContents.length*/; i++){
            if(i % this.LoadGestureCount == 0){
                var newPage: GameObject = GameObject.Instantiate(this._prefPage, this._contentsParent) as GameObject;
                this.nowPage = newPage;
                
                this.pages.push(newPage);
            }
            var newThumb : GameObject = GameObject.Instantiate(this._prefThumb, this.nowPage.transform) as GameObject; 
            newThumb.SetActive(false); 
            this._thumbnailButton.push(newThumb.GetComponent<ThumbnailButton>());
        }
        this.isReady2 = true;
    }

    *GestureFavoritesListLoad(message:unknown){
        yield new WaitUntil(() => true === this.isReady && true === this.isPoseReady);
        var load = JSON.parse(message.toString());
        if(load !== null && load !== undefined){
            console.log("load gesture length: " + load.length)
            for(var i = 0;i<load.length;++i){
                var idnum = Number.parseInt(load[i]);
                var content = this.ContentArrayIndex(Mathf.Floor(idnum / 1000));
                var contentIndex = content.length - (idnum - Mathf.Floor(idnum / 1000) * 1000);

                this._saveFavorotes.push(idnum);
                this._FavoritesContents.push(content[contentIndex]);
            }

        }
    }

    //텍스쳐 내용 바꿔주는 코드
    ChangeTexture(arraynum:number){
        ///*
        var _Startindex = (this.pageIndex + arraynum) * this.LoadGestureCount;
        // if(_Startindex < 0 || this.pageIndex + arraynum >= this.pages.length) return;
        var _nowPageGameObject = this.pages[arraynum];//this.pages[this.pageIndex + arraynum];

        _nowPageGameObject.transform.localPosition = new Vector3(250, -(98 + 200 * (arraynum + this.pageIndex)), 0);

        // var content;
        var content = this.ContentArrayIndex(this.contentnum);

        for (let i = _Startindex; i < _Startindex + this.LoadGestureCount; i++) {
            if(/*i % this.LoadGestureCount  > _nowPageGameObject.transform.childCount -1 ||//*/ content.length <= i ){
                var thumb = _nowPageGameObject.transform.GetChild( i % this.LoadGestureCount ).gameObject;
                this.ReChangeDetailTexture(thumb);
                continue;
            }

            if(!content[i].IsDownloadedThumbnail){
                content[i].DownloadThumbnail(this._myCharacter, ()=>{
                    var _nowThumb:GameObject = _nowPageGameObject.transform.GetChild( i % this.LoadGestureCount ).gameObject;
                    _nowThumb.SetActive(true);
                    this.SetThumbnailBuffer(i, _nowThumb, this.contentnum, content);
                });
                
            } else{
                var _nowThumb:GameObject = _nowPageGameObject.transform.GetChild( i % this.LoadGestureCount ).gameObject;
                _nowThumb.SetActive(true);
                this.SetThumbnailBuffer(i, _nowThumb, this.contentnum, content);
            }
            
        }

        if(this.lastPageIndex === -1){
            this.lastPageIndex = this.pageIndex + arraynum;
            return;
        }
        //*/
        

    }
    /*
    ReChangeTexture(pageindex:number){
        var _Startindex_last = (this.pageIndex + pageindex) * this.LoadGestureCount;
        // if(_Startindex_last < 0 || this.pageIndex + pageindex >= this.pages.length) return;

        var content = this.ContentArrayIndex(this.contentnum);

        for( let i = _Startindex_last; i<_Startindex_last + this.LoadGestureCount; i ++){
            if(content.length <= i) continue;

            if(content[i] === null || content[i] === undefined){
                break;
            }

            //Destroy 안해주면 프레임 엄청떨어짐! - Gesture 업데이트로 안해줘도댐
            // GameObject.Destroy(content[i].Thumbnail);
            var _thumb = this.pages[this.pageIndex + pageindex].transform.GetChild(i % this.LoadGestureCount).gameObject;
            _thumb.SetActive(false);

            this.ReChangeDetailTexture(_thumb);
        }
    }
    //*/
    ReChangeDetailTexture(_thumb:GameObject){
        _thumb.GetComponent<ThumbnailButton>().isRemoveSet();
    }

    /*
    ChangePoseTexture(){
        var _Startindex = this.posePageIndex * this.LoadGestureCount;
        var _nowPageGameObject = this.pose_pages[this.posePageIndex];

        for (let i = _Startindex; i < _Startindex + this.LoadGestureCount; i++) {
            if(i % this.LoadGestureCount  > _nowPageGameObject.transform.childCount -1){
                continue;
            }

            this._poseContents[i].DownloadThumbnail(this._myCharacter, ()=>{
                var j = i% this.LoadGestureCount;
                
                var _nowThumb:GameObject = _nowPageGameObject.transform.GetChild(j).gameObject;
                this.SetThumbnailBuffer(i, _nowThumb,2, this._poseContents);
            });
            
        }

        if(this.poseLastPageIndex === -1){
            this.poseLastPageIndex = this.posePageIndex;
            return;
        }

        var _Startindex_last =  this.poseLastPageIndex * this.LoadGestureCount;
        var _lastPageGameObject = this.pose_pages[this.poseLastPageIndex];
        for( let i = _Startindex_last; i<_Startindex_last + this.LoadGestureCount; i ++){
            if(this._poseContents[i] === null || this._poseContents[i] === undefined){
                console.log("isNull");
                break;
            }
            console.log("Destroy Before");
            GameObject.Destroy(this._poseContents[i].Thumbnail);
            var _thumb = this.pose_pages[this.poseLastPageIndex].transform.GetChild(i % this.LoadGestureCount).gameObject;
            _thumb.GetComponentInChildren<RawImage>().texture = null;
            // Texture2D.Destroy(this._gestureContents[i].Thumbnail);
            // this._gestureContents[i].Thumbnail. = null;
            // Texture2D.DestroyImmediate(this._gestureContents[i].Thumbnail);
            console.log("Destroy After");
            
        }

        // for(var i = 0; i < this.LoadGestureCount; i++){
        //      _lastPageGameObject.transform.GetChild(j).gameObject;
        // }

        this.poseLastPageIndex = this.posePageIndex;

    }
    *///
    //루프 스크롤바 위치 체크해서 몇번째 페이지에 존재하는 지 체크
    *CheckScrollBar(){
        yield new WaitUntil(()=> this.isReady2 === true);
        this._contentsRectTransform.sizeDelta = new Vector2(0, Mathf.Floor(this.ContentArrayIndex(this.contentnum).length / 2) * 200);

        const wfs = new WaitForSeconds(0.3);
        while(true){
            yield wfs;
            yield new WaitUntil(() => true === this.gestureScroll.activeSelf);

            var ypos:number = Mathf.Round(this._contentsParent.localPosition.y);
            this.pageIndex = Mathf.Max(0, Math.floor((ypos + 40) / 200));

            if(ypos < 0){
                // this._contentsParent.localPosition = Vector3.zero;
                continue;
            }
            if(Mathf.Floor(this.ContentArrayIndex(this.contentnum).length / 2) * 200 < ypos){
                // this._contentsParent.localPosition = new Vector3(0, Mathf.Floor(this.ContentArrayIndex(this.contentnum).length / 2) * 200, 0);
                continue;
            }
            
            if(this.lastPageIndex !== this.pageIndex){
                for(var i = 0;i < 3; ++i){
                    this.ChangeTexture(i);
                }
                //this.ReChangeTexture(-1);
                //this.ReChangeTexture(3);
                this.lastPageIndex = this.pageIndex;
            }
        }
    }
    // 서버로부터 콘텐츠를 받음
    // receive content from the server
    private ContentRequest() {
        //Gesture Type Request
        ZepetoWorldContent.RequestOfficialContentList(OfficialContentType.Gesture, contents => {
            this._gestureContents = contents; //this._gestureContents.length
            this._gestureContents.forEach(content =>{
                if(true === content.Keywords.includes(OfficialContentType.GestureDancing)) this._gesture_DanceContent.push(content);
                if(true === content.Keywords.includes(OfficialContentType.GestureDenial)) this._gesture_DenialContent.push(content);
                if(true === content.Keywords.includes(OfficialContentType.GestureAffirmation)) this._gesture_AffirmationContent.push(content);
                if(true === content.Keywords.includes(OfficialContentType.GestureGreeting)) this._gesture_GreetingContent.push(content);
            })

            this.isReady = true;
        });

        ZepetoWorldContent.RequestOfficialContentList(OfficialContentType.Pose, contents => {
            this._poseContents = contents; //this._gestureContents.length

            this.isPoseReady = true;
        });
    }

    private SetThumbnailBuffer(thumbnail_index:number, _thumb:GameObject, _typenum:number, contents:Content[]){
        var content = contents[thumbnail_index];//this._gestureContents[thumbnail_index];
        if(_typenum === 7){ 
            var numbering = this._saveFavorotes[thumbnail_index];
            _typenum = Mathf.Floor(numbering / 1000); 
            thumbnail_index = this.ContentArrayIndex(_typenum).length - ( numbering - _typenum * 1000 );
        }
        var _type;

        switch(_typenum){
            case 1: _type = OfficialContentType.Gesture; break;
            case 2: _type = OfficialContentType.Pose; break;
            case 3: _type = OfficialContentType.GestureDancing; break;
            case 4: _type = OfficialContentType.GestureAffirmation; break;
            case 5: _type = OfficialContentType.GestureDenial; break;
            case 6: _type = OfficialContentType.GestureGreeting; break;
        }

        var thumbnailbut = _thumb.GetComponent<ThumbnailButton>();
        if(thumbnailbut._texture.texture === content.Thumbnail) return;

        var p = _typenum * 1000 + ( this.ContentArrayIndex(_typenum).length - thumbnail_index);
        var isOn = this._saveFavorotes.indexOf(p) === -1 ? false : true;
        thumbnailbut.ButtonSetting(thumbnail_index, _typenum, _type, isOn, content);

    }

    /*
    private ReUseTunbnailObject(gestureIndex:number, gestureType:OfficialContentType, _thumb:GameObject){
        var content;
        if (gestureType == OfficialContentType.Gesture) {
            content = this._gestureContents[gestureIndex];
        }
        else if (gestureType == OfficialContentType.Pose) {
            content = this._poseContents[gestureIndex];
        }

        var _button =_thumb.GetComponent<Button>();
        _button.onClick.RemoveAllListeners();
        _button.onClick.AddListener(()=>{
            if (SimpleRideManager_Multy.myInstance.isSimpleRide == false && 
                SimpleRideManager.myInstance.isSimpleRide == false && 
                SimpleRideManager_Multy.myInstance.isSimpleRide === false && 
                ChairManager.myInstance.isSeat == false && 
                GestureManager.myInstance.isplayable == false && 
                GestureManager.myInstance.isGestureLoop == false) 
            {
                this.SendMyGesture(gestureIndex,gestureType);
                
                if(GestureManager.myInstance.isPlayGesture == false){
                    GestureManager.myInstance.isPlayGesture = true;
                }

            } else {
                MessageManager.myInstance.SetOkMessage(137);
                MessageManager.myInstance.OnOkMessage();
            }
        });
        // _thumb.GetComponentInChildren<RawImage>().texture = content.Thumbnail as Texture2D;
        
        _thumb.GetComponentInChildren<RawImage>().texture = content.Thumbnail;
        _thumb.GetComponentInChildren<Text>().text = content.Title;
               if(gestureType == OfficialContentType.Pose) {
            this._poseObj.push(_thumb);
        }
        else(gestureType == OfficialContentType.Gesture)
            this._gestureObj.push(_thumb);
    }
    private CreateThumbnailObjcet(gestureIndex:number, gestureType:OfficialContentType){
        var content;
        if (gestureType == OfficialContentType.Gesture) {
            content = this._gestureContents[gestureIndex];
        }
        else if (gestureType == OfficialContentType.Pose) {
            content = this._poseContents[gestureIndex];
        }
        if(gestureIndex % this.LoadGestureCount == 0){
            var newPage: GameObject = GameObject.Instantiate(this._prefPage, this._contentsParent) as GameObject;
            this.nowPage = newPage;
            this.pages.push(newPage);

        }
        var newThumb : GameObject = GameObject.Instantiate(this._prefThumb, this.nowPage.transform) as GameObject;       
        // 각 썸네일의 버튼 리스너       // Button Listener for each thumbnail
        newThumb.GetComponent<Button>().onClick.AddListener(() => {
            if (SimpleRideManager_Multy.myInstance.isSimpleRide == false &&
                SimpleRideManager.myInstance.isSimpleRide == false && 
                SimpleRideManager_Multy.myInstance.isSimpleRide === false && 
                ChairManager.myInstance.isSeat == false && 
                GestureManager.myInstance.isplayable == false && 
                GestureManager.myInstance.isGestureLoop == false) 
            {
                this.SendMyGesture(gestureIndex,gestureType);


            } else {
                MessageManager.myInstance.SetOkMessage(137);
                MessageManager.myInstance.OnOkMessage();
            }
        });
        // newThumb.GetComponentInChildren<RawImage>().texture = content.Thumbnail as Texture2D;

        newThumb.GetComponentInChildren<RawImage>().texture = content.Thumbnail;
        newThumb.GetComponentInChildren<Text>().text = content.Title;
               if(gestureType == OfficialContentType.Pose) {
            this._poseObj.push(newThumb);
        }
        else(gestureType == OfficialContentType.Gesture)
            this._gestureObj.push(newThumb);
    }
    //*/
    public SendMyFigureGesture(){        
        for(var i= 0; i <this._gestureContents.length; i++){
            if("ZW_GESTURE_022" === this._gestureContents[i].Id){
                // gestureIndex = i;
                // console.log("Test123123123: " + this._gestureContents[i].AnimationClip.name);
                if (!this._gestureContents[i].IsDownloadedAnimation) {
                    // If the animation has not been downloaded, download it.
                    this._gestureContents[i].DownloadAnimation(() => {
                        // play animation clip
                        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.SetGesture(this._gestureContents[i].AnimationClip);
                    });
                }  
                else {  
                    ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.SetGesture(this._gestureContents[i].AnimationClip);
        
                }

                // ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.SetGesture(this._gestureContents[i].AnimationClip);
                break;
            } 
        }

        this.room.Send("HideCharacter_FigureEnding", "");
    }

    public LoadMyGesture(_str:string){
        for(var i= 0; i <this._gestureContents.length; i++){
            if(_str === this._gestureContents[i].Id){
                if (!this._gestureContents[i].IsDownloadedAnimation) {
                    this._gestureContents[i].DownloadAnimation(() => {
                        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.SetGesture(this._gestureContents[i].AnimationClip);
                    });
                }  
                else {  
                    ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.SetGesture(this._gestureContents[i].AnimationClip);
        
                }
                break;
            } 
        }
    }

    //첫 로드 시 start에서 선언 필요.
    public LoadAnimationClip(_str:string,_character:ZepetoCharacter){
        var content = this._gestureContents.find(element => element.Id === _str);
        if(false === content.IsDownloadedAnimation){
            content.DownloadAnimation(() => {
                _character.SetGesture(content.AnimationClip);
            });
        }
        else{
            _character.SetGesture(content.AnimationClip);
        }

    }

    public LoadAnimationClip_Pose(_str:string,_character:ZepetoCharacter){
        var content = this._poseContents.find(element => element.Id === _str);
        if(false === content.IsDownloadedAnimation){
            content.DownloadAnimation(() => {
                _character.SetGesture(content.AnimationClip);
            });
        }
        else{
            _character.SetGesture(content.AnimationClip);
        }

    }

    

    public SendCancleFigureGesture(){

        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.CancelGesture();
        SimpleRideManager.myInstance.CancelRideSimpleCar(SimpleRideManager.myInstance.room.SessionId);
        SimpleRideManager_Multy.myInstance.isSimpleRide === true ?
            SimpleRideManager_Multy.myInstance.CancelCar_Multy(SimpleRideManager_Multy.myInstance.selectCarID, SimpleRideManager_Multy.myInstance.selectSeatnum, SimpleRideManager_Multy.myInstance.room.SessionId) : null;



        SimpleRideManager.myInstance.RideSimpleCar(SimpleRideManager.myInstance.room.SessionId, 0 , true, FigureManager.myInstance._figureLevel);

    }

    public SendMyGesture(gestureIndex: number, gestureType:OfficialContentType) {
        const data = new RoomData();
        var isloop = gestureType === OfficialContentType.Pose ? true : this.isloopGesture;
        data.Add("gestureIndex",gestureIndex);
        data.Add("gestureType",gestureType);
        data.Add("gestureloop", isloop);
        this.room.Send("OnChangeGesture", data.GetObject());
    }

    private LoadAnimation(playerGestureInfo:PlayerGestureInfo) {
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(playerGestureInfo.sessionId).character;
        var content;

        if (playerGestureInfo.gestureIndex == CancelMotion) {
            zepetoPlayer.CancelGesture();
            return;
        }
        else if(playerGestureInfo.gestureType == OfficialContentType.Gesture) { content = this._gestureContents[playerGestureInfo.gestureIndex]; }
        else if(playerGestureInfo.gestureType == OfficialContentType.Pose) { content = this._poseContents[playerGestureInfo.gestureIndex]; }
        else if(playerGestureInfo.gestureType == OfficialContentType.GestureDancing) { content = this._gesture_DanceContent[playerGestureInfo.gestureIndex]; }
        else if(playerGestureInfo.gestureType == OfficialContentType.GestureAffirmation) { content = this._gesture_AffirmationContent[playerGestureInfo.gestureIndex]; }
        else if(playerGestureInfo.gestureType == OfficialContentType.GestureDenial) { content = this._gesture_DenialContent[playerGestureInfo.gestureIndex]; }
        else if(playerGestureInfo.gestureType == OfficialContentType.GestureGreeting) { content = this._gesture_GreetingContent[playerGestureInfo.gestureIndex]; }
        console.log("GestureIndex: " + content.Id);
    
        var gesturetype = this.ContentArrayEnum(playerGestureInfo.gestureType);
        var id = gesturetype * 1000 + (this.ContentArrayIndex(gesturetype).length - playerGestureInfo.gestureIndex);

        if(zepetoPlayer.ZepetoAnimator.GetInteger("PlayGesture") !== id){
            zepetoPlayer.CancelGesture();
            return;
        }

        zepetoPlayer.ZepetoAnimator.SetInteger("PlayGesture", id); 


        // Verify animation load
        if (!content.IsDownloadedAnimation) {
            // If the animation has not been downloaded, download it.
            content.DownloadAnimation(() => {
                // play animation clip
                // content.AnimationClip.wrapMode = playerGestureInfo.gestureloop === true ? WrapMode.Loop : WrapMode.Once;

                this.StartCoroutine(this.loopPlayGesture(content.AnimationClip, zepetoPlayer, playerGestureInfo, playerGestureInfo.gestureloop));
            });
        }  
        else {  
            // content.AnimationClip.wrapMode = playerGestureInfo.gestureloop === true ? WrapMode.Loop : WrapMode.Once;
            
            this.StartCoroutine(this.loopPlayGesture(content.AnimationClip, zepetoPlayer, playerGestureInfo, playerGestureInfo.gestureloop));
        }   
    }

    *loopPlayGesture(clip:AnimationClip, character:ZepetoCharacter, playerinfo:PlayerGestureInfo, loop:bool){
        character.SetGesture(clip);

        var gesturetype = this.ContentArrayEnum(playerinfo.gestureType);
        var id = gesturetype * 1000 + (this.ContentArrayIndex(gesturetype).length - playerinfo.gestureIndex);

        var t:number = 0;
        while(t < clip.length){
            yield null;
            t += Time.deltaTime;
            if(id !== ZepetoPlayers.instance.GetPlayer(playerinfo.sessionId).character.ZepetoAnimator.GetInteger("PlayGesture")) return;
        }

        if(loop === true) {
            if(0 === character.ZepetoAnimator.GetInteger("PlayGesture")){
                return;
            }
            this.LoadAnimation(playerinfo);
        } 
        else if(loop === false) { 
            if(0 === character.ZepetoAnimator.GetInteger("PlayGesture")){
                return;
            }
            character.ZepetoAnimator.SetInteger("PlayGesture", 0);
            character.CancelGesture(); 
        } 
    }

    public StopGesture() {
        this.SendMyGesture(CancelMotion,OfficialContentType.Gesture); 
    }


    // Category Toggle UI Set
    private SetCategoryUI(category: OfficialContentType, isToggle?:bool) {

        if((isToggle === undefined || isToggle === false) && this._favoritesToggle.isOn === true){
            this._favoritesToggle.isOn = false;
        }

        this.ReleaseContent(this.ContentArrayIndex(this.contentnum));
        var num:number = 1;

        switch(category){
            case OfficialContentType.Gesture: num = 1; break;
            case OfficialContentType.Pose: num = 2; break;
            case OfficialContentType.GestureDancing: num = 3; break;
            case OfficialContentType.GestureAffirmation: num = 4; break;
            case OfficialContentType.GestureDenial: num = 5; break;
            case OfficialContentType.GestureGreeting: num = 6; break;
            case OfficialContentType.All: num = 7; break;
        }

        
        if(category !== OfficialContentType.All){ this.savecontent = category; }

        this._contentsParent.localPosition = Vector3.zero;
        this._contentsRectTransform.sizeDelta = new Vector2(0, Mathf.Floor(this.ContentArrayIndex(num).length / 2) * 200);
        this.contentnum = num;
        this.lastPageIndex = -1;
        // this.contentnum = category;

        // if (category == OfficialContentType.All) {
        //     this._gestureObj.forEach((Obj) => Obj.SetActive(true));
        //     this._poseObj.forEach((Obj) => Obj.SetActive(true));
        // }
        // else if (category == OfficialContentType.Gesture) {
        //     // this._gestureObj.forEach((Obj) => Obj.SetActive(true));
        //     // this._poseObj.forEach((Obj) => Obj.SetActive(false));
        //     if(false === this.isPose){
        //         return;
        //     }
        //     this.isPose = false;
        //     this.gestureScroll.gameObject.SetActive(true);

        //     this.poseScroll.gameObject.SetActive(false);
        // }
        // else if (category == OfficialContentType.Pose) {
        //     // this._gestureObj.forEach((Obj) => Obj.SetActive(false));
        //     // this._poseObj.forEach((Obj) => Obj.SetActive(true));
        //     if(true === this.isPose){
        //         return;
        //     }
        //     this.isPose = true;
        //     this.gestureScroll.gameObject.SetActive(false);
            
        //     this.poseScroll.gameObject.SetActive(true);


        // }
    }

    private ReleaseContent(contentArr:Content[]){
        // for(var i = 0; i<contentArr.length;++i){
        //     if(contentArr[i] === null || contentArr[i] === undefined) continue;
        //     GameObject.Destroy(contentArr[i].Thumbnail);
        // }
        for(var i = 0; i < this._thumbnailButton.length;++i){
            this._thumbnailButton[i].isRemoveSet();
        }
    }

    private ContentArrayIndex(num:number):Content[]{
        switch(num){
            case 1: return this._gestureContents; 
            case 2: return this._poseContents; 
            case 3: return this._gesture_DanceContent;
            case 4: return this._gesture_AffirmationContent;
            case 5: return this._gesture_DenialContent; 
            case 6: return this._gesture_GreetingContent; 
            case 7: return this._FavoritesContents; 
        }
        return null;
    }
    private ContentArrayEnum(num:number):number{
        switch(num){
            case OfficialContentType.Gesture: return 1;
            case OfficialContentType.Pose: return 2;
            case OfficialContentType.GestureDancing: return 3;
            case OfficialContentType.GestureAffirmation: return 4;
            case OfficialContentType.GestureDenial: return 5;
            case OfficialContentType.GestureGreeting: return 6;
            case OfficialContentType.All: return 7; break;
        }
        return 0;
    }

    public SaveFavorites_Toggle(_thumbnail_index:number, _typenum:number){
        var p = _typenum * 1000 + ( this.ContentArrayIndex(_typenum).length - _thumbnail_index);

        if(this._saveFavorotes.indexOf(p) === -1){
            this._saveFavorotes.push(p);
            this._FavoritesContents.push(this.ContentArrayIndex(_typenum)[_thumbnail_index]);
            this.room.Send("SaveFavorites", p);                                      
        } 
    }
    public DeleteFavorites_Toggle(_thumbnail_index:number, _typenum:number){
        var p = _typenum * 1000 + ( this.ContentArrayIndex(_typenum).length - _thumbnail_index);

        var indexnum = this._saveFavorotes.indexOf(p);
        var indexcon = this._FavoritesContents.indexOf(this.ContentArrayIndex(_typenum)[_thumbnail_index]);
        if(indexnum !== -1 && indexcon !== -1){
            this._saveFavorotes.splice(indexnum, 1);
            this._FavoritesContents.splice(indexcon, 1);
            this.room.Send("DeleteFavorites", p);
        }
    }

    private ChangeDropdownString(){
        // for(var i = 0;i< this._gesturedropdown.options.length;++i){
        //     this._gesturedropdown.options[i].text = GetTextTable.myInstance.UImap[369 + i];
        // }
    }

    public GetContentBuffer(contentenum:number, id:string):Content{
        var num = this.ContentArrayEnum(contentenum);
        var contents = this.ContentArrayIndex(num);

        var content = contents.find(element => element.Id === id);
        if(false == content.IsDownloadedThumbnail){
            content.DownloadThumbnail(this._myCharacter, () => {
            });
        }
        return content;

    }

}