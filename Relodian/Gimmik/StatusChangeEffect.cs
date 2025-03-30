using Photon.Deterministic;
using System;

namespace Quantum
{
    [Serializable]
    public unsafe partial class StatusChangeEffect : StateEffectConfig
    {

        public override void Start_StateEffect(Frame f, EntityRef caster, EntityRef entity, StateEffectBase* statebase)
        {
            Status* status = f.Unsafe.GetPointer<Status>(entity);

            var addStatus = f.ResolveList(status->addStatus);
            var datalist = f.ResolveList(statebase->stat.value.data_FPlist);
           
            foreach ( var item in datalist )
            {
                addStatus[(int)item.option] += item.data;
            }
        }
        public override void End_StateEffect(Frame f, EntityRef entity, int index, StateEffectBase* statebase)
        {
              Status* status = f.Unsafe.GetPointer<Status>(entity);

            var addStatus = f.ResolveList(status->addStatus);
            var datalist = f.ResolveList(statebase->stat.value.data_FPlist);

            foreach (var item in datalist)
            {
                addStatus[(int)item.option] -= item.data;
            }
        }

    }
}