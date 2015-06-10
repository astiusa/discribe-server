import sys, os, shutil
import json

srcRoot = "."
targetRoot = "../lib/"


#### string formatter templates. Note escaped braces
#### fields list for inspector
fieldOrderTemplate = """
            '{fieldName}'"""
fieldPropertiesTemplate = """
            {fieldName}:{{ offset:{offset}, fieldSize:{fieldSize}, fieldType:'{fieldType}' }}"""
#### version code snipit
pduVersionTemplate = """
var {pduVersion} = function() {{    // size: {sizeInBytes} bytes
    var self = {{}};

    self.baseSize = {sizeInBytes};

    self.view = function(dataView) {{

        // Getter & setters
        var view = {{{getters}
    {setters}
        }};

        view.protocolVersion = {protocolVersion};

        // Helper functions
        view.asByteArray = function() {{return dataView.byteArray(0, this.pduLength)}};
        view.asArrayBuffer = function() {{return dataView.arrayBuffer(0, this.pduLength)}};

        // Field order for formatter
        view.fieldOrder = [{fieldOrder}
        ];

        return view;
    }};

    // Field properties for formatter
    self.fieldProperties = {{{fieldProperties}
    }};

    return self;
}};
"""
pduSupportVersionTemplate = """
var {pduVersion} = function() {{    // size: {sizeInBytes} bytes
    var self = {{}};

    self.view = function(dataView, offset) {{

        // Getter & setters
        var view = {{{getters}
    {setters}
        }};

        view.protocolVersion = {protocolVersion};
        view.size = {sizeInBytes};

        // Helper functions
        view.asByteArray = function() {{return dataView.byteArray(0, {sizeInBytes})}};
        view.asArrayBuffer = function() {{return dataView.arrayBuffer(0, {sizeInBytes})}};

        // Field order for formatter
        view.fieldOrder = [{fieldOrder}
        ];

        return view;
    }};

    // Field properties for formatter
    self.fieldProperties = {{{fieldProperties}
    }};

    return self;
}};
"""

#### Pdu body template
pduTemplate =  """// This module is auto generated. Do not modify.
'use strict';

var dis = require('../disSupporting');
{pduVersions}
exports.version = function(protocolVersion) {{
    var supported = {{{versionMap}}};
    if (typeof protocolVersion==='undefined' || !supported.hasOwnProperty(protocolVersion)) {{
        protocolVersion = v6;   // Use default version
    }}

    return supported[protocolVersion].call(this);
}};

exports.view = function(dataView, protocolVersion) {{
    if (typeof protocolVersion==='undefined') {{
        // Use value from dataView buffer
        protocolVersion = dataView.getUint8(0);
    }}

    return exports.version(protocolVersion).view(dataView);
}};

"""
#### Pdu supporting object body template
pduSupportTemplate =  """// This module is auto generated. Do not modify.
'use strict';

var dis = require('../disSupporting');
{pduVersions}
exports.version = function(protocolVersion) {{
    var supported = {{{versionMap}}};
    if (typeof protocolVersion==='undefined' || !supported.hasOwnProperty(protocolVersion)) {{
        protocolVersion = v6;   // Use default version
    }}

    return supported[protocolVersion].call(this);
}};

exports.view = function(dataView, offset, protocolVersion) {{
    return exports.version(protocolVersion).view(dataView, offset);
}};

"""

defaultVersion = "v6"

#### define size of primitive types. Pdu support function sizes are added
#### during processing of support functions.
primitiveTypeSize = {
        "Uint8":1,
        "Int8":1,
        "Uint16":2,
        "Int16":2,
        "Uint32":4,
        "Int32":4,
        "Float32":4,
        "Float64":8,
        "Long":8
}

pduSupportingTypeSize = {
    "DescriptorRecord":{"v6":16},
    "VariableTransmitterParameter":{"v6":40}
}

#### getter/setter formatting template definitions

#### primitive type
primitiveTypeTemplate = {
    "getter": """
            get {fieldName}() {{return dataView.get{fieldType}({prefix}{offset});}},""",
    "setter": """
            set {fieldName}(val) {{dataView.set{fieldType}({prefix}{offset}, val);}}"""
}

#### array of primitive types, specifing length
primitiveArrayTemplate = {
    "getter": """
            get {fieldName}() {{return dis.UtilityFunctions.{fieldType}.get(dataView, {prefix}{offset}, {length});}},""",
    "setter": """
            set {fieldName}(list) {{dis.UtilityFunctions.{fieldType}.set(dataView, {prefix}{offset}, list);}}"""
}

primitiveArrayTemplates = {
    "CharArray": primitiveArrayTemplate,
    "Uint8Array": primitiveArrayTemplate,
    "Uint16Array": primitiveArrayTemplate,
    "Uint32Array": primitiveArrayTemplate
}

#### pduSupport objects e.g EntityId, EntityType
pduSupportObjectTemplate = {
    "getter": """
            get {fieldName}() {{return dis.{fieldType}.view(dataView, {prefix}{offset}, this.protocolVersion);}},""",
    "setter": """
            set {fieldName}(val) {{dataView.setFromByteArray({prefix}{offset}, val.asByteArray());}}"""
}

#### list of pduSupport objects, specifying list size through lengthField
pduSupportObjectListTemplate = {
    "getter": """
            get {fieldName}() {{return dis.UtilityFunctions.{fieldType}.get(dataView, {prefix}{offset}, this.protocolVersion, this.{lengthField});}},""",
    "setter": """
            set {fieldName}(list) {{dis.UtilityFunctions.{fieldType}.set(dataView, {prefix}{offset}, this.protocolVersion, list);}}"""
}

pduSupportObjectListTemplates = {
    "AntennaPatternList": pduSupportObjectListTemplate,
    "DataRecordList": pduSupportObjectListTemplate,
    "DataRecordValues": pduSupportObjectListTemplate,
    "ElectromagneticEmissionBeamDataList": pduSupportObjectListTemplate,
    "ElectromagneticEmissionSystemDataList": pduSupportObjectListTemplate,
    "FixedDatumList": pduSupportObjectListTemplate,
    "FundamentalParameterDataList": pduSupportObjectListTemplate,
    "IffFundamentalParameterDataList": pduSupportObjectListTemplate,
    "IffLayerList": pduSupportObjectListTemplate,
    "ModulationParameterList": pduSupportObjectListTemplate,
    "RecordSetList": pduSupportObjectListTemplate,
    "SupplyQuantityList": pduSupportObjectListTemplate,
    "TrackJamTargetList": pduSupportObjectListTemplate,
    "VariableTransmitterParameterList": pduSupportObjectListTemplate,
    "VariableParameterList": pduSupportObjectListTemplate,
    "VariableDatumValue": pduSupportObjectListTemplate,
    "VariableDatumList": pduSupportObjectListTemplate,
    "RecordIdList": pduSupportObjectListTemplate
}

#### template for record set values, specifying fields which contains the recordset length and count
recordSetValuesTemplates = {
    "RecordSetValues":{
        "getter": """
            get {fieldName}() {{return dis.RecordSetValues.get(dataView, {prefix}{offset}, this.{lengthField}, this.{sizeField});}},""",
        "setter": """
            set {fieldName}(list) {{dis.RecordSetValues.set(dataView, {prefix}{offset}, list, this.{sizeField});}}"""
    }
}

#### template for audio sample data, specifying lengthField and dataLength
audioDataTemplates = {
    "AudioData":{
        "getter": """
            get {fieldName}() {{return dis.UtilityFunctions.AudioData.get(dataView, {prefix}{offset}, this.{lengthField}, this.{dataLengthField});}},""",
        "setter": """
            set {fieldName}(list) {{dis.UtilityFunctions.AudioData.set(dataView, {prefix}{offset}, list, this.{lengthField}, this.{dataLengthField});}}"""
    }
}

#### unknown template formatter
unsupportedTemplate = """
            **** Unsupported field type {fieldName} ****"""

