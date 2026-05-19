import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheckBig } from 'lucide-react';
import * as S from '../styles/app';
import BottomTabs from '../components/BottomTabs';
import { supabase } from '../utils/supabase';

const MAX = 4;
const avatarStyle = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: '#E8F5E9',
  color: '#00C853',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 13,
  flexShrink: 0,
};

export default function Vote() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [setting, setSetting] = useState({ is_open: false });
  const [teams, setTeams] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const myVote = useMemo(() => votes.find((v) => v.user_id === me?.id), [votes, me]);
  const effectiveSelectedTeamId = myVote?.team_id || selectedTeamId;

  const load = async () => {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) return navigate('/login');

    const [{ data: profile }, { data: st }, { data: teamData }, { data: voteData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('vote_settings').select('*').eq('id', 1).single(),
      supabase.from('teams').select('*').order('created_at'),
      supabase.from('votes').select('*').order('created_at'),
    ]);

    const ids = [...new Set([...(teamData || []).map((t) => t.leader_id), ...(voteData || []).map((v) => v.user_id)].filter(Boolean))];
    const { data: names } = await supabase
      .from('profiles')
      .select('id,name')
      .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

    const namesById = Object.fromEntries((names || []).map((n) => [n.id, n.name]));

    const nextTeams = (teamData || []).map((t) => ({ ...t, leader_name: namesById[t.leader_id] || '미지정' }));
    const nextVotes = (voteData || []).map((v) => ({ ...v, user_name: namesById[v.user_id] || '익명' }));

    setMe(profile);
    setSetting(st || { is_open: false });
    setTeams(nextTeams);
    setVotes(nextVotes);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('vote-page-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vote_settings', filter: 'id=eq.1' },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      load();
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const byTeam = (teamId) => votes.filter((v) => v.team_id === teamId);

  const sortedTeams = teams;

  const vote = async (teamId) => {
    const count = byTeam(teamId).length;
    if (count >= MAX) return;
    await supabase.from('votes').upsert({ user_id: me.id, team_id: teamId }, { onConflict: 'user_id' });
    setSelectedTeamId(null);
    load();
  };

  const confirmVote = async () => {
    if (!selectedTeamId) return;
    await vote(selectedTeamId);
  };

  if (loading) return <S.Page><S.Meta>불러오는 중...</S.Meta></S.Page>;

  return (
    <>
      <S.Page>
        <S.HeaderCard>
          <S.Row>
            <div>
              <h2>{setting?.is_open ? '팀 투표' : '팀 결과'}</h2>
              <S.Meta>{me?.name} · {setting?.is_open ? '투표 진행 중' : '투표 종료/결과 확인'}</S.Meta>
            </div>
            <S.PrimaryButton secondary onClick={() => { localStorage.removeItem('profileId'); navigate('/login'); }} style={{ width: 'auto', padding: '10px 12px' }}>로그아웃</S.PrimaryButton>
          </S.Row>
        </S.HeaderCard>

        {setting?.is_open && !myVote ? (
          <S.Card highlight>
            <S.Meta>
              현재 선택: {teams.find((t) => t.id === effectiveSelectedTeamId)?.name || '선택 안함'}
            </S.Meta>
            <div style={{ marginTop: 12 }}>
              <S.PrimaryButton
                secondary={false}
                disabled={!selectedTeamId}
                onClick={confirmVote}
              >
                투표 확정
              </S.PrimaryButton>
            </div>
          </S.Card>
        ) : null}

        {sortedTeams.map((team) => {
          const members = byTeam(team.id);
          const full = members.length >= MAX;
          const mine = effectiveSelectedTeamId === team.id;
          const canSeeNames = me?.role === 'admin' || me?.id === team.leader_id || !setting?.is_open;
          const leaderInitial = (team.leader_name || '?').slice(0, 1);
          const visibleNames = canSeeNames ? members.map((m) => m.user_name) : [];

          return (
            <S.Card
              key={team.id}
              selected={mine}
              onClick={() => {
                if (!setting?.is_open) return;
                if (myVote) return;
                if (full && !mine) return;
                setSelectedTeamId((prev) => (prev === team.id ? null : team.id));
              }}
              style={{
                transition: 'all .3s ease',
                cursor: setting?.is_open && !myVote && (!full || mine) ? 'pointer' : 'default',
                opacity: setting?.is_open && effectiveSelectedTeamId && !mine ? 0.45 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={avatarStyle}>{leaderInitial}</div>
                  <div>
                    <strong>{team.leader_name}</strong>
                    <S.Meta>{team.name}</S.Meta>
                  </div>
                </div>
                {setting?.is_open ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <CircleCheckBig size={18} color={mine ? '#22C55E' : '#9CA3AF'} strokeWidth={2.3} />
                    <S.Meta>{members.length}/{MAX}</S.Meta>
                  </div>
                ) : (
                  <S.Meta>{members.length}/{MAX}</S.Meta>
                )}
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {canSeeNames ? (
                    visibleNames.length ? (
                      visibleNames.map((name) => (
                        <span key={`${team.id}-${name}`} style={{ fontSize: 12, padding: '5px 9px', borderRadius: 999, background: '#F3F4F6', color: '#374151' }}>
                          {name}
                        </span>
                      ))
                  ) : (
                    <S.Meta>아직 없음</S.Meta>
                  )
                ) : null}
                </div>
              </div>
            </S.Card>
          );
        })}
      </S.Page>

      <BottomTabs active="vote" role={me?.role} guardAdmin />
    </>
  );
}
