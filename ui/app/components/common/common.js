/**
 * Created by chriscooke on 4/29/15.
 */

define([
        './directives/exercises.directive',
        './directives/forceLevels.directive',
        './directives/pduCounts.directive',
        './directives/radioPduCounts.directive',
        './directives/sortableCol.directive',
        './directives/titleBar.directive',
        './directives/pduView.directive',

        './filters/formatDateRange.filter',
        './filters/formatDateTime.filter',
        './filters/formatDecimal.filter',
        './filters/formatDuration.filter',
        './filters/formatEntityId.filter',
        './filters/formatEntityMarking.filter',
        './filters/formatEntityType.filter',
        './filters/formatHeading.filter',
        './filters/formatIPAddr.filter',
        './filters/formatFrequency.filter',
        './filters/formatLat.filter',
        './filters/formatLon.filter',
        './filters/pduTypeName.filter',

        './services/disEnums.service'
    ],
    function(
        exercisesDirective,
        forceLevelsDirective,
        pduCountsDirective,
        radioPduCountsDirective,
        sortableColDirective,
        titleBarDirective,
        pduViewDirective,

        formatDateRangeFilter,
        formatDateTimeFilter,
        formatDecimalFilter,
        formatDurationFilter,
        formatEntityIdFilter,
        formatEntityMarkingFilter,
        formatEntityTypeFilter,
        formatHeadingFilter,
        formatIPAddrFilter,
        formatFrequencyFilter,
        formatLatFilter,
        formatLonFilter,
        pduTypeNameFilter,

        disEnumsService
    ) {

        'use strict';

        var module = angular.module('common', []);

        module.directive(exercisesDirective);
        module.directive(forceLevelsDirective);
        module.directive(pduCountsDirective);
        module.directive(radioPduCountsDirective);
        module.directive(sortableColDirective);
        module.directive(titleBarDirective);
        module.directive(pduViewDirective);

        module.filter(formatDateRangeFilter);
        module.filter(formatDateTimeFilter);
        module.filter(formatDecimalFilter);
        module.filter(formatDurationFilter);
        module.filter(formatEntityIdFilter);
        module.filter(formatEntityMarkingFilter);
        module.filter(formatEntityTypeFilter);
        module.filter(formatHeadingFilter);
        module.filter(formatIPAddrFilter);
        module.filter(formatFrequencyFilter);
        module.filter(formatLatFilter);
        module.filter(formatLonFilter);
        module.filter(pduTypeNameFilter);

        module.service(disEnumsService);
    });

