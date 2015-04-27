/**
 * Created by chriscooke on 4/13/15.
 * ArrayBuffer DataView replacement object that uses node Buffer and maintains littleEndian within the module.
 */

'use strict';

var bv = module.exports;

var dataViewLE = function(buffer, bufferIndex) {
    this.buffer = buffer;
    this.bufferIndex = bufferIndex;

    // DataView function overides
    this.getUint8 = function(offset) {return this.buffer.readUInt8(this.bufferIndex+offset);};
    this.getInt8 = function(offset) {return this.buffer.readInt8(this.bufferIndex+offset);};
    this.getUint16 = function(offset) {return this.buffer.readUInt16LE(this.bufferIndex+offset);};
    this.getInt16 = function(offset) {return this.buffer.readInt16LE(this.bufferIndex+offset);};
    this.getUint32 = function(offset) {return this.buffer.readUInt32LE(this.bufferIndex+offset);};
    this.getInt32 = function(offset) {return this.buffer.readInt32LE(this.bufferIndex+offset);};
    this.getFloat32 = function(offset) {return this.buffer.readFloatLE(this.bufferIndex+offset);};
    this.getFloat64 = function(offset) {return this.buffer.readFloatLE(this.bufferIndex+offset);};
    this.getLong = function(offset) {
        var m = Math.pow(2,31);
        var data1 = this.buffer.readUInt32LE(this.bufferIndex+offset);
        var data2 = this.buffer.readUInt32LE(this.bufferIndex+offset+4);
        return data1*m + data2;
    };

    this.setUint8 = function(offset, val) {this.buffer.writeUInt8(val, this.bufferIndex+offset);};
    this.setInt8 = function(offset, val) {this.buffer.writeInt8(val, this.bufferIndex+offset);};
    this.setUint16 = function(offset, val) {this.buffer.writeUInt16LE(val, this.bufferIndex+offset);};
    this.setInt16 = function(offset, val) {this.buffer.writeInt16LE(val, this.bufferIndex+offset);};
    this.setUint32 = function(offset, val) {this.buffer.writeUInt32LE(val, this.bufferIndex+offset);};
    this.setInt32 = function(offset, val) {this.buffer.writeInt32LE(val, this.bufferIndex+offset);};
    this.setFloat32 = function(offset, val) {this.buffer.writeFloatLE(val, this.bufferIndex+offset);};
    this.setFloat64 = function(offset, val) {this.buffer.writeFloatLE(val, this.bufferIndex+offset);};
    this.setLong = function(offset, val) {
        /*
         var m = Math.pow(2,31);
         var valMs = Math.floor(val/m);
         var valLs = val;
         this.buffer.writeUInt32LE(valMs, this.bufferIndex+offset);
         this.buffer.writeUInt32LE(valLs, this.bufferIndex+offset+4);
         */
    };
};

var dataViewBE = function(buffer, bufferIndex) {
    this.buffer = buffer;
    this.bufferIndex = bufferIndex;

    // DataView function overides
    this.getUint8 = function(offset) {return this.buffer.readUInt8(this.bufferIndex+offset);};
    this.getInt8 = function(offset) {return this.buffer.readInt8(this.bufferIndex+offset);};
    this.getUint16 = function(offset) {return this.buffer.readUInt16BE(this.bufferIndex+offset);};
    this.getInt16 = function(offset) {return this.buffer.readInt16BE(this.bufferIndex+offset);};
    this.getUint32 = function(offset) {return this.buffer.readUInt32BE(this.bufferIndex+offset);};
    this.getInt32 = function(offset) {return this.buffer.readInt32BE(this.bufferIndex+offset);};
    this.getFloat32 = function(offset) {return this.buffer.readFloatBE(this.bufferIndex+offset);};
    this.getFloat64 = function(offset) {return this.buffer.readFloatBE(this.bufferIndex+offset);};
    this.getLong = function(offset) {
        var m = Math.pow(2,31);
        var data1 = this.buffer.readUInt32BE(this.bufferIndex+offset);
        var data2 = this.buffer.readUInt32BE(this.bufferIndex+offset+4);
        return data1*m + data2;
    };

    this.setUint8 = function(offset, val) {this.buffer.writeUInt8(val, this.bufferIndex+offset);};
    this.setInt8 = function(offset, val) {this.buffer.writeInt8(val, this.bufferIndex+offset);};
    this.setUint16 = function(offset, val) {this.buffer.writeUInt16BE(val, this.bufferIndex+offset);};
    this.setInt16 = function(offset, val) {this.buffer.writeInt16BE(val, this.bufferIndex+offset);};
    this.setUint32 = function(offset, val) {this.buffer.writeUInt32BE(val, this.bufferIndex+offset);};
    this.setInt32 = function(offset, val) {this.buffer.writeInt32BE(val, this.bufferIndex+offset);};
    this.setFloat32 = function(offset, val) {this.buffer.writeFloatBE(val, this.bufferIndex+offset);};
    this.setFloat64 = function(offset, val) {this.buffer.writeFloatBE(val, this.bufferIndex+offset);};
    this.setLong = function(offset, val) {
        /*
         var m = Math.pow(2,31);
         var valMs = Math.floor(val/m);
         var valLs = val;
         this.buffer.writeUInt32BE(valMs, this.bufferIndex+offset);
         this.buffer.writeUInt32BE(valLs, this.bufferIndex+offset+4);
         */
    };
};

bv.dataView = function(buffer, bufferIndex, le) {
    return le ? new dataViewLE(buffer, bufferIndex) : new dataViewBE(buffer, bufferIndex);
};


