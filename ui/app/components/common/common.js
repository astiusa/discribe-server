/**
 * Created by chriscooke on 4/29/15.
 */

define([
        './directives/exercises.directive',
        './directives/forceLevels.directive',
        './directives/pduCounts.directive',
        './directives/radioPduCounts.directive',
        './directives/sortableCol.directive',

        './filters/formatDateTime.filter',
        './filters/formatDuration.filter',
        './filters/formatEntityId.filter',
        './filters/formatEntityMarking.filter',
        './filters/formatEntityType.filter',
        './filters/formatIPAddr.filter',
        './filters/formatFrequency.filter',
        './filters/pduTypeName.filter'
    ],
    function(
        exercisesDirective,
        forceLevelsDirective,
        pduCountsDirective,
        radioPduCountsDirective,
        sortableColDirective,

        formatDateTimeFilter,
        formatDurationFilter,
        formatEntityIdFilter,
        formatEntityMarkingFilter,
        formatEntityTypeFilter,
        formatIPAddrFilter,
        formatFrequencyFilter,
        pduTypeNameFilter
    ) {

        'use strict';

        var module = angular.module('common', []);

        module.directive(exercisesDirective);
        module.directive(forceLevelsDirective);
        module.directive(pduCountsDirective);
        module.directive(radioPduCountsDirective);
        module.directive(sortableColDirective);

        module.filter(formatDateTimeFilter);
        module.filter(formatDurationFilter);
        module.filter(formatEntityIdFilter);
        module.filter(formatEntityMarkingFilter);
        module.filter(formatEntityTypeFilter);
        module.filter(formatIPAddrFilter);
        module.filter(formatFrequencyFilter);
        module.filter(pduTypeNameFilter);
    });

