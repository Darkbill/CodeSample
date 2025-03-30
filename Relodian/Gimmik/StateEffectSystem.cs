using Photon.Deterministic;
using Quantum.Collections;
using System.Collections.Generic;
using UnityEngine.Scripting;

namespace Quantum
{
    public unsafe class StateEffectSystem : SystemMainThread, ISignalOnRegistStateEffect, ISignalOnAttackStateEffect,
          ISignalOnRobotDeath, ISignalOnRegistStateEffect2, ISignalOnGameEnded
    {
        [Preserve]
        //게임 종료 시 해당캐릭터에 등록된 StateEffect들 삭제.
        //다른 방법으로 다음씬으로 넘어갈 때 일부 효과들은 그대로 넘어가므로 주의( ex - AddStatus )
        void ISignalOnGameEnded.OnGameEnded(Frame frame, GameController* gameController)
        {
            var _filter = frame.Filter<StateEffectFields>();
            while (_filter.NextUnsafe(out var entity, out var stateEffectFields))
            {
                var updateEffect = frame.ResolveList(stateEffectFields->UpdateEffect_Index);
                for (var i = 0; i < updateEffect.Count; i++)
                {
                    var _state = updateEffect.GetPointer(i);
                    AssetLoadExtension.TryGetSpec<StateEffectListConfig>(frame, stateEffectFields->effectListConfig.Id, out var config);
                    StateEffectConfig effect = config.Collectibles[_state->index];
                    effect.End_StateEffect(frame, entity, _state->index, _state);
                    //updateEffect.Remove(*_state);
                }
                updateEffect.Clear();
            }
            frame.SystemDisable<StateEffectSystem>();
        }

        public override void Update(Frame f)
        {
            var _filter = f.Filter<StateEffectFields, Status>();
            while (_filter.NextUnsafe(out var entity, out var stateEffectFields, out var status))
            {
                //status
                StateChangeHelper.ResetAddStatus_effect(f, entity);
                var updateEffect = f.ResolveList(stateEffectFields->UpdateEffect_Index);
                AssetLoadExtension.TryGetSpec<StateEffectListConfig>(f, stateEffectFields->effectListConfig.Id, out var config);

                for (var i = 0; i < updateEffect.Count; i++)
                {
                    var state = updateEffect[i];
                    var _state = updateEffect.GetPointer(i);
                    StateEffectConfig effect = config.Collectibles[_state->index];
                    //캐릭터에 변수가 생겨 삭제할 경우,
                    if (true == effect.CheckDestroy(f, entity, effect))
                    {
                        effect.End_StateEffect(f, entity, state.index, _state);
                        updateEffect.Remove(*_state);
                        continue;
                    }
                    effect.Update_StateEffect(f, entity, _state);
                    //영구지속형 버프 체크
                    if (true == effect.isNonDestroy)
                    {
                        continue;
                    }
                    
                    //해당 버프의 지속시간이 되어서 삭제할 경우,
                    if (_state->timer + _state->stat.value.time_duration < f.ElapsedTime)
                    {
                        effect.End_StateEffect(f, entity, state.index, _state);
                        updateEffect.Remove(*_state);
                        continue;
                    }
                }
            }
        }

        public void OnRegistStateEffect(Frame f, EntityRef caster, EntityRef target, int _index, StateEffectData data)
        {
            SetRegistStateEffect(f, caster, target, _index, data);
        }

        void SetRegistStateEffect(Frame f, EntityRef caster, EntityRef target, int _index, StateEffectData data)
        {
            //해당 Asset에 등록된 StateEffect들 정보 가져오기
            AssetLoadExtension.TryGetSpec<StateEffectListConfig>(f, 1790589348360991914, out var config);
            StateEffectConfig effect = config.Collectibles[_index];

            //테이블 및 캐릭터에 등록된 데이터 가져오기.
            var time_duration = data.value.time_duration;

            if (FP.MaxValue == time_duration)
            {
                //time_duration = effect.checkTime;
            }
            var isSelf = data.value.isSelf;
            var _target = target;
            if (true == isSelf)
            {
                _target = caster;
            }
            StateEffectFields* field = f.Unsafe.GetPointer<StateEffectFields>(_target);
            var list = f.ResolveList(field->UpdateEffect_Index);
            var _exist = false;
            //중복체크(index)
            if (data.value.type == (int)EffectType.Attack && caster == target)
            {
                return;
            }
            for (var i = 0; i < list.Count; i++)
            {
                var _base = list.GetPointer(i);
                if(data.id == -1)
                {
                    break;
                }
                if (_base->stat.id == data.id && data.id < -1)
                {
                    _base->timer = f.ElapsedTime;
                    //if (false == effect.isOwnInit)
                    //{
                    //    _base->timer = f.ElapsedTime;
                    //}
                    _exist = true;
                    return;
                    //break;
                }
            }
            if (false == _exist)
            {
                var _option = new StateEffectBase
                {
                    index = _index,
                    timer = f.ElapsedTime,
                    dot_timer = f.ElapsedTime,
                    caster = caster,
                    stat = data,
                };
                list.Add(_option);
                data.ReleaseData();

                if(data.value.type == EffectOption.Disposable)
                {
                    data.value.deactivation = true;
                }
                effect.Start_StateEffect(f, caster, _target, list.GetPointer(list.Count - 1));
            }
        }
        public void OnAttackStateEffect(Frame f, EntityRef caster, EntityRef target, EffectType type)
        {
            //해당 데이터의 타입이 Attack일 경우,
            StateEffectFields* field = f.Unsafe.GetPointer<StateEffectFields>(caster);
            var _status = f.Unsafe.GetPointer<Status>(caster);
            var list = f.ResolveList(_status->effectData);
            AssetLoadExtension.TryGetSpec<StateEffectListConfig>(f, 1790589348360991914, out var config);

            for (var i = 0; i < list.Count; i++)
            {
                var _data = list[i];
                var _index = _data.key;
                var effect = config.Collectibles[_index];
                var regist = _data.value.type == EffectOption.Attack;
                if (true == regist)
                {
                    OnRegistStateEffect(f, caster, target, _index, _data);
                }
            }
        }

        void ISignalOnRobotDeath.OnRobotDeath(Frame frame, EntityRef deadRef, EntityRef killerRef)
        {
            OnAttackStateEffect(frame, killerRef, killerRef, EffectType.Kill);
        }

        //안씀 아마도
        public void OnRegistStateEffect2(Frame f, EntityRef caster, EntityRef target, int _index, FP value, FP _time_duration, FP _check_dot_time)
        {
            //SetRegistStateEffect(f, caster, target, _index, value, _time_duration, _check_dot_time);
        }
    }

    public unsafe partial struct StateEffect_Stat
    {
        public void DataListSet(Frame f, List<StateEffect_StatData> data)
        {
            data_FPlist = f.AllocateList<StateEffect_StatData>();
            var list = f.ResolveList(data_FPlist);
            foreach(var item in data)
            {
                var added = new StateEffect_StatData();
                added.option = item.option;
                added.data = item.data;
                list.Add(added);
            }
        }
    }
    public unsafe partial struct StateEffectData
    {
        public void ReleaseData()
        {
            value.data_FPlist = default;
        }
    }
    public unsafe partial struct StateEffect_StatData
    {
        public StateEffect_StatData(int key, int _option, FP data)
        {
            this.datakey = key;
            this.option = (StatusOption)_option;
            this.data = data;
        }
    }
}