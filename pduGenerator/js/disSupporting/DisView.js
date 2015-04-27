'use strict';
var dis = dis || {};

dis.DisView = function(arrayBuffer, bufferIndex, le){
    // Size defines
    this.Uint8 = 1;
    this.Int8 = 1;
    this.Uint16 = 2;
    this.Int16 = 2;
    this.Uint32 = 4;
    this.Int32 = 4;
    this.Float32 = 4;
    this.Float64 = 8;
    this.Long = 8;

    // Utility function to manage field offset
    this.after = function(field) {
        return field.offset+field.size;
    };

    // Endian setting
    this.le = le;
    this.dataView = new DataView(arrayBuffer, bufferIndex);

    this.getUint8 = function(offset) {return this.dataView.getUint8(offset, this.le);};
    this.getInt8 = function(offset) {return this.dataView.getInt8(offset, this.le);};
    this.getUint16 = function(offset) {return this.dataView.getUint16(offset, this.le);};
    this.getInt16 = function(offset) {return this.dataView.getInt16(offset, this.le);};
    this.getUint32 = function(offset) {return this.dataView.getUint32(offset, this.le);};
    this.getInt32 = function(offset) {return this.dataView.getInt32(offset, this.le);};
    this.getFloat32 = function(offset) {return this.dataView.getFloat32(offset, this.le);};
    this.getFloat64 = function(offset) {return this.dataView.getFloat64(offset, this.le);};
    this.getLong = function(offset) {
        var m = Math.pow(2,31);
        var data1 = this.dataView.getUint32(offset, this.le);
        var data2 = this.dataView.getUint32(offset+4, this.le);
        var data = data1*m + data2;
        return data;
    };

    this.setUint8 = function(offset, val) {this.dataView.setUint8(offset, val, this.le);};
    this.setInt8 = function(offset, val) {this.dataView.setInt8(offset, val, this.le);};
    this.setUint16 = function(offset, val) {this.dataView.setUint16(offset, val, this.le);};
    this.setInt16 = function(offset, val) {this.dataView.setInt16(offset, val, this.le);};
    this.setUint32 = function(offset, val) {this.dataView.setUint32(offset, val, this.le);};
    this.setInt32 = function(offset, val) {this.dataView.setInt32(offset, val, this.le);};
    this.setFloat32 = function(offset, val) {this.dataView.setFloat32(offset, val, this.le);};
    this.setFloat64 = function(offset, val) {this.dataView.setFloat64(offset, val, this.le);};
    this.setLong = function(offset, val) {
        /*
        var m = Math.pow(2,31);
        var valMs = Math.floor(val/m);
        var valLs = val;
        this.dataView.setUint32(offset, valMs, this.le);
        this.dataView.setUint32(offset+4, valLs, this.le);
        */
    };

    this.byteArray = function(offset, size) {
        var bytesAvailable = this.dataView.buffer.byteLength - offset;
        var bytesToCopy = size>bytesAvailable ? bytesAvailable : size;

        var _byteArray = [];
        for(var idx = 0; idx < bytesToCopy; idx++)
        {
            _byteArray.push(this.getUint8(offset+idx));
        }
        return _byteArray;
    };

    this.setFromByteArray = function(offset, array) {
        var bytesAvailable = this.dataView.buffer.byteLength - offset;
        var bytesToCopy = array.length>bytesAvailable ? bytesAvailable : array.length;

        for(var idx = 0; idx < bytesToCopy; idx++)
        {
            this.setUint8(offset+idx, array[idx]);
        }
    };

    this.arrayBuffer = function(begin, size) {
        // Note: end is byte index to end slicing (so not begin+size-1)
        var end = ((begin+size)>this.dataView.buffer.byteLength)
            ? this.dataView.buffer.byteLength
            : begin+size;
        return this.dataView.buffer.slice(begin, end);
    };

    this.arrayBufferFromByteArray = function(byteArray) {
        var uint8Array = new Uint8Array(byteArray);
        return uint8Array.buffer;
    };

    this.arrayBufferToByteArray = function(arrayBuffer) {
        var byteArray = [];
        var uint8Array = new Uint8Array(arrayBuffer);
        for (var idx=0; idx<arrayBuffer.byteLength; idx++) {
            byteArray.push(uint8Array[idx]);
        }
        return byteArray;
    };

    this.copyArrayBufferFromOffset = function(offset, sizeInBytes) {
        var arrayBuffer = new ArrayBuffer(sizeInBytes);
        var array32 = new Uint32Array(arrayBuffer);
        var sizeInInt32s = sizeInBytes >> 2;
        for(var idx = 0; idx < sizeInInt32s; idx++)
        {
            array32[idx] = this.getUint32(offset);
            offset += this.Uint32;
        }
        return arrayBuffer;
    };
    this.copyArrayBufferToOffset = function(arrayBuffer, offset, sizeInBytes) {
        var array32 = new Uint32Array(arrayBuffer);
        var sizeInInt32s = sizeInBytes >> 2;
        for (var idx=0; idx < sizeInInt32s; idx++) {
            this.setUint32(offset, array32[idx]);
            offset+=this.Uint32;
        }
    };
};

