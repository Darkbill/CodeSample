using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public struct tagAStarNode
{
    public float fCost;
    public Vector2 vIndex;
    public tagAStarNode[] pParent;
}

public class AStar
{
    List<tagAStarNode> l_tOpenList = new List<tagAStarNode>();
    List<tagAStarNode> l_tCloseList = new List<tagAStarNode>();
    List<Vector2> l_vBestList = new List<Vector2>();

    Vector2 m_vStartIndex;
    Vector2 m_vEndIndex;

    int m_iMapSizeX;
    int m_iMapSizeY;

    //List<Tile> l_tiMapTileSet = new List<Tile>();
    Tile[,] l_tiMapTileSet;

    public List<Vector3> GetBestList()
    {
        List<Vector3> setPos = new List<Vector3>();

        for(int i = 0;i<l_vBestList.Count;++i)
        {
            Vector3 atof = new Vector3(-l_vBestList[i].x, 
                l_tiMapTileSet[(int)l_vBestList[i].x, (int)l_vBestList[i].y].transform.position.y,
                l_vBestList[i].y);
            setPos.Add(atof);
        }
        return setPos;
    }

    public void AStarStartPos(Vector3 vStartPos, Vector3 vEndPos, Tile[,] lMapSet, int iSizX, int iSizY)
    {
        //시작지점과 마지막지점
        l_tiMapTileSet = lMapSet;
        m_iMapSizeX = iSizX;
        m_iMapSizeY = iSizY;

        m_vStartIndex = new Vector2(-Mathf.RoundToInt(vStartPos.x), Mathf.RoundToInt(vStartPos.z));
        m_vEndIndex = new Vector2(Mathf.RoundToInt(vEndPos.x), Mathf.RoundToInt(vEndPos.y));

        AStarStart(m_vStartIndex, m_vEndIndex);
    }

    void AStarStart(Vector2 iStartIndex, Vector2 IEndIndex)
    {
        if (iStartIndex == IEndIndex)
            return;

        if (l_tiMapTileSet.Length == 0)
            return;
        //불가이동타일 처리
        if(l_tiMapTileSet[(int)IEndIndex.x, (int)IEndIndex.y].GetOption() != 1)
        {
            Debug.Log("Not MoveTile!!");
            return;
        }

        Release();
        MakeRute();
    }

    void MakeRute()
    {
        tagAStarNode pFirst_Node = new tagAStarNode();
        pFirst_Node.vIndex = m_vStartIndex;
        pFirst_Node.pParent = null;
        pFirst_Node.fCost = 0.0f;

        l_tCloseList.Add(pFirst_Node);

        tagAStarNode pMake_Node = new tagAStarNode();
        Vector2 vIndex = new Vector2();

        while(true)
        {
            //up
            vIndex = pFirst_Node.vIndex + new Vector2(0.0f, -1.0f);
            if(vIndex.y >= 0 && 
                (int)l_tiMapTileSet[(int)vIndex.x, (int)vIndex.y].GetOption() == 1 &&
                listCheck(vIndex))
            {
                pMake_Node = MakeNode(vIndex, pFirst_Node);
                l_tOpenList.Add(pMake_Node);   
            }

            //down
            vIndex = pFirst_Node.vIndex + new Vector2(0.0f, 1.0f);
            if (vIndex.y <= m_iMapSizeY &&
                (int)l_tiMapTileSet[(int)vIndex.x, (int)vIndex.y].GetOption() == 1 &&
                listCheck(vIndex))
            {
                pMake_Node = MakeNode(vIndex, pFirst_Node);
                l_tOpenList.Add(pMake_Node);
            }

            //right
            vIndex = pFirst_Node.vIndex + new Vector2(1.0f, 0.0f);
            if (vIndex.x < m_iMapSizeX &&
                (int)l_tiMapTileSet[(int)vIndex.x, (int)vIndex.y].GetOption() == 1 &&
                listCheck(vIndex))
            {
                pMake_Node = MakeNode(vIndex, pFirst_Node);
                l_tOpenList.Add(pMake_Node);
            }

            //left
            vIndex = pFirst_Node.vIndex + new Vector2(-1.0f, 0.0f);
            if (vIndex.x >= 0 &&
                (int)l_tiMapTileSet[(int)vIndex.x, (int)vIndex.y].GetOption() == 1 &&
                listCheck(vIndex))
            {
                pMake_Node = MakeNode(vIndex, pFirst_Node);
                l_tOpenList.Add(pMake_Node);
            }

            //상하좌우 다해주고 정렬
            l_tOpenList.Sort(delegate (tagAStarNode pNode01, tagAStarNode pNode02)
            {
                if (pNode01.fCost < pNode02.fCost) return -1;
                else if (pNode01.fCost > pNode02.fCost) return 1;
                return 0;
            });

            if(l_tOpenList.Count == 0)
            {
                Debug.Log("!!AStar Error!!_Not Found OpenList");
                return;
            }

            //가장 적은 비용의 타일
            tagAStarNode ptag = l_tOpenList[0];
            pFirst_Node = ptag;
            l_tCloseList.Add(ptag);
            l_tOpenList.Remove(ptag);

            if(pFirst_Node.vIndex == m_vEndIndex)
            {
                //best node를 얻어내자
                while(true)
                {
                    l_vBestList.Add(pFirst_Node.vIndex);
                    //도착지점에서부터 시작지점까지의 노드
                    pFirst_Node = pFirst_Node.pParent[0];

                    if (pFirst_Node.vIndex == m_vStartIndex)
                        break;
                }
                l_vBestList.Reverse();
                break;
            }
        }
    }

    tagAStarNode MakeNode(Vector2 vIndex, tagAStarNode pParent)
    {
        tagAStarNode pNode = new tagAStarNode();

        pNode.vIndex = vIndex;
        pNode.pParent = new tagAStarNode[1];
        pNode.pParent[0] = pParent;

        Vector2 fDist = vIndex - pParent.vIndex;

        //플레이어 위치에서 인접한 노드의 거리
        float fPlayerCost = fDist.magnitude;
        //인접타일에서부터 도착지점까지 거리
        fDist = vIndex - m_vEndIndex;

        float fEndCost = fDist.magnitude;
        //플레이어 위치에서 도착지점까지의 거리
        pNode.fCost = fPlayerCost + fEndCost;

        return pNode;
    }

    bool listCheck(Vector2 vIndex)
    {
        for(int i = 0;i<l_tOpenList.Count;++i)
        {
            if (l_tOpenList[i].vIndex == vIndex)
                return false;
        }

        for(int i = 0;i<l_tCloseList.Count;++i)
        {
            if (l_tCloseList[i].vIndex == vIndex)
                return false;
        }
        return true;
    }

    void Release()
    {
        if(l_tOpenList.Count != 0)
            l_tOpenList.Clear();
        if(l_tCloseList.Count != 0)
            l_tCloseList.Clear();
        if(l_vBestList.Count != 0)
            l_vBestList.Clear();
    }
}
