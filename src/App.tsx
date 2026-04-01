/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Clock, 
  Bell, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft,
  AlarmClock,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Square,
  Music
} from 'lucide-react';

// Constants
const CYCLE_MINUTES = 90;
const DEFAULT_CYCLES = 5; // 7.5 hours

const ALARM_SOUNDS = [
  { id: 'default', name: 'System Default', type: 'system' },
  { id: 'gentle', name: 'Gentle Breeze', type: 'custom' },
  { id: 'energetic', name: 'Morning Energy', type: 'custom' },
  { id: 'birds', name: 'Forest Birds', type: 'custom' },
];

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCycles, setSelectedCycles] = useState(DEFAULT_CYCLES);
  const [isBackwardsMode, setIsBackwardsMode] = useState(false);
  const [targetTime, setTargetTime] = useState("07:00");
  const [alarmSet, setAlarmSet] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  
  // Sound Selection State
  const [availableSounds, setAvailableSounds] = useState(ALARM_SOUNDS);
  const [selectedSound, setSelectedSound] = useState(ALARM_SOUNDS[0]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [activeAlarmTime, setActiveAlarmTime] = useState<string | null>(null);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedCycles = localStorage.getItem('sleep_cycles');
    const savedSoundId = localStorage.getItem('sleep_sound_id');
    const savedAlarmActive = localStorage.getItem('sleep_alarm_active') === 'true';
    const savedAlarmTime = localStorage.getItem('sleep_alarm_time');
    const savedVibration = localStorage.getItem('sleep_vibration_enabled');

    if (savedCycles) setSelectedCycles(parseInt(savedCycles));
    if (savedSoundId) {
      const sound = availableSounds.find(s => s.id === savedSoundId);
      if (sound) setSelectedSound(sound);
    }
    if (savedAlarmActive) {
      setIsAlarmActive(true);
      setActiveAlarmTime(savedAlarmTime);
    }
    if (savedVibration !== null) {
      setIsVibrationEnabled(savedVibration === 'true');
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sleep_cycles', selectedCycles.toString());
    localStorage.setItem('sleep_sound_id', selectedSound.id);
    localStorage.setItem('sleep_alarm_active', isAlarmActive.toString());
    localStorage.setItem('sleep_vibration_enabled', isVibrationEnabled.toString());
    if (activeAlarmTime) localStorage.setItem('sleep_alarm_time', activeAlarmTime);
  }, [selectedCycles, selectedSound, isAlarmActive, activeAlarmTime, isVibrationEnabled]);

  // ... existing useEffect for current time ...

  const handleToggleAlarm = () => {
    if (isAlarmActive) {
      // Cancel Alarm
      setIsAlarmActive(false);
      setActiveAlarmTime(null);
      setAlarmSet(false);
    } else {
      // Set Alarm
      const timeStr = formatTime(calculatedWakeUpTime);
      setIsAlarmActive(true);
      setActiveAlarmTime(timeStr);
      setAlarmSet(true);
      setShowAlarmModal(true);
      stopPreview();
      setTimeout(() => setShowAlarmModal(false), 3000);
    }
  };

  const handleAddCustomSound = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newSound = {
        id: `custom-${Date.now()}`,
        name: file.name,
        uri: URL.createObjectURL(file),
        isCustom: true
      };
      setAvailableSounds(prev => [...prev, newSound]);
      setSelectedSound(newSound);
    }
  };

  // Calculate wake-up time based on current time + cycles
  const calculatedWakeUpTime = useMemo(() => {
    const date = new Date(currentTime);
    date.setMinutes(date.getMinutes() + selectedCycles * CYCLE_MINUTES);
    return date;
  }, [currentTime, selectedCycles]);

  // Calculate sleep times based on target wake-up time
  const suggestedSleepTimes = useMemo(() => {
    const [hours, minutes] = targetTime.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    // If target is earlier than now, assume it's for tomorrow
    if (target < currentTime) {
      target.setDate(target.getDate() + 1);
    }

    return [6, 5, 4].map(cycles => {
      const sleepTime = new Date(target);
      sleepTime.setMinutes(sleepTime.getMinutes() - cycles * CYCLE_MINUTES);
      return {
        time: sleepTime,
        cycles,
        duration: (cycles * CYCLE_MINUTES) / 60
      };
    });
  }, [targetTime, currentTime]);

  // Suggested wake-up times (4, 5, 6 cycles)
  const suggestions = useMemo(() => {
    return [4, 5, 6].map(cycles => {
      const date = new Date(currentTime);
      date.setMinutes(date.getMinutes() + cycles * CYCLE_MINUTES);
      return {
        time: date,
        cycles,
        duration: (cycles * CYCLE_MINUTES) / 60
      };
    });
  }, [currentTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleSetAlarm = () => {
    setAlarmSet(true);
    setShowAlarmModal(true);
    stopPreview();
    setTimeout(() => setShowAlarmModal(false), 3000);
  };

  const togglePreview = () => {
    if (isPreviewing) {
      stopPreview();
    } else {
      startPreview();
    }
  };

  const startPreview = () => {
    setIsPreviewing(true);
    // In a real app, we would play the actual audio file
    console.log(`Previewing sound: ${selectedSound.name}`);
  };

  const stopPreview = () => {
    setIsPreviewing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Sleep Cycle</h1>
        </div>
        <button 
          onClick={() => setIsBackwardsMode(!isBackwardsMode)}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-indigo-400"
          title={isBackwardsMode ? "Switch to Sleep Now" : "Switch to Wake Up At"}
        >
          <RefreshCw className={`w-6 h-6 transition-transform duration-500 ${isBackwardsMode ? 'rotate-180' : ''}`} />
        </button>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8 pb-32">
        {/* Mode Toggle Info */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex gap-3 items-start">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400 leading-relaxed">
            {isBackwardsMode 
              ? "Tell us when you want to wake up, and we'll suggest the best times to fall asleep."
              : "Going to bed now? We'll calculate the best times for you to wake up feeling refreshed."}
          </p>
        </div>

        {/* Main Display */}
        <section className="text-center space-y-4 py-4">
          <AnimatePresence mode="wait">
            {!isBackwardsMode ? (
              <motion.div
                key="sleep-now"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Wake up at</p>
                  <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
                    {formatTime(calculatedWakeUpTime)}
                  </h2>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                    <button 
                      onClick={() => setSelectedCycles(Math.max(1, selectedCycles - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="px-4 text-center min-w-[120px]">
                      <p className="text-2xl font-bold text-indigo-400">{selectedCycles} Cycles</p>
                      <p className="text-xs text-slate-500">{(selectedCycles * 90) / 60} Hours</p>
                    </div>
                    <button 
                      onClick={() => setSelectedCycles(Math.min(8, selectedCycles + 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    value={selectedCycles} 
                    onChange={(e) => setSelectedCycles(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="wake-up-at"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">I want to wake up at</p>
                  <input 
                    type="time" 
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className="bg-transparent text-7xl font-black text-center focus:outline-none text-indigo-400 w-full"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-slate-500 font-medium text-sm">Suggested sleep times:</p>
                  <div className="grid grid-cols-1 gap-3">
                    {suggestedSleepTimes.map((item, i) => (
                      <div key={i} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex justify-between items-center hover:border-indigo-500/50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                            <Moon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-xl font-bold">{formatTime(item.time)}</p>
                            <p className="text-xs text-slate-500">{item.cycles} cycles ({item.duration}h)</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">Set Reminder</button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Sound Selection Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Music className="w-4 h-4" /> Alarm Sound
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isVibrationEnabled ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                  <RefreshCw className={`w-5 h-5 ${isVibrationEnabled ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <p className="font-bold">Vibration</p>
                  <p className="text-xs text-slate-500">{isVibrationEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVibrationEnabled(!isVibrationEnabled)}
                className={`w-14 h-8 rounded-full transition-colors relative ${isVibrationEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isVibrationEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="relative">
              <select 
                value={selectedSound.id}
                onChange={(e) => {
                  const sound = availableSounds.find(s => s.id === e.target.value);
                  if (sound) {
                    setSelectedSound(sound);
                    stopPreview();
                  }
                }}
                className="w-full bg-slate-800 text-white p-4 rounded-xl appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {availableSounds.map(sound => (
                  <option key={sound.id} value={sound.id}>{sound.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={togglePreview}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isPreviewing 
                    ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isPreviewing ? (
                  <>
                    <Square className="w-4 h-4 fill-current" /> Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Preview Sound
                  </>
                )}
              </button>
              <button 
                onClick={handleAddCustomSound}
                className="px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl font-bold border border-indigo-500/30 transition-all flex items-center gap-2"
              >
                <Music className="w-4 h-4" /> Add Custom
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept="audio/*" 
                className="hidden" 
              />
            </div>
          </div>
        </section>

        {/* Suggestions Grid (Only in Sleep Now mode) */}
        {!isBackwardsMode && (
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Other Options</h3>
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((item, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedCycles(item.cycles)}
                  className={`w-full p-4 rounded-2xl border transition-all duration-300 flex justify-between items-center ${
                    selectedCycles === item.cycles 
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedCycles === item.cycles ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold">{formatTime(item.time)}</p>
                      <p className="text-xs text-slate-500">{item.cycles} cycles ({item.duration}h)</p>
                    </div>
                  </div>
                  {selectedCycles === item.cycles && (
                    <motion.div layoutId="active-indicator">
                      <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Action Button */}
        <div className="fixed bottom-8 left-0 right-0 px-6 max-w-md mx-auto z-20">
          <div className="flex flex-col gap-4">
            {isAlarmActive && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold"
              >
                <Bell className="w-4 h-4" />
                Alarm is set for {activeAlarmTime}
              </motion.div>
            )}
            <button 
              onClick={handleToggleAlarm}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                isAlarmActive 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
              }`}
            >
              {isAlarmActive ? (
                <>
                  <VolumeX className="w-6 h-6" />
                  Cancel Alarm
                </>
              ) : (
                <>
                  <AlarmClock className="w-6 h-6" />
                  Set Alarm
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Alarm Modal Overlay */}
      <AnimatePresence>
        {showAlarmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-4 max-w-xs w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-10 h-10 text-emerald-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold">Alarm Scheduled</h3>
              <p className="text-slate-400">We'll wake you up at <span className="text-white font-bold">{formatTime(calculatedWakeUpTime)}</span> with <span className="text-indigo-400">{selectedSound.name}</span></p>
              <div className="pt-4">
                <button 
                  onClick={() => setShowAlarmModal(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
