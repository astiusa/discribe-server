/*!
 * formatDateRange filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define(['bower_components/d3/d3.min'], function(d3) {

    'use strict';

    var deps = [];
    return {formatDateRange: deps.concat(factory)};

    function factory() {
        return function(startTimestamp, endTimestamp) {
            var dateRange = "";
            var startDate = new Date (startTimestamp*1000);
            var endDate = new Date (endTimestamp*1000);
            var timeFormat = d3.time.format("%X");
            var startTime = timeFormat(startDate);
            var endTime = timeFormat(endDate);
            var startDay = startDate.getDate();
            var endDay = endDate.getDate();
            if (endDay!==startDay) {
                dateRange =
                    startDate.toDateString()+', ' + startTime + ' - ' +
                        //startDate.getHours()+':'+(startDate.getMinutes()<10?'0':'') + startDate.getMinutes() + ' - ' +
                        endDate.toDateString()+', '+endTime
                //endDate.getHours()+':'+(endDate.getMinutes()<10?'0':'') + endDate.getMinutes();
            } else {
                dateRange =
                    startDate.toDateString()+', '+ startTime + ' - ' + endTime;
                //startDate.getHours()+':'+(startDate.getMinutes()<10?'0':'') + startDate.getMinutes() + '-' +
                //endDate.getHours()+':'+(endDate.getMinutes()<10?'0':'') + endDate.getMinutes();
            }
            return dateRange
        };
    }
});

