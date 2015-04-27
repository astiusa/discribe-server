/**
 * Created by chriscooke on 4/17/15.
 */
'use strict';

var Q = require('q');
var bv = require('./bv');
var pduView = require('./pduView');
var Formatter = require('./formatter');

var log = require('./logger').create('disParser');

var disParser = module.exports;

disParser.parse = function(buffer, filter, fields, hasGlobalHeader) {

    var d = Q.defer();

    var PACKET_TYPE_OFFSET = 12;

    var IPV4 = 0x0800;
    var IPV4_IP_LENGTH_OFFSET = 16;
    var IPV4_SRC_ADDRESS_OFFSET = 26;
    var IPV4_DST_ADDRESS_OFFSET = 30;
    var IPV4_SRC_PORT_OFFSET = 34;
    var IPV4_DST_PORT_OFFSET = 36;
    var IPV4_UDP_LENGTH_OFFSET = 38;
    var IPV4_PACKET_OFFSET = 42;

    var IPV6 = 0x86dd;
    //var IPV6_PORT_OFFSET = 56;
    var IPV6_PACKET_OFFSET = 62;

    var GLOBAL_HEADER_LENGTH = 24; //bytes
    var PACKET_HEADER_LENGTH = 16; //bytes

    var self = {
        parser: null,
        filter: null,
        formatter: null,
        buffer: null,
        bufferIndex: 0,             // Current location within buffer
        pduLE: false,               // pdu endiness
        pcapLE: true,               // pcap endiness
        packetOffset: IPV4_PACKET_OFFSET,
        packetBufferIndex: 0,       // Position of start of current packet
        packetCount: 0,
        currentPacketHeader: {},
        pdus: []
    };

    var isValidUdpPacket = function() {
        var valid = true;

        try {

            //var dv = new dis.DisView(self.buffer, self.bufferIndex, self.pduLE);
            var dv = bv.dataView(self.buffer, self.bufferIndex, self.pduLE);

            var packetType = dv.getUint16(PACKET_TYPE_OFFSET);
            // Position at start of DIS data
            if (packetType==IPV4) {
                self.currentPacketHeader.ipPacketLength = dv.getUint16(IPV4_IP_LENGTH_OFFSET);
                self.currentPacketHeader.ipSrcAddress = dv.getUint32(IPV4_SRC_ADDRESS_OFFSET);
                self.currentPacketHeader.ipDstAddress = dv.getUint32(IPV4_DST_ADDRESS_OFFSET);
                self.currentPacketHeader.ipSrcPort = dv.getUint16(IPV4_SRC_PORT_OFFSET);
                self.currentPacketHeader.ipDstPort = dv.getUint16(IPV4_DST_PORT_OFFSET);
                self.currentPacketHeader.udpPacketLength = dv.getUint16(IPV4_UDP_LENGTH_OFFSET);

                self.packetOffset = IPV4_PACKET_OFFSET;
            } else if (packetType==IPV6) {  // Not supported at this time
                self.packetOffset = IPV6_PACKET_OFFSET;
                log.error("Packet Validation", "Ignoring IPV6 ethernet packet:"+packetType);
                valid = false;
            } else {  //Not valid
                log.error("Packet Validation", "Ignoring unknown Ethernet packet:"+packetType);
                valid = false;
            }
        }
        catch(err) {
            log.error("Packet Validation", "Exception: " + err.message);
            valid = false;
        }

        return valid;
    };

    self.parsePdu = function() {

        //var dv = new dis.DisView(self.buffer, self.bufferIndex, self.pduLE);
        var dv = bv.dataView(self.buffer, self.bufferIndex, self.pduLE);

        // Use dis pdu length to validate dis packet (must be at least 12 bytes
        var pduType = dv.getUint8(2);
        var pduLength = dv.getUint16(8);
        if ((self.currentPacketHeader.udpPacketLength<12) ||
            (self.currentPacketHeader.udpPacketLength-pduLength)!==8) {
            //Temporary check to handle incorrect EntityStateSummary/TransmissionSummary lengths pdu
            if(pduType!==212 && pduType!==213) {
                // Not a DIS packet
                pduType = -1;       // Show as udp packet
                //log.error("Non DIS Packet received (UDP?)");
            }
        } else {
            pduType = dv.getUint8(2);
        }

        var pdu = pduView(pduType, dv);
        if (pdu) {
            var passes = self.filter ? self.filter.passes(pdu) : true;
            if (passes) {
                // Merge second amd microsecond timestamps from packet header
                pdu.header = {};
                pdu.header.timestamp = (self.currentPacketHeader.timestampSeconds +
                (self.currentPacketHeader.timestampMicroseconds*0.000001));
                pdu.header.port = self.currentPacketHeader.ipDstPort;
                pdu.header.srcAddress = self.currentPacketHeader.ipSrcAddress;
                pdu.header.dstAddress = self.currentPacketHeader.ipDstAddress;

                var fieldValues = self.formatter.pduValues(pdu);
                self.pdus.push(fieldValues);
            }
        }
    };

    self.parsePacketBody = function() {
        if ((self.buffer.length-self.bufferIndex) < self.currentPacketHeader.capturedLength) {
            var bytesLeft = self.buffer.length - self.bufferIndex;
            var diff = self.currentPacketHeader.capturedLength - bytesLeft;
            throw new Error("Size mismatch in packet buffer, bytesLeft=" + bytesLeft + ", diff=" + diff);
        }

        if (isValidUdpPacket()) {
            self.bufferIndex += self.packetOffset;
            self.parsePdu();
        }

        // Move to start of next packet
        self.bufferIndex = self.packetBufferIndex + PACKET_HEADER_LENGTH + self.currentPacketHeader.capturedLength;
        self.parser = self.parsePacketHeader;

        return true;
    };

    self.parsePacketHeader = function() {
        if ((self.buffer.length -self.bufferIndex) >= PACKET_HEADER_LENGTH) {
            self.packetBufferIndex = self.bufferIndex;
            self.packetCount += 1;

            //var dv = new dis.DisView(self.buffer, self.bufferIndex, self.pcapLE);
            var dv = bv.dataView(self.buffer, self.bufferIndex, self.pcapLE);
            self.currentPacketHeader = {
                timestampSeconds: dv.getUint32(0),
                timestampMicroseconds: dv.getUint32(4),
                capturedLength: dv.getUint32(8),
                originalLength: dv.getUint32(12)
            };

            self.bufferIndex += PACKET_HEADER_LENGTH;
            self.parser = self.parsePacketBody;
            return true;
        }

        return false;
    };

    self.parseGlobalHeader = function() {

        if (self.buffer.length >= GLOBAL_HEADER_LENGTH) {
            // Determine byte swapping from 'magic number'
            var magicNumber = new Uint8Array(self.buffer,0,4);

            self.pcapLE = (magicNumber[0].toString(16) !== "a1");

            //var dv = new dis.DisView(self.buffer, 0, self.pcapLE);
            var dv = bv.dataView(self.buffer, 0, self.pcapLE);

            var header = {
                magicNumber: dv.getUint32(0),
                majorVersion: dv.getUint16(4),
                minorVersion: dv.getUint16(6),
                gmtOffset: dv.getInt32(8),
                timestampAccuracy: dv.getUint32(12),
                snapshotLength: dv.getUint32(16),
                linkLayerType: dv.getUint32(20)
            };

            // Check valid magic number with endiness
            magicNumber = header.magicNumber.toString(16);
            if (magicNumber !== "a1b2c3d4" && magicNumber !== "d4c3b2a1") {
                throw new Error("Unknown magic number: " + magicNumber.toString());
            }

            if (header.majorVersion != 2 && header.minorVersion != 4) {
                throw new Error("Unsupported version "+header.majorVersion+"."+header.minorVersion+". parser only parses libpcap file format 2.4");
            }

            self.bufferIndex += GLOBAL_HEADER_LENGTH;
            self.parser = self.parsePacketHeader;
            return true;
        }

        return false;
    };

    try {

        self.filter = filter;
        self.formatter = new Formatter(fields);
        self.buffer = buffer;
        self.bufferIndex = 0;

        self.parser = hasGlobalHeader ? self.parseGlobalHeader : self.parsePacketHeader;

        while (self.parser.call(this)) {}

        d.resolve(self.pdus);
    }
    catch(err) {
        d.reject(err);
    }

    return d.promise;
};

