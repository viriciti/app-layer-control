#!/bin/bash

if ! which jq >/dev/null; then
    echo "Error: 'jq' is required, please install it (apt install jq)"
    exit 1
fi

DIRECTORY="$(dirname $(readlink -f "$0"))/../"
PKG="${DIRECTORY}/package.json"
if [[ ! -f $PKG ]]; then
    echo "No package.json found in $DIRECTORY"
    exit 1
fi

# Build the image
cd $DIRECTORY

VERSION="$(jq '.version' ${PKG} | cut -d'"' -f2)"
read -p "Build App Layer Control v${VERSION}? [Y/n] " CONTINUE
CONTINUE=${CONTINUE:Y}
if [[ $CONTINUE =~ ^[y|Y]$ ]]; then
    echo -e "\e[33m×\e[0m Not building"
    exit 0
fi

echo "Building viriciti/app-layer-control:${VERSION} ..."
docker build -t viriciti/app-layer-control:${VERSION} .

read -p "Push image to Docker Hub? [y/N] " PUSH
if [[ ! $PUSH =~ ^[y|Y]$ ]]; then
    echo -e "\e[33m×\e[0m Not pushing"
    exit 0
fi

docker push viriciti/app-layer-control:${VERSION}
echo -e "\e[32m✓ Pushed ${VERSION} to the Docker Registry\e[0m"
