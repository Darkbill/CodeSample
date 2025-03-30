using Photon.Deterministic;
using Quantum.Collections;
using static UnityEngine.GraphicsBuffer;
using System.Collections.Generic;
using UnityEngine.UIElements;
//using UnityEditor.Experimental.GraphView;

namespace Quantum
{
    public unsafe class CollisionSystem : SystemSignalsOnly, ISignalMotionSetTarget, ISignalMotionSetTarget_Count
    {
        public void MotionSetTarget(Frame f, EntityRef caster, EntityRef target, Transform2D starttrans, EntityRef parent, 
                            FP angle, QBoolean isEnd, int cntindex, int index, FP chargingpow)
        {
            if(false == MotionCheck(f, caster, parent, cntindex))
            {
                return;
            }
            BehaviorSkillFields* fields = f.Unsafe.GetPointer<BehaviorSkillFields>(parent);
            CollisionStruct* col = f.Unsafe.GetPointer<CollisionStruct>(parent);
            //var config = f.FindAsset<CollisionData>(col->data.Id);
            AssetLoadExtension.TryGetSpec<CollisionData>(f, col->data.Id, out var config);

            var _list = f.ResolveList(col->motion_numlist);
            if (config.parent.Count <= _list[cntindex])
            {
                return;
            }
            foreach (var affect in config.parent[_list[cntindex]]._affects)
            {
                AffectSet(f, fields, affect, caster, target, starttrans, parent, angle, cntindex, index, chargingpow);
            }
            if(true == f.Has<BehaviorSkillStatus>(caster))
            {
                var _addAffect = f.ResolveList(f.ResolveList(f.Get<BehaviorSkillStatus>(caster).attdata)[fields->type].Affectlist);
                for (var i = 0; i < _addAffect.Count; i++)
                {
                    if (_list[cntindex] == _addAffect[i].motionindex)
                    {
                        AssetLoadExtension.TryGetSpec<AffectBase>(f, _addAffect[i].Affect.Id, out var _affect);
                        AffectSet(f, fields, _affect, caster, target, starttrans, parent, angle, cntindex, index, chargingpow);
                    }
                }
            }
            

            if (!isEnd)
            {
                return;
            }
            _list[cntindex]++;
            if(false == MotionCountCheck(f, fields, config, _list, cntindex, parent))
            {
                return;
            }
            EntityRef _target = target;
            config.parent[_list[cntindex]]._motion.CreateCol(f, caster, _target, starttrans.Position, parent, cntindex, _list[cntindex], chargingpow);
        }
        public void MotionSetTarget_Count(Frame f, EntityRef caster, EntityRef target, Transform2D starttrans, EntityRef parent, 
                                      FP angle, QBoolean isEnd, int cntindex, int index, FP chargingpow)
        {
            if (false == MotionCheck(f, caster, parent, cntindex))
            {
                return;
            }
            BehaviorSkillFields* fields = f.Unsafe.GetPointer<BehaviorSkillFields>(parent);
            CollisionStruct* col = f.Unsafe.GetPointer<CollisionStruct>(parent);
            //var config = f.FindAsset<CollisionData>(col->data.Id);
            AssetLoadExtension.TryGetSpec<CollisionData>(f, col->data.Id, out var config);

            var _list = f.ResolveList(col->motion_numlist);
            var _motioncnt = f.ResolveList(f.Unsafe.GetPointer<CollisionStruct>(parent)->motioncnt);

            foreach (var affect in config.parent[index]._affects)
            {
                AffectSet(f, fields, affect, caster, target, starttrans, parent, angle, cntindex, index, chargingpow);
            }

           if(true == f.Has<BehaviorSkillStatus>(caster))
            {
                var _addAffect = f.ResolveList(f.ResolveList(f.Get<BehaviorSkillStatus>(caster).attdata)[fields->type].Affectlist);
                for (var i = 0; i < _addAffect.Count; i++)
                {
                    if (_list[cntindex] == _addAffect[i].motionindex)
                    {
                        AssetLoadExtension.TryGetSpec<AffectBase>(f, _addAffect[i].Affect.Id, out var _affect);
                        AffectSet(f, fields, _affect, caster, target, starttrans, parent, angle, cntindex, index, chargingpow);
                    }
                }
            }
            //motion 개수 체크
            if (!isEnd)
            {
                return;
            }
            if (_list[cntindex] == index)
            {
                _list[cntindex]++;
            }
            if (_motioncnt[index] > config.parent[index]._motion.CreateCount)
            {
                if (false == MotionCountCheck(f, fields, config, _list, cntindex, parent))
                {
                    return;
                }
            }
            _motioncnt[index]++;

            if (config.parent.Count <= index)
            {
                return;
            }

            EntityRef _target = target;
            config.parent[index + 1]._motion.CreateCol(f, caster, _target, starttrans.Position, parent, cntindex, _list[cntindex], chargingpow);
        }
        private bool MotionCheck(Frame f, EntityRef caster, EntityRef parent, int cntindex)
        {
            if (false == f.Exists(parent))
            {
                return false;
            }
            if (!f.Has<CollisionStruct>(parent))
            {
                return false;
            }

            BehaviorSkillFields* fields = f.Unsafe.GetPointer<BehaviorSkillFields>(parent);
            CollisionStruct* col = f.Unsafe.GetPointer<CollisionStruct>(parent);
            //var config = f.FindAsset<CollisionData>(col->data.Id);
            AssetLoadExtension.TryGetSpec<CollisionData>(f, col->data.Id, out var config);

            var _list = f.ResolveList(col->motion_numlist);

            if (cntindex < 0)
            {
                EndMotion(f, fields);
                return false;
            }
            if (false == f.Exists(caster))
            {
                EndMotion(f, fields);
                return false;
            }
            if (true == fields->IsEndMotion)
            {
                EndMotion(f, fields);
                return false;
            }
            return true;
        }
        private void AffectSet(Frame f, BehaviorSkillFields* fields, AffectBase affect, EntityRef caster, EntityRef target, Transform2D starttrans, 
                            EntityRef parent, FP angle, int cntindex, int motionindex, FP chargingpow)
        {
            if (affect.isSingle)
            {
                if (EntityRef.None != target)
                {
                    affect.CreateCol(f, caster, target, angle, chargingpow, fields->type, cntindex, motionindex, parent);
                }
                else
                {
                    affect.CreateCol(f, caster, starttrans, angle, chargingpow, fields->type, cntindex, motionindex, parent);
                }
            }
            else
            {
                 //affect.CreateCol(f, caster, starttrans, angle, chargingpow, fields->type, cntindex, motionindex,parent);
                if (EntityRef.None != target && false == affect.isplayfocus)
                {
                    affect.CreateCol(f, caster, starttrans, angle, chargingpow, fields->type, cntindex, motionindex,parent, target);
                }
                else
                {
                    affect.CreateCol(f, caster, starttrans, angle, chargingpow, fields->type, cntindex, motionindex,parent);
                }
            }
        }
        private bool MotionCountCheck(Frame f, BehaviorSkillFields* skill, CollisionData data, QList<int> _list, int index, EntityRef parent)
        {
            skill->countmotion--;
            if (skill->countmotion <= 0)
            {
                EndMotion(f, skill);
                return false;
            }
            if (data.parent.Count <= _list[index])
            {
                return false;
            }
            return true;
        }
        private void EndMotion(Frame f, BehaviorSkillFields* skill)
        {
            skill->IsEndMotion = true;
            AssetLoadExtension.TryGetSpec<BehaviorSkillBase>(f, skill->skilldata.Id, out var config);
            if(true == config.isend_notanicancel)
            {
                return;
            }

            f.Events.TargetLookat(skill->Source, EntityRef.None);
            if (false == f.Exists(skill->Source))
            {
                f.Events.OnSkillCancelAnimation(skill->Source);
                return;
            }
            if(false == f.Exists(f.Get<BehaviorAttack>(skill->Source).lastEntity))
            {
                f.Events.OnSkillCancelAnimation(skill->Source);
                return;
            }
            if (f.Get<BehaviorAttack>(skill->Source).lastEntity == EntityRef.None)
            {
                f.Events.OnSkillCancelAnimation(skill->Source);
            }
        }
    }
}