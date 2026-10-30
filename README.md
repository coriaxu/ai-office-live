# ai-office-live
Static page. `index.html` is built by `python3 build.py` from `src/` + `data.json`.
The page also re-reads `data.json` over http(s) every 5 min, so a data-only refresh = edit data.json and push (no rebuild needed).
