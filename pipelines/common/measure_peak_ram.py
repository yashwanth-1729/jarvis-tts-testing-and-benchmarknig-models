"""Run a subprocess and report the peak RAM (RSS, including any child
processes it spawns) it used, in MB.

On this Windows setup, python.exe launched from certain installs (e.g. the
Microsoft Store app-execution-alias) is a thin stub that immediately spawns
a separate child process to run the real interpreter, so RAM must be summed
across the process tree, not just the immediate child's own PID.

Usage: python measure_peak_ram.py -- <python.exe> <script.py> [args...]
Prints one JSON line: {"peakRamMB": <float>, "stdout": <str>}
"""
import json
import subprocess
import sys
import time

import psutil


def total_rss(root: psutil.Process) -> int:
    total = 0
    procs = [root]
    try:
        procs += root.children(recursive=True)
    except psutil.NoSuchProcess:
        pass
    for p in procs:
        try:
            total += p.memory_info().rss
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return total


def main():
    args = sys.argv[1:]
    if args and args[0] == "--":
        args = args[1:]

    proc = subprocess.Popen(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    root = psutil.Process(proc.pid)
    peak_bytes = 0

    while proc.poll() is None:
        peak_bytes = max(peak_bytes, total_rss(root))
        time.sleep(0.05)

    stdout, _ = proc.communicate()
    peak_mb = peak_bytes / (1024 * 1024)
    print(json.dumps({"peakRamMB": round(peak_mb, 1), "stdout": stdout}))


if __name__ == "__main__":
    main()
