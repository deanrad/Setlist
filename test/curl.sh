set -e #exit on first error (like grep not finding something)

HOST='http://chicagogrooves.herokuapp.com'
# HOST='http://localhost:5000'

curl --head $HOST/rUnNinG | grep 'Location: .*/running.html'

# The following should all get redirects to DeepFreeze.mp3
curl -i $HOST/deepfreeze | grep '/DeepFreeze.mp3'
curl -i $HOST/deep%20freeze | grep 'DeepFreeze.mp3'
curl -i $HOST/uprising | grep 'Uprising.pdf'
curl -i $HOST/upr | grep 'Uprising.mp3'

echo "
-------
SUCCESS  All tests pass for $HOST
"
