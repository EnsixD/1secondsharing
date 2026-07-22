import React from 'react';
import { motion } from 'motion/react';
import { LogOut, RotateCcw } from 'lucide-react';

interface RoomClosedModalProps {
  onReturnHome: () => void;
}

export const RoomClosedModal: React.FC<RoomClosedModalProps> = ({ onReturnHome }) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-16 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full p-8 rounded-2xl bg-[#111218] border border-zinc-800 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-5">
          <LogOut className="w-6 h-6 text-rose-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Room Session Closed</h2>
        <p className="text-zinc-400 text-xs max-w-sm mb-8 leading-relaxed">
          The peer has left or closed the room. All ephemeral memory channels have been shredded.
        </p>

        <button
          onClick={onReturnHome}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-950/50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>
      </motion.div>
    </div>
  );
};
