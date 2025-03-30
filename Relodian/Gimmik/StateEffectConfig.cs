using Sirenix.OdinInspector;
using System.Collections.Generic;
using UnityEngine;

namespace Quantum
{


    //무기 발사 Base 
    public unsafe abstract partial class StateEffectConfig
    {
        [Title("적 처치관련 Bool관련")]
        [Tooltip("적 직접 처치")]
        public bool isKill;
        [Tooltip("적 간접 처치")]
        public bool isAssist;

        [Title("삭제조건\n" +
            "해당 속성은 버프 아이템에 사용X")]
        public bool isNonDestroy;

        [Title("Affect")]
        [Tooltip("조건달성 시 실행시킬 Affects")]
        public List<AffectBase> playAffectList;

        public virtual void Start_StateEffect(Frame f, EntityRef caster, EntityRef entity, StateEffectBase* statebase) 
        {
        }
        public virtual bool CheckDestroy(Frame f, EntityRef entity, StateEffectConfig effect) {
            var _status = f.Unsafe.GetPointer<Status>(entity);

            if(false == f.Exists(entity))
            {
                return true;
            }
            if(true == _status->IsDead && false == effect.isNonDestroy)
            {
                return true;
            }
            return false;
        }
        public virtual void Update_StateEffect(Frame frame, EntityRef entity, StateEffectBase* statebase) { }
        public virtual void End_StateEffect(Frame f, EntityRef entity, int index, StateEffectBase* statebase) { }

        public bool IsTypeCheck(Frame f, EntityRef entity, StateEffectBase* statebase)
        {
            if (true == statebase->stat.value.deactivation)
            {
                return false;
            }
            return true;
        }
        //public void IsTimer(Frame f, StateEffectBase* isTime)
        //{
        //    if (!isTimeLimit) return;
        //    isTime->timer += f.DeltaTime;
        //}
        //    public virtual void UpdateProjectilePosition(Frame frame, EntityRef _entity)
        //{
        //        StateEffectFields* fields = frame.Unsafe.GetPointer<StateEffectFields>(_entity);
        //        Transform2D* _transform = frame.Unsafe.GetPointer<Transform2D>(_entity);

        //        Transform2D* _target_transform = frame.Unsafe.GetPointer<Transform2D>(fields->target);

        //        _transform->Position = _target_transform->Position;
        //       // Draw.Circle(transform->Position, ShapeConfig.CircleRadius, ColorRGBA.Red);
        //    }


        //public virtual bool CheckCollision(Frame frame, EntityRef projectile, ProjectileFields* projectileFields, Transform2D* transform)
        //{
        //  return false;
        //}

        //    public virtual void Spawn(Frame frame, EntityRef _caster, EntityRef _target)
        //    {
        //        EntityRef _entity = frame.Create(Prototype);

        //        StateEffectFields* _stateEffectFields = frame.Unsafe.GetPointer<StateEffectFields>(_entity);
        //        _stateEffectFields->duration = duration;
        //        _stateEffectFields->caster = _caster;
        //        _stateEffectFields->target = _target;
        //        _stateEffectFields->actionTime = checkTime;
        //        _stateEffectFields->value = value;
        //    }




        //    public virtual void CheckDestroyCondition(Frame frame, EntityRef _entity)
        //{
        //        StateEffectFields* stateEffectFields = frame.Unsafe.GetPointer<StateEffectFields>(_entity);

        //        stateEffectFields->duration -= frame.DeltaTime;
        //        if (stateEffectFields->duration <= 0)
        //        {
        //            frame.Destroy(_entity);
        //            return;
        //        }


        //    }



        //    public virtual void CheckAction(Frame frame, EntityRef _entity)
        //    {
        //        StateEffectFields* stateEffectFields = frame.Unsafe.GetPointer<StateEffectFields>(_entity);

        //        stateEffectFields->actionTime -= frame.DeltaTime;
        //        if (stateEffectFields->actionTime <= FP._0)
        //        {
        //            stateEffectFields->actionTime = checkTime;
        //            Action(frame, _entity);
        //            return;
        //        }


        //    }

        //    public virtual void Action(Frame frame, EntityRef _entity)
        //    {
        //        StateEffectFields* stateEffectFields = frame.Unsafe.GetPointer<StateEffectFields>(_entity);

        //    }

        
    }

}