# AB Z Fruit challenge server
WebSocket server (same port as HTTP). `/health` returns JSON. Protocol and rules: see header of server.js and test/run.js.
Env: PORT, DATA_DIR (mount a volume, wallets.json lives there), START_COINS=500, ENTRY_FEE=100, CUT_PCT=0, DUR_EASY/MEDIUM/HARD (seconds: 240/360/480), LEVEL_EASY/MEDIUM/HARD (10/60/150).
