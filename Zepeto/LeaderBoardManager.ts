import { GameObject, Input, KeyCode, Mathf, Rect, RectTransform, Sprite, Texture, Texture2D, Vector2, WaitUntil , Resources } from 'UnityEngine';
import { UnityEvent, UnityEvent$1} from 'UnityEngine.Events';
import { Button, Image, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GetRangeRankResponse, LeaderboardAPI, ResetRule, SetScoreResponse } from 'ZEPETO.Script.Leaderboard';
import { ZepetoWorldHelper } from 'ZEPETO.World';
import CanvasChoice from './CanvasChoice';
import MainMenuButton from './MainMenuButton';

export default class LeaderBoardManager extends ZepetoScriptBehaviour {
    static SetLeaderBoard:UnityEvent$1<int> = new UnityEvent$1<int>();
    static SetlevelLeaderBoard:UnityEvent$1<int> = new UnityEvent$1<int>();


    public leaderboardId: string;
    public leaderboardId_bucketplay:string;
    public leaderboardId_pinokio: string;

    public levelboardId: string;
    public levelboardId_bucketplay:string;
    public levelboardId_pinokio: string;
    public isPINOKIO:bool;


    public startRank:number;
    public endRank:number;
    private resetRule:ResetRule;
    private levelResetRule:ResetRule;

    private myRank_id:string;
    private myRank_rank:number;
    private myRank_name:string;
    private myRank_score:number;

    myRank_rank_Text:Text;
    myRank_rank_th_Text:Text;
    myRank_name_Text:Text;
    myRank_score_Text:Text;
    myRank_score_Icon:Image;
    myRank_profile:Image;


    RankDatas:rankData[];
    ranklistImage:Image[];
    ranklistRanking:Text[];
    ranklistName:Text[];
    ranklistScore:Text[];
    ranklistScoreIcon:Image[];
    isSetProfile:bool;


    isInstantiate:bool;
    ranklistArray:GameObject[];

    leaderboardButton:Button;
    guide_Button:Button;
    leaderboard_popup:GameObject;

    category_score_text:Text;
    isStarLeaderBoard:bool;

    level_button:Button;
    level_selected:GameObject;
    star_button:Button;
    star_selected:GameObject;
    
    scroll_pos:RectTransform;

    cancel_button:Button;

    public static myInstance: LeaderBoardManager;

    public static Instacne():LeaderBoardManager{
        if(null === this.myInstance || undefined === this.myInstance){
            return null;
        }
        return this.myInstance;
    }

