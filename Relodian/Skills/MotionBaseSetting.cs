using Photon.Deterministic;
using System;
using System.Diagnostics.Tracing;
using UnityEngine;

namespace Quantum
{
    public unsafe abstract partial class MotionBase
    {
        //motion 생성 후 기본세팅
        public MotionFields* CreateMotion(Frame f, EntityRef caster, FPVector2 startpos, EntityRef parent, int index, FP pow)
        {
            EntityRef motion = f.Create(motion_);
            GetMotionFields(f, motion, out var fields, out var fieldtrans, out var fieldbool);

            Transform2D* transform = f.Unsafe.GetPointer<Transform2D>(motion);

            fields->MotionData = this;
            fields->Source = motion;
            fieldbool->IsPenetration = ispenetration;
            fields->parent = parent;
            fieldbool->Isdestroy = false;
            fields->StartTime = f.ElapsedTime + start_delaytime;
            fields->cntIdex = index;
            fieldbool->isphysicsSet = false;
            fields->timetolive = timetolive;
            fields->chargingpow = pow;
            fields->ShapeTime = 0;

            fieldtrans->Caster = caster;
            fieldtrans->Already_hits = f.AllocateList<EntityRef>();
            fieldtrans->Angle = f.Get<CustomKCC>(caster).IsFacingRight == true ? FP._0 : FP.Pi;

            var _offset = true == isAxisRotationY ? FPVector2.Rotate(new FPVector2(offset.X, 0), fieldtrans->Angle) + new FPVector2(0, offset.Y) :
                 FPVector2.Rotate(offset, fieldtrans->Angle);

            var _startpos = (true == isStartCaster) ? f.Get<Transform2D>(caster).Position + _offset : startpos + _offset;
            fieldtrans->StartPosition = _startpos;
            transform->Position = _startpos;

            return fields;
        }
        //motion 생성후 1프레임 후 추가세팅
        public void StarterMotion(Frame f, MotionFields* fields)
        {
            GetMotionFields(f, fields->Source, out var field, out var fieldtrans, out var fieldbool);
            if (true == fieldbool->isStarter)
            {
                return;
            }
            if (true == IsAnitmionPart)
            {

                if (AniPart_Index < 100)
                {
                    f.Events.OnSkillAnitmionPart(fieldtrans->Caster, AniPart_Index, AniPart_Speed, AniIdleSet);
                }
                else
                {
                    f.Events.OnAttackAnimation(fieldtrans->Caster, AniPart_Index / 100, AniPart_Speed, true, false, 0/*idle_durartion*/);
                }
            }


            AddStarterMotion(f, fields);
            fieldbool->isStarter = true;
        }
        //motion 생성 후 target의 유무, 및 생성갯수에 따른 맞춤 세팅.
        public void CreateCol(Frame f, EntityRef caster, EntityRef target, FPVector2 startpos, EntityRef parent, int index, int motionindex, FP pow)
        {
            for (var i = 0; i < CreateCount + 1; ++i)
            {
                if (false == f.Exists(caster))
                {
                    f.Unsafe.GetPointer<BehaviorSkillFields>(parent)->IsEndMotion = true;
                    continue;
                }
                var config = CreateMotion(f, caster, startpos, parent, index, pow);
                MotionFields_Trans* fieldtrans = f.Unsafe.GetPointer<MotionFields_Trans>(config->Source);
                config->motionindex = motionindex;
                config->CreateCnt = i;
                if (false == f.Exists(target))
                {
                    fieldtrans->Target_entity = EntityRef.None;
                    fieldtrans->Target_pos = fieldtrans->StartPosition + distance;
                    AddCreateSetting(f, config);
                    f.Signals.OnSetEffectData(config->Source, EntityRef.None, fieldtrans->Target_pos - distance, start_delaytime, fieldtrans->Angle, null, this, 0);
                    continue;
                }
                else
                {
                    fieldtrans->Target_entity = target;
                    fieldtrans->Target_pos = f.Unsafe.GetPointer<Transform2D>(target)->Position;
                    AddCreateSetting(f, config);
                }

                f.Signals.OnSetEffectData(config->Source, EntityRef.None, fieldtrans->Target_pos, start_delaytime, fieldtrans->Angle, null, this, 0);
            }
        }
        //해당 motion이 physics가 적용되었을 때, 추가세팅
        public void PhysicsSetMotion(Frame f, EntityRef motion, MotionFields* fields)
        {
            GetMotionFields(f, fields->Source, out var field, out var fieldtrans, out var fieldbool);
            if (fieldbool->isphysicsSet)
            {
                return;
            }
            if (!isphysics)
            {
                return;
            }
            var physicsShape = shape.CreateShape(f);
            if (shape.ShapeType == Shape2DType.Box)
            {
                physicsShape.Box.Extents = (physicsShape.Box.Extents / 2) * FP._0_50;// * FP._8;
            }
            else if (shape.ShapeType == Shape2DType.Circle)
            {
                physicsShape.Circle.Radius = physicsShape.Circle.Radius * FP._0_50;// * FP._8;
            }
            var _list = f.ResolveList(f.Unsafe.GetPointer<BehaviorSkillFields>(fields->parent)->start_angle);
            var collider = PhysicsCollider2D.Create(f, physicsShape);
            CallbackFlags flags = CallbackFlags.None;
            collider.Layer = f.Layers.GetLayerIndex(layerstring);
            var body = PhysicsBody2D.CreateDynamic(FP._1);
            body.Velocity = velocity + velocity * fields->chargingpow;
            body.Velocity.X = _list[fields->cntIdex] <= FP.Pi / 2 ? velocity.X : -velocity.X;
            body.AngularVelocity = fieldtrans->Angle > FP.Pi / 2 ? angularvelocity : -angularvelocity;
            body.AddAngularImpulse(Impulse);

            if (null != collider2d.collisionmat)
            {
                collider.Material = collider2d.collisionmat;
                body.Drag = collider2d._Drag;
                body.AngularDrag = collider2d._AngularDrag;
                body.GravityScale = collider2d._Gravity;
                body.UseContinuousCollisionDetection = true;
            }   
            if(true == collider2d.isCollisionEnter)
            {
                flags |= CallbackFlags.OnDynamicCollisionEnter;
                flags |= CallbackFlags.OnStaticCollisionEnter;
            }

            f.Set(motion, collider);
            f.Set(motion, body);
            f.Physics2D.SetCallbacks(motion, flags);

            AddPhysicsSetting(f, motion, fields, _list[fields->cntIdex] <= FP.Pi / 2);
            fieldbool->isphysicsSet = true;
        }
        //시전자의 상태체크에 의해 스킬Update여부 체크
        public bool IsCasterStateCheck(Frame f, EntityRef caster, MotionFields* motion)
        {
            if (false == f.Exists(caster))
            {
                return true;
            }
            if(false == f.Exists(motion->parent))
            {
                return true;
            }
            var destroymove = f.Get<BehaviorSkillFields>(motion->parent).isNotStunDestroy;
            if(true == destroymove)
            {
                return true;
            }
            var state = f.Get<Status>(caster);
            GetMotionFields(f, motion->Source, out var field, out var fieldtrans, out var fieldbool);
            if (state.StunState != StunList.None && state.StunState < StunList.Confine && false == IsStunNotDestroy)
            {
                f.Unsafe.GetPointer<PhysicsBody2D>(caster)->Velocity.X = 0;
                f.Unsafe.GetPointer<BehaviorSkillFields>(motion->parent)->IsEndMotion = true;
                fieldbool->Isdestroy = true;
                return false;
            }
            return true;
        }
        //외부 요인으로 해당 스킬의 motion의 다음 motion과의 연결을 끊을 때
        public void ReleaseSkill_fromMotion(Frame f, EntityRef motion)
        {
            GetMotionFields(f, motion, out var fields, out var fieldtrans, out var fieldbool);

            f.Unsafe.GetPointer<BehaviorSkillFields>(fields->parent)->IsEndMotion = true;
            BehaviorAttack* attack = f.Unsafe.GetPointer<BehaviorAttack>(fieldtrans->Caster);
            attack->lastEntity = attack->lastEntity == fields->parent ? EntityRef.None : attack->lastEntity;
            fields->parent = EntityRef.None;
            //f.Events.TargetLookat(fieldtrans->Caster, EntityRef.None);
            //f.Events.OnSkillAnitmionPart(fieldtrans->Caster, 2, 1, 0);
            fieldbool->isStarter = true;
        }
    }
}