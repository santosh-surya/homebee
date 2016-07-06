git reset --hard
git pull
if pgrep nodejs &> /dev/null ; then pkill -9  nodejs ; fi
nodejs ./bin/www --homebeeserver >> node.log 2>&1 &