def processTemplate(template, templateType, versionTemplate, targetPath, prefix):
    templateName = template["name"]
    templateVersionMap = template["versionMap"]
    versionBodies = []
    for v in template["versions"]:
        version = v["version"]
        getters = []
        setters = []
        fieldOrder = []
        fieldProperties = []
        sizeInBytes = 0
        for field in v["fields"]:
            fieldType = field["type"]
            fieldSize = 0;
            if fieldType in primitiveTypeSize:
                ## Add primitive function calls
                getters.append(primitiveTypeTemplate["getter"].format(fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix))
                setters.append(primitiveTypeTemplate["setter"].format(fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix))
                fieldSize = primitiveTypeSize[fieldType]
                sizeInBytes += fieldSize

            elif fieldType in pduSupportingTypeSize:
                ## Add dis supporting object function calls
                getters.append(pduSupportObjectTemplate["getter"].format(fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix))
                setters.append(pduSupportObjectTemplate["setter"].format(fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix))
                if version in pduSupportingTypeSize:
                    fieldSize = pduSupportingTypeSize[fieldType][version]
                else:
                    fieldSize = pduSupportingTypeSize[fieldType][defaultVersion]
                sizeInBytes += fieldSize

            elif fieldType in primitiveArrayTemplates:
                ## Add primitive array type function calls
                t = primitiveArrayTemplates[fieldType];
                getters.append(t["getter"].format(
                    fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix, length=field["length"]))
                setters.append(t["setter"].format(fieldName=field["name"], fieldType=fieldType, prefix=prefix, offset=sizeInBytes, length=field["length"]))
                fieldSize = field["length"]
                sizeInBytes += fieldSize

            elif fieldType in pduSupportObjectListTemplates:
                ## Add dis supporting object list function calls
                t = pduSupportObjectListTemplates[fieldType];
                getters.append(t["getter"].format(
                    fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix, lengthField=field["lengthField"]))
                setters.append(t["setter"].format(fieldName=field["name"], fieldType=fieldType, prefix=prefix, offset=sizeInBytes, lengthField=field["lengthField"]))

            elif fieldType in audioDataTemplates:
                ## Add audioData function call
                t = audioDataTemplates[fieldType];
                getters.append(t["getter"].format(
                    fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix, lengthField=field["lengthField"], dataLengthField=field["dataLengthField"]))
                setters.append(t["setter"].format(
                    fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix, lengthField=field["lengthField"], dataLengthField=field["dataLengthField"]))

            elif fieldType in recordSetValuesTemplates:
                ## Add recordSet function call
                t = recordSetValuesTemplates[fieldType];
                getters.append(t["getter"].format(
                    fieldName=field["name"], fieldType=fieldType, offset=sizeInBytes, prefix=prefix, lengthField=field["lengthField"], sizeField=field["sizeField"]))
                setters.append(t["setter"].format(fieldName=field["name"], fieldType=fieldType, prefix=prefix, offset=sizeInBytes, lengthField=field["lengthField"], sizeField=field["sizeField"]))
            else:
                ## Unknown type, flag as error
                getters.append(unsupportedTemplate.format(fieldName=field["name"]))
                setters.append(unsupportedTemplate.format(fieldName=field["name"]))
                print "**** Invalid template requested for field %s: %s ****" % (field["name"], fieldType)

            fieldOrder.append(fieldOrderTemplate.format(fieldName=field["name"]))
            fieldProperties.append(fieldPropertiesTemplate.format(fieldName=field["name"],
                offset=sizeInBytes-fieldSize, fieldSize=fieldSize, fieldType=fieldType))

        versionBody = versionTemplate.format(
            pduVersion = version,
            protocolVersion = version.replace('v',''),
            sizeInBytes = sizeInBytes,
            getters=''.join(str(item) for item in getters),
            setters=','.join(str(item) for item in setters),
            fieldOrder=','.join(str(item) for item in fieldOrder),
            fieldProperties=','.join(str(item) for item in fieldProperties)
            )

        if not templateName in pduSupportingTypeSize:
           pduSupportingTypeSize[templateName] = {}

        pduSupportingTypeSize[templateName][version] = sizeInBytes
        ##print "processed %s, size=%s" % (version, sizeInBytes)

        versionBodies.append(versionBody)

    pduVersions = ''.join(str(item) for item in versionBodies)
    pduBody = templateType.format(pduName=templateName, versionMap=templateVersionMap, pduVersions=pduVersions)

    filePath = os.path.join(targetPath, templateName)+'.js'
    f = open(filePath, 'w')
    f.write(pduBody)
    f.close()

