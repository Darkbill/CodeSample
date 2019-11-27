using GlobalDefine;
using System.Collections.Generic;
using UnityEngine;

public class SkillSupporterIsLightning : Skill
{
    #region SkillSetting
    enum eSupporterIsLightningSkillOption
    {
        Damage,
        CoolTime,
        AttackSpeed,
        SkillEndTime,
    }
    private float damage;
    private float attackspeed;
    private float skillendtime;
    public override void SkillSetting()
    {
        skillID = 15;
        PlayerSkillData skillData = JsonMng.Ins.playerSkillDataTable[skillID];
        damage = skillData.optionArr[(int)eSupporterIsLightningSkillOption.Damage];
        cooldownTime = skillData.optionArr[(int)eSupporterIsLightningSkillOption.CoolTime];
        attackspeed = skillData.optionArr[(int)eSupporterIsLightningSkillOption.AttackSpeed];
        skillendtime = skillData.optionArr[(int)eSupporterIsLightningSkillOption.SkillEndTime];
        delayTime = cooldownTime;
        gameObject.SetActive(false);
    }

    public override void SetItemBuff(eSkillOption optionType, float changeValue)
    {
        switch (optionType)
        {
            case eSkillOption.Damage:
                damage += damage * changeValue;
                break;
            case eSkillOption.CoolTime:
                cooldownTime -= cooldownTime * changeValue;
                break;
			case eSkillOption.Speed:
				attackspeed += attackspeed * changeValue;
				break;
			case eSkillOption.ActiveTime:
				skillendtime += skillendtime * changeValue;
				break;
        }
    }
    public override void SetBullet()
    {
        foreach(SupporterIsLightning o in supporter)
            o.Setting(skillID, damage, attackspeed, skillendtime);
    }
    public override void OffSkill()
    {
        foreach (SupporterIsLightning o in supporter)
            o.gameObject.SetActive(false);
    }
    #endregion

    //스킬을 담은 리스트. 해당 클래스는 이 스킬 리스트를 관리해준다.
    public List<SupporterIsLightning> supporter = new List<SupporterIsLightning>();

    //호출 순서는 ActiveSkill - OnButtonDown - OnDrag - OnDrop이다.
    //스킬을 실행하고 클릭했을 때 실행
    public override void OnButtonDown()
    {
        //에임을 표시.
        GameMng.Ins.SetSkillAim(skillID);
    }
    //스킬을 실행했을 때 처음에 한번 호출.
    public override void ActiveSkill()
    {
        base.ActiveSkill();
    }
    //스킬을 실행하고 드래그 할 때 호출.
    public override void OnDrag()
    {
        base.OnDrag();
    }
    //스킬을 실행하고 손을 뗐을 대 호출
    public override void OnDrop()
    {
        base.OnDrop();
        //스킬이 실행되는 중에 쿨타임이 돌아왔을 때 스킬을 하나 더 생성하여 리스트에 삽입시켜준다.
        for(int i = 0;i<supporter.Count;++i)
        {
            if (supporter[i].gameObject.activeSelf) continue;
            supporter[i].SystemSetting(Camera.main.ScreenToWorldPoint(Input.mousePosition));
            return;
        }

        SupporterIsLightning o = Instantiate(supporter[0], GameMng.Ins.skillMng.transform);
        supporter.Add(o);
		o.Setting(skillID, damage, attackspeed, skillendtime);
		o.SystemSetting(Camera.main.ScreenToWorldPoint(Input.mousePosition));
    }
    //안드로이드 플랫폼의 경우 클릭한 위치를 월드변환으로 변환시켜준다.
    public override void OnDrop(Vector2 pos)
    {
        base.OnDrop();
        Vector3 mousePos = Camera.main.ScreenToWorldPoint(pos);
        mousePos = new Vector3(mousePos.x, mousePos.y, 0);
        for (int i = 0; i < supporter.Count; ++i)
        {
            if (supporter[i].gameObject.activeSelf) continue;
            supporter[i].SystemSetting(mousePos);
            return;
        }

        SupporterIsLightning o = Instantiate(supporter[0], GameMng.Ins.skillMng.transform);
        supporter.Add(o);
        o.Setting(skillID, damage, attackspeed, skillendtime);
        o.SystemSetting(Camera.main.ScreenToWorldPoint(pos));
    }
    private void Update()
    {
        delayTime += Time.deltaTime;
    }
}
