/*!
 * Map Service.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {svcMapUtils: deps.concat(factory)};

function factory() {
    var self = {};

    ////////////////////////////////////////
    // Constants_Earth_

    var Constants_Earth_MajorAxis = 6378137.0;
    var Constants_Earth_MinorAxis = 6356752.3142;
    var Constants_Earth_FirstEccentricitySquared = 6.69437999014e-3;

    var Vector = function(p_x, p_y, p_z, p_w) {
        this.x = p_x;
        this.y = p_y;
        this.z = p_z;
        this.w = p_w;
    };

    var Vector_Add = function (a, b) {
        return new Vector(a.x + b.x, a.y + b.y, a.z + b.z, a.w);
    };

    var Vector_Scale = function (a, v) {
        return new Vector(a * v.x, a * v.y, a * v.z, v.w);
    };

    var Vector_Mag = function (v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    };

    var Vector_Dot = function (a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    };

    var Euler = function(p_x, p_y, p_z) {
        this.x = p_x;
        this.y = p_y;
        this.z = p_z;
    };

    var Euler_Add = function (a, b) {
        return new Euler(a.x + b.x, a.y + b.y, a.z + b.z);
    };

    var Euler_Scale = function (t, a) {
        return new Euler(t * a.x, t * a.y, t * a.z);
    };

    var Euler_FromFrame = function(a) {
        var l_dX = 0;
        var l_dY = 0;
        var l_dZ = 0;
        if ( a.X.z === 1 ) {
            l_dY = -Math.PI / 2;
            l_dX = 0;
            l_dZ = Math.atan2 ( -a.Y.x, a.Y.y );
        }
        else if ( a.X.z === -1 ) {
            l_dY = Math.PI / 2;
            l_dX = 0;
            l_dZ = Math.atan2 ( a.Z.y, a.Y.y );
        }
        else {
            l_dY = Math.asin ( -a.X.z );
            l_dZ = Math.atan2 ( a.X.y, a.X.x );
            l_dX = Math.atan2 ( a.Y.z, a.Z.z );
        }

        return new Euler(l_dX, l_dY, l_dZ);
    };

    var Euler_ToFrame = function (a) {
        return Frame_RotateEuler(a);
    };

    var Frame = function(p_x, p_y, p_z, p_t) {
        this.X = p_x;
        this.Y = p_y;
        this.Z = p_z;
        this.T = p_t;
    };

    var Frame_Inverse = function (a) {
        return new Frame(
            new Vector(a.X.x, a.Y.x, a.Z.x, 0),
            new Vector(a.X.y, a.Y.y, a.Z.y, 0),
            new Vector(a.X.z, a.Y.z, a.Z.z, 0),
            new Vector(-Vector_Dot(a.X, a.T), -Vector_Dot(a.Y, a.T), -Vector_Dot(a.Z, a.T), 1));
    };

    var Frame_Mul = function (a, b) {
        return new Frame(
            new Vector(
                a.X.x * b.X.x + a.X.y * b.Y.x + a.X.z * b.Z.x,
                a.X.x * b.X.y + a.X.y * b.Y.y + a.X.z * b.Z.y,
                a.X.x * b.X.z + a.X.y * b.Y.z + a.X.z * b.Z.z, 0),
            new Vector(
                a.Y.x * b.X.x + a.Y.y * b.Y.x + a.Y.z * b.Z.x,
                a.Y.x * b.X.y + a.Y.y * b.Y.y + a.Y.z * b.Z.y,
                a.Y.x * b.X.z + a.Y.y * b.Y.z + a.Y.z * b.Z.z, 0),
            new Vector(
                a.Z.x * b.X.x + a.Z.y * b.Y.x + a.Z.z * b.Z.x,
                a.Z.x * b.X.y + a.Z.y * b.Y.y + a.Z.z * b.Z.y,
                a.Z.x * b.X.z + a.Z.y * b.Y.z + a.Z.z * b.Z.z, 0),
            new Vector(
                a.T.x * b.X.x + a.T.y * b.Y.x + a.T.z * b.Z.x + b.T.x,
                a.T.x * b.X.y + a.T.y * b.Y.y + a.T.z * b.Z.y + b.T.y,
                a.T.x * b.X.z + a.T.y * b.Y.z + a.T.z * b.Z.z + b.T.z, 1));
    };

    var Frame_RotateX = function (a) {
        var c = Math.cos(a);
        var s = Math.sin(a);
        return new Frame(new Vector(1, 0, 0, 0), new Vector(0, c, s, 0), new Vector(0, -s, c, 0), new Vector(0, 0, 0, 1));
    };

    var Frame_RotateEuler = function (a) {
        var cX = Math.cos(a.x);
        var sX = Math.sin(a.x);
        var cY = Math.cos(a.y);
        var sY = Math.sin(a.y);
        var cZ = Math.cos(a.z);
        var sZ = Math.sin(a.z);
        return new Frame(new Vector(cY * cZ, cY * sZ, -sY, 0), new Vector(-cX * sZ + sX * sY * cZ, cX * cZ + sX * sY * sZ, sX * cY, 0), new Vector(sX * sZ + cX * sY * cZ, -sX * cZ + cX * sY * sZ, cX * cY, 0), new Vector(0, 0, 0, 1));
    };

    var Frame_RotateY = function (a) {
        var c = Math.cos(a);
        var s = Math.sin(a);
        return new Frame(new Vector(c, 0, -s, 0), new Vector(0, 1, 0, 0), new Vector(s, 0, c, 0), new Vector(0, 0, 0, 1));
    };

    var GeodeticCoordinate = function(p_Lat, p_Lon, p_Alt) {
        this.Lat = p_Lat;
        this.Lon = p_Lon;
        this.Alt = p_Alt;
    };

    var GeodeticCoordinate_FromVector = function (p_vA) {
        var P = Math.sqrt(p_vA.x * p_vA.x + p_vA.y * p_vA.y);
        var Z = Math.sqrt(p_vA.z * p_vA.z);
        if (Z == 0) {
            return new GeodeticCoordinate(0.0, Math.atan2(p_vA.y, p_vA.x), P - Constants_Earth_MajorAxis);
        }
        if (P == 0) {
            if (Z == 0) {
                return new GeodeticCoordinate(0, 0, -Constants_Earth_MajorAxis);
            }
            if (p_vA.z > 0) {
                return new GeodeticCoordinate(Math.atan2(1.0, 0.0), 0, p_vA.z - Constants_Earth_MajorAxis * Math.sqrt(1.0 - Constants_Earth_FirstEccentricitySquared));
            }
            return new GeodeticCoordinate(Math.atan2(-1.0, 0.0), 0, -p_vA.z - Constants_Earth_MajorAxis * Math.sqrt(1.0 - Constants_Earth_FirstEccentricitySquared));
        }
        var c = Constants_Earth_MajorAxis / Constants_Earth_MinorAxis;
        var d = P / Z;
        var b3 = 2 * (d * c + (c * Constants_Earth_MajorAxis - Constants_Earth_MinorAxis) / Z);
        var b1 = 2 * (d * c - (c * Constants_Earth_MajorAxis - Constants_Earth_MinorAxis) / Z);
        var g = 1 / b1;
        for (var l_iI = 0; l_iI < 32; l_iI++) {
            var f = g * (g * (g * (g + b3)) + b1) - 1;
            var df = g * (g * (g * 4 + 3 * b3)) + b1;
            g = g - f / df;
            if (f == 0)
                break;
        }
        var t = 2 * Math.atan(g);
        var LAT = Math.atan2(Constants_Earth_MajorAxis * Math.sin(t), Constants_Earth_MinorAxis * Math.cos(t));
        var LON = Math.atan2(p_vA.y, p_vA.x);
        var N = Constants_Earth_MajorAxis / Math.sqrt(1 - Constants_Earth_FirstEccentricitySquared * Math.sin(LAT) * Math.sin(LAT));
        var ALT = Z / Math.sin(LAT) - N * (1 - Constants_Earth_FirstEccentricitySquared);
        return new GeodeticCoordinate((p_vA.z < 0 ? -LAT : LAT), LON, ALT);
    };

    var GeodeticCoordinate_ToVector = function (p_cA) {
        var l_dN = Constants_Earth_MajorAxis / Math.sqrt(1.0 - Constants_Earth_FirstEccentricitySquared * Math.sin(p_cA.Lat) * Math.sin(p_cA.Lat));
        return new Vector(
            (l_dN + p_cA.Alt) * Math.cos(p_cA.Lat) * Math.cos(p_cA.Lon),
            (l_dN + p_cA.Alt) * Math.cos(p_cA.Lat) * Math.sin(p_cA.Lon),
            (l_dN * (1 - Constants_Earth_FirstEccentricitySquared) + p_cA.Alt) * Math.sin(p_cA.Lat), 1);
    };

    var GeodeticCoordinate_ToFrame = function (p_cA) {
        var l_fA = new Frame(
            new Vector(0, 0, 1, 0),
            new Vector(0, 1, 0, 0),
            new Vector(-1, 0, 0, 0),
            GeodeticCoordinate_ToVector(p_cA));
        l_fA = Frame_Mul(Frame_RotateX(p_cA.Lon), l_fA);
        l_fA = Frame_Mul(Frame_RotateY(-p_cA.Lat), l_fA);
        return l_fA;
    };

    self.MotionBuffer = function(timestamp,
                                 entityLocation,
                                 entityLinearVelocity,
                                 entityOrientation,
                                 deadReckoningParameters) {
        return {
            T0: timestamp,
            F0: [
                new Vector(entityLocation.x, entityLocation.y, entityLocation.z, 1),
                new Vector(entityLinearVelocity.x, entityLinearVelocity.y, entityLinearVelocity.z, 1),
                new Vector(
                    deadReckoningParameters.entityLinearAcceleration.x,
                    deadReckoningParameters.entityLinearAcceleration.y,
                    deadReckoningParameters.entityLinearAcceleration.z, 1),
                new Vector(0, 0, 0, 0),
                new Vector(0, 0, 0, 0),
                new Vector(0, 0, 0, 0)
            ],
            G0: [
                new Euler(entityOrientation.phi, entityOrientation.theta, entityOrientation.psi),
                new Euler(
                    deadReckoningParameters.entityAngularVelocity.x,
                    deadReckoningParameters.entityAngularVelocity.y,
                    deadReckoningParameters.entityAngularVelocity.z),
                new Euler(0, 0, 0),
                new Euler(0, 0, 0)
            ],
            T1: timestamp+10,
            F1: [
                new Vector(0, 0, 0, 0),
                new Vector(0, 0, 0, 0),
                new Vector(0, 0, 0, 0)
            ],
            G1: [
                new Euler(0, 0, 0),
                new Euler(0, 0, 0)
            ]
        };
    };

    var MotionBuffer_GetWorldPosition = function (m, t) {
        var dt;
        var result;
        if (t < m.T0) {
            result = m.F0[0];
        }
        else if (t < m.T1) {
            dt = t - m.T0;
            result =
                Vector_Add(m.F0[0],
                    Vector_Add(Vector_Scale(dt, m.F0[1]),
                        Vector_Add(Vector_Scale(1.0 / 2.0 * dt * dt, m.F0[2]),
                            Vector_Add(Vector_Scale(1.0 / 6.0 * dt * dt * dt, m.F0[3]),
                                Vector_Add(Vector_Scale(1.0 / 24.0 * dt * dt * dt * dt, m.F0[4]),
                                    Vector_Scale(1.0 / 120.0 * dt * dt * dt * dt * dt, m.F0[5])
                                )
                            )
                        )
                    )
                );
        }
        else {
            dt = t - m.T1;
            result = Vector_Add(m.F1[0], Vector_Add(Vector_Scale(dt, m.F1[1]), Vector_Scale(dt, m.F1[2])));
        }

        return result;
    };

    var MotionBuffer_GetWorldOrientation = function (m, t) {
        var dt;
        var result;
        if (t < m.T0) {
            result = m.G0[0];
        }
        else if (t < m.T1) {
            dt = t - m.T0;
            result = Euler_Add(m.G0[0], Euler_Add(Euler_Scale(dt, m.G0[1]), Euler_Add(Euler_Scale(1.0 / 2.0 * dt * dt, m.G0[2]), Euler_Scale(1.0 / 6.0 * dt * dt * dt, m.G0[3]))));
        }
        else {
            dt = t - m.T1;
            result = Euler_Add(m.G1[0], Euler_Scale(dt, m.G1[1]));
        }

        return result;
    };

    self.lonRadToDeg = function(rad) {
        if (typeof rad === 'undefined')
            return "";

        // normalize to range -2pi to 2pi
        rad = rad % (Math.PI*2);
        if (rad < 0)
            rad = 2*Math.PI + rad;

        // convert negatives to equivalent positive angle
        var rad360 = rad % (Math.PI*2);

        // anything above 90 is subtracted from 360
        if (rad360 > Math.PI)
            rad360 = Math.PI*2 - rad360;

        // if it is greater than 180 then make negative
        if (rad > Math.PI)
            rad = -rad360;
        else
            rad = rad360;

        return rad/Math.PI*180;
    };

    self.latRadToDeg = function(rad) {
        if (typeof rad === 'undefined')
            return "";

        // normalize to range -2pi to 2pi
        rad = rad % (Math.PI*2);

        // convert negatives to equivalent positive angle
        if (rad < 0)
            rad = 2*Math.PI + rad;

        // restict to 0 - 180
        var rad180 = rad % (Math.PI);

        // anything above 90 is subtracted from 180
        if (rad180 > Math.PI/2)
            rad180 = Math.PI - rad180;
        // if it is greater than 180 then make negative
        if (rad > Math.PI)
            rad = -rad180;
        else
            rad = rad180;

        return rad/Math.PI*180;
    };

    self.entityLinearVelocity = function(v) {
        return Vector_Mag(v);
    };

    self.entityLinearAcceleration = function(v) {
        return Vector_Mag(v);
    };

    self.entityPosition = function(M, t) {
        try {
            var eW = MotionBuffer_GetWorldPosition(M, t);
            //if (self.MyEarth.isPointVisible(eW) == false) {
            if (eW.x===0) {
                return null;
            }

            var o = MotionBuffer_GetWorldOrientation(M, t);

            var eG = GeodeticCoordinate_FromVector(eW);
            var lv_w = GeodeticCoordinate_ToFrame(eG);
            //lv_w.T = new Vector(0,0,0,1);
            var c_w = Euler_ToFrame(o);
            var q = Frame_Mul(c_w, Frame_Inverse(lv_w));
            var hpr = Euler_FromFrame(q);

            var v = M.F0[1];

            var speed = Vector_Mag(v);

            return {'lat':eG.Lat, 'lon':eG.Lon, 'alt':eG.Alt, 'heading': hpr.z, 'speed':speed};
        }
        catch(err) {
            console.log(err.message);
        }

        return {};
    };

    return self;
}

});

