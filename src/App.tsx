import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoomWebSocket } from './lib/useRoomWebSocket';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { JoinRoomView } from './components/JoinRoomView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { TransferRoomView } from './components/TransferRoomView';
import { Toast } from './components/Toast';
import { ShieldCheck, HardDrive, Zap } from 'lucide-react';

export default function App() {
  const {
    screen,
    wsConnected,
    errorMessage,
    setErrorMessage,
    roomClosedNotice,
    setRoomClosedNotice,
    roomState,
    transfers,
    sharedTexts,
    p2pConnected,
    createRoom,
    joinRoom,
    closeRoom,
    sendFiles,
    sendText,
    setScreen,
  } = useRoomWebSocket();

  const handleHeaderBack = () => {
    if (screen === 'waiting' || screen === 'transfer') {
      closeRoom();
    } else if (screen === 'join') {
      setScreen('home');
      setErrorMessage(null);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden text-white selection:bg-violet-500 selection:text-white">
      {/* Ambient background orbs */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '40vw',
            height: '40vw',
            background:
              'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '30vw',
            height: '30vw',
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <Header
        wsConnected={wsConnected}
        activeCode={roomState.code}
        onLeaveRoom={closeRoom}
        showBack={screen !== 'home'}
        onBack={handleHeaderBack}
      />

      {/* Main Content View with Smooth Page Transitions */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {/* Bottom vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'linear-gradient(rgba(5, 5, 5, 0) 0%, rgb(10, 10, 15) 100%)',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
        <div className="animated-grid" aria-hidden="true" />

        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <HomeView
              key="home"
              onCreateRoom={createRoom}
              onNavigateToJoin={() => setScreen('join')}
              onJoinRoom={joinRoom}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          )}

          {screen === 'join' && (
            <JoinRoomView
              key="join"
              onJoinRoom={joinRoom}
              onBackHome={() => {
                setScreen('home');
                setErrorMessage(null);
              }}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          )}

          {screen === 'waiting' && (
            <WaitingRoomView
              key="waiting"
              code={roomState.code}
              onCloseRoom={closeRoom}
            />
          )}

          {screen === 'transfer' && (
            <TransferRoomView
              key="transfer"
              code={roomState.code}
              role={roomState.role}
              p2pConnected={p2pConnected}
              transfers={transfers}
              onSendFiles={sendFiles}
              onCloseRoom={closeRoom}
            />
          )}

        </AnimatePresence>
      </main>

      <Toast
        message={roomClosedNotice}
        onDismiss={() => setRoomClosedNotice(null)}
      />

    </div>
  );
}
