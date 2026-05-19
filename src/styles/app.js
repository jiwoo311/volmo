import { createGlobalStyle, styled, keyframes } from 'styled-components';

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

export const GlobalStyle = createGlobalStyle`
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

  :root {
    --bg: #ffffff;
    --panel: #ffffff;
    --panel-soft: #f8fafc;
    --deep-green: #00C853;
    --gold: #0EA5E9;
    --ivory: #EEF2FF;
    --text-main: #111827;
    --text-sub: #6b7280;
    --line: rgba(17, 24, 39, 0.12);
    --success: #22C55E;
    --warn: #F59E0B;
    --danger: #EF4444;
    --radius-2xl: 22px;
  }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

  body {
    margin: 0;
    font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #ffffff;
    color: var(--text-main);
  }

  h1, h2, h3, h4, h5 { letter-spacing: -0.01em; font-weight: 700; margin: 0; }
  p { line-height: 1.5; margin: 0; }
  button, input, select { font: inherit; color: inherit; }
`;

export const PageShell = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0;
  background: #ffffff;
`;

export const MobileFrame = styled.main`
  width: 100%;
  max-width: 430px;
  height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid var(--line);
  border-radius: 0;
  box-shadow: 0 16px 40px rgba(17, 24, 39, 0.08);
  backdrop-filter: blur(10px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export const Page = styled.section`
  padding: 20px 18px 96px;
  animation: ${floatIn} 0.35s ease;
`;

export const HeaderCard = styled.div`
  background: linear-gradient(160deg, #ffffff, #f8fafc);\
  border: 1px solid var(--line);
  border-radius: var(--radius-2xl);
  padding: 18px;
  margin-bottom: 14px;
`;

export const Card = styled.div`
  background: #ffffff;
  border: 1px solid ${(p) => (p.selected ? 'rgba(14,165,233,0.6)' : 'var(--line)')};
  border-radius: var(--radius-2xl);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.16);
  transition: transform .22s ease, border-color .22s ease, background .22s ease;

  &:hover { transform: translateY(-2px); }
  &:active { transform: scale(0.99); }
`;

export const PrimaryButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 18px;
  padding: 13px 14px;
  background: ${(p) => (p.secondary ? '#f3f4f6' : '#00C853')};
  color: ${(p) => (p.secondary ? '#111827' : '#ffffff')};
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: transform .16s ease, filter .16s ease;

  &:disabled { opacity: .45; cursor: not-allowed; }
  &:active { transform: scale(0.98); }
  &:hover:not(:disabled) { filter: brightness(1.05); }
`;

export const Input = styled.input`
  width: 100%;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: #ffffff;
  padding: 13px 14px;
  outline: none;

  &:focus { border-color: rgba(14,165,233,0.75); box-shadow: 0 0 0 3px rgba(14,165,233,0.14); }
`;

export const Select = styled.select`
  width: 100%;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: #ffffff;
  padding: 12px;
`;

export const TopTabs = styled.nav`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid var(--line);
`;

export const Tab = styled.button`
  border: 1px solid ${(p) => (p.active ? 'rgba(14,165,233,0.55)' : 'var(--line)')};
  background: ${(p) => (p.active ? 'rgba(14,165,233,0.12)' : '#ffffff')};
  color: var(--text-main);
  border-radius: 14px;
  padding: 10px 6px;
  font-size: 12px;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const Meta = styled.p`
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.5;
`;

export const CopyRight = styled.p`
  position: absolute;
  white-space: nowrap;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--text-sub);
`;