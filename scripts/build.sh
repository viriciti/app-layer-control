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
echo "Building viriciti/app-layer-control:${VERSION} ..."
docker build -t viriciti/app-layer-control:${VERSION} .

read -p "Push image to Docker Hub? [y/N] " PUSH
if [[ ! $PUSH =~ ^[y|Y]$ ]]; then
    echo "Not pushing"
else
    docker push viriciti/app-layer-control:${VERSION}
fi
