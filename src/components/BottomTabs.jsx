import { useNavigate } from 'react-router-dom';
import { Tab, TopTabs } from '../styles/app';

const isAdminRole = (role) => role === 'admin' || role === 'leader';

export default function BottomTabs({ active, role, guardAdmin = false }) {
  const navigate = useNavigate();
  const isAdmin = isAdminRole(role);

  const move = (path, adminOnly = false) => {
    if (guardAdmin && adminOnly && !isAdminRole(role)) {
      alert('관리자 계정만 접근할 수 있습니다.');
      return;
    }
    navigate(path);
  };

  return (
    <TopTabs>
      <Tab active={active === 'vote'} onClick={() => move('/vote')}>투표</Tab>
      <Tab
        active={active === 'admin'}
        onClick={() => move('/admin', true)}
        style={guardAdmin && !isAdmin ? { opacity: 0.45 } : undefined}
      >
        조 편성
      </Tab>
      <Tab
        active={active === 'roles'}
        onClick={() => move('/roles', true)}
        style={guardAdmin && !isAdmin ? { opacity: 0.45 } : undefined}
      >
        참가자
      </Tab>
    </TopTabs>
  );
}
