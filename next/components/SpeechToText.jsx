import React, { useState, useEffect, useRef } from "react";
import icons from "@/icons";
import { emit } from "process";
import axios from 'axios'


const { MicIcon, SpeakerIcon } = icons;

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [revealedText, setRevealedText] = useState("");
  const [reply, setReply] = useState("");

  const audioRef = useRef(null);
  const [url, setUrl] = useState("");

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Animated GIF for MIC isListening state
  const gifUrl = "https://i.imgur.com/cLzMXgm.gif";

  // const supabase = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'], process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

  // Check if the user is authenticated
  // const user = supabase.auth.user();

  // if (user) {
  //   console.log('User is authenticated');
  //   console.log('User ID:', user.id);
  //   console.log('User email:', user.email);
  //   console.log('User role:', user.role);
  //   // You can access other user properties as needed
  // } else {
  //   console.log('User is not authenticated');
  // }

  // API call to the Flask (or Node) server
  async function llmResponse() {
    const response = await fetch(process.env.NEXT_PUBLIC_FLASK_API_URL, {
      method: "post",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ query: transcript }),
    });

    return response;
  }

  const callAPI = async () => {
    console.log("init");
    const options = {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-API-KEY": process.env['NEXT_PUBLIC_VOICE_AI_KEY'],
      },
    };

    const body = JSON.stringify({
      speed: 1.25,
      text: reply,
      speaker: process.env['NEXT_PUBLIC_SPEAKER_ID'],
    })
    const response = await axios.post(process.env['NEXT_PUBLIC_VOICE_AI_URL'],
      body,
      options
    )
    const responseURL = response.data.data[0].urls[0];
    console.log(responseURL);
    setUrl(responseURL);
  };


  // Effect for triggering the sound of the AI after the response is received.
  useEffect(() => {
    if (reply) {
      callAPI();
    }
  }, [reply]);

  useEffect(() => {
    if(url){
      playAudio();
    }
  }, [url])


  // Word by word text reveal effect
  useEffect(() => {
    if (transcript) {
      const wordsArray = transcript.split(" ");
      let currentRevealedText = "";
      const interval = setInterval(() => {
        if (wordsArray.length === 0) {
          clearInterval(interval);
        } else {
          currentRevealedText += wordsArray.shift() + " ";
          setRevealedText(currentRevealedText);
        }
      }, 300);
    }
  }, [transcript]);


  // Getting the Response from the LLM 
  useEffect(() => {
    if (!isListening && transcript) {
      async function getResponse() {
        try {
          const response = await llmResponse();
          setReply((await response.json()).result);
        } catch (e) {
          console.log("Error in getResponse! \n", e);
        }
      }
      getResponse();
    }
  }, [isListening]);


  // Listen Function
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.onstart = () => {
      setIsListening(true);
    };
    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      console.log(speechResult);
      setTranscript(speechResult);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // console.log(reply);

  return (
    <div>
      <div className="container mx-auto p-10 flex flex-col items-center w-full">
        <div className="flex items-center justify-center">
          {isListening ? (
            <img
              src={gifUrl}
              alt="Playing GIF"
              style={{
                width: "200px",
              }}
            />
          ) : null}
        </div>
        {!isListening && (
          <div
            className="flex items-center justify-center"
            style={{ height: "200px" }}
          >
            <button
              className={`p-4 rounded-full transition-transform duration-200 bg-blue-500 text-white`}
              onClick={startListening}
              disabled={isListening}
            >
              <MicIcon className="text-2xl" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 mx-6 flex flex-col ">
        <div className="flex justify-end">
          {/* <h2 className="text-xl font-semibold mb-2">Transcript:</h2> */}
          {revealedText && (
            <p className="bg-[#D9FDD3] mb-3 p-2 rounded max-w-fit">
              {revealedText}
            </p>
          )}
        </div>

        {/* Lovo AI Speech */}
        {/* <button onClick={callAPI}>Call API</button> */}
        <div id="output">
          {url ? <div>
            {/* <button onClick={playAudio}>Play Audio</button> */}
            <audio className="hidden" ref={audioRef} controls>
              <source src={url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div> : null}
        </div>

        <div>
          {reply && (
            <p className="bg-[#FFF7EE] mt-4 p-2 rounded max-w-fit">{reply}</p>
          )}
        </div>
        <div className="flex justify-end">
          {reply && (
            <button
              className="my-3 bg-green-500 text-white p-2 rounded max-w-fit text-2xl"
              onClick={playAudio}
            >
              <SpeakerIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechToText;