def processPduSupportTemplates(templateDir):
    targetPath = os.path.join(targetRoot, "disSupporting")
    srcPath = os.path.join(srcRoot, templateDir, 'pduSupport.json')
    jsonPduSupport=open(srcPath)
    pduSupportTemplates = json.load(jsonPduSupport)
    modules = []
    for template in pduSupportTemplates:
        ##print "processing supporting template %s" % (template["name"])
        processTemplate(template, pduSupportTemplate, pduSupportVersionTemplate, targetPath, "offset+")
        modules.append(template["name"])

    jsonPduSupport.close()
    return modules

def processPduTemplates(templateDir):
    targetPath = os.path.join(targetRoot, "dis")
    templatesPath = os.path.join(srcRoot, templateDir)
    templates = os.listdir(templatesPath)
    modules = []
    for f in templates:
        srcPath = os.path.join(templatesPath, f)
        jsonTemplate=open(srcPath)
        ##print "jsonTemplate for %s" % srcPath
        template = json.load(jsonTemplate)
        #print "processing pdu template %s" % (template["name"])
        processTemplate(template, pduTemplate, pduVersionTemplate, targetPath, "")
        jsonTemplate.close()
        modules.append(template["name"])

    return modules

def copySupportModules(srcDir):
    disFiles = ["Udp.js"]
    disSupprtFiles = ["DisView.js", "UtilityFunctions.js",
    "DescriptorRecord.js",
    "ModulationParameter.js",
    "VariableParameter.js",
    "VariableTransmitterParameter.js"]

    ## Copy static pdu modules,
    targetPath = os.path.join(targetRoot, 'dis')
    for fileName in disFiles:
        srcPath = os.path.join(srcRoot, srcDir, 'dis', fileName)

        try:
            ##print "copying %s to %s" % (srcPath, targetPath)
            shutil.copy(srcPath, targetPath)
        except Exception, e:
            print "Error copying dis module: %s" % str(e)

    ## Copy static disSupport modules,
    targetPath = os.path.join(targetRoot, 'disSupporting')
    for fileName in disSupprtFiles:
        srcPath = os.path.join(srcRoot, srcDir, 'disSupporting', fileName)

        try:
            ##print "copying %s to %s" % (srcPath, targetPath)
            shutil.copy(srcPath, targetPath)
        except Exception, e:
            print "Error copying dis support module: %s" % str(e)

def clearTargetDir(dir):
    targetPath = os.path.join(targetRoot, dir)
    for f in os.listdir(targetPath):
        filePath = os.path.join(targetPath, f)
        os.unlink(filePath)

def createIndexFile(dir):
    requireArray = []
    targetPath = os.path.join(targetRoot, dir)
    files = os.listdir(targetPath)
    for f in files:
        moduleName = f.replace(".js", "")
        requireArray.append("exports.%s = require('../%s/%s');" % (moduleName,dir, moduleName))

    indexBody = "\n".join(module for module in requireArray)

    filePath = os.path.join(targetPath, "index.js")
    f = open(filePath, 'w')
    f.write(indexBody)
    f.close()

clearTargetDir("dis")
clearTargetDir("disSupporting")
copySupportModules("js")

modules = processPduSupportTemplates("disPduSupportTemplates")
createIndexFile("disSupporting")

modules = processPduTemplates("disPduTemplates")
createIndexFile("dis")
