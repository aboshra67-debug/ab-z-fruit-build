# VC172 – online challenge module (client)
Server: `wss://challenge-server-production-31308fc7.up.railway.app` (Railway project "AB Z Fruit Challenge", branch `challenge-server` of this repo; code is in that branch, not here). Override for tests: `window.ZF_ONLINE_URL` or localStorage `zf_online_url`.
Flow: تحديات اللعب → تحدي أونلاين → name + difficulty → create room (4-digit code) or join by code → host starts → 3 s countdown → everybody plays the same level (easy 10 / medium 60 / hard 150) and the same board (`cfg.seed ^ room seed`) and the same random events (`rnd` seeded) → ranking + prizes (2 players: winner takes all; 3+: 60/30/10).
Rules in online play: no pause, no paid/free helper row (hudBottom); defense bar stays; time limit = room time (4/6/8 min); back button asks to leave (leaving forfeits the 100-coin entry); showMenu() while in a match = forfeit.
Files: `www/online.js` (UI+network), `index.html` (sOnline172, overlays, popups), `style.css` (end block), `game.js` hooks: `ONL172`, `buildLevel` seed mix, `limit155` for online, `finishChallenge155` -> `onlineEnd172`, `onlinePrepare172/onlineGo172`, `ZF.show/lang/onlinePrepare/onlineGo/endLevel`, update() tick, showMenu reset.
Coins: kept by the server per device (start 500, entry 100); NOT the campaign coins; virtual only.
Tests: `tools/verify_vc172.js` (engine hooks); end-to-end with two real Chrome pages against the real server code: `tools/e2e_online172.py` (needs playwright + google-chrome + the server folder).
Not tested: real Android device, real internet WebSocket from the sandbox (blocked), more than 2 browsers at once (10 players tested at server level only).

## VC173 – challenge styles
Host picks the style in the lobby (after players joined): **race** (first to clear; rank by time, then fewer fruit left), **speed** (60 s, most matched fruit wins; tie = reached the score earlier), **action** (race with the action events, same moments for all). Levels: race easy/medium/hard = 10/60/150; speed = 51/100/200; action = 21/60/150. Room timers: race/action 4/6/8 min, speed 60 s.
Game: `onlinePrepare(n,seed,ms,style)` maps style to the existing variants (race -> 'online', speed -> 'speed', action -> 'action') and sets `G.online172=style`; hooks use `G.online172`. Client reports `score` (matched fruit) in progress/finish/lost. Server accepts final reports for a short grace after time-up (`TIMEUP_GRACE_MS`, 2 s).
Tests: server 48 checks; `tools/verify_vc172.js` (styles + hooks); `tools/e2e_online172.py` (race scenario + speed scenario, two real Chrome pages).
