set -e #exit on first error (like grep not finding something)

curl --head http://chicagogrooves.herokuapp.com/rUnNinG | grep 'Location: .*/running.html'

# The following should all get redirects to DeepFreeze.mp3
curl --head http://chicagogrooves.herokuapp.com/deepfreeze | grep 'Location: .*/DeepFreeze.mp3'
curl --head http://chicagogrooves.herokuapp.com/deep%20freeze | grep 'Location: .*/DeepFreeze.mp3'
curl --head http://chicagogrooves.herokuapp.com/uprising | grep 'Location: .*/Uprising.mp3'

echo "All tests pass for chicagogrooves.herokuapp.com/"