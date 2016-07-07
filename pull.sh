git reset --hard
git pull
kill `pgrep  -f "nodejs.*--homebeeserver*"`
ROOT=/home/santosh/homebee/homebee-server-app/platforms/browser/www PORT=4000 HTTPSPORT=4043 nodejs ./bin/www --homebeeserver >> node.log 2>&1 &
