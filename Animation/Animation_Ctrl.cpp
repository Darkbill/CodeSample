#include "..\Headers\Animation_Ctrl.h"

USING(Engine)

//��Ʈ�ѷ��� ������� �� �ʱ� ����
//ȭ�鱸���� ��Ʈ�ѷ��� ó������ �ΰ��� �����ش�.
CAnimation_Ctrl::CAnimation_Ctrl(LPDIRECT3DDEVICE9 pGraphicDev, LPD3DXANIMATIONCONTROLLER	pAnimation_Ctrl, LPD3DXANIMATIONCONTROLLER	pAnimation_CtrlSec)
	: m_pGraphic_Device(pGraphicDev)
	, m_pAnimation_Ctrl(pAnimation_Ctrl)
	, m_pAnimation_CtrlSec(pAnimation_CtrlSec)
	, m_iMaxNumAniSet(0)
	, m_Period(0.0)
{
	m_pGraphic_Device->AddRef();
	m_pAnimation_Ctrl->AddRef();
	m_pAnimation_CtrlSec->AddRef();
}

//�ִϸ��̼��� ��Ʈ�ѷ�, Ʈ�� ���� ����.
CAnimation_Ctrl::CAnimation_Ctrl(const CAnimation_Ctrl & rhs)
	: m_pGraphic_Device(rhs.m_pGraphic_Device)
	, m_pAnimation_Ctrl(nullptr)
	, m_pAnimation_CtrlSec(nullptr)
	, m_iCurrentTrack(rhs.m_iCurrentTrack)
	, m_iNewTrack(rhs.m_iNewTrack)
	, m_Period(rhs.m_Period)
{
	rhs.m_pAnimation_Ctrl->CloneAnimationController(rhs.m_pAnimation_Ctrl->GetMaxNumAnimationOutputs()
		, m_iMaxNumAniSet = rhs.m_pAnimation_Ctrl->GetNumAnimationSets(), rhs.m_pAnimation_Ctrl->GetMaxNumTracks(), rhs.m_pAnimation_Ctrl->GetMaxNumEvents(), &m_pAnimation_Ctrl);

	rhs.m_pAnimation_CtrlSec->CloneAnimationController(rhs.m_pAnimation_CtrlSec->GetMaxNumAnimationOutputs()
		, m_iMaxNumAniSetSec = rhs.m_pAnimation_CtrlSec->GetNumAnimationSets(), rhs.m_pAnimation_CtrlSec->GetMaxNumTracks(), rhs.m_pAnimation_CtrlSec->GetMaxNumEvents(), &m_pAnimation_CtrlSec);

	m_pGraphic_Device->AddRef();
}

