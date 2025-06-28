import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2, CheckCircle, AlertCircle, Video } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import type { CallState } from '../types';

interface AICallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionSummary {
  overview?: string;
  transcript?: string;
  evaluation?: Record<string, any>;
}

const AICallModal: React.FC<AICallModalProps> = ({ isOpen, onClose }) => {
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    isJoined: false,
    isMuted: false,
    isAudioChecked: false
  });

  const [currentScreen, setCurrentScreen] = useState<'audioCheck' | 'calling' | 'callEnd'>('audioCheck');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAudioTesting, setIsAudioTesting] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [conversationMessages, setConversationMessages] = useState<Array<{type: 'user' | 'agent', text: string}>>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('🟢 Connected to ElevenLabs');
      setCallState(prev => ({ ...prev, isJoined: true }));
      setCallStartTime(new Date());
      
      // Add initial greeting
      const greeting = "Hi! I'm Sam, your AI front desk assistant. I'm here to help you learn about our diagnostic services and book appointments. How can I assist you today?";
      setConversationMessages([{ type: 'agent', text: greeting }]);
    },
    onDisconnect: () => {
      console.log('🔴 Disconnected from ElevenLabs');
      setCallState(prev => ({ ...prev, isJoined: false }));
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      
      if (message.type === 'agent_response' && message.message) {
        setConversationMessages(prev => [...prev, { type: 'agent', text: message.message }]);
      } else if (message.type === 'user_transcript' && message.message) {
        setConversationMessages(prev => [...prev, { type: 'user', text: message.message }]);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs Error:', error);
      setAudioError('Connection error with AI assistant. Please try again.');
    },
  });

  useEffect(() => {
    if (isOpen) {
      setCallState(prev => ({ ...prev, isOpen: true }));
      setCurrentScreen('audioCheck');
      checkMicrophonePermission();
    } else {
      resetAllState();
    }
  }, [isOpen]);

  const onShowToast = (title: string, message: string, type: 'success' | 'error') => {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  };

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      onShowToast('Microphone Ready', 'Your microphone is working perfectly!', 'success');
      
      // Create audio context for level detection
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      streamRef.current = stream;
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isOpen) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      setIsAudioTesting(true);
      
    } catch (error) {
      setMicPermission('denied');
      onShowToast('Microphone Access Denied', 'Please allow microphone access to continue', 'error');
      setAudioError('Microphone access denied. You can still join the call but audio features may be limited.');
    }
  };

  const resetAllState = () => {
    setCallState({
      isOpen: false,
      isJoined: false,
      isMuted: false,
      isAudioChecked: false
    });
    setCurrentScreen('audioCheck');
    setAudioLevel(0);
    setIsAudioTesting(false);
    setAudioError(null);
    setCallStartTime(null);
    setSessionSummary(null);
    setMicPermission('pending');
    setConversationMessages([]);
    cleanup();
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current = null;
    }
  };

  const handleAudioCheckComplete = useCallback(async () => {
    console.log('Audio check completed, proceeding to call...');
    setCallState(prev => ({ ...prev, isAudioChecked: true }));
    setIsAudioTesting(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Proceed to calling screen
    setCurrentScreen('calling');
    await startConversation();
  }, []);

  const startConversation = useCallback(async () => {
    try {
      if (micPermission === 'granted') {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      await conversation.startSession({
        agentId: 'agent_01jy614wfzeyysvckvwxz01pw4',
      });
      
      setSessionSummary(null); // clear previous session
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setAudioError('Failed to connect to AI assistant. Please try again.');
    }
  }, [conversation, micPermission]);

  const handleEndCall = useCallback(async () => {
    console.log('End call initiated');
    
    try {
      // End the conversation session
      await conversation.endSession();
      
      // Stop all audio streams immediately
      cleanup();
      
      // Reset call state
      setCallState(prev => ({ ...prev, isJoined: false }));
      
      console.log('Call ended successfully, returning to home');
      
      // Close modal and return to home screen
      resetAllState();
      onClose();
      
    } catch (error) {
      console.error('Error ending call:', error);
      // Even if there's an error, still close the modal and return home
      cleanup();
      resetAllState();
      onClose();
    }
  }, [conversation, onClose]);

  const createFallbackSummary = (): SessionSummary => {
    const endTime = new Date();
    const duration = callStartTime ? 
      Math.round((endTime.getTime() - callStartTime.getTime()) / 1000) : 0;
    
    const userMessages = conversationMessages.filter(msg => msg.type === 'user');
    const agentMessages = conversationMessages.filter(msg => msg.type === 'agent');
    
    const transcript = conversationMessages
      .map(msg => `${msg.type === 'user' ? 'User' : 'Agent'}: ${msg.text}`)
      .join('\n\n');

    const overview = `Call completed successfully. Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}. ${userMessages.length} user messages and ${agentMessages.length} agent responses exchanged.`;
    
    const evaluation = {
      call_quality: userMessages.length > 3 ? 'Excellent' : userMessages.length > 1 ? 'Good' : 'Fair',
      engagement_level: userMessages.length > 2 ? 'High' : 'Medium',
      topics_covered: extractKeyTopics(conversationMessages.map(msg => msg.text)),
      duration_seconds: duration
    };

    return { overview, transcript, evaluation };
  };

  const extractKeyTopics = (messages: string[]): string[] => {
    const topics = [];
    const allText = messages.join(' ').toLowerCase();
    
    if (allText.includes('diagnostic') || allText.includes('test')) topics.push('Diagnostic Tests');
    if (allText.includes('imaging') || allText.includes('scan') || allText.includes('mri') || allText.includes('ct')) topics.push('Imaging Services');
    if (allText.includes('checkup') || allText.includes('physical') || allText.includes('health')) topics.push('Health Checkups');
    if (allText.includes('appointment') || allText.includes('book') || allText.includes('schedule')) topics.push('Appointment Booking');
    if (allText.includes('price') || allText.includes('cost') || allText.includes('insurance')) topics.push('Pricing & Insurance');
    
    return topics.length > 0 ? topics : ['General Inquiry'];
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

  const handleBackToHome = () => {
    resetAllState();
    onClose();
  };

  const getCallDuration = () => {
    if (!callStartTime) return '0:00';
    const now = new Date();
    const duration = Math.round((now.getTime() - callStartTime.getTime()) / 1000);
    return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  console.log('Conversation status:', conversation.status);
  console.log('Messages:', conversationMessages);

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

        {/* White Circle Image - Bottom Right */}
        <div className="absolute bottom-8 right-8 z-20">
          <img 
            src="/white_circle_360x360.png" 
            alt="Sam Labs Logo"
            className="w-20 h-20 opacity-60 hover:opacity-80 transition-opacity duration-300"
          />
        </div>

        {currentScreen === 'audioCheck' && (
          // Audio Check Screen
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="max-w-md w-full text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Volume2 className="w-16 h-16 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Audio Check</h2>
              <p className="text-gray-300 mb-8">
                Testing your microphone to ensure clear communication with our AI assistant.
              </p>

              <div className="p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 mb-8">
                <h3 className="text-lg font-semibold mb-4">Microphone Status</h3>
                
                {micPermission === 'pending' && (
                  <div className="flex items-center justify-center space-x-2 text-yellow-400">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking microphone access...</span>
                  </div>
                )}

                {micPermission === 'denied' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">Microphone access denied</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      You can still join the call, but audio features will be limited.
                    </p>
                  </div>
                )}

                {micPermission === 'granted' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-400 mb-4">
                      <CheckCircle className="w-5 h-5" />
                      <span>Microphone Ready</span>
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-2">Audio Level Monitor</div>
                    <div className="w-full bg-gray-700 rounded-full h-6 mb-4 overflow-hidden">
                      <div 
                        className={`h-6 rounded-full transition-all duration-150 ${
                          audioLevel > 50 ? 'bg-gradient-to-r from-green-400 to-blue-500' :
                          audioLevel > 20 ? 'bg-gradient-to-r from-yellow-400 to-green-500' :
                          audioLevel > 5 ? 'bg-gradient-to-r from-orange-400 to-yellow-500' :
                          'bg-gradient-to-r from-red-400 to-orange-500'
                        }`}
                        style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                      Audio Level: {Math.round(audioLevel * 2)}%
                      {audioLevel > 10 && <span className="text-green-400 ml-2">✓ Good signal</span>}
                      {audioLevel > 0 && audioLevel <= 10 && <span className="text-yellow-400 ml-2">⚠ Speak louder</span>}
                      {audioLevel === 0 && <span className="text-gray-500 ml-2">Silent</span>}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAudioCheckComplete}
                  className="flex items-center space-x-2 mx-auto px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-300"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Join Call</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'calling' && (
          // Calling Screen
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
                  {conversation.isSpeaking && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                      <div className="absolute inset-2 rounded-full border-2 border-white/20 animate-ping delay-75"></div>
                    </>
                  )}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Sam - AI Assistant</h2>
              <div className="flex items-center space-x-4 mb-4">
                <p className={`font-medium flex items-center space-x-2 ${
                  conversation.status === 'connected' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    conversation.status === 'connected' ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></div>
                  <span>{conversation.status === 'connected' ? 'Connected' : 'Connecting...'}</span>
                </p>
                {callStartTime && (
                  <p className="text-gray-400 text-sm">
                    Duration: {getCallDuration()}
                  </p>
                )}
              </div>
              
              {/* Conversation Display */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full mb-8 min-h-[200px] max-h-[300px] overflow-y-auto">
                <div className="space-y-4">
                  {conversationMessages.length === 0 && conversation.status !== 'connected' && (
                    <div className="text-center text-gray-400">
                      <div className="flex justify-center mb-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                      <p>Connecting to AI assistant...</p>
                    </div>
                  )}
                  
                  {conversationMessages.map((message, index) => (
                    <div key={index} className="text-left">
                      <div className={`font-semibold mb-1 ${
                        message.type === 'agent' ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {message.type === 'agent' ? 'Sam (AI Assistant):' : 'You:'}
                      </div>
                      <p className="text-gray-300 leading-relaxed">{message.text}</p>
                    </div>
                  ))}
                  
                  {conversation.isSpeaking && (
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

        {currentScreen === 'callEnd' && sessionSummary && (
          // Call End Screen
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="max-w-2xl w-full text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Call Completed</h2>
              <p className="text-gray-300 mb-8">Thank you for using our AI assistant service!</p>

              {/* Call Summary */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 text-left max-h-[60vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-6 text-center">📞 Call Summary</h3>
                
                {sessionSummary.overview && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-blue-400 mb-2">Overview</h4>
                    <p className="text-gray-300 leading-relaxed">{sessionSummary.overview}</p>
                  </div>
                )}

                {sessionSummary.evaluation && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-blue-400 mb-2">Evaluation Result</h4>
                    <div className="space-y-2">
                      {Object.entries(sessionSummary.evaluation).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-gray-300 font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sessionSummary.transcript && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-blue-400 mb-2">Transcript</h4>
                    <div className="bg-white/5 p-4 rounded-xl max-h-40 overflow-y-auto">
                      <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {sessionSummary.transcript}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleBackToHome}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full text-white font-semibold text-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICallModal;