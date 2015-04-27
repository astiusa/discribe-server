'use strict';

var disUtils = exports;

disUtils.AntennaPatternList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.ModulationParameter(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.AudioData = {
    get : function(dataView, offset, samples, dataLength) {
        var sampleSize = dataLength/samples;

        switch(sampleSize) {
            case 8: {
                return disUtils.Uint8Array.get(dataView, offset, samples);
            }
            case 16: {
                return disUtils.Uint16Array.get(dataView, offset, samples);
            }
            case 32: {
                return disUtils.Uint32Array.get(dataView, offset, samples);
            }
        }

        console.log("Invalid Audio format - samples"+samples+", dataLength:"+dataLength+" sampleSize:"+sampleSize);
        return [];
    },

    set : function(dataView, offset, protocolVersion, list) {
        for(var idx = 0; idx < list.length; idx++)
        {
            dataView.setUint16(offset+(idx*2), list[idx]);
        }
    }
};

disUtils.CharArray = {
    get : function(dataView, offset, listSize) {
        var chars = "";
        for(var idx = 0; idx < listSize; idx++)
        {
            var char = parseInt(dataView.getUint8(offset+idx), 10);
            chars += String.fromCharCode(char);
        }

        return chars;
    },

    set : function(dataView, offset, s) {
        for(var idx = 0; idx < s.length; idx++)
        {
            dataView.setUint8(offset+idx, s.charCodeAt(idx));
        }
    }
};

disUtils.DataRecordList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var dataRecord = disUtils.DataRecord(dataView, nextOffset, protocolVersion);
            list.push(dataRecord);
            nextOffset += dataRecord.recordLength;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.DataRecordValues = {
    get : function(dataView, offset, protocolVersion, dataRecordSize) {
        var list = [];
        // Record size - description fields
        var listSize = dataRecordSize-6;
        for(var idx = 0; idx < listSize; idx++)
        {
            var value = dataView.getUint8(offset+idx);
            list.push(value);
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.FixedDatumList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.FixedDatum(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.ElectromagneticEmissionSystemDataList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.ElectromagneticEmissionSystemData(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        var nextOffset = offset;
        for(var idx = 0; idx < list.length; idx++)
        {
            var item = disUtils.ElectromagneticEmissionSystemData(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }
    }
};

disUtils.ElectromagneticEmissionBeamDataList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.ElectromagneticEmissionBeamData(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.IffFundamentalParameterDataList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.IffFundamentalParameterData(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.IffLayerList = {
    get : function(dataView, offset, protocolVersion, pduLength) {
        var list = [];
        var maxLayers = 4;
        var nextOffset = offset;
        for(var idx = 0; idx < maxLayers; idx++)
        {
            var layer;
            var layerHeader = disUtils.LayerHeader(dataView, nextOffset, protocolVersion);
            switch(layerHeader.layerNumber) {
                case 2: {
                    layer = disUtils.IffAtcNavAidsLayer2(dataView, nextOffset, protocolVersion);
                    list.push(layer);
                    break;
                }
                default:
                    console.log("Unsupported Iff Layer number: "+layerHeader.layerNumber);
            }
            nextOffset += layerHeader.layerLength;
            if ((nextOffset-offset)>=pduLength) {
                break;
            }
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.FundamentalParameterDataList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.FundamentalParameterData(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.ModulationParameterList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.ModulationParameter(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.RecordIdList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        return disUtils.Uint32Array.get(dataView, offset, listSize);
    },

    set : function(dataView, offset, protocolVersion, list) {
        disUtils.Uint32Array.set(dataView, offset, list);
    }
};

disUtils.RecordSetList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var recordSet = disUtils.RecordSet(dataView, nextOffset, protocolVersion);
            list.push(recordSet);
            // recordSet.size is size before recordValues. recordLength is size in bits
            var recordValuesSize = (recordSet.size+((recordSet.recordLength>>3)*recordSet.recordCount));
            // Pad to next 64bit boundary
            recordValuesSize = Math.floor((recordValuesSize-1)<<3)>>3;
            nextOffset += recordValuesSize;
        }
        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.RecordSetValues = {
    get : function(dataView, offset, listSize, recordSizeInBits) {
        var list = [];
        var recordSizeInBytes = recordSizeInBits >> 3;
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var arrayBuffer = dataView.copyArrayBufferFromOffset(nextOffset, recordSizeInBytes);
            list.push(arrayBuffer);
            nextOffset += recordSizeInBytes;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, arrayBuffer, listSize) {
        // Tbd
    }
};

disUtils.SupplyQuantityList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.SupplyQuantity(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.TrackJamTargetList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.TrackJamTarget(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.Uint8Array = {
    get : function(dataView, offset, listSize) {
        var list = [];
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = dataView.getUint8(offset+idx);
            list.push(item);
        }

        return list;
    },

    set : function(dataView, offset, list) {
        for(var idx = 0; idx < list.length; idx++)
        {
            dataView.setUint8(offset+idx, list[idx]);
        }
    }
};

disUtils.Uint16Array = {
    get : function(dataView, offset, listSize) {
        var list = [];
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = dataView.getUint16(offset+(idx*2));
            list.push(item);
        }

        return list;
    },

    set : function(dataView, offset, list) {
        for(var idx = 0; idx < list.length; idx++)
        {
            dataView.setUint16(offset+(idx*2), list[idx]);
        }
    }
};

disUtils.Uint32Array = {
    get : function(dataView, offset, listSize) {
        var list = [];
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = dataView.getUint32(offset+(idx*4));
            list.push(item);
        }

        return list;
    },

    set : function(dataView, offset, list) {
        for(var idx = 0; idx < list.length; idx++)
        {
            dataView.setUint32(offset+(idx*4), list[idx]);
        }
    }
};

disUtils.VariableDatumList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var variableDatum = disUtils.VariableDatum(dataView, nextOffset, protocolVersion);
            list.push(variableDatum);

            // Size is (value in bits) to next 64 bit boundary, convert to bytes + Uint32 +Uint32
            var variableDatumSize = (Math.ceil(variableDatum.variableDatumLength>>6)<<3) + 64;
            nextOffset += variableDatumSize;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};

disUtils.VariableDatumValue = {
    get : function(dataView, offset, protocolVersion, sizeInBits) {
        // returns array of bytes
        var list = [];
        if (sizeInBits===0) {
            return list;
        }

        var valueSizeInBytes = Math.ceil((sizeInBits)>>3);
        for(var idx = 0; idx < valueSizeInBytes; idx++)
        {
            var item = dataView.getUint8(offset+idx);
            list.push(item);
        }

        return list;
    },

    set : function(dataView, offset, list) {
        // List is expected to be modulo 64bits
        for(var idx = 0; idx < list.length; idx++)
        {
            dataView.setUint8(offset+idx, list[idx]);
        }
    }
};

disUtils.VariableParameterList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.VariableParameter(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list, listSize) {
        // Tbd
    }
};

disUtils.VariableTransmitterParameterList = {
    get : function(dataView, offset, protocolVersion, listSize) {
        var list = [];
        var nextOffset = offset;
        for(var idx = 0; idx < listSize; idx++)
        {
            var item = disUtils.VariableParameter(dataView, nextOffset, protocolVersion);
            list.push(item);
            nextOffset += item.size;
        }

        return list;
    },

    set : function(dataView, offset, protocolVersion, list) {
        // Tbd
    }
};