HRESULT CAnimation_Ctrl::Set_AnimationSet(const _uint & iAni_Index)
{
	//��Ʈ�ѷ��� ���� ����ó��.
	//�ִϸ��̼��� ���ų� index���� ������ ���� ���, Fals��ȯ.
	if (iAni_Index == m_iOldAniSetIdx)
		return E_FAIL;

	if (iAni_Index >= m_iMaxNumAniSet)
		return E_FAIL;

	if (nullptr == m_pAnimation_Ctrl)
		return E_FAIL;

	//������ ����Ǿ������ִ� Ʈ���� �������� ���� �ִϸ��̼� Ʈ���� �帧���� �Ѿ��.
	m_iNewTrack = m_iCurrentTrack == 0 ? 1 : 0;

	//���ο� �ִϸ��̼��� �ּҰ��� ������ ����.
	LPD3DXANIMATIONSET		pAniSet = nullptr;

	if (FAILED(m_pAnimation_Ctrl->GetAnimationSet(iAni_Index, &pAniSet)))
		return E_FAIL;

	m_Period = pAniSet->GetPeriod();

	if (FAILED(m_pAnimation_Ctrl->SetTrackAnimationSet(m_iNewTrack, pAniSet)))
		return E_FAIL;

	//Ʈ���� �ִ� Ű ���� ���� ���������ش�.
	m_pAnimation_Ctrl->UnkeyAllTrackEvents(m_iCurrentTrack);
	m_pAnimation_Ctrl->UnkeyAllTrackEvents(m_iNewTrack);

	//���� �ִϸ��̼��� ������ �ش�.
	//����Ʈ���� ��������ʴ� Ű���� ����ð����κ��� ������ ������ �ð��� �ְ� �ӵ��� ����ġ�� ���� �κ��� ���������Ѵ�.
	m_pAnimation_Ctrl->KeyTrackEnable(m_iCurrentTrack, FALSE, m_fTimeAcc + 0.25f);
	m_pAnimation_Ctrl->KeyTrackSpeed(m_iCurrentTrack, 1.0f, m_fTimeAcc, 0.25f, D3DXTRANSITION_LINEAR);
	m_pAnimation_Ctrl->KeyTrackWeight(m_iCurrentTrack, 0.1f, m_fTimeAcc, 0.25f, D3DXTRANSITION_LINEAR);


	//���� ���� Ʈ���� ���� ���� �����ش�.
	//�ִϸ��̼��� ���� �� �������� �ε巴�� ���ϰ� �ϱ� ����.
	if (FAILED(m_pAnimation_Ctrl->SetTrackEnable(m_iNewTrack, TRUE)))
		return E_FAIL;	
	m_pAnimation_Ctrl->KeyTrackSpeed(m_iNewTrack, 1.0f, m_fTimeAcc, 0.25f, D3DXTRANSITION_LINEAR);
	m_pAnimation_Ctrl->KeyTrackWeight(m_iNewTrack, 0.9f, m_fTimeAcc, 0.25f, D3DXTRANSITION_LINEAR);
	
	m_pAnimation_Ctrl->SetTrackPosition(m_iNewTrack, 0.0);

	m_pAnimation_Ctrl->ResetTime();	
	m_fTimeAcc = 0.f;

	m_iOldAniSetIdx = iAni_Index;
	
	//���� Ʈ���� ���Ž����ش�.
	m_iCurrentTrack = m_iNewTrack;
	
	return NOERROR;
}

HRESULT CAnimation_Ctrl::Set_AnimationSetSec(const _uint & iAni_Index)
{
	if (iAni_Index == m_iOldAniSetIdxSec)
		return E_FAIL;

	if (iAni_Index >= m_iMaxNumAniSetSec)
		return E_FAIL;

	if (nullptr == m_pAnimation_CtrlSec)
		return E_FAIL;

	m_iNewTrackSec = m_iCurrentTrackSec == 0 ? 1 : 0;

	LPD3DXANIMATIONSET		pAniSet = nullptr;

	if (FAILED(m_pAnimation_CtrlSec->GetAnimationSet(iAni_Index, &pAniSet)))
		return E_FAIL;

	m_PeriodSec = pAniSet->GetPeriod();

	if (FAILED(m_pAnimation_CtrlSec->SetTrackAnimationSet(m_iNewTrackSec, pAniSet)))
		return E_FAIL;

	m_pAnimation_CtrlSec->UnkeyAllTrackEvents(m_iCurrentTrackSec);
	m_pAnimation_CtrlSec->UnkeyAllTrackEvents(m_iNewTrackSec);


	m_pAnimation_CtrlSec->KeyTrackEnable(m_iCurrentTrackSec, FALSE, m_fTimeAccSec + 0.25f);
	m_pAnimation_CtrlSec->KeyTrackSpeed(m_iCurrentTrackSec, 1.0f, m_fTimeAccSec, 0.25f, D3DXTRANSITION_LINEAR);
	m_pAnimation_CtrlSec->KeyTrackWeight(m_iCurrentTrackSec, 0.1f, m_fTimeAccSec, 0.25f, D3DXTRANSITION_LINEAR);



	if (FAILED(m_pAnimation_CtrlSec->SetTrackEnable(m_iNewTrackSec, TRUE)))
		return E_FAIL;
	m_pAnimation_CtrlSec->KeyTrackSpeed(m_iNewTrackSec, 1.0f, m_fTimeAccSec, 0.25f, D3DXTRANSITION_LINEAR);
	m_pAnimation_CtrlSec->KeyTrackWeight(m_iNewTrackSec, 0.9f, m_fTimeAccSec, 0.25f, D3DXTRANSITION_LINEAR);

	m_pAnimation_CtrlSec->SetTrackPosition(m_iNewTrackSec, 0.0);

	m_pAnimation_CtrlSec->ResetTime();
	m_fTimeAccSec = 0.f;

	m_iOldAniSetIdxSec = iAni_Index;

	m_iCurrentTrackSec = m_iNewTrackSec;

	return NOERROR;
}

