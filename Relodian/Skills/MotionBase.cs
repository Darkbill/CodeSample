using Photon.Deterministic;
using Quantum.Physics2D;
using Sirenix.OdinInspector;
using System;
using UnityEngine;

namespace Quantum
{
    public unsafe abstract partial class MotionBase
    {//partial
#if QUANTUM_UNITY
        [Header("View Configuration", order = 9)]
        public GameObject MotionFx;
        public GameObject EnemyMotionFx;
        public bool EffectContinuing;
        public bool IsPosCaster;
        public bool IsParent;
        public Reloadian.AudioConfiguration CastAudio;
        public bool islinkSound;
#endif
        public const QueryOptions Options = QueryOptions.ComputeDetailedInfo | QueryOptions.HitAll;
        [Header("--Motion Setting--", order = 15)]

        public EntityPrototype motion_;
        public bool issubmotion;
        [Tooltip("한 motion에 여러개를 재생시킬 때,\n" +
                "사용 시 이후 추가motion이 있으면 안됨.")]
        public bool isCreateCount;
        public int CreateCount;
        public FP motionInterval;

        //움직일 대상
        [Header("움직일 대상")]
        [Tooltip("Caster 자신을 움직일 때")]
        public bool isself;  
        [Tooltip("적 대상을 움직일 때")] 
        public bool isenemy;
        //body trigger 옵션
        [Tooltip("Character를 움직일 때,\n충돌무시 여부")] 
        public bool isbodytrigger;
        
        //body적용
        [Header("PhysicsBody적용")]
        public bool isphysics;
        [Tooltip("힘이 가해지는 방향")] 
        public FPVector2 velocity;  //방향
        public FP angularvelocity;  //각도
        public FP Impulse;          //힘
        public string layerstring;  //레이어

        [Header("세부옵션")]
        [Tooltip("시작 딜레이시간")] 
        public FP start_delaytime;//딜레이 시간
        [Tooltip("관통여부")] 
        public bool ispenetration;//관통유무
        [Tooltip("해당 모션의 시작위치를 시전자로 할때")] 
        public bool isStartCaster;//해당 모션의 시작위치를 캐스터로 할때.
        [Tooltip("타겟이 없을 경우, 최종 처리를 제외시킬 때")] 
        public bool IsNotEndsignal;//마지막 시그널을 제외할때(타겟이 없을경우)
        [Tooltip("충돌 검사결과를 n번 간격으로 비우고싶을때")]
        public bool IsCollisionListReset;//충돌 검사결과를 n번 간격으로 비우고싶을때,
        [Tooltip("충돌 체크를 리셋하고 난 후 최초 한번씩만 할 때")]
        public bool IsCollisionListFirsttime;
        [Tooltip("충돌 검사결과를 리셋시킬 시간 간격")]
        public FP resettime;//리섯할 시간 간격.
        [Tooltip("이동경로(스크립트 추가 필요)")]
        public bool HasLayTarget;//이동경로를 그리고 싶을 때   
        [Tooltip("이동경로 표현 prototype")]
        public EntityPrototype LayPrototype;//이동경로를 그려줄 프로토타입.
        [Tooltip("motion이 update 중에 충돌체크를 제외시킬 때")]
        public bool IsNotCheckSignals;//행동 중 충돌체크를 제외시킬 때.
        [Tooltip("Effect의 위치를 global로 뺄 때,")]
        public bool IsEffectglobalpos;//이펙트 위치 글로벌
        [Tooltip("스턴 걸려도 계속 update")]
        public bool IsStunNotDestroy;

        //충돌관련 정보
        //motion의 충돌도형
        //[Sirenix.OdinInspector.HideIf("asd")]
        [Header("충돌체")]
        [DisplayName("도형 타입")]
        public Shape2DConfig shape;
        public FPVector2 offset;
        [Tooltip("플랫폼 충돌체크에 포함시킬 것인지 여부")]
        public bool IsplatformCheck;//플랫폼을 충돌체크에 포함시킬 것인지
        [Tooltip("캐릭터 충돌체크에 포함시킬 것인지 여부")]
        public bool IsNonCharacter;//캐릭터 충돌체크를 제외시킬 것인지
        [Tooltip("Y축 회전 여부")]
        public bool isAxisRotationY;//Y축 회전 여부
        [Tooltip("충돌체가 아군을 포함시킬 때")]
        public bool isteam;//아군을 포함시킬 때
        [Tooltip("충돌한 정보 복사여부")]
        public bool iscollisioncopy;//충돌한 정보를 복사할 때,
        [Tooltip("IsObject 충돌 제외")]
        public bool isnonObjectcol;

        public MotionCollider2D collider2d;

        [Tooltip("실제 충돌적용범위를 표시하고 싶을 때\n" +
                "(test전용)")]
        public bool isDebug;
        public ColorRGBA DebugColor;
        public bool isHitPoint;//motion 실행 중 충돌했을 때 충돌지점을 넘겨줄지, 
        //애니메이션 정보
        [Header("애니메이션")]
        [Tooltip("부분 애니메이션 적용 여부\n" +
                "사용하러면 skillbase에서 Ani_index값 설정필요")]
        public bool IsAnitmionPart; //부분애니메이션 적용여부
        [Tooltip("부분 애니메이션의 index\n" +
                "0: pre, skip / 1: Act / 2: Post")]
        public int AniPart_Index;   //부분애니메이션의 인덱스
        [Tooltip("부분애니메이션의 속도")]
        public FP AniPart_Speed;    //부분애니메이션의 속도
        [Tooltip("해당 애니메이션의 motion이 마지막일 때")]
        public bool IsEndMotion;    //해당 모션이 마지막일 때
        public int AniIdleSet;      //해당 애니메이션을 idle형태로 변경할 때,

