using Photon.Deterministic;
using Quantum.Collections;
using Quantum.Physics2D;

namespace Quantum
{
    public unsafe abstract partial class MotionBase
    {
        //충돌계산 (쿼리형태)
        public void AddBroadPhaseQuery(Frame f, EntityRef motionRef)
        {
            if (true == isphysics)
            {
                return;
            }
            //MotionFields* fields = f.Unsafe.GetPointer<MotionFields>(motionRef);
            MotionFields_Trans* fieldtrans = f.Unsafe.GetPointer<MotionFields_Trans>(motionRef);
            Transform2D* transform = f.Unsafe.GetPointer<Transform2D>(motionRef);

            var _offset = true == isAxisRotationY ? FPVector2.Rotate(new FPVector2(shape.PositionOffset.X, 0), fieldtrans->Angle) + new FPVector2(0, shape.PositionOffset.Y) :
                 FPVector2.Rotate(shape.PositionOffset, fieldtrans->Angle);
            Shape2D _shape = MotionAddRadius(f, motionRef);
            _shape.LocalTransform.Rotation = _shape.Type == Shape2DType.Polygon ? fieldtrans->Angle : _shape.LocalTransform.Rotation;
            if (isDebug)
            {
                SkillHelper.DrawDebugShape(f,
                    _shape,
                    transform->Position,// + _shape.Centroid,
                    f.Get<Transform2D>(motionRef).Position,// + _offset,
                    transform->Rotation,
                    fieldtrans->Angle,
                    DebugColor,
                    isAxisRotationY);
            }

            var _layer = true == IsplatformCheck ? f.Layers.GetLayerMask("StaticCollider", "Character", "Enemy", "Platform", "CharacterPlat") : f.Layers.GetLayerMask("Character", "Enemy", "CharacterPlat");
            var query = f.Physics2D.AddOverlapShapeQuery((transform->Position) + _shape.Centroid, transform->Rotation, _shape, _layer, options: Options);
            fieldtrans->QueryResult = query;
        }
        //등록된 shape2d 생성.
        private Shape2D MotionAddRadius(Frame f, EntityRef motionref)
        {
            Shape2D _shape = shape.CreateShape(f);

            var fields = f.Get<MotionFields>(motionref);
            var fieldtrans = f.Get<MotionFields_Trans>(motionref);
            if(false == f.Has<BehaviorSkillFields>(fields.parent))
            {
                return _shape;
            }
            var _parentfields = f.Get<BehaviorSkillFields>(fields.parent);

            var added = SkillHelper.SkillBaseState(f, fieldtrans.Caster, (AttackType)_parentfields.type, SkillStatus.AddRadius);
            switch (_shape.Type)
            {
                case Shape2DType.Box:
                    _shape.Box.Extents = _shape.Box.Extents + _shape.Box.Extents * added;
                    break;
                case Shape2DType.Circle:
                    _shape.Circle.Radius = _shape.Circle.Radius + _shape.Circle.Radius * added;
                    break;
                case Shape2DType.Polygon://Asset에 직접 접근해서변환하는데 값변경x
                    break;
            }
            return _shape;
        }
        //body가 포함되지않은 collision 체크
        public EntityRef CheckCollision(Frame f, EntityRef motionRef)
        {
            GetMotionFields(f, motionRef, out var fields, out var fieldtrans, out var fieldbool);

            Transform2D* transform = f.Unsafe.GetPointer<Transform2D>(motionRef);
            var coldata = f.ResolveList(fieldtrans->Already_hits);

            fieldbool->IsFirstCheck = true;
            if (true == IsCollisionListReset)
            {
                if (fields->ShapeTime < resettime)
                {
                    fields->ShapeTime += f.DeltaTime;
                    if(true == IsCollisionListFirsttime)
                        return EntityRef.None;
                }
                else
                {
                    fields->ShapeTime = 0;
                    coldata.Clear();
                }
            }

            var _shape = shape.CreateShape(f);
            f.Physics2D.TryGetQueryHits(fieldtrans->QueryResult, out HitCollection hits);// (*transform, _shape);
            var _array = HitSortSetting(f, motionRef, hits);
            for (var i = 0; i < _array.Length; ++i)
            {
                var hittarget = _array[i].Entity;
                if (false == CollisionLayerCheck(f, hittarget, fieldtrans->Caster, coldata))
                {
                    continue;
                }
                coldata.Add(hittarget);
                if (!ispenetration)
                {
                    fieldbool->Isdestroy = true;
                    fieldtrans->Target_entity = hittarget;
                    return EntityRef.None;
                }
                if (true == IsNotCheckSignals)
                {
                    continue;
                }
                var hitpoint = new Transform2D();
                hitpoint.Position = _array[i].Point;
                hitpoint.Rotation = FP._0;
                SetHitList(f, fields->parent, fieldtrans);
                SetTarget(f,
                    fieldtrans->Caster,
                    hittarget,
                    true == isHitPoint ? hitpoint : *transform,
                    false == issubmotion ? fields->parent : EntityRef.None,
                    fieldtrans->Angle,
                    false,
                    fields->cntIdex,
                    fields->motionindex,
                    fields->chargingpow);
                if (true == istimetolive)
                {
                    fields->StartTime = f.ElapsedTime + penetration_time;
                }
                continue;
            }
            return EntityRef.None;
        }
        //body가 포함되었을 때 collision 체크
        public EntityRef CheckCollision_body(Frame f, EntityRef motionRef)
        {
            GetMotionFields(f, motionRef, out var fields, out var fieldtrans, out var fieldbool);

            Transform2D* transform = f.Unsafe.GetPointer<Transform2D>(motionRef);
            var coldata = f.ResolveList(fieldtrans->Already_hits);

            fieldbool->IsFirstCheck = true;
            if (true == IsCollisionListReset)
            {
                if (fields->ShapeTime < resettime)
                {
                    fields->ShapeTime += f.DeltaTime;
                }
                else
                {
                    fields->ShapeTime = 0;
                    coldata.Clear();
                }
            }

            var _off = true == isAxisRotationY ? shape.PositionOffset.X * FPVector2.Right : shape.PositionOffset;

            var _offset = FPVector2.Rotate(_off, fieldtrans->Angle) + (true == isAxisRotationY ? shape.PositionOffset.Y * FPVector2.Up : FPVector2.Zero);

            var _shape = shape.CreateShape(f);

            _shape.LocalTransform.Rotation = _shape.Type == Shape2DType.Polygon ? fieldtrans->Angle : _shape.LocalTransform.Rotation;
            if (isDebug)
            {
                SkillHelper.DrawDebugShape(f,
                    _shape,
                    transform->Position + _shape.Centroid,
                    f.Get<Transform2D>(motionRef).Position + _offset,
                    transform->Rotation,
                    fieldtrans->Angle,
                    DebugColor,
                    isAxisRotationY);
            }

            FPQuaternion.AngleAxis(fieldtrans->Angle, FPVector3.Up);

            var _layer = IsLayerCheck(f);

            HitCollection hits = f.Physics2D.OverlapShape((transform->Position) + _shape.Centroid, 0, _shape, _layer, options: Options);
            for (int i = 0; i < hits.Count; i++)
            {
                EntityRef _entity = hits[i].Entity;
                if (false == CollisionLayerCheck(f, _entity, fieldtrans->Caster, coldata))
                {
                    continue;
                }
                coldata.Add(_entity);
                if (!ispenetration)
                {
                    fieldbool->Isdestroy = true;
                    fieldtrans->Target_entity = _entity;
                    return EntityRef.None;
                }
                if (true == IsNotCheckSignals)
                {
                    continue;
                }
                var hitpoint = new Transform2D();
                hitpoint.Position = hits[i].Point;
                hitpoint.Rotation = FP._0;
                SetHitList(f, fields->parent, fieldtrans);
                SetTarget(f,
                    fieldtrans->Caster, 
                    _entity, 
                    true == isHitPoint ? hitpoint : *transform, 
                    false == issubmotion ? fields->parent : EntityRef.None,
                    fieldtrans->Angle,
                    false,
                    fields->cntIdex,
                    fields->motionindex,
                    fields->chargingpow);

                if (true == istimetolive)
                {
                    fields->StartTime = f.ElapsedTime + penetration_time;
                }
                return _entity;
            }
            return EntityRef.None;
        }
        //충돌된 대상들의 정보를 behaviorskillbase에 저장하여 재사용할 때,
        protected void SetHitList(Frame f, EntityRef parent, MotionFields_Trans* fields_trans)
        {
            if (false == iscollisioncopy)
            {
                return;
            }
            if (false == f.Exists(parent))
            {
                return;
            }
            CollisionStruct* col = f.Unsafe.GetPointer<CollisionStruct>(parent);
            var _list = f.ResolveList(fields_trans->Already_hits);
            col->Already_hits = f.ResolveList(fields_trans->Already_hits);
        }
        //motion을 삭제하기 전, 다음motion이나 등록된 affect로 넘기는 signals
        protected void SetTarget(Frame f, EntityRef caster, EntityRef target, Transform2D starttrans, 
            EntityRef parent, FP angle, QBoolean isEnd, int cntindex, int motionindex, FP chargingpow)
        {
            if (true == isCreateCount)
            {
                f.Signals.MotionSetTarget_Count(caster, target, starttrans, parent, angle, isEnd, cntindex, motionindex, chargingpow);
                return;
            }
            f.Signals.MotionSetTarget(caster, target, starttrans, parent, angle, isEnd, cntindex, motionindex, chargingpow);
        }
        //충돌되었을 때 해당 entity가 같은팀, 몬스터, 오브젝트인지 확인 여부
        public bool CollisionLayerCheck(Frame f, EntityRef hitentity, EntityRef caster, QList<EntityRef> data)
        {
            if(false == f.Exists(caster))
            {
                return false;
            }
            if (true == data.Contains(hitentity))
            {
                return false;
            }
            if (hitentity == caster)
            {
                if(true == isteam)
                {
                    return true;
                }
                return false;
            }
            if (f.TryGet<Status>(hitentity, out var _status))
            {
                var iscondition = StateChangeHelper.StatusConditionCheck(f, hitentity, caster, out int result);
                //false 관통
                //if (false == iscondition)
                //{
                //    return false;
                //}
                
                if (false == isteam && false == iscondition)
                {
                    return false;
                }
                if(true == isteam && result < 0)
                {
                    return false;
                }
                if (_status.IsObject && isnonObjectcol)
                {
                    return false;
                }

                //if (result < 0 && (false == iscondition || true == isteam))
                //{
                //    return false;
                //}
                //if(result > 0 && false == isteam)
                //{
                //    return false;
                //}

                //if (false == iscondition)
                //{
                //    return false;
                //}
                //if(true == iscondition && true == isteam && (result == 0 || result == 2))
                //{
                //    return false;
                //}
            }
            return true;
        }
        //충돌 레이어 체크,
        private int IsLayerCheck(Frame f)
        {
            if(false == IsplatformCheck && false == IsNonCharacter)
            {
                return f.Layers.GetLayerMask("Character", "Enemy", "CharacterPlat");
            }
            if(true == IsplatformCheck && false == IsNonCharacter)
            {
                return f.Layers.GetLayerMask("StaticCollider", "Character", "Enemy", "Platform", "CharacterPlat");
            }
            if(true == IsplatformCheck && true == IsNonCharacter)
            {
                return f.Layers.GetLayerMask("StaticCollider", "Platform");
            }
            return 0;
        } 
    }
}