# discribe-server

node server for DIScribe services

# Requires
1. node/npm
2. python               // for PDU template generation
2. npm install mocha -g     // for running tests
3. npm install bunyan -g    // for 'pretty' log output
4. npm install bower -g     // for ui packages

# Build

1. cd discribe-server
2. ./build

# Run (listens on port 3000)
1. node lib/server | bunyan

# Testing (currently needs test archive "a_Force Count 1_1420642699_1420650044")
mocha test

# Building Docker Image
```bash
docker build -t <IMAGE_NAME> .
```

# Running Docker Image
```bash
docker run -p 3000:3000 <IMAGE_NAME>
```

The -p 3000:3000 flag binds the docker port 3000 to your local machine/VM's 
port 3000. You will need to forward port 3000 if running using Boot2Docker in
 a VirtualBox VM.
