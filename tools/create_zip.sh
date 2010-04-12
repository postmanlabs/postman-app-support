#!/bin/sh

die () {
  echo "$1" > /dev/stderr
  exit 1
}

echo "Started build"

# make build directory and copy original files there for preflighting
rm -rf ../build
rm -rf ../simple-rest-client.zip
mkdir ../build
cp -R ../simple-rest-client/_locales ../build/
cp -R ../simple-rest-client/* ../build/

# combine/minimize JS and CSS
echo "Minimizing JS"
java -jar compiler.jar -js ../build/requester.js > ../build/requester.min.js || die "Failed to minimize JS"

echo "Combining JS"
cat ../build/jquery.min.js ../build/jquery.chili.min.js ../build/jquery.chili.recipes.js ../build/requester.min.js > ../build/scripts.js || die "Failed to combine JS"

echo "Minimizing CSS"
java -jar yuicompressor-2.4.2.jar ../build/style.css > ../build/style.min.css && \
    sed -i -e "s|;}|}|g" ../build/style.min.css || die "Failed to minimize CSS"

echo "Combining CSS"
cat ../build/reset.min.css ../build/style.min.css > ../build/screen.css || die "Failed to combine CSS"
java -jar yuicompressor-2.4.2.jar ../build/screen.css > ../build/screen.min.css && \
    sed -i -e "s|;}|}|g" ../build/screen.min.css || die "Failed to minimize CSS"

# consolidate JS links, inline CSS
echo "Consolidate JS links, inlining CSS"
css=`cat ../build/screen.min.css`
sed -i -e "s|<script type=\"text/javascript\" src=\"jquery.min.js\"></script>||g" ../build/index.html || die "Failed to consolidate JS and inlining CSS"
sed -i -e "s|<script type=\"text/javascript\" src=\"jquery.chili.min.js\"></script>||g" ../build/index.html || die "Failed to consolidate JS and inlining CSS"
sed -i -e "s|<script type=\"text/javascript\" src=\"jquery.chili.recipes.js\"></script>||g" ../build/index.html || die "Failed to consolidate JS and inlining CSS"
sed -i -e "s|<script type=\"text/javascript\" src=\"requester.js\">|<script type=\"text/javascript\" src=\"scripts.js\">|g" ../build/index.html || die "Failed to consolidate JS and inlining CSS"
sed -i -e "s|<link rel=\"stylesheet\" type=\"text/css\" href=\"reset.min.css\" />||g" ../build/index.html || die "Failed to consolidate JS and inlining CSS"
sed -i -e "s|<link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />|<style>${css}</style>|g" ../build/index.html || die "Failed to consolidate JS and inlining CSS"

# remove unused CSS properties on a page-by-page basis
# echo "Removing unused CSS"
# python lesscss.py ../build/index.html || die "Failed to remove unused CSS"

# zipping build to simple-rest-client.zip
echo "Cleanning up before building ZIP"
rm -rf ../build/requester.js
rm -rf ../build/requester.min.js
rm -rf ../build/jquery.min.js
rm -rf ../build/jquery.chili.min.js
rm -rf ../build/jquery.chili.recipes.js
rm -rf ../build/reset.min.css
rm -rf ../build/style.css
rm -rf ../build/screen.css
rm -rf ../build/screen.min.css
rm -rf ../build/*-e
echo "Creating ZIP archive for chrome.google.com/extensions"
zip ../simple-rest-client.zip -rq ../build/*  || die "Failed to create ZIP"
rm -rf ../build
echo "Done"