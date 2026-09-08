import asyncio
import sys
import os
import argparse
import edge_tts

# Voices available: pt-BR-AntonioNeural (Masculino), pt-BR-FranciscaNeural (Feminino), pt-BR-ThalitaNeural (Feminino)
DEFAULT_VOICE = "pt-BR-AntonioNeural"

async def generate_speech(text: str, output_path: str, voice: str = DEFAULT_VOICE, rate: str = "+0%", pitch: str = "+0Hz"):
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(output_path)
    print(f"SUCCESS: Audio saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TTS Engine (ElevenLabs Alternative)")
    parser.add_argument("--text", type=str, required=True, help="Text to speak")
    parser.add_argument("--out", type=str, required=True, help="Output MP3 file path")
    parser.add_argument("--voice", type=str, default=DEFAULT_VOICE, help="Voice name")
    parser.add_argument("--rate", type=str, default="+0%", help="Speed rate e.g. +10%%")
    
    args = parser.parse_args()
    asyncio.run(generate_speech(args.text, args.out, args.voice, args.rate))
