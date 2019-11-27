
// 전역변수는 상수화되어있다.
// 전역변수는 클라이언트로부터 값을 받아올 수 있다.
// float				g_fData = 10.f;

// For.Directional
vector				g_vLight_Direction;
vector				g_vLight_Diffuse;
vector				g_vLight_Ambient;
vector				g_vLight_Specular;

// For.Material
vector				g_vMaterial_Diffuse;
vector				g_vMaterial_Ambient;
vector				g_vMaterial_Specular;
float				g_fPower;

// For.Camera
vector				g_vCamera_Position;

// float4x4
matrix				g_matWorld, g_matView, g_matProj;

texture				g_BaseTexture;

sampler BaseSampler = sampler_state
{
	texture = g_BaseTexture;
	minfilter = linear;
	magfilter = linear;
	mipfilter = linear;
};

texture				g_DestTexture;

sampler DestSampler = sampler_state
{
	texture = g_DestTexture;
	minfilter = linear;
	magfilter = linear;
	mipfilter = linear;
};

// VertexShader
// 리턴 함수이름(인자값) { }

/*정점inLocalSpace*/
struct VS_IN
{
	// 위치
	float3		vPosition : POSITION;

	float3		vNormal : NORMAL;
	// 텍스쳐 uv좌표
	float2		vTexUV : TEXCOORD0;
};

struct VS_OUT
{
	vector		vPosition : POSITION;
	vector		vShade : COLOR0;
	vector		vSpecular : COLOR1;
	float2		vTexUV : TEXCOORD0;	
	vector		vWorldPos : TEXCOORD1;
};

// VS_MAIN(vector		vPosition : POSITION, float2		vTexUV : TEXCOORD0)

// 버텍스 셰이더를 수행하기위한 메인함수.
VS_OUT VS_MAIN(VS_IN In)
{
	VS_OUT			Out = (VS_OUT)0;

	matrix			matWV, matWVP;

	matWV = mul(g_matWorld, g_matView);
	matWVP = mul(matWV, g_matProj);

	// 

	vector			vNormal_World = mul(vector(In.vNormal, 0.f), g_matWorld);

	

	Out.vShade = max(dot(normalize(g_vLight_Direction) * -1.f, normalize(vNormal_World)), 0.f);

	vector				vLook, vReflect;
	vector				vPos_World = mul(vector(In.vPosition, 1.f), g_matWorld);

	vLook = vPos_World - g_vCamera_Position;

	vReflect = reflect(g_vLight_Direction, vNormal_World);

	Out.vSpecular = pow(max(dot(normalize(vLook) * -1.f, normalize(vReflect)), 0.f), g_fPower);

	Out.vPosition = mul(vector(In.vPosition, 1.f), matWVP);

	Out.vWorldPos = mul(vector(In.vPosition, 1.f), g_matWorld);

	Out.vTexUV = In.vTexUV;

	

	return Out;
}

struct PS_IN
{
	vector		vPosition : POSITION;
	vector		vShade : COLOR0;
	vector		vSpecular : COLOR1;
	float2		vTexUV : TEXCOORD0;	
	vector		vWorldPos : TEXCOORD1;
};

struct PS_OUT
{
	vector		vColor : COLOR0;
};

PS_OUT PS_MAIN(PS_IN In)
{
	PS_OUT		Out = (PS_OUT)0;

	vector	vColor;

	vColor = tex2D(BaseSampler, In.vTexUV);	

	Out.vColor = (vColor * (g_vLight_Diffuse * g_vMaterial_Diffuse)) * saturate(In.vShade + (g_vLight_Ambient * g_vMaterial_Ambient))
		+ (g_vLight_Specular * g_vMaterial_Specular) * In.vSpecular;

	//vector			vColor_Fog = (vector)1.f;
	vector			vColor_Fog = vector(1.f, 0.f, 0.f, 1.f);

	float			fDistance = length(In.vWorldPos - g_vCamera_Position) / 100;

	Out.vColor = Out.vColor * (1.f - fDistance) + vColor_Fog * fDistance;

	return Out;
}

technique Default_Device
{
	pass Not_Lighting
	{
		Lighting = false;
		CullMode = ccw;		
		VertexShader = compile vs_3_0 VS_MAIN();
		PixelShader = compile ps_3_0 PS_MAIN();
	}

	pass Texture_Mapping
	{		
		AlphaTestEnable = true;
		AlphaRef = 0x00;
		AlphaFunc = greater;

		VertexShader = compile vs_3_0 VS_MAIN();
		PixelShader = compile ps_3_0 PS_MAIN();
	}
};
