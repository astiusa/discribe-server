/*!
 * pduCounts directive.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define(['bower_components/d3/d3.min'], function(d3) {

    'use strict';

    var deps = ['$timeout', '$window'];

    return {radioPduCounts: deps.concat(factory)};

    function factory($timeout, $window) {
        return {
            restrict: 'A',
            scope: {
                pduStats: "=",
                timeSpan: "="
            },
            templateUrl: 'app/components/common/views/radioPduCounts.html',
            link: function(scope, element) {
                var commsPduTypes = [25,26,27];
                var parentWidth = element[0].parentElement.offsetWidth;

                var margin = {top: 10, right: 20, bottom: 40, left: 50},
                    width = parentWidth - margin.left - margin.right,
                    height = 200 - margin.top - margin.bottom;

                var xScale = d3.time.scale().range([0, width]);
                var yScale = d3.scale.linear().range([height, 0]);
                var pduTypeColor = d3.scale.ordinal()
                    .range(["red","green","steelblue"])
                    .domain(commsPduTypes);

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
                    .attr("class", "radioPduCounts")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);

                svg.append("defs").append("clipPath")
                    .attr("id", "radioPduCountsClip")
                    .append("rect")
                    .attr("class", "radioPduCounts clipPath")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);

                var brush = d3.svg.brush()
                    .x(xScale)
                    .on("brushstart", brushStart);

                var chart = svg.append("g")
                    .attr("class", "radioPduCounts")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var dataArea = chart.append("g")
                    .attr("class", "radioPduCounts area");

                chart.append("g")
                    .attr("class", "radioPduCounts x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                chart.append("g")
                    .attr("class", "radioPduCounts y axis")
                    .call(yAxis);

                chart.append("g")
                    .attr("class", "radioPduCounts x brush")
                    .call(brush)
                    .selectAll("rect")
                    .attr("y", -6)
                    .attr("height", height + 7);

                chart.append("text")
                    .attr("class", "radioPduCounts no-items")
                    .attr("text-anchor", "middle")
                    .text("No Entities found")
                    .style("visibility", "hidden");

                var showMsg = function(msg) {
                    d3.select("text.radioPduCounts.no-items")
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

                    // Get latest pduStats at best resolution
                    scope.pduStats.query(scope.timeSpan)
                        .then(function(result) {
                            if (result) {
                                try {
                                    var _data = {};
                                    angular.forEach(commsPduTypes, function(pduType, index) {
                                        angular.forEach(scope.pduStats.pduTypeCounts[pduType].counts, function(count, timestamp) {
                                            var counts = _data[timestamp];
                                            if (!counts) {
                                                counts = [0, 0, 0];
                                                _data[timestamp] = counts;
                                            }
                                            counts[index] = count;
                                        });
                                    });

                                    var data = [];
                                    angular.forEach(_data, function (counts, timestamp) {
                                        var y0 = 0;
                                        var commCounts = counts.map(function(count, index) {
                                            return {
                                                pduType: commsPduTypes[index], y0: y0, y1: y0 += count
                                            };
                                        });
                                        data.push({
                                            time: new Date(timestamp*1000),
                                            counts: commCounts,
                                            totalCount: commCounts[commCounts.length - 1].y1,
                                            timestamp: timestamp});
                                    });

                                    //var totalCount = d3.max(data.map(function(d) { return d.totalCount; }));
                                    var totalCount = d3.max(data, function(d) { return d.totalCount; });
                                    xScale.domain([new Date(scope.timeSpan.startTimestamp*1000), new Date(scope.timeSpan.endTimestamp*1000)]);
                                    yScale.domain([0, totalCount]);

                                    var barWidth = width*scope.pduStats.interval/scope.timeSpan.duration;
                                    barWidth = (barWidth<5) ? 5 : barWidth;

                                    var timestampCounts = dataArea.selectAll(".timestampCounts")
                                        .data(data, function(d){
                                            return d.timestamp+"-"+totalCount+"-"+scope.pduStats.interval;
                                        });

                                    timestampCounts.enter().append("g")
                                        .attr("class", "g timestampCounts");

                                    timestampCounts.exit().remove();

                                    timestampCounts.attr("transform", function(d) {
                                        return "translate(" + xScale(d.time) + ",0)";
                                    });

                                    var items = timestampCounts.selectAll("rect.bar")
                                        .data((function(d) { return d.counts; }), function(d){
                                            return d.pduType;
                                        });

                                    items.enter().append('rect')
                                        .attr('class', 'radioPduCounts bar');

                                    items.exit().remove();

                                    items
                                        //.attr('x', function(d) {
                                        //    return xScale(d.time)-barWidth;
                                        //})
                                        .attr('y', function(d) {
                                            return yScale(d.y1);
                                        })
                                        .attr('width', barWidth)
                                        .attr('height', function(d) {
                                            return (yScale(d.y0)-yScale(d.y1));
                                        })
                                        .style("fill", function(d) {
                                            return pduTypeColor(d.pduType);
                                        });

                                    chart.select(".x.axis").call(xAxis);
                                    chart.select(".y.axis").call(yAxis);

                                    dataArea.style("visibility", "visible");

                                    d3.select("text.radioPduCounts.no-items")
                                        .attr("dx", width/2)
                                        .attr("dy", height/2)
                                        .text("No Entities found")
                                        .style("visibility", function() {
                                            return (totalCount>0) ? "hidden" : "visible";
                                        });

                                } catch (err) {
                                    result.error = { 'message': err.message };
                                    console.log("radioPduCounts update error: "+result.error);
                                }

                            } else if (result.error) {
                                console.log("radioPduCounts update error: "+result.error);
                            }
                        });
                };

                scope.revert = function() {
                    scope.timeSpan.revertRange();
                    scope.pduStats.clearCache();
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
                            scope.pduStats.clearCache();
                        } else if (scope.timeSpan.duration>60) {
                            // Zoom to best time range (1 min, 1hr or 1 day)
                            var mouseX = d3.mouse(this)[0];
                            var dt = xScale.invert(mouseX);
                            scope.timeSpan.setClosestRange(dt);
                            scope.pduStats.clearCache();
                        }
                    }
                    isClick = true;
                    $timeout(function() {
                        isClick = false;
                    }, 250);
                }

                var _watchForceStatsFirst = true;
                scope.$watch('pduStats.hasUpdate', function() {
                    if (_watchForceStatsFirst) {
                        _watchForceStatsFirst = false;
                        return;
                    }
                    scope.pduStats.clearCache();
                    update(true);
                });

                var _watchFilterUpdateFirst = true;
                scope.$watch('timeSpan.hasUpdate', function() {
                    if (_watchFilterUpdateFirst) {
                        _watchFilterUpdateFirst = false;
                        return;
                    }

                    scope.pduStats.clearCache();
                    update(true);
                });
                /*
                 var _watchFilterLiveUpdateFirst = false;
                 scope.$watch('timeSpan.hasLiveUpdate', function() {
                 if (_watchFilterLiveUpdateFirst) {
                 _watchFilterLiveUpdateFirst = false;
                 return;
                 }

                 //update();
                 });
                 */
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
                    d3.select("svg.radioPduCounts").attr("width", width + margin.left + margin.right);
                    d3.select("radioPduCountsclipPath").attr("width", width);
                    xScale.range([0, width]);
                    xAxis.scale(xScale);

                    chart.select(".x.axis").call(xAxis);

                    update(true);
                });

                scope.pduStats.clearCache();
                update();
            }
        };
    }
});

