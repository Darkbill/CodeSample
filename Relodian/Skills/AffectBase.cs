using Quantum.Physics2D;

namespace Quantum
{
    using UnityEngine;
    using Photon.Deterministic;
    using Reloadian;

    [System.Serializable]


    public unsafe partial class AffectBase : AssetObject
    {
#if QUANTUM_UNITY
        [Header("View Configuration", order = 9)]
        [Tooltip("터질 때 이펙트")] 
        public FxBase AffectFx;
        [Tooltip("플랫폼에 터질 때 이펙트")] 
        public FxBase PlatformFx;
        [Tooltip("target이 피격되었을 때 이펙트")] 
        public FxBase HitFx;
        public Reloadian.AudioConfiguration CastAudio;
#endif
        [Header("보조 Motion")]
        public MotionBase submotion;
        [Tooltip("해당 affect의 위치를 줄 것인가")]
        public bool isaffectpos;
        [Tooltip("motion에 parent를 제외: 계속재생")]
        public bool isnotParent;
        [Header("프로토타입 설정")]
        public EntityPrototype affect_;
        public AffectList option;

        [Header("변수 집합")]
        public OnlyDamage onlydmg_info;
        public HasBuff buff_info;
        public Affect_Hide affecthide_info;
        public AffectCrowdControl crowdcontrol_info;