        //충돌하지 않거나 관통motion일 때 최대거리 및 시간
        [Header("거리 및 시간")]
        public bool istimetolive;   //시간으로 계산할 때
        public FPVector2 distance;  //거리, 다른옵션으로도 사용할 수 있음.
        public FP timetolive;      //시간
        public FP penetration_time; //관통되었을 때 다시 체크할 시간
        public FP speed;            //속도
        public FPAnimationCurve speed_graph;//속도변동 그래프
        public bool isYmovepos;     //Y축 이동유무

        //생성하고 기본세팅 후 추가적인 세팅이 필요한 경우,
        public virtual void AddCreateSetting(Frame f, MotionFields* fields) { }
        //
        public virtual void AddStarterMotion(Frame f, MotionFields* fields) { }
        public virtual void AddPhysicsSetting(Frame f, EntityRef motion, MotionFields* fields, bool isangle) { }
        public virtual void Update(Frame f, EntityRef motion) { }
        public virtual void HasOption(Frame f, MotionFields* fields) { }
        //field 가져오기
        public void GetMotionFields(Frame f, EntityRef motion, out MotionFields* fields, out MotionFields_Trans* fieldtrans, out MotionField_Bool* fieldbool)
        {
            fields = default;
            fieldtrans = default;
            fieldbool = default;
            if (false == f.Exists(motion))
            {
                return;
            }
            fields = f.Unsafe.GetPointer<MotionFields>(motion);
            fieldtrans = f.Unsafe.GetPointer<MotionFields_Trans>(motion);
            fieldbool = f.Unsafe.GetPointer<MotionField_Bool>(motion);
        }
        //해당 motion의 설정된 shape에 충돌했을 때 정렬(기본 오름차순 정렬)
        public virtual Hit[] HitSortSetting(Frame f, EntityRef motionRef, HitCollection hit)
        {
            Transform2D* transform = f.Unsafe.GetPointer<Transform2D>(motionRef);
            hit.Sort(transform->Position);

            return hit.ToArray();
        } 
        //해당 motion의 종료 여부.
        public bool IsDurationOption(Frame f, EntityRef field_entity) 
        {
            GetMotionFields(f, field_entity, out var fields, out var fieldtrans, out var fieldbool);
            if (false == f.Exists(fieldtrans->Caster))
            {
                return false;
            }
            if(EntityRef.None != fields->parent && true == f.Exists(fields->parent))
            {
                var parent = f.Unsafe.GetPointer<BehaviorSkillFields>(fields->parent);
                if (true == parent->IsEndMotion)
                {
                    fieldbool->Isdestroy = true;
                    AddReleaseOption(f, fields);
                    return false;
                }
            }

            if(true == istimetolive)
            {
                return IsTimeToLive(f, field_entity);
            }
            return IsDistance(f, field_entity);
        }
        public virtual bool IsDistance(Frame f, EntityRef field_entity)
        {
            //거리계산 조건부
            //MotionFields* fields = f.Unsafe.GetPointer<MotionFields>(field_entity);
            MotionFields_Trans* fieldtrans = f.Unsafe.GetPointer<MotionFields_Trans>(field_entity);
            var trans = f.Get<Transform2D>(field_entity);
            var targetpos = (fieldtrans->Target_entity == EntityRef.None || false == f.Exists(fieldtrans->Target_entity)) ? fieldtrans->Target_pos : f.Get<Transform2D>(fieldtrans->Target_entity).Position;

            return FPVector2.Distance(fieldtrans->StartPosition, trans.Position) < FPVector2.Distance(fieldtrans->StartPosition, targetpos);
        }
        public virtual bool IsTimeToLive(Frame f, EntityRef field_entity)
        {
            //시간계산 조건부
            MotionFields* fields = f.Unsafe.GetPointer<MotionFields>(field_entity);
            if(fields->timetolive < 0)
            {
                return false;
            }
            fields->timetolive -= f.DeltaTime;
            return true;
        }
        //해제시 추가해제여부
        public virtual void AddReleaseOption(Frame f, MotionFields* fields) { }
        //motion의 종료 체크 후, 삭제후 다음motion생성 및 등록된 affect생성
        public FPVector2 CheckDuration(Frame f, EntityRef field_entity)
        {
            GetMotionFields(f, field_entity, out var fields, out var fieldtrans, out var fieldbool);
            var trans = f.Get<Transform2D>(field_entity);
            var cnt = fields->cntIdex;

            if (IsDurationOption(f, field_entity) && !fieldbool->Isdestroy)
            {
                return FPVector2.Zero;
            }
            if(true == IsNotEndsignal && fieldtrans->Target_entity == EntityRef.None)
            {
                cnt = -1;
            }
            //if (true == IsNotCheckSignals)
            //{
            //    var coldata = f.ResolveList(fieldtrans->Already_hits);
            //    foreach ( var col in coldata )
            //    {
            //        SetHitList(f, fields->parent, fieldtrans);
            //        SetTarget(f,
            //            fieldtrans->Caster,
            //            col,
            //            trans,
            //            false == issubmotion ? fields->parent : EntityRef.None,
            //            fieldtrans->Angle,
            //            false,
            //            cnt,
            //            fields->motionindex,
            //            fields->chargingpow);
            //    }
            //    f.Destroy(field_entity);
            //    return trans.Position;
            //}
            SetHitList(f, fields->parent, fieldtrans);
            SetTarget(f,
                fieldtrans->Caster,
                    fieldtrans->Target_entity,
                    trans,
                    false == issubmotion ? fields->parent : EntityRef.None,
                    fieldtrans->Angle,
                    true,
                    cnt,
                    fields->motionindex,
                    fields->chargingpow);

              f.Destroy(field_entity);
            return trans.Position;
        }
    }
}
