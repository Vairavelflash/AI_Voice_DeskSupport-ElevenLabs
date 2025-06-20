import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2, CheckCircle, AlertCircle } from 'lucide-react';
import type { CallState } from '../types';

interface AICallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AICallModal: React.FC<AICallModalProps> = ({ isOpen, onClose }) => {
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    isJoined: false,
    isMuted: false,
    isAudioChecked: false
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAudioTesting, setIsAudioTesting] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [conversationText, setConversationText] = useState<string>('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCallState(prev => ({ ...prev, isOpen: true }));
    } else {
      // Reset state when modal closes
      setCallState({
        isOpen: false,
        isJoined: false,
        isMuted: false,
        isAudioChecked: false
      });
      setIsConnecting(false);
      setAudioLevel(0);
      setIsAudioTesting(false);
      setAudioError(null);
      setConversationText('');
      setIsAgentSpeaking(false);
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startAudioTest = async () => {
    setIsAudioTesting(true);
    setAudioError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyser && isAudioTesting) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(average / 128 * 100, 100));
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
    } catch (error) {
      console.error('Audio access error:', error);
      setAudioError('Unable to access microphone. Please check your permissions and try again.');
    }
  };

  const handleAudioCheck = () => {
    setCallState(prev => ({ ...prev, isAudioChecked: true }));
    setIsAudioTesting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const connectToElevenLabs = async () => {
    try {
      setIsConnecting(true);
      
      // Create WebSocket connection to ElevenLabs Conversational AI
      const websocket = new WebSocket(
        `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=agent_01jy614wfzeyysvckvwxz01pw4`
      );

      // Add API key to headers (note: WebSocket constructor doesn't support headers directly)
      // We'll send the API key in the first message instead
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('Connected to ElevenLabs');
        
        // Send authentication and initial setup
        websocket.send(JSON.stringify({
          type: 'conversation_initiation_metadata',
          conversation_initiation_metadata: {
            agent_id: 'agent_01jy614wfzeyysvckvwxz01pw4'
          }
        }));

        setCallState(prev => ({ ...prev, isJoined: true }));
        setIsConnecting(false);
        
        // Initial greeting
        setConversationText('Hi! I\'m Sam, your AI front desk assistant. I\'m here to help you learn about our diagnostic services and book appointments. How can I assist you today?');
        setIsAgentSpeaking(true);
        
        setTimeout(() => setIsAgentSpeaking(false), 4000);

        // Start recording audio if stream is available
        if (streamRef.current) {
          startAudioRecording();
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received:', data);
          
          if (data.type === 'agent_response' || data.type === 'agent_response_audio_delta') {
            if (data.agent_response || data.delta) {
              const text = data.agent_response || data.delta;
              setConversationText(prev => data.type === 'agent_response' ? text : prev + text);
              setIsAgentSpeaking(true);
              setTimeout(() => setIsAgentSpeaking(false), 2000);
            }
          } else if (data.type === 'user_transcript' || data.type === 'user_transcript_delta') {
            const text = data.user_transcript || data.delta || '';
            setConversationText(`You: ${text}`);
          } else if (data.type === 'audio') {
            // Handle audio playback
            if (data.audio_event && data.audio_event.audio_base_64) {
              playAudioFromBase64(data.audio_event.audio_base_64);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConversationText('Connection error. Please try again.');
        setIsConnecting(false);
      };

      websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (callState.isJoined) {
          setConversationText('Connection lost. Please try again.');
        }
      };

    } catch (error) {
      console.error('Failed to connect to ElevenLabs:', error);
      setConversationText('Failed to connect to AI assistant. Please try again.');
      setIsConnecting(false);
    }
  };

  const startAudioRecording = () => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN && !callState.isMuted) {
          // Convert audio data to base64 and send
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            websocketRef.current?.send(JSON.stringify({
              type: 'audio_event',
              audio_event: {
                audio_base_64: base64Audio,
                sample_rate: 44100
              }
            }));
          };
          reader.readAsArrayBuffer(event.data);
        }
      };

      mediaRecorder.start(250); // Send audio chunks every 250ms
    } catch (error) {
      console.error('Failed to start audio recording:', error);
    }
  };

  const playAudioFromBase64 = (base64Audio: string) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleJoinCall = async () => {
    await connectToElevenLabs();
  };

  const handleEndCall = () => {
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    const newMutedState = !callState.isMuted;
    setCallState(prev => ({ ...prev, isMuted: newMutedState }));
    
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 bg-white/10 backdrop-blur-lg rounded-full hover:bg-white/20 transition-all duration-300"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Background Animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {!callState.isJoined ? (
          // Pre-call Screen
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="max-w-md w-full text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Phone className="w-16 h-16 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">AI Front Desk Assistant</h2>
              <p className="text-gray-300 mb-8">
                Our AI assistant is ready to help you with diagnostic tests, imaging scans, and health checkup packages.
              </p>

              {!callState.isAudioChecked ? (
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
                    <Volume2 className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                    <h3 className="text-lg font-semibold mb-2">Audio Check</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Please test your microphone and ensure audio levels are working properly.
                    </p>

                    {!isAudioTesting ? (
                      <button 
                        onClick={startAudioTest}
                        className="flex items-center space-x-2 mx-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-all duration-300"
                      >
                        <Mic className="w-5 h-5" />
                        <span>Test Microphone</span>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {audioError ? (
                          <div className="flex items-center justify-center space-x-2 text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{audioError}</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-gray-400 mb-2">Speak into your microphone</div>
                            <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
                              <div 
                                className={`h-4 rounded-full transition-all duration-150 ${
                                  audioLevel > 50 ? 'bg-gradient-to-r from-green-400 to-blue-500' :
                                  audioLevel > 20 ? 'bg-gradient-to-r from-yellow-400 to-green-500' :
                                  'bg-gradient-to-r from-red-400 to-yellow-500'
                                }`}
                                style={{ width: `${Math.min(audioLevel, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mb-4">
                              Audio Level: {Math.round(audioLevel)}%
                              {audioLevel > 10 && <span className="text-green-400 ml-2">✓ Good</span>}
                            </div>
                            <button 
                              onClick={handleAudioCheck}
                              disabled={audioLevel < 5}
                              className="flex items-center space-x-2 mx-auto px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="w-5 h-5" />
                              <span>Audio is Good</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleJoinCall}
                  disabled={isConnecting}
                  className="flex items-center space-x-3 mx-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting to AI...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-6 h-6" />
                      <span>Join Call</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          // In-call Screen
          <div className="flex flex-col h-full">
            {/* Assistant Avatar/Info */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="relative mb-8">
                <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center">
                      <Phone className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Speaking Animation */}
                  {isAgentSpeaking && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                      <div className="absolute inset-2 rounded-full border-2 border-white/20 animate-ping delay-75"></div>
                    </>
                  )}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Sam - AI Assistant</h2>
              <p className="text-green-400 font-medium mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </p>
              
              {/* Conversation Text */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full mb-8 min-h-[120px] flex items-center">
                <div className="text-center w-full">
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {conversationText || 'Listening...'}
                  </p>
                  {isAgentSpeaking && (
                    <div className="flex justify-center mt-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center space-x-6 pb-12">
              <button 
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all duration-300 ${
                  callState.isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {callState.isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>

              <button 
                onClick={handleEndCall}
                className="p-6 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300 hover:scale-105"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICallModal;