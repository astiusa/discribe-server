/*!
 * exercises directive.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define(['bower_components/d3/d3.min'], function(d3) {

    'use strict';

    var deps = ['$window', '$timeout'];

    return {exercises: deps.concat(factory)};

    function factory($window, $timeout) {
        return {
            restrict: 'A',
            scope: {
                exerciseStats: "=",
                timeSpan: "="
            },
            templateUrl: 'app/components/common/views/exerciseChart.html',
            link: function(scope, element) {
                var container = element[0].parentElement;

                var margin = {top: 5, right: 15, bottom: 20, left: 25},
                    width = container.offsetWidth - margin.left - margin.right,
                    height = 150 - margin.top - margin.bottom;

                var xScale = d3.time.scale().range([0, width]);
                var yScale = d3.scale.ordinal().rangePoints([height, 0], 1);

                var customTimeFormat = d3.time.format.multi([
                    [".%L", function(d) { return d.getMilliseconds(); }],
                    [":%S", function(d) { return d.getSeconds(); }],
                    ["%H:%M", function(d) { return d.getMinutes(); }],
                    ["%H:%M", function(d) { return d.getHours(); }],
                    ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
                    ["%b %d", function(d) { return d.getDate() != 1; }],
                    ["%B", function(d) { return d.getMonth(); }],
                    ["%Y", function() { return true; }]
                ]);

                var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(customTimeFormat);
                var yAxis = d3.svg.axis().scale(yScale).orient("left");

                var svg = d3.select(element[0]).append("svg")
                    .attr("class", "exercises")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);

                var pane = svg.append("rect")
                    .attr("class", "exercises pane")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                svg.append("defs").append("clipPath")
                    .attr("id", "clip")
                    .append("rect")
                    .attr("class", "exercises clipPath")
                    .attr("width", width)
                    .attr("height", height);

                var brush = d3.svg.brush()
                    .x(xScale)
                    .on("brushstart", brushStart);

                var chart = svg.append("g")
                    .attr("class", "exercises chart")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var dataArea = chart.append("g")
                    .attr("class", "exercises area");

                chart.append("g")
                    .attr("class", "exercises x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                chart.append("g")
                    .attr("class", "exercises y axis")
                    .call(yAxis);

                chart.append("g")
                    .attr("class", "exercises x brush")
                    .call(brush)
                    .selectAll("rect")
                    .attr("y", -6)
                    .attr("height", height + 7);

                chart.append("text")
                    .attr("class", "exercises no-items")
                    .attr("text-anchor", "middle")
                    .text("No Pdus found")
                    .style("visibility", "hidden");

                var showMsg = function(msg) {
                    d3.select("text.exercises.no-items")
                        .attr("dx", width/2)
                        .attr("dy", height/2)
                        .text(msg)
                        .style("visibility", "visible");

                    dataArea.style("visibility", "hidden");
                };

                var update = function(showLoading) {
                    if (showLoading) {
                        showMsg("Loading");
                    }

                    scope.exerciseStats.query(scope.timeSpan).then(function(results) {

                        xScale.domain([new Date(scope.timeSpan.startTimestamp * 1000), new Date(scope.timeSpan.endTimestamp * 1000)]);

                        // Get unique yDomain for height calculation
                        var yDomain = [];
                        angular.forEach(results, function (d) {
                            if (yDomain.indexOf(d.exercise) === -1) {
                                yDomain.push(d.exercise);
                            }
                        });

                        // Calc new height for y domain
                        yDomain = yDomain.sort(function (a, b) {
                            return a - b;
                        });
                        height = ((yDomain.length * 20) < 50) ? 50 : yDomain.length * 20;

                        // Adjust height of elements for new y domain size
                        yScale.domain(yDomain).rangePoints([height, 0], 1);
                        yAxis.scale(yScale);
                        d3.select("svg.exercises").attr("height", height + margin.top + margin.bottom);
                        d3.select("g.exercises.chart").attr("height", height + margin.top + margin.bottom);
                        d3.select("g.exercises.x.axis").attr("transform", "translate(0," + height + ")");
                        d3.select("rect.exercises.clipPath").attr("height", height);
                        pane.attr("height", height);
                        chart.select("g.brush").call(brush).selectAll("rect").attr("height", height + 7);

                        chart.select(".x.axis").call(xAxis);
                        chart.select(".y.axis").call(yAxis);

                        dataArea.style("visibility", "visible");

                        d3.select("text.exercises.no-items")
                            .attr("dx", width / 2)
                            .attr("dy", height / 2)
                            .text("No Exercises found")
                            .style("visibility", function () {
                                return (results.length > 0) ? "hidden" : "visible";
                            });

                        var line = dataArea.selectAll(".line")
                            .data(results, function (d) {
                                return d.id;
                            });

                        line.enter()
                            .append("svg:line")
                            .attr("class", "line line-exercise")
                            .attr("opacity", 1);

                        line.exit()
                            .remove();

                        line
                            .attr('x1', function (d) {
                                return xScale(new Date(d.start * 1000));
                            })
                            .attr('y1', function (d) {
                                return yScale(d.exercise); //+'/'+ d.port)
                            })
                            .attr('x2', function (d) {
                                return xScale(new Date(d.end * 1000));
                            })
                            .attr('y2', function (d) {
                                return yScale(d.exercise);
                            });
                    });
                };

                scope.filter = {'ports': '', 'exercises':'', minDuration: 5};
                scope.validNumber = /^\s*\d+\s*$/;

                scope.revert = function() {
                    scope.timeSpan.revertRange();
                };

                scope.loadFilter = function() {
                    var ccc = 1;
                };

                scope.updateExerciseFilter = function() {
                    scope.exerciseStats.filter.exercises.length = 0;
                    var validNumbers = scope.filter.exercises.match(/[0-9]+/g);
                    if (validNumbers && validNumbers.length>0) {
                        var list = validNumbers.map(function(d){
                            return parseInt(d,10);
                        });
                        Array.prototype.push.apply(scope.exerciseStats.filter.exercises, list);
                    }
                    scope.exerciseStats.notifyUpdated();
                };

                scope.updatePortFilter = function() {
                    scope.exerciseStats.filter.ports.length = 0;
                    var validNumbers = scope.filter.ports.match(/[0-9]+/g);
                    if (validNumbers && validNumbers.length>0) {
                        var list = validNumbers.map(function(d){
                            return parseInt(d,10);
                        });
                        Array.prototype.push.apply(scope.exerciseStats.filter.ports, list);
                    }
                    scope.exerciseStats.notifyUpdated();
                };

                scope.updateDurationFilter = function() {
                    scope.exerciseStats.filter.minDuration = scope.filter.minDuration;
                    scope.exerciseStats.notifyUpdated();
                };

                var isClick = false;
                function brushStart() {
                    // Use mousedown event to detect dblclick, ignoring when no brush
                    if (isClick) {
                        // Check this is a valid brush
                        var range = brush.extent();
                        var startDt = range[0];
                        var endDt = range[1];
                        if (!brush.empty()) {
                            // Clear brush
                            chart.select("g.brush").call(brush.clear());

                            // Assign new range
                            var startTimestamp = Math.floor(startDt.getTime()/1000);
                            var endTimestamp = Math.floor(endDt.getTime()/1000);
                            scope.timeSpan.saveCurrentRange();
                            scope.timeSpan.setRange(startTimestamp, endTimestamp);
                        } else if (scope.timeSpan.duration>60) {
                            // Zoom to best time range (1 min, 1hr or 1 day)
                            var mouseX = d3.mouse(this)[0];
                            var dt = xScale.invert(mouseX);
                            scope.timeSpan.setClosestRange(dt);
                        }
                    }
                    isClick = true;
                    $timeout(function() {
                        isClick = false;
                    }, 250);
                }

                var _watchTimespanUpdateFirst = true;
                scope.$watch('timeSpan.hasUpdate', function() {
                    if (_watchTimespanUpdateFirst) {
                        _watchTimespanUpdateFirst = false;
                        return;
                    }

                    //scope.pduStats.clearCache();
                    update(true);
                });

                var _watchFilterUpdateFirst = true;
                scope.$watch('exerciseStats.hasUpdate', function() {
                    if (_watchFilterUpdateFirst) {
                        _watchFilterUpdateFirst = false;
                        return;
                    }

                    //scope.pduStats.clearCache();
                    update(true);
                });

                var _watchWidthFirst = true;
                scope.$watch(function(){
                    //return $window.innerWidth;
                    return angular.element($window)[0].innerWidth;
                }, function() {
                    if (_watchWidthFirst) {
                        _watchWidthFirst = false;
                        return;
                    }

                    var parentWidth = element[0].parentElement.offsetWidth;

                    width = parentWidth - margin.left - margin.right;
                    d3.select("svg.exercises").attr("width", width + margin.left + margin.right);
                    pane.attr("width", width);
                    d3.select("rect.exercises.clipPath").attr("width", width);
                    xScale.range([0, width]);
                    xAxis.scale(xScale);

                    chart.select(".x.axis").call(xAxis);
                    update(true);
                });

                update(true);
            }
        };
    }
});

