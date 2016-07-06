git reset --hard
git pull
if pgrep nodejs &> /dev/null ; then pkill -9  nodejs ; fi
nodejs ./bin/www --log=debug --dbdebug=true --homebeeserver >> node.log 2>&1 &

