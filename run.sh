if pgrep  -f "nodejs.*--homebeeserver*" &> /dev/null ; then kill -9  `pgrep  -f "nodejs.*--homebeeserver*"` ; fi;
echo "Starting HomeBee Server now ..."
PORT=4000 HTTPSPORT=4043 nodemon --log=debug --dbdebug1=true --homebeeserver >> node.log 2>&1 &
tail -f node.log
