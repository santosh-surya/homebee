git add .
git commit -a -m "comments: $1"
git push
ssh santosh@rackspace "cd /home/santosh/homebee/homebee-server;/home/santosh/homebee/homebee-server/pull-debug.sh"
