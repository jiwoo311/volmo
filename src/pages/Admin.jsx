import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import * as S from '../styles/app';
import BottomTabs from '../components/BottomTabs';
import { supabase } from '../utils/supabase';


export default function Admin() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [setting, setSetting] = useState({ is_open: false });
  const [teams, setTeams] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');

  const parseTeamNumber = (name) => {
    const matched = String(name || '').match(/^(\d+)조$/);
    return matched ? Number(matched[1]) : Number.NaN;
  };

  const normalizeTeamOrder = async (teamData) => {
    const ordered = [...(teamData || [])].sort((a, b) => {
      const aNum = parseTeamNumber(a.name);
      const bNum = parseTeamNumber(b.name);
      if (Number.isNaN(aNum) && Number.isNaN(bNum)) return 0;
      if (Number.isNaN(aNum)) return 1;
      if (Number.isNaN(bNum)) return -1;
      return aNum - bNum;
    });

    let hasGap = false;
    for (let i = 0; i < ordered.length; i += 1) {
      const expectedName = `${i + 1}조`;
      if (ordered[i].name !== expectedName) {
        hasGap = true;
        break;
      }
    }

    if (!hasGap) return ordered;

    for (let i = 0; i < ordered.length; i += 1) {
      const expectedName = `${i + 1}조`;
      if (ordered[i].name !== expectedName) {
        await supabase.from('teams').update({ name: expectedName }).eq('id', ordered[i].id);
      }
    }

    const { data: normalizedTeams, error } = await supabase.from('teams').select('*').order('created_at');
    if (error) return ordered;

    return [...(normalizedTeams || [])].sort((a, b) => parseTeamNumber(a.name) - parseTeamNumber(b.name));
  };

  const load = async () => {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) return navigate('/login');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();
    if (profileError) {
      alert(`프로필 조회 오류: ${profileError.message}`);
      return;
    }
    if (profile?.role !== 'admin' && profile?.role !== 'leader') return navigate('/vote');

    const [{ data: st, error: settingError }, { data: teamData, error: teamError }, { data: people, error: peopleError }] = await Promise.all([
      supabase.from('vote_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('teams').select('*').order('created_at'),
      supabase.from('profiles').select('*').order('name'),
    ]);
    const firstError = settingError || teamError || peopleError;
    if (firstError) {
      alert(`데이터 조회 오류: ${firstError.message}`);
      return;
    }

    const normalizedTeams = await normalizeTeamOrder(teamData || []);

    setMe(profile);
    setSetting(st || { is_open: false });
    setTeams(normalizedTeams);
    setProfiles(people || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createTeam = async () => {
    if (!selectedLeaderId) return;

    const nextNumber =
      teams.reduce((max, team) => {
        const matched = String(team.name || '').match(/^(\d+)조$/);
        if (!matched) return max;
        return Math.max(max, Number(matched[1]));
      }, 0) + 1;
    const nextTeamName = `${nextNumber}조`;

    const { error: createError } = await supabase
      .from('teams')
      .insert({ name: nextTeamName, leader_id: selectedLeaderId });
    if (createError) {
      alert(`조 생성 실패: ${createError.message}`);
      return;
    }
    setSelectedLeaderId('');
    load();
  };

  const assignLeader = async (teamId, leaderId) => {
    await supabase.from('teams').update({ leader_id: leaderId || null }).eq('id', teamId);
    load();
  };

  const deleteTeam = async (teamId) => {
    const targetTeam = teams.find((team) => team.id === teamId);
    const deletedNumber = Number(String(targetTeam?.name || '').match(/^(\d+)조$/)?.[1]);

    await supabase.from('votes').delete().eq('team_id', teamId);
    await supabase.from('teams').delete().eq('id', teamId);

    if (!Number.isNaN(deletedNumber)) {
      const trailingTeams = teams
        .map((team) => ({
          id: team.id,
          number: Number(String(team.name || '').match(/^(\d+)조$/)?.[1]),
        }))
        .filter((team) => team.id !== teamId && !Number.isNaN(team.number) && team.number > deletedNumber)
        .sort((a, b) => a.number - b.number);

      for (const team of trailingTeams) {
        await supabase
          .from('teams')
          .update({ name: `${team.number - 1}조` })
          .eq('id', team.id);
      }
    }

    load();
  };

  const toggleVote = async () => {
    const { error } = await supabase
      .from('vote_settings')
      .upsert(
        {
          id: 1,
          is_open: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) {
      alert(`투표 상태 변경 실패: ${error.message}`);
      return;
    }
    load();
  };

  const startVote = async () => {
    const { error } = await supabase
      .from('vote_settings')
      .upsert(
        {
          id: 1,
          is_open: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) {
      alert(`투표 시작 실패: ${error.message}`);
      return;
    }
    load();
  };

  const restartVote = async () => {
    if (!window.confirm('기존 투표 데이터를 모두 지우고 재시작할까요?')) return;
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
      alert(`투표 데이터 초기화 실패: ${deleteError.message}`);
      return;
    }

    const { error: settingError } = await supabase
      .from('vote_settings')
      .upsert(
        {
          id: 1,
          is_open: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (settingError) {
      alert(`재시작 실패: ${settingError.message}`);
      return;
    }
    load();
  };

  const findName = (id) => profiles.find((profile) => profile.id === id)?.name || '미지정';

  if (!me) return <S.Page><S.Meta>권한 확인 중...</S.Meta></S.Page>;

  return (
    <>
      <S.Page>
        <S.HeaderCard>
          <h2>조 편성 관리</h2>
          <S.Meta>투표 시작/종료 및 팀 생성이 가능합니다.</S.Meta>
        </S.HeaderCard>

        <S.Card>
          <S.Row>
            <S.Meta>투표 상태</S.Meta>
            <strong>{setting.is_open ? '진행 중' : '중지'}</strong>
          </S.Row>
          {setting.is_open ? (
            <div style={{ marginTop: 12 }}>
              <S.PrimaryButton onClick={toggleVote} style={{ background: '#EF4444', color: '#ffffff' }}>
                투표 종료
              </S.PrimaryButton>
            </div>
          ) : (
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <S.PrimaryButton onClick={startVote}>투표 시작</S.PrimaryButton>
              <S.PrimaryButton secondary onClick={restartVote}>재시작</S.PrimaryButton>
            </div>
          )}
        </S.Card>

        <S.Card>
          <S.Meta>팀 추가 (조장 이름 기준 자동 생성)</S.Meta>
          <div style={{ marginTop: 10 }}>
            <S.Select value={selectedLeaderId} onChange={(e) => setSelectedLeaderId(e.target.value)}>
              <option value="">조장 선택</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </S.Select>
          </div>
          <div style={{ marginTop: 12 }}>
            <S.PrimaryButton onClick={createTeam} disabled={!selectedLeaderId}>
              팀 생성
            </S.PrimaryButton>
          </div>
        </S.Card>

        {teams.map((team) => (
          <S.Card key={team.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E8F5E9', color: '#00C853', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                {findName(team.leader_id).slice(0, 1)}
              </div>
              <div>
                <strong>{findName(team.leader_id)}</strong>
                <S.Meta>{team.name}</S.Meta>
              </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm('삭제하시겠습니까?')) return;
                  deleteTeam(team.id);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#111111',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                aria-label={`${team.name} 삭제`}
              >
                <XCircle size={16} />
              </button>
            </div>
            <S.Select value={team.leader_id || ''} onChange={(e) => assignLeader(team.id, e.target.value)}>
              <option value="">조장 미지정</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </S.Select>
          </S.Card>
        ))}
      </S.Page>
      <BottomTabs active="admin" role={me?.role} />
    </>
  );
}
