import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';

interface HeaderProps {
  wsConnected: boolean;
  activeCode?: string;
  onLeaveRoom?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  activeCode,
  onLeaveRoom,
  showBack,
  onBack,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onLeaveRoom && activeCode) {
      onLeaveRoom();
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(10, 10, 10, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Back button, absolutely placed so the brand stays centered */}
      {showBack && (
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            left: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
            transition: 'var(--transition-smooth)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      )}

      {/* Center Brand Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => onLeaveRoom && activeCode && onLeaveRoom()}
      >
        <div
          style={{
            background:
              'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))',
            padding: 8,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--color-accent-glow)',
          }}
        >
          <Share2 size={24} color="white" />
        </div>
        <h1
          className="text-gradient"
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          1SecondSharing
        </h1>
      </div>
    </header>
  );
};

