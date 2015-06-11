FROM centos:centos7
MAINTAINER Ryan Tucker <ryan.tucker@asti-usa.com>

# Enable EPEL for Node.js
RUN     rpm -Uvh http://dl.fedoraproject.org/pub/epel/7/x86_64/e/epel-release-7-5.noarch.rpm
# Install Node.js and npm

RUN     yum update -y && yum install -y git npm

# Bundle the app source
COPY . /src

RUN cd /src; npm install --production && \
     npm install -g bunyan && \
     npm install -g bower && \
     cd ui && \
     bower install && \
     cd ../pduGenerator && \
     python pduParser.py

ENV NODE_ENV production

EXPOSE 3000

WORKDIR /src
CMD ["node", "lib/server.js"]
