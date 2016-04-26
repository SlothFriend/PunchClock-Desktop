angular.module('punchclock', ['LocalStorageModule'])
.controller('ClockController', ['$interval', 'storage', function($interval, storage){
    var clockControl = this;
    
    var defaultProjectName = 'Project Name';
    this.showingTotals = true;
    this.clocks = [];
    //storage.clearAll();
    loadClocks();
    
    /************  BEGIN BOUND FUNCTIONS  *************/
    //Attached to Add a Clock button
    this.addClock = function(){
        clockControl.clocks.push(bindClockFunctions({
            name: '',
            seconds: 0,
            hoursPart: 0,
            minutesPart: 0,
            secondsPart: 0,
            active: false,
            editting: true,
            lastTouchedTime: new Date().getTime()
        }));
    }
    
//    this.printClocks = function(){
//        console.log(clockControl.clocks);
//    };
    
    //Attached to Reset Clocks button
    this.resetClocks = function(){
        for(var i = 0; i < clockControl.clocks.length; i++){
            clockControl.clocks[i].setActive(false);
            clockControl.clocks[i].reset();
        }
        storage.storeClocks(clockControl.clocks);
    };
    
    this.totalTime = function(){
        var totalSeconds = 0;
        for(var i = 0, len = clockControl.clocks.length; i < len; i++){
            totalSeconds += clockControl.clocks[i].seconds;
        }
        return totalSeconds;
    }
    /************  END BOUND FUNCTIONS  *************/
    
    
    /************  BEGIN INTERNAL FUNCTIONS  *************/
    function loadClocks(){
        //Get the clocks in local storage and runs each one through the function binding via map
        clockControl.clocks = storage.getClocks().map(bindClockFunctions);
    };
    
    function bindClockFunctions(clockObj){
        return extend(clockObj, {
            setName: function(name){
                if(typeof name !== 'string'){
                    console.error('Incorrect type for name: ' + typeof name);
                    return;
                }
                this.name = name;
            },
            setSeconds: function(seconds){
                if(typeof seconds !== 'number'){
                    console.error('Incorrect type for seconds: ' + typeof number);
                    return;
                }
                this.seconds = seconds;
            },
            setHoursPart: function(hoursPart){
                if(typeof hoursPart !== 'number'){
                    console.error('Incorrect type for hoursPart: ' + typeof hoursPart);
                    return;
                }
                this.hoursPart = hoursPart;
            },
            setMinutesPart: function(minutesPart){
                if(typeof minutesPart !== 'number'){
                    console.error('Incorrect type for minutesPart: ' + typeof minutesPart);
                    return;
                }
                this.minutesPart = minutesPart;
            },
            setSecondsPart: function(secondsPart){
                if(typeof secondsPart !== 'number'){
                    console.error('Incorrect type for secondsPart: ' + typeof secondsPart);
                    return;
                }
                this.secondsPart = secondsPart;
            },
            setTimeParts: function(){
                this.setHoursPart(parseInt(this.seconds / (60*60)));
                this.setMinutesPart(parseInt((this.seconds % (60*60)) / 60));
                this.setSecondsPart(parseInt(this.seconds % 60));
            },
            setActive: function(active){
                if(typeof active !== 'boolean'){
                    console.error('Incorrect type for active: ' + typeof active);
                    return;
                }
                this.active = active;
            },
            activate: function(){
                shutOffClocks();
                this.setActive(true);
                storage.storeClocks(clockControl.clocks);
            },
            deactivate: function(){
                this.setActive(false);
                storage.storeClocks(clockControl.clocks);
            },
            reset: function(){
                this.setSeconds(0);
                this.setTimeParts();
            },
            setEditting: function(editting){
                if(typeof editting !== 'boolean'){
                    console.error('Incorrect type for editting: ' + typeof editting);
                    return;
                }
                this.editting = editting;
            },
            edit: function(){
                this.setEditting(true);
                this.setTimeParts();
            },
            closeEdit: function(){
                this.setEditting(false);
                this.name === '' ? this.setName(defaultProjectName) : null;
                this.setSeconds(totalSeconds(this.hoursPart, this.minutesPart, this.secondsPart));
                storage.storeClocks(clockControl.clocks);
            },
            delete: function(){
                clockControl.clocks.splice(clockControl.clocks.indexOf(this), 1);
                storage.storeClocks(clockControl.clocks);
            }
        });
    };
    
    function shutOffClocks(){
        for(var i = 0; i < clockControl.clocks.length; i++){
            clockControl.clocks[i].setActive(false);
        }
    };
    
    function totalSeconds(hours, minutes, seconds){
        hours = parseInt(hours == null ? 0 : hours);
        minutes = parseInt(minutes == null ? 0 : minutes);
        seconds = parseInt(seconds == null ? 0 : seconds);
        return (hours*60*60) + (minutes*60) + seconds;
    }
    /************  END INTERNAL FUNCTIONS  *************/
    
    
    //Increment the active clocks (that are not being editted)
    $interval(function(){
        for(var i = 0; i < clockControl.clocks.length; i++){
            var clock = clockControl.clocks[i];
            if(clock.active && !clock.editting){
                clock.seconds++;
            }
        }
    }, 1000);
}])
.factory('storage', function(localStorageService){
    return {
        storeClocks: function(clockArray){ //To store the current array of clocks
            localStorageService.set('clocks', JSON.stringify(clockArray.map(
                function(clock){ //Update each clock's lastTouched time
                    clock.lastTouchedTime = new Date().getTime();
                    return clock;
                }
            )));
        },
        getClocks: function(){
            var retrievedClocks = localStorageService.get('clocks');
            if(retrievedClocks == null) return [];
            
            return JSON.parse(retrievedClocks).map(function(clock){
                if(clock.active){ //Add the time offset to our active clock that was in storage
                    var timeDiff = new Date().getTime() - clock.lastTouchedTime;
                    clock.seconds += parseInt(timeDiff/1000);
                }
                return clock;
            });
        },
        clearAll: function(){
            localStorageService.clearAll();
        }
    }
})
.filter('HHMISS', function(){
    return function(totalSeconds){
        var secsInHour = 60*60;
        var timeString = '';
        
        var hours = parseInt(totalSeconds / secsInHour);
        timeString += (hours < 10 ? '0' + hours : hours);
        
        var minutes = parseInt((totalSeconds % secsInHour) / 60);
        timeString += ':' + (minutes < 10 ? '0' + minutes : minutes);
        
        var seconds = totalSeconds % 60;
        timeString += ':' + (seconds < 10 ? '0' + seconds : seconds);
        
        return timeString;
    };
})
.filter('HHMI', function(){
    return function(totalSeconds){
        var secsInHour = 60*60;
        var timeString = '';
        
        var hours = parseInt(totalSeconds / secsInHour);
        timeString += (hours < 10 ? '0' + hours : hours);
        
        var minutes = parseInt((totalSeconds % secsInHour) / 60);
        timeString += ':' + (minutes < 10 ? '0' + minutes : minutes);
        
        return timeString;
    };
})
.directive('focusMe', function(){
    return {
        link: function(scope, element, attrs){
            scope.$watch(attrs.focusMe, function(val){
                if(val === true){
                    element[0].focus();
                    scope[attrs.focusMe] = false;
                }
            });
        }
    };
});