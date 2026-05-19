import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as S from '../styles/app';
import { supabase } from '../utils/supabase';

export default function Result() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [votes, setVotes] = useState([]);

  const load = async () => {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) return navigate('/login');

    const [{ data: teamData }, { data: voteData }] = await Promise.all([
      supabase.from('teams').select('*').order('created_at'),
      supabase.from('votes').select('*').order('created_at'),
    ]);

    const ids = [...new Set([...(teamData || []).map((t) => t.leader_id), ...(voteData || []).map((v) => v.user_id)].filter(Boolean))];
    const { data: names } = await supabase
      .from('profiles')
      .select('id,name')
      .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

    const namesById = Object.fromEntries((names || []).map((n) => [n.id, n.name]));
    setTeams((teamData || []).map((t) => ({ ...t, leader_name: namesById[t.leader_id] || '미지정' })));
    setVotes((voteData || []).map((v) => ({ ...v, user_name: namesById[v.user_id] || '-' })));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <S.Page>
        <S.HeaderCard>
          <h2>조 결과</h2>
          <S.Meta>형성된 팀을 한눈에 확인합니다.</S.Meta>
        </S.HeaderCard>

        {!teams.length ? (
          <S.Card>
            <S.Meta>아직 생성된 조가 없습니다. 관리 화면에서 조를 먼저 추가하세요.</S.Meta>
          </S.Card>
        ) : null}

        {teams.map((team) => {
          const members = votes.filter((v) => v.team_id === team.id);
          return (
            <S.Card key={team.id}>
              <S.Row>
                <strong>{team.name}</strong>
                <S.Meta>{members.length}명</S.Meta>
              </S.Row>
              <S.Meta style={{ marginTop: 6 }}>조장: {team.leader_name}</S.Meta>
              <S.Meta style={{ marginTop: 8 }}>{members.map((m) => m.user_name).join(', ') || '참가자 없음'}</S.Meta>
            </S.Card>
          );
        })}
      </S.Page>
      <S.TopTabs>
        <S.Tab onClick={() => navigate('/vote')}>투표</S.Tab>
        <S.Tab onClick={() => navigate('/admin')}>조 편성</S.Tab>
        <S.Tab onClick={() => navigate('/roles')}>참가자</S.Tab>
      </S.TopTabs>
    </>
  );
}
