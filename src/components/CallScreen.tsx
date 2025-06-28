import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOff, Volume2, Mic, MicOff, Video } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';




export function CallScreen({ isOpen, onClose }) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const startTimeRef = useRef<Date>(new Date());
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('🟢 Connected to ElevenLabs');
      setCurrentMessage('Connected to AI assistant');
    },
    onDisconnect: () => {
      console.log('🔴 Disconnected from ElevenLabs');
      setCurrentMessage('Disconnected');
    },
    onMessage: (msg) => {
      console.log('Message:', msg);
      if (msg.message) {
        setCurrentMessage(msg.message);
      }
    },
    onError: (err) => {
      console.error('ElevenLabs Error:', err);
      setCurrentMessage('Connection error occurred');
    },
  });

  useEffect(() => {
    if(isOpen){
      
    // initializeCall();
    }
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get microphone permission and setup audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setupAudioVisualization(stream);
      
      // Start ElevenLabs conversation
      await conversation.startSession({
        // agentId: agentId,
        agentId:"agent_01jy614wfzeyysvckvwxz01pw4"
      });
      
      // Start call timer
      startTimeRef.current = new Date();
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize call f:', error);
      setCurrentMessage('Failed to start conversation');
    }
  };

  const setupAudioVisualization = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const microphone = audioContextRef.current.createMediaStreamSource(stream);
    
    microphone.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        requestAnimationFrame(updateAudioLevel);
      }
    };
    
    updateAudioLevel();
  };

  const handleEndCall = useCallback(async () => {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000);
    
    try {
      // Get conversation details before ending
      const conversationId = conversation.getId();
      let conversationDetails = null;
      
      // if (conversationId) {
      //   const response = await fetch(
      //     `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      //     {
      //       method: 'GET',
      //       headers: {
      //         'Xi-Api-Key': settings.apiKey,
      //       },
      //     }
      //   );
        
      //   if (response.ok) {
      //     conversationDetails = await response.json();
      //   }
      // }
      
      // End the conversation
      await conversation.endSession();
      
      // const callData: CallData = {
      //   duration,
      //   startTime: startTimeRef.current,
      //   endTime,
      //   conversationId,
      //   conversationDetails,
      //   transcript: conversationDetails?.transcript || 'Conversation completed successfully',
      //   evaluation: {
      //     score: conversationDetails?.analysis?.call_successful === 'success' ? 90 : 75,
      //     feedback: conversationDetails?.analysis?.transcript_summary || "Great conversation! You showed genuine interest and engagement.",
      //     highlights: ["Good listening skills", "Asked thoughtful questions", "Maintained positive energy"]
      //   }
      // };
      cleanup();
      onClose();
      
      // onEndCall(callData);
    } catch (error) {
      console.error('Error ending call:', error);
      
      // Still end the call even if there's an error
      const callData: CallData = {
        duration,
        startTime: startTimeRef.current,
        endTime,
        conversationId: conversation.getId(),
        transcript: 'Conversation completed',
        evaluation: {
          score: 75,
          feedback: "Great conversation! You showed genuine interest and engagement.",
          highlights: ["Good listening skills", "Asked thoughtful questions", "Maintained positive energy"]
        }
      };
      cleanup();
      // onEndCall(callData);
    }
  }, [conversation]);

  const cleanup = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
console.log('first',conversation)
  if(!isOpen) return;
  return (
       <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
        {/* Close Button */}
        {/* <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 bg-white/10 backdrop-blur-lg rounded-full hover:bg-white/20 transition-all duration-300"
        >
          <X className="w-6 h-6 " />
        </button> */}
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-violet-900 to-rose-900 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://plus.unsplash.com/premium_photo-1725985758331-e1b46919d8cf?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-screen flex flex-col lg:flex-row">
        {/* Main Call Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="text-center pt-8 pb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`w-4 h-4 rounded-full animate-pulse ${
                conversation.status === 'connected' ? 'bg-emerald-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-white font-semibold">
                {conversation.status === 'connected' ? 'AI Connected' : 'Connecting...'}
              </span>
              <span className="text-white/80 text-sm">({formatTime(callDuration)})</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80">
              <Volume2 className="w-5 h-5" />
              <span>AI voice call in progress</span>
            </div>
          </div>

          {/* Profile Display */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="relative">
              <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                <img
                  src={"https://plus.unsplash.com/premium_photo-1725985758331-e1b46919d8cf?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                  alt={"profile.name"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Audio Visualization */}
              {conversation.status === 'connected' && (
                <>
                  <div className="absolute -inset-4 rounded-full border-4 border-emerald-400/30 animate-ping"></div>
                  <div className="absolute -inset-8 rounded-full border-2 border-emerald-400/20 animate-ping animation-delay-150"></div>
                </>
              )}
              
              {/* Audio Level Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full px-4 py-2">
                <div className="flex items-center gap-2">
                  {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                  <div className="w-16 bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-emerald-400 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Message Display */}
          {currentMessage && (
            <div className="px-4 pb-4">
              <div className="max-w-2xl mx-auto bg-black/50 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-white text-lg leading-relaxed">{currentMessage}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                  <span className="text-white/60 text-sm">
                    {conversation.isSpeaking ? 'AI is speaking' : 'AI is listening'}
                  </span>
                </div>
              </div>
            </div>
          )}
              

          {/* Controls */}
          <div className="text-center pb-8">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              
              
              <button
                onClick={handleEndCall}
                disabled={conversation.status !== 'connected'}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white p-4 rounded-full shadow-2xl hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-200"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
            <p className="text-white/80 text-sm mt-4">
              Status: {conversation.status}
            </p>
          </div>
        </div>

        
      </div>
    </div>
      </div>
       </div>
    
  );
}