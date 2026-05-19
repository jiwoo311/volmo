import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import * as S from '../styles/app';
import BottomTabs from '../components/BottomTabs';
import { supabase } from '../utils/supabase';

export default function Roles() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState([]);

  const load = async () => {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) return navigate('/login');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single();
    if (profile?.role !== 'admin' && profile?.role !== 'leader') return navigate('/vote');

    const { data } = await supabase.from('profiles').select('*').order('name');
    setMe(profile);
    setProfiles(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id, role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    load();
  };

  const removeUser = async (id) => {
    await supabase.from('votes').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);
    load();
  };

  if (!me) return <S.Page><S.Meta>권한 확인 중...</S.Meta></S.Page>;

  return (
    <>
      <S.Page>
        <S.HeaderCard>
          <h2>참가자 관리</h2>
          <S.Meta>참가자 분들의 권한 등록/수정/삭제가 가능합니다.</S.Meta>
        </S.HeaderCard>

        {profiles.map((p) => (
          <S.Card key={p.id}>
            <S.Row>
              <strong>{p.name}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <S.Meta>{p.role === 'admin' ? '관리자' : '일반'}</S.Meta>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('삭제하시겠습니까?')) return;
                    removeUser(p.id);
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
                  aria-label={`${p.name} 삭제`}
                >
                  <XCircle size={16} />
                </button>
              </div>
            </S.Row>
            <div style={{ marginTop: 8 }}>
              <S.Select
                value={p.role === 'admin' ? 'admin' : 'member'}
                onChange={(e) => updateRole(p.id, e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 12 }}
              >
                <option value="member">일반</option>
                <option value="admin">관리자</option>
              </S.Select>
            </div>
          </S.Card>
        ))}
      </S.Page>
      <BottomTabs active="roles" role={me?.role} />
    </>
  );
}