//�ִϸ��̼��� ����Ǿ��� �� �ش� Ʈ���� ��������ش�.
_bool CAnimation_Ctrl::is_Finish_Animation(void)
{
	D3DXTRACK_DESC			Track_Desc;
	ZeroMemory(&Track_Desc, sizeof(D3DXTRACK_DESC));

	m_pAnimation_Ctrl->GetTrackDesc(m_iCurrentTrack, &Track_Desc);

	if (Track_Desc.Position >= m_Period)
		return true;

	return false;
}

_bool CAnimation_Ctrl::is_Finish_AnimationSec(void)
{
	D3DXTRACK_DESC			Track_Desc;
	ZeroMemory(&Track_Desc, sizeof(D3DXTRACK_DESC));

	m_pAnimation_CtrlSec->GetTrackDesc(m_iCurrentTrackSec, &Track_Desc);

	if (Track_Desc.Position >= m_PeriodSec)
		return true;

	return false;
}

HRESULT CAnimation_Ctrl::Ready_Animation_Ctrl(void)
{
	return NOERROR;
}
//�ִϸ��̼��� �ʱ� ���.
void CAnimation_Ctrl::Play_Animation(const _float & fTimeDelta)
{
	if (nullptr == m_pAnimation_Ctrl)
		return;

	m_pAnimation_Ctrl->AdvanceTime(fTimeDelta, nullptr);

	m_fTimeAcc += fTimeDelta;
}

void CAnimation_Ctrl::Play_AnimationSec(const _float & fTimeDelta)
{
	if (nullptr == m_pAnimation_CtrlSec)
		return;

	m_pAnimation_CtrlSec->AdvanceTime(fTimeDelta, nullptr);

	m_fTimeAccSec += fTimeDelta;
}

CAnimation_Ctrl * CAnimation_Ctrl::Create(LPDIRECT3DDEVICE9 pGraphicDev, LPD3DXANIMATIONCONTROLLER	pAnimation_Ctrl, LPD3DXANIMATIONCONTROLLER	pAnimation_CtrlSec)
{
	CAnimation_Ctrl *	pInstance = new CAnimation_Ctrl(pGraphicDev, pAnimation_Ctrl, pAnimation_CtrlSec);

	if (FAILED(pInstance->Ready_Animation_Ctrl()))
	{
		MessageBox(0, L"CAnimation_Ctrl Created Failed", nullptr, MB_OK);
		Engine::Safe_Release(pInstance);
	}
	return pInstance;
}

//�ִϸ��̼� ��Ʈ�ѷ��� ����
CAnimation_Ctrl * CAnimation_Ctrl::Create(const CAnimation_Ctrl & rhs)
{
	CAnimation_Ctrl *	pInstance = new CAnimation_Ctrl(rhs);

	if (FAILED(pInstance->Ready_Animation_Ctrl()))
	{
		MessageBox(0, L"CAnimation_Ctrl Clone Failed", nullptr, MB_OK);
		Engine::Safe_Release(pInstance);
	}
	return pInstance;
}

//�����Ǿ��� �� �޸�����
_ulong CAnimation_Ctrl::Free(void)
{
	Safe_Release(m_pAnimation_Ctrl);
	Safe_Release(m_pAnimation_CtrlSec);
	Safe_Release(m_pGraphic_Device);

	return _ulong();
}
