import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import * as S from '../styles/app';

export default function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return setError('이름을 입력해주세요.');
    setLoading(true);
    setError('');

    const { data: found, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('name', trimmedName)
      .maybeSingle();

    if (findError) {
      setError(findError.message);
      setLoading(false);
      return;
    }

    if (found) {
      localStorage.setItem('profileId', found.id);
      navigate('/vote');
      return;
    }

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ name: trimmedName, role: 'member' })
      .select()
      .single();

    if (createError) {
      if (createError.message?.includes('row-level security policy')) {
        setError('가입 권한이 없어 계정 생성이 차단되었습니다. 관리자에게 RLS 정책 확인을 요청해주세요.');
      } else {
        setError(createError.message);
      }
      setLoading(false);
      return;
    }

    localStorage.setItem('profileId', created.id);
    navigate('/vote');
  };

  return (
    <S.Page>
      <S.HeaderCard style={{ background: '#ffffff' }}>
        <h1>Make The Team</h1>
        <S.Meta>하단의 입력창에 자신의 이름을 적어 입장해주세요.</S.Meta>
      </S.HeaderCard>

      <S.Card as="form" onSubmit={submit}>
        <S.Meta style={{ marginBottom: 10 }}>참가자 이름</S.Meta>
        <S.Input placeholder="이름 입력" value={name} onChange={(e) => setName(e.target.value)} />
        {error ? <S.Meta style={{ color: 'var(--danger)', marginTop: 10 }}>{error}</S.Meta> : null}
        <div style={{ marginTop: 14 }}>
          <S.PrimaryButton type="submit" disabled={loading}>{loading ? '확인 중...' : '입장하기'}</S.PrimaryButton>
        </div>
      </S.Card>
    </S.Page>
  );
}
