set -eux

cd $(dirname $0)/..
pwd

readonly packaged_artifact=packaged.zip

rm -f ${packaged_artifact}

zip -j ${packaged_artifact} manifest.json *.html
zip -r ${packaged_artifact} javascript lib images

# list files within the packaged zip
zipinfo -l ${packaged_artifact}