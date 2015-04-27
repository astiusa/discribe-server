# discribe-server

node server for DIScribe services

# Requires
1. node/npm
2. python               // for PDU template generation
2. npm install mocha -g     // for running tests
3. npm install bunyan -g    // for 'pretty' log output

# Build

1. cd discribe-server
2. ./build

# Run (listens on port 3000)
1. node lib/server | bunyan

# Testing (currently needs test archive "a_Force Count 1_1420642699_1420650044")
mocha test