    private Awake(){
        if(null == LeaderBoardManager.myInstance || undefined === LeaderBoardManager.myInstance){
            LeaderBoardManager.myInstance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    Start() {

        // LeaderBoardManager.SetLeaderBoard.AddListener((num)=> LeaderboardAPI.SetScore(this.leaderboardId, num, this.OnResult, this.OnError));
        this.StartCoroutine(this.SetLeaderBoard());
        this.resetRule = 2;
        this.levelResetRule = 0;
        this.isInstantiate = false;
        this.isSetProfile = false;
        this.isStarLeaderBoard = false;
        // this.ranklistArray = [];
        // this.ranklistImage = [];
        // this.ranklistRanking = [];
        // this.ranklistName = [];
        // this.ranklistScore = [];
        this.RankDatas = [];
        this.ranklistScoreIcon = [];
        this.myRank_score_Icon = this.myRank_score_Text.transform.GetChild(0).GetComponent<Image>();

        for(var i = 0; i<this.ranklistScore.length;i++){
            this.ranklistScoreIcon.push(this.ranklistScore[i].transform.GetChild(0).GetComponent<Image>());
        }
        this.RankRefresh();

        this.leaderboardButton.onClick.AddListener(()=>{
            this.RankRefresh();
        })
        
        this.guide_Button.onClick.AddListener(()=>{
            CanvasChoice.myInstance.category_buttons[1].onClick.Invoke();
            CanvasChoice.myInstance.GuideObject.SetActive(true);  
        })

        this.level_selected.SetActive(true);
        this.star_selected.SetActive(false);

        this.level_button.onClick.AddListener(()=>{
            if(false === this.isStarLeaderBoard){
                return;
            }
            Resources.UnloadUnusedAssets();
            this.isStarLeaderBoard = false;
            this.level_selected.SetActive(true);
            this.star_selected.SetActive(false);
            this.RankRefresh();
        })

        this.star_button.onClick.AddListener(()=>{
            if(true === this.isStarLeaderBoard){
                return;
            }
            Resources.UnloadUnusedAssets();
            this.isStarLeaderBoard = true;
            this.level_selected.SetActive(false);
            this.star_selected.SetActive(true);
            this.RankRefresh();
        })
        this.cancel_button.onClick.AddListener(()=>{
            Resources.UnloadUnusedAssets();
        })
    }   
    
    SetLeaderBoardID(){
        if(true === this.isPINOKIO){
            this.leaderboardId = this.leaderboardId_pinokio;
            this.levelboardId = this.levelboardId_pinokio;
        }else{
            this.leaderboardId = this.leaderboardId_bucketplay;
            this.levelboardId = this.levelboardId_bucketplay;
        }

        console.log("Leader: " + this.leaderboardId);


    }

    *SetLeaderBoard(){
        this.leaderboardId = null;

        if(this.leaderboardId === undefined){
            console.log("Leader1: " + this.leaderboardId);
        }
        if(this.leaderboardId === null || this.leaderboardId === undefined || this.levelboardId === null || this.levelboardId === undefined){
            this.SetLeaderBoardID();
            yield new WaitUntil(()=> null !== this.leaderboardId ||  undefined !== this.leaderboardId);
            console.log("Leader2: " + this.leaderboardId);
            yield new WaitUntil(()=> null !== this.levelboardId || undefined !== this.levelboardId);
            console.log("levelLeader2: " + this.levelboardId);


        }
        LeaderBoardManager.SetLeaderBoard.AddListener((num)=> LeaderboardAPI.SetScore(this.leaderboardId, num, this.OnResult, this.OnError));
        LeaderBoardManager.SetlevelLeaderBoard.AddListener((num)=> LeaderboardAPI.SetScore(this.levelboardId, num, this.OnResult, this.OnError));
    }



    OnResult(result: SetScoreResponse) {
    }
  
    OnError(error: string) {
        console.error(error);
    }



    OnGetResult(result:GetRangeRankResponse){
        if (result.rankInfo.myRank) {
            // console.log(`member: ${result.rankInfo.myRank.member}, rank: 
            // ${result.rankInfo.myRank.rank}, score: ${result.rankInfo.myRank.score}, name: 
            // ${result.rankInfo.myRank.name}`);
            LeaderBoardManager.myInstance.myRank_id = result.rankInfo.myRank.member;
            LeaderBoardManager.myInstance.myRank_rank = result.rankInfo.myRank.rank;
            LeaderBoardManager.myInstance.myRank_name = result.rankInfo.myRank.name;
            LeaderBoardManager.myInstance.myRank_score = result.rankInfo.myRank.score;
        }
        if (result.rankInfo.rankList) {
            LeaderBoardManager.myInstance.RankDatas = [];
            var _count:number = 20;
            if(result.rankInfo.rankList.length < 20){
                _count = result.rankInfo.rankList.length;
            }
            console.log("RankTest:" + result.rankInfo.rankList.length);
            for (let i = 0; i < _count; ++i) {
                var rank = result.rankInfo.rankList[i];
                // console.log(`i: ${i}, member: ${rank.member}, rank: ${rank.rank}, score: 
                //     ${rank.score}, name: ${rank.name}`);
                LeaderBoardManager.myInstance.RankDatas.push(new rankData(rank.member, rank.rank , rank.score , rank.name));
            }
            var _rank = 1;
            var _score = LeaderBoardManager.myInstance.RankDatas[0]._score;
            LeaderBoardManager.myInstance.RankDatas.forEach(x=>{
                if(_score === x._score){
                    x._rank = _rank;
                }else{
                    _rank = x._rank;
                    _score = x._score;
                }
            })
            var  _my_data =LeaderBoardManager.myInstance.RankDatas.find(x=> x._id === LeaderBoardManager.myInstance.myRank_id);
            if((null !== _my_data) && (undefined !== _my_data)){
                LeaderBoardManager.myInstance.myRank_rank = _my_data._rank;
            }
            LeaderBoardManager.myInstance.isSetProfile = true;
        }else{
            LeaderBoardManager.myInstance.RankDatas = [];
            LeaderBoardManager.myInstance.isSetProfile = true;
        }
    }

    SetRanklist_Image_other(i:number){
        ZepetoWorldHelper.GetProfileTexture(LeaderBoardManager.myInstance.RankDatas[i]._id,(texture:Texture)=>{
            LeaderBoardManager.myInstance.ranklistImage[i].sprite = LeaderBoardManager.myInstance.GetSprite(texture);
            
        },(error)=>{

            console.log(error);

        });
    }

    *SetRankList_All(){
        yield new WaitUntil(()=>this.isSetProfile === true);
        
        for(var i = this.RankDatas.length; i<20;i++){
            this.ranklistArray[i].SetActive(false);
        }

        for(var i =0; i< this.RankDatas.length; i++){
            // console.log("test: " + this.RankDatas[i]._id);
            this.SetRanklist_Text(i, this.RankDatas);
            this.SetRanklist_Image_other(i);
            this.ranklistArray[i].SetActive(true);
            var _scoress = this.RankDatas[i]._score + 2;
            var _index = Mathf.FloorToInt((this.RankDatas[i]._score + 2) / 10);
            var _icon_name = true == this.isStarLeaderBoard ? "icon_credit_star" : "icon_level_" + _index;
            MainMenuButton.myInstance.ButtonLoadTexture(_icon_name,this.ranklistScoreIcon[i]);
            // this.ranklistScoreIcon[i].gameObject.SetActive(this.isStarLeaderBoard);
        }

        ZepetoWorldHelper.GetProfileTexture(LeaderBoardManager.myInstance.myRank_id, (texture:Texture)=>{
            LeaderBoardManager.myInstance.myRank_profile.sprite = LeaderBoardManager.myInstance.GetSprite(texture);
        }, (error)=>{
            console.log(error);
        })

        this.myRank_name_Text.text = this.myRank_name;
        this.myRank_rank_Text.text = this.myRank_rank.toString();
        if(this.myRank_rank%10 == 1 && this.myRank_rank %100 != 11){
            this.myRank_rank_th_Text.text = "st";
        }else if (this.myRank_rank%10 == 2 && this.myRank_rank % 100 != 12){
            this.myRank_rank_th_Text.text = "nd";
            
        }else if (this.myRank_rank%10 == 3 && this.myRank_rank% 100 != 13){
            this.myRank_rank_th_Text.text = "rd";

        }else{
            this.myRank_rank_th_Text.text = "th";

        }
        
        var _score = true == this.isStarLeaderBoard ? "" + this.myRank_score.toString() : "LV " + (this.myRank_score + 2).toString();
        this.myRank_score_Text.text = _score;
        var _index = Mathf.FloorToInt((this.myRank_score + 2) / 10);
        var _icon_name = true == this.isStarLeaderBoard ? "icon_credit_star" : "icon_level_" + _index;
        // this.myRank_score_Icon.gameObject.SetActive(this.isStarLeaderBoard);
        MainMenuButton.myInstance.ButtonLoadTexture(_icon_name,this.myRank_score_Icon);
    }

    SetRanklist_Text(_index:number, _rankdata:rankData[]){
        // this.ranklistRanking[_index].text = _rankdata[_index]._rank.toString();
        var _rank = _rankdata[_index]._rank.toString();
        if(1 === _rankdata[_index]._rank){
            _rank += "st";
        }else if(2 === _rankdata[_index]._rank){
            _rank += "nd";
        }else if(3 === _rankdata[_index]._rank){
            _rank += "rd";
        }else{
            _rank += "th";
        }
        this.ranklistRanking[_index].text = _rank;
        this.ranklistName[_index].text = _rankdata[_index]._name;
        var _score = true == this.isStarLeaderBoard ? "" + _rankdata[_index]._score.toString() : "LV " + (_rankdata[_index]._score+ 2).toString();
        this.ranklistScore[_index].text = _score;
    }

    RankRefresh(){
        if(this.leaderboardId == null || this.leaderboardId === undefined){
            this.SetLeaderBoardID();
        }

        this.scroll_pos.offsetMax = new Vector2(this.scroll_pos.offsetMax.x,0);

        this.isSetProfile = false;

        var _leaderboard_id = this.levelboardId;
        var _reset_rule = this.levelResetRule;
        if(true === this.isStarLeaderBoard){
            _leaderboard_id = this.leaderboardId;
            _reset_rule =  this.resetRule;
        }
        // LeaderboardAPI.GetRangeRank(this.leaderboardId, this.startRank, this.endRank, 
        //     this.resetRule ,false ,this.OnGetResult, this.OnError);
        this.category_score_text.text = true == this.isStarLeaderBoard ? "SCORE" : "LEVEL";
        LeaderboardAPI.GetRangeRank(_leaderboard_id, this.startRank, this.endRank, 
            _reset_rule ,false ,this.OnGetResult, this.OnError);
        this.StartCoroutine(this.SetRankList_All());
    }

    GetSprite(texture:Texture){

        let rect:Rect = new Rect(0, 0, texture.width, texture.height);

        return Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));

    }
}


class rankData{
    _id:string;
    _rank:number;
    _score:number;
    _name:string;

    constructor(i:string, r:number , s:number , n:string){
        this._id = i;
        this._rank = r;
        this._score = s;
        this._name = n;
    }
}