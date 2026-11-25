import subprocess
import os

ff = r"C:\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe"
fp = r"C:\ffmpeg-9.0.2-essentials_build\bin\ffprobe.exe"
vid = r"C:\Users\nrgma\.gemini\antigravity\brain\d7acc774-0c1e-46f2-a1cd-9098bdecf609\.user_uploaded\media_1795578132053_063a4a0a.mp4"
out_dir = r"d:\kilo\AI video\scratch\video_analysis"

os.makedirs(out_dir, exist_ok=True)

# 1. Probe format & stream info
cmd_probe = [
    fp, "-v", "error",
    "-show_entries", "format=duration,size,bit_rate:stream=codec_name,codec_type,width,height,r_frame_rate",
    "-of", "default=noprint_wrappers=1",
    vid
]
res_probe = subprocess.run(cmd_probe, capture_output=True, text=True)
print("=== PROBE INFO ===")
print(res_probe.stdout)

# 2. Extract frames at timestamps
timestamps = [0.0, 0.3, 0.6, 1.0, 1.5, 2.0, 3.0, 5.0, 8.0, 15.0, 25.0, 35.0, 45.0, 55.0]
for ts in timestamps:
    out_file = os.path.join(out_dir, f"frame_{ts:.1f}s.jpg")
    cmd_extract = [
        ff, "-y", "-ss", str(ts), "-i", vid,
        "-vframes", "1", "-q:v", "2", out_file
    ]
    subprocess.run(cmd_extract, capture_output=True)
print(f"Extracted {len(timestamps)} frames to {out_dir}")

# 3. Analyze volume in first 3 seconds
cmd_vol = [
    ff, "-ss", "0.0", "-t", "3.0", "-i", vid,
    "-af", "volumedetect", "-f", "null", "-"
]
res_vol = subprocess.run(cmd_vol, capture_output=True, text=True)
print("=== VOLUME STATS (0.0s - 3.0s) ===")
for line in res_vol.stderr.splitlines():
    if "volume" in line.lower():
        print(line)

# 4. Analyze silence in first 3 seconds
cmd_silence = [
    ff, "-ss", "0.0", "-t", "5.0", "-i", vid,
    "-af", "silencedetect=noise=-30dB:d=0.2", "-f", "null", "-"
]
res_silence = subprocess.run(cmd_silence, capture_output=True, text=True)
print("=== SILENCE DETECT (0.0s - 5.0s) ===")
for line in res_silence.stderr.splitlines():
    if "silence" in line.lower():
        print(line)
