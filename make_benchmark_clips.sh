#!/usr/bin/env bash
# Builds the 25 reward-curve clips the site uses from the offline benchmark videos.
# Usage:  ./make_benchmark_clips.sh /path/to/offline_benchmark
# Needs ffmpeg (on a Mac: brew install ffmpeg) and python3.
set -euo pipefail
SRC="${1:?give the path to the offline_benchmark folder}"
cd "$(dirname "$0")"
mkdir -p media/bench
python3 - "$SRC" <<'PY'
import json, subprocess, sys, os
src = sys.argv[1]
for c in json.load(open('bench_clips.json')):
    inp = os.path.join(src, c['rel'])
    out = c['out']
    print('->', out)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', inp, '-frames:v', str(c['frames']),
                    '-vf', 'scale=640:-2,format=yuv420p', '-c:v', 'libx264', '-crf', '27', '-g', '5', '-keyint_min', '5', '-sc_threshold', '0',
                    '-preset', 'slow', '-movflags', '+faststart', '-an', out], check=True)
PY
echo "Done. Clips are in media/bench/"
