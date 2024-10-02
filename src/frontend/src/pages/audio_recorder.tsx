import React, { useState, useRef, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { Mic, Square, Play, Pause, Send } from 'lucide-react';


const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const API_ENDPOINT = 'http://localhost:8000/speech-to-text/'; // Update this to your actual API endpoint

  useEffect(() => {
    getAudioDevices();
  }, []);

  const getAudioDevices = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      setDevices(audioDevices);
      if (audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0]?.deviceId || '');
      }
    } catch (err) {
      console.error('Error enumerating audio devices:', err);
      setError('Unable to access audio devices. Please check your browser permissions.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { deviceId: selectedDevice ? { exact: selectedDevice } : undefined } 
      });
  
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        setError(`${options.mimeType} is not supported on your browser.`);
        return;
      }
  
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };
  
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access the microphone. Please check your connection and permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (audioBlob && audioRef.current) {
      if (audioRef.current.paused) {
        if (!audioRef.current.src) {
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current.src = audioUrl;
        }
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const sendAudio = async () => {
    if (audioBlob) {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recorded_audio.wav');

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setTranscription(data.text);
          console.log('Audio sent successfully');
        } else {
          console.error('Failed to send audio');
          setError('Failed to send audio. Please try again.');
        }
      } catch (err) {
        console.error('Error sending audio:', err);
        setError('Error sending audio. Please check your internet connection.');
      }
    }
  };

  const buttonClass = (isActive: boolean, isDisabled: boolean) => `
    w-16 h-16 rounded-full flex items-center justify-center text-white
    ${isDisabled 
      ? 'bg-gray-300 cursor-not-allowed' 
      : isActive
        ? 'bg-red-500 hover:bg-red-600'
        : 'bg-blue-500 hover:bg-blue-600'}
    ${isDisabled ? '' : 'cursor-pointer'}
    transition-colors duration-200
  `;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Microphone Selection */}
      <Select.Root onValueChange={setSelectedDevice} value={selectedDevice}>
        <Select.Trigger className="inline-flex items-center justify-center rounded px-4 py-2 text-sm leading-none h-9 gap-1 bg-white text-violet11 shadow-md hover:bg-mauve3 focus:shadow-violet8 data-[placeholder]:text-violet9 outline-none">
          <Select.Value placeholder="Select a microphone" />
          <Select.Icon>
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="overflow-hidden bg-white rounded-md shadow-md">
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-violet11 cursor-default">
              <ChevronUpIcon />
            </Select.ScrollUpButton>
            <Select.Viewport className="p-1">
              {devices.map((device) => (
                <Select.Item
                  key={device.deviceId}
                  value={device.deviceId}
                  className="text-sm leading-none text-violet11 rounded-md flex items-center h-6 pr-9 pl-6 relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
                >
                  <Select.ItemText>{device.label || `Microphone ${device.deviceId.slice(0, 5)}`}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-violet11 cursor-default">
              <ChevronDownIcon />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

              <div className="flex flex-row space-x-4">
      {/* Recording Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={buttonClass(isRecording, !selectedDevice)}
        disabled={!selectedDevice}
      >
        {isRecording ? <Square /> : <Mic />}
      </button>

      {/* Playback Button */}
      <button
        onClick={toggleAudioPlayback}
        disabled={!audioBlob || isRecording}
        className={buttonClass(isPlaying, !audioBlob || isRecording)}
        >
        {isPlaying ? <Pause /> : <Play />}
        </button>

      {/* Send Audio Button */}
      <button
        onClick={sendAudio}
        disabled={!audioBlob || isRecording}
        className={buttonClass(false, !audioBlob || isRecording)}
      >
        <Send />
      </button>
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)} 
        onPause={() => setIsPlaying(false)}
        />

      {/* Display Transcription */}
      {transcription && (
        <div className="mt-4 p-4 rounded">
          <p>{transcription}</p>
        </div>
      )}

      {/* Display Errors */}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default AudioRecorder;