        [Header("옵션")]
        [Tooltip("시작시간")] 
        public FP starttime;      
        [Tooltip("적용 범위")] 
        public Shape2DConfig shape; 
        public bool worldoffset;    //월드위치
        [Tooltip("단일타겟 여부")] 
        public bool isSingle;
        [Tooltip("단일타겟이 아닐 때 폭발시점을\n" +
                "충돌한 지점으로 할지")]
        public bool isplayfocus;
        [Tooltip("Y축을 기준으로 회전시킬 때")] 
        public bool isAxisRotationY;
        [Tooltip("Target = Caster일 때")] 
        public bool isTargetCaster;
        public bool isDebug;
        public ColorRGBA DebugColor;
        [Tooltip("카메라가Shake")] 
        public bool isCameraShake;
        [Tooltip("진동시간")] 
        public FP cameraValue;
        [Tooltip("Affect기준으로 전방에 있는 범위만 체크할때")] 
        public bool isrightTarget;
        [Tooltip("아군에게만 적용시킬 때")]
        public bool isteam;
        //Affect 생성 후, 기본세팅.
        public AffectFields* CreateAffect(Frame f, EntityRef caster, FP angle, FP pow, int type, EntityRef parent, int index)
        {
            //Affect 세팅
            EntityRef affect = f.Create(affect_);
            AffectFields* fields = f.Unsafe.GetPointer<AffectFields>(affect);
            fields->Caster = caster;
            fields->IsMove = fields->DurationTime > 0;
            fields->AffData = this;
            fields->Source = affect;
            fields->angle = angle;
            fields->StartTime = f.ElapsedTime + starttime;
            fields->Already_hits = f.AllocateList<EntityRef>();
            fields->attacktype = type;
            fields->Pow = 0 < pow ? pow + 1 : 1;
            fields->parent = parent;
            fields->Index = index;
            fields->Target_pos = f.Get<Transform2D>(affect);

            return fields;
        }
        //Affect 생성 후 타겟이 있을 경우 추가세팅
        public void CreateCol(Frame f, EntityRef caster, EntityRef target, FP angle, FP pow, int type, int index, int motionindex, EntityRef parent)
        {
            if (false == f.Exists(caster))
            {
                return;
            }
            if(false == f.Exists(target))
            {
                return;
            }
            AffectFields* fields = CreateAffect(f, caster, angle, pow, type, parent, index);//->Target_entity = target;
            fields->motionindex = motionindex;
            fields->Target_entity = true == isTargetCaster ? caster : target;
            fields->Target_pos.Position = f.Get<Transform2D>(target).Position;// + (FPVector2.Rotate(FPVector2.Left, angle));
            if (AffectList.Buff != option && AffectList.Mark != option)
            {
                f.Signals.OnSetEffectData(
                    target, 
                    fields->Caster, 
                    f.Get<Transform2D>(target).Position + shape.PositionOffset, 
                    starttime,
                    fields->angle, 
                    this, 
                    null, 
                    1);
            }
        }
        //Affect 생성 후 타겟이 없을 경우 추가세팅
        public void CreateCol(Frame f, EntityRef caster, Transform2D transform, FP angle, FP pow, int type, int index, int motionindex, EntityRef parent,  EntityRef? target = null)
        {
            if(false == f.Exists(caster))
            {
                return;
            }

            AffectFields* fields = CreateAffect(f, caster, angle, pow, type, parent, index);
            fields->motionindex = motionindex;
            var _target = (null == target) ? EntityRef.None : (EntityRef)target;

            fields->Target_pos = true == isTargetCaster ? 
                f.Get<Transform2D>(caster) : 
                (false == f.Exists(_target) || false == f.Has<Status>(_target)) ? transform : f.Get<Transform2D>(_target);
            //fields->Target_pos.Position += (FPVector2.Rotate(FPVector2.Left, angle));
            fields->Target_entity = true == isTargetCaster ? caster : _target;
            if (AffectList.Buff != option && AffectList.Mark != option)
            {
                var _off = true == isAxisRotationY ? shape.PositionOffset.X * FPVector2.Right : shape.PositionOffset;
                var _offset = FPVector2.Rotate(_off, fields->angle);
                f.Signals.OnSetEffectData(
                    EntityRef.None != _target ? _target : EntityRef.None, 
                    fields->Caster, 
                    transform.Position + _offset, 
                    starttime, 
                    fields->angle, 
                    this, 
                    null,
                    true == f.Has<PlatformDropable>(_target) ? 2 : 1);
            }
        }
        public void Update()
        {

        }
        public void Update(Frame f, EntityRef entity)
        {
            AffectFields* fields = f.Unsafe.GetPointer<AffectFields>(entity);
            if (isSingle && fields->Target_entity != EntityRef.None)
            {
                //타겟이 있을 경우 해당타겟에 바로 타격 적용.
                harmCharacter(f, fields->Caster, fields->Target_entity, fields, fields->Target_pos.Position);
            }
            else
            {
                //타겟이 없을 경우, 등록된 shape2d만큼 크기의 범위를 체크 후 타격.
                CheckCollision(f, entity);
            }
        }
        //범위체크 후 안에 들어온 대상 타격 적용
        public void CheckCollision(Frame f, EntityRef affectRef)
        {
            //범위 지정
            if (isSingle)
            {
                return;
            }
            AffectFields* fields = f.Unsafe.GetPointer<AffectFields>(affectRef);

            var _offset = SkillHelper.ShapeRotate(shape.PositionOffset, fields->angle, isAxisRotationY);
            var _shape = shape.CreateShape(f);
            _shape.Centroid = FPVector2.Zero;
            _shape.LocalTransform.Rotation = _shape.Type == Shape2DType.Polygon ? fields->angle : _shape.LocalTransform.Rotation;
            if (isDebug)
            {
                //var center = FPVector2.Rotate(_shape.Centroid, worldoffset ? 0 : fields->angle);
                SkillHelper.DrawDebugShape(f,
                    _shape,
                    fields->Target_pos.Position + _offset,
                    fields->Target_pos.Position + _offset,
                    0,
                    fields->angle,
                    DebugColor,
                    isAxisRotationY);
            }
            FPQuaternion.AngleAxis(fields->angle, FPVector3.Up);
            HitCollection hits = f.Physics2D.OverlapShape(fields->Target_pos.Position + _offset, 0, _shape);
            for (int i = 0; i < hits.Count; i++)
            {
                EntityRef _entity = hits[i].Entity;
                //범위 안 캐릭터에 대한 처리
                harmCharacter(f, fields->Caster, _entity, fields, fields->Target_pos.Position);
            }
        }
        //타격이 가능한지 여부 체크 후, 효과적용.
        public void harmCharacter(Frame f, EntityRef caster, EntityRef target, AffectFields* fields, FPVector2 pos)
        {
            if (!f.Has<Status>(target))
            {
                return;
            }
            if(false == f.Exists(caster) || false == f.Exists(target))
            {
                return;
            }
            var conditioncheck = StateChangeHelper.StatusConditionCheck(f, target, caster, out int result, (true == isSingle && true == isTargetCaster));

            if(result < 0 && !conditioncheck)
            {
                return;
            }
            if(result > 0 && false == isteam)
            {
                return;
            }
            if(result <= 0 && true == isteam)
            {
                return;
            }
            if(false == conditioncheck && false == isteam)
            {
                return;
            }
            if(true == isteam && (result == 0 || result == 2))
            {

            }
            var _addpos = FPVector2.Rotate(FPVector2.Left, fields->angle);
            if (true == isrightTarget)//범위 내 적 기준으로 전방에있는 적 타격
            {//시전자 기준으로 적이 전방에 있을때
                var _angle = FPVector2.Radians(FPVector2.Rotate(FPVector2.Right, f.Get<PlayerInput>(fields->Caster).AimDirection), f.Get<Transform2D>(target).Position - f.Get<Transform2D>(caster).Position);
                if (FPMath.Abs(_angle) > FP.Pi / 2)
                {
                    return;
                }
            }
            if (true == isCameraShake)
            {//카메라 흔들림에 대한 이벤트
                f.Events.CameraEvent(CameraEnum.Shake, cameraValue, new FPVector3(0, FP._0_50, 0), fields->Caster);
            }
            f.Signals.OnSetEffectData(target, caster, f.Get<Transform2D>(target).Position + shape.PositionOffset, starttime, false == isAxisRotationY ? fields->angle : 0, this, null, 3);
            //f.Events.AffectParticle(caster, target, fields->AffData, f.Get<Transform2D>(target).Position, 0, starttime, true);



            var coldata = f.ResolveList(fields->Already_hits);
            if (true == coldata.Contains(target))
            {
                return;
            }
            coldata.Add(target);
            //서브모션이 있을 경우 서브모션생성
            CheckSubmotion(f, caster, target, fields);
            FP maindamage = FP._0;
            var addskillstatus = SkillHelper.SkillBaseState(f, caster, (AttackType)fields->attacktype, SkillStatus.AddDamage) / 100;
            switch (option)
            {
                case AffectList.OnlyDamage:
                    if (onlydmg_info.ischeck_distance)
                    {
                        break;
                    }
                    maindamage = onlydmg_info.damage * fields->Pow;
                    addskillstatus *= maindamage;
                    f.Signals.OnRobotHitEffect(caster, target, maindamage + addskillstatus, (AttackType)fields->attacktype, pos + _addpos);
                    break;
                case AffectList.Buff:
                case AffectList.Mark:
                    f.Signals.OnSetAffectBuff(buff_info, *fields, target);
                    break;
                case AffectList.Stun:
                case AffectList.Snare:
                    maindamage = crowdcontrol_info.damage * fields->Pow;
                    addskillstatus *= maindamage;
                    f.Signals.OnRobotStun(target, crowdcontrol_info.option.duration, crowdcontrol_info.state);
                    if(maindamage != 0)
                    {
                        f.Signals.OnRobotHitEffect(caster, target, maindamage + addskillstatus, (AttackType)fields->attacktype, pos + _addpos);
                    }
                    break;
                case AffectList.Fear:
                    f.Signals.OnSetAffectBuff(buff_info, *fields, target);
                    maindamage = buff_info.BuffAffect.value * fields->Pow;
                    addskillstatus *= maindamage;
                    f.Signals.OnRobotStun(target, buff_info.BuffAffect.duration, StunList.Fear);
                    if (maindamage != 0)
                    {
                        f.Signals.OnRobotHitEffect(caster, target, maindamage + addskillstatus, (AttackType)fields->attacktype, pos + _addpos);
                    }
                    break;
                case AffectList.Airborne:
                case AffectList.Silence:
                    break;
                case AffectList.Hide:
                    break;
                case AffectList.CostReturn:
                    break;
                //case AffectList.Summon:
                //    f.Signals.OnSummonCreature(caster, *fields, pos);
                //    break;
            }

        }
        //Affect로 피격된 대상에게 추가적인 행동(motion)을 부여할 때 사용.
        private void CheckSubmotion(Frame f, EntityRef caster, EntityRef target, AffectFields* fields)
        {
            if(submotion == null)
            {
                return;
            }

            var _startpos = f.Get<Transform2D>(fields->Source).Position;
            if (true == isaffectpos)
            {
                _startpos = fields->Target_pos.Position;
            }
            if(true == f.TryGet<Status>(target, out var status))
            {
                if(true == status.IsSuperArmour)
                {
                    return;
                }
            }
            submotion.CreateCol(f, caster, target, _startpos, true == isnotParent ? EntityRef.None : fields->parent, fields->Index, fields->motionindex, fields->Pow);
        }
        //지속시간 체크
        public void CheckDuration(Frame f, EntityRef entity)
        {
            AffectFields* fields = f.Unsafe.GetPointer<AffectFields>(entity);
            if (fields->DurationTime > 0)
            {
                fields->DurationTime -= f.DeltaTime;
            }
            f.Destroy(entity);
        }
    }
    
}
