app.service('timeSeriesGraphService', ['$log', 'runRequestService', 'timeSeriesAnnotationService', function ($log, runRequestService, timeSeriesAnnotationService) {


    // set the dimensions and margins of the graph
    var margin = {
        top: 150,
        right: 50,
        bottom: 50,
        left: 100
    }
    var width = 960 - margin.left - margin.right;
    var height = 550 - margin.top - margin.bottom;


    var trendLineColors = ['#8cc2d0', '#152e34']

    // set the ranges
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);
    var z = d3.scaleOrdinal(trendLineColors);


    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);

    var endZoomVector = d3.zoomIdentity.scale(1).translate(0, 0);

    var ctrlDown = false;

    var line = d3.line()
        .x(function (d) { return x(d.Time); })
        .y(function (d) { return y(d.RTH); });


    var zoom = d3.zoom()
        .on('zoom', zoomed)



    var svg = d3.select('svg');
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var graph = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr('class', 'graph')
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    graph.attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');



    svg.call(zoom)
        .on("dblclick.zoom", null);

    d3.select('body')
        .on('keydown', function () {
            $log.log(d3.event.keyCode);
            if (d3.event.keyCode === 16) {
                $log.log('keyPress');
                ctrlDown = true;
            }
        })
    d3.select('body')
        .on('keyup', function () {
            if (d3.event.keyCode === 16) {
                $log.log('keyUp');
                ctrlDown = false;
            }
        })

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);



    var annotationLabelGroup = graph.append('g').attr('class', 'annotationLabel-group');
    var annotationGroup = graph.append('g').attr('class', 'annotation-group');


    //yLock
    var yLock = svg.append('g')
        .attr('transform', 'translate(' + (margin.left * 0.85) + ',' + (margin.top * 0.6) + ')')
        .attr('class', 'y-lock')
        .attr('locked', 0)

    yLock.append('svg:image')
        .attr('xlink:href', './assets/img/lock_unlocked.svg')
        .attr('width', '30')
        .attr('height', '30')
        .on('click', function () {
            lockToggle(yLock);
        });



    //xLock
    var xLock = svg.append('g')
        .attr('transform', 'translate(' + (width + margin.left * 1.2) + ',' + (height + margin.top * 0.8) + ')')
        .attr('class', 'x-lock')
        .attr('locked', 0)

    xLock.append('svg:image')
        .attr('xlink:href', './assets/img/lock_unlocked.svg')
        .attr('width', '30')
        .attr('height', '30')
        .on('click', function () {
            lockToggle(xLock);
        });

    getData(['2B497C4DAFF48A9C!160', '2B497C4DAFF48A9C!178'])

    function getData(idArray) {
        var getRunPromises = idArray.map(runRequestService.getRun);
        Promise.all(getRunPromises).then(function (result) {
            var results = [];
            for (var i = 0, n = result.length; i < n; i++) {
                var resultArray = dataObjectToArray(result[i].data.runData);
                results.push({ id: i, values: resultArray });
            }
            drawGraph(results);
        })
    }



    function dataObjectToArray(dataObject) {
        var dataArray = [];
        var objectKeys = Object.keys(dataObject);
        for (var i = 0, n = dataObject[objectKeys[0]].length; i < n; i++) {
            var row = {};
            for (var o = 0, m = objectKeys.length; o < m; o++) {
                row[objectKeys[o]] = Number(dataObject[objectKeys[o]][i]);
            }
            dataArray.push(row);
        }
        return dataArray;
    }



    function drawGraph(runsData) {
        var xDomain = [
            d3.min(runsData, function (c) { return d3.min(c.values, function (d) { return d.Time }) }),
            d3.max(runsData, function (c) { return d3.max(c.values, function (d) { return d.Time }) })
        ];
        x.domain(d3.extent(xDomain));
        z.domain(runsData.map(function (r) { return r.id }))

        y.domain([
            d3.min(runsData, function (c) { return d3.min(c.values, function (d) { return d.RTH; }); }),
            d3.max(runsData, function (c) { return d3.max(c.values, function (d) { return d.RTH; }); })
        ]);

        $log.log(runsData);

        graph.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        graph.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis)

        var runGroup = graph.append('g')
            .attr('class', 'run-group')

        var runs = runGroup.selectAll(".run")
            .data(runsData)
            .enter().append("g")
            .attr("class", function (d) {
                return 'run' + d.id;
            })
            .on('click', function (d) {
                d3.select(this).moveToFront();
            });

        runs.append("path")
            .attr("class", "line")
            .attr("d", function (d) { return line(d.values); })
            .style("stroke", function (d) { return z(d.id); })


        timeSeriesAnnotationService.addAnnotation(undefined, { Time: 14000, RTH: 0.08616 }, 'hi there from A sdffadsfdsfdsfsdfdf ');
        timeSeriesAnnotationService.addAnnotation(undefined, { Time: 18005, RTH: 0.0933 }, 'hello there from B');
        annotationBadgeRender(timeSeriesAnnotationService.getAnnotations());



    }

    function annotationBadgeRender(annotations, t) {
        var xt = endZoomVector.rescaleX(x);
        var yt = endZoomVector.rescaleY(y);

        if (t != undefined) {
            xt = t.rescaleX(x);
            yt = t.rescaleY(y);
        }

        var lastTime = - 1;
        var makeAnnotations = d3.annotation()
            .notePadding(15)
            .type(d3.annotationBadge)
            .accessors({
                x: d => xt(d.Time),
                y: d => -10
                
            })
            .annotations(annotations)
            .on('subjectclick', annotationClick)
        annotationGroup.call(makeAnnotations);
    }

    function annotationLabelRender(annotationLabel, t) {
        var xt = endZoomVector.rescaleX(x);
        var yt = endZoomVector.rescaleY(y);

        if (t != undefined) {
            xt = t.rescaleX(x);
            yt = t.rescaleY(y);
        }

        var makeAnnotations = d3.annotation()
            .notePadding(15)
            .type(d3.annotationLabel)
            .accessors({
                x: d => xt(d.Time),
                y: d => -120
            })
            .annotations(annotationLabel);


        annotationLabelGroup.call(makeAnnotations)
        $log.log(annotationLabelGroup.select('.annotations').select('g').attr('editMode'));
        if (annotationLabelGroup.select('.annotations').select('g').attr('editMode') != 'true') {
            annotationLabelGroup.select('.annotations').select('g')
                .append('g')
                .attr('class', 'edit button')
                .attr('transform', 'translate(' + (50) + ',' + -20 + ')')
                .append('svg:image')
                .attr('xlink:href', './assets/img/lock_unlocked.svg')
                .attr('width', '30')
                .attr('height', '30')
                .on('click', annotationEditMode)
                .call(d3.drag()
                    .on("drag", annotationDrag));
                
        } else {
            var noteLabel = annotationLabelGroup.select('.annotations')
                .select('g').select('.annotation-note')
                .select('.annotation-note-content')
                .select('.annotation-note-label')

            var text = '';

            noteLabel.selectAll('tspan')
                .each(function (d) {
                    text += d.note.label;
                });
        }




    }

    function annotationDrag(d){
       var circle = annotationLabelGroup.select('g').select('circle');
       circle.attr('cx',d3.event.x);
       var label = circle.attr('label');
       var annotationBadge = timeSeriesAnnotationService.getAnnotation(label);
       var xCor = x.invert(d3.event.x);
       annotationBadge.data.Time = xCor;
       annotationBadgeRender(timeSeriesAnnotationService.getAnnotations());
        /*  $log.log(x.invert((d.annotations[0]._x)));
        $log.log(d);
        d.annotations[0].data.Time = d3.event.x + d.annotations[0].data.Time;
        annotationBadgeRender(timeSeriesAnnotationService.getAnnotations()); */
    }

    function annotationEditMode() {
        annotationLabelGroup.select('.annotations').select('g')
            .attr('editMode', 'true')
        annotationLabelRender(timeSeriesAnnotationService.getAnnotationLabels())
    }

    function zoomed() {
        var t = d3.event.transform;

        var isZooming = endZoomVector.k != t.k;

        var xIsLocked = (xLock.attr('locked') == 1);
        var yIsLocked = (yLock.attr('locked') == 1);

        t.x = xIsLocked && !isZooming ? endZoomVector.x : t.x;
        t.y = yIsLocked && !isZooming ? endZoomVector.y : t.y;

        var xt = t.rescaleX(x);
        var yt = t.rescaleY(y);

        var line = d3.line()
            .x(function (d) {
                return xt(d.Time);
            })
            .y(function (d) {
                return yt(d.RTH);
            })

        if (isZooming || ctrlDown) {
            graph.select('.axis--x').call(xAxis.scale(xt));
            graph.select('.axis--y').call(yAxis.scale(yt));
            graph.selectAll('.line')
                .attr('d', function (d) {
                    return line(d.values);
                });
        } else {
            graph.select('.line')
                .attr('d', function (d) {
                    return line(d.values);
                });
        }



        annotationBadgeRender(timeSeriesAnnotationService.getAnnotations(), t);
        var makeAnnotationsLabels = d3.annotation()
            .notePadding(15)
            .type(d3.annotationLabel)
            .accessors({
                x: d => xt(d.Time),
                y: d => -120
            })
            .annotations(timeSeriesAnnotationService.getAnnotationLabels());

        annotationLabelGroup.call(makeAnnotationsLabels)







        endZoomVector = t;


    }

    function lockToggle(lock) {
        var image = lock.select('image');
        var locked = (lock.attr('locked') == 1)
        locked ? image.attr('xlink:href', './assets/img/lock_unlocked.svg') : image.attr('xlink:href', './assets/img/lock_locked.svg')
        locked ? locked = 0 : locked = 1;
        lock.attr('locked', locked);
    }

    function annotationClick(annotation) {
         $log.log(annotation);
       annotationLabelGroup.append('g')
        .append('circle')
        .attr('cx',annotation._x)
        .attr('cy',annotation._y-70)
        .attr('r',15)
        .attr('label',annotation.note.title)
        .style('stroke','black')
        .call(d3.drag()
                    .on("drag", annotationDrag));
         /* var isHidden = timeSeriesAnnotationService.getAnnotation(annotation.subject.text).subject.label.hidden;
        annotationLabelGroup.select('.annotations').remove();

        $log.log(isHidden);
        timeSeriesAnnotationService.annotationLabelHideAll();

        if (isHidden) {
            $log.log('showing');
            annotationLabelRender([annotation.subject.label]);
            timeSeriesAnnotationService.annotationLabelShow(annotation.subject.text);
        } else {
            $log.log('removing');
            timeSeriesAnnotationService.annotationLabelHide(annotation.subject.text);
        } */
    }

    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };
}])