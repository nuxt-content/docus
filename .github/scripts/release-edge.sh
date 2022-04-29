#!/bin/bash

# Restore all git changes
git restore -s@ -SW  -- theme

# Bump versions to edge
yarn jiti ./.github/scripts/bump-edge

# Update token
if [[ ! -z ${NODE_AUTH_TOKEN} ]] ; then
  echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" >> ~/.npmrc
  echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
  echo "always-auth=true" >> ~/.npmrc
  npm whoami
fi

# Release package
echo "Publishing docus-edge"
npm publish -q --access public
