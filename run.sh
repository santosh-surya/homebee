if pgrep  -f "nodejs.*--homebeeserver*" &> /dev/null ; then kill -9  `pgrep  -f "nodejs.*--homebeeserver*"` ; fi;
echo "Starting HomeBee Server now ..."
ROOT=/home/santosh/homebee/homebee-server-app/platforms/browser/www PORT=4000 HTTPSPORT=4043 nodejs ./bin/www --homebeeserver >> node.log 2>&1 &
tail -f node.log
