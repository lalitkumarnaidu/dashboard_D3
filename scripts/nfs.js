!(function(){
  /*Assumes only tsv as on now*/
  /*Chart resizes on window resize, applies change only in x axis*/
  window.nfs = function(inputID, canvasID, url){
      var vis = {};
      vis.parseDate =  d3.time.format.utc('%Y-%m-%dT%H:%M:%S.%LZ').parse;
      vis.plotChart = false;
      vis.updateChart = false;
      vis.deviceList = [];
      vis.canvas = canvasID;
      vis.url = url;
      vis.selectBoxID = inputID;
      width = parseInt(d3.select(vis.canvas).style('width'), 10);
      /********************************/
      /*        Chart Layout         */
      /*******************************/
      vis.margin = {top: 20, right: 20, bottom: 100, left: 100},
      width = width - vis.margin.left - vis.margin.right,
      height = 500 - vis.margin.top - vis.margin.bottom;
      var chart = d3.select(vis.canvas)
      .append("svg")
      .attr("width", width + vis.margin.left + vis.margin.right)
      .attr("height", height + vis.margin.top + vis.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

      /********************************/
      /*        Selection Box        */
      /*******************************/
      var selectBox = d3.select(vis.selectBoxID)
      .append('select')
      .attr('class','select')
      .attr('label', 'device:')
      .on('change',onchange);
      /********************************/
      /*         Scale and Axis      */
      /*******************************/
      var x = d3.time.scale().range([0, width]),
      y = d3.scale.ordinal().rangeRoundBands([height,0], 0.1);

      var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");
      // .tickSize(-height, 0)
      // .tickSubdivide(true)
      // .tickPadding(10);
      var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

      /********************************/
      /*          Init Data           */
      /*******************************/

      d3.tsv(vis.url, function(error, data) {
        if (error) throw error;
        vis.Data = data;
        data.forEach(function(d){
        if(vis.deviceList.indexOf(d.dhcpLease_macAddress) == -1)
              vis.deviceList.push(d.dhcpLease_macAddress);
        });
      /********************************/
      /*          Selection           */
      /*******************************/
        vis.selectBoxOptions = selectBox.selectAll('option')
                               .data(vis.deviceList)
                               .enter()
                               .append('option')
                               .text(function (d) { return d; });
      });//end of vis.fname read
        /********************************/
        /*   Events                    */
        /*******************************/
        function onchange()
        {
      	   vis.selectValue = d3.select('select').property('value');
           vis.plotChart = true;
           if(vis.updateChart)
            updateChart(vis.selectValue);
           else
            initChart(vis.selectValue);
        };

        function initChart(s){
          /********************************/
          /*          Data                */
          /*******************************/
          vis.updateChart = true;
          vis.deviceData = [];
          (vis.Data).forEach(function(d){
            if(d.dhcpLease_macAddress == s)
             {
               var obj = {
                       deviceMac: d.dhcpLease_macAddress,
                       category: d.category,
                       startTime: vis.parseDate(d.dateTimeFirstSeen),
                       endTime: new Date((+vis.parseDate(d.dateTimeFirstSeen))+ ((+d.duration)*1000))
                     };
               vis.deviceData.push(obj);
             }

          });
          /*************************************/
          /*   Setting up Scale and Axis      */
          /************************************/
          if(vis.plotChart){
            //Verbose lines: for x axis extent of date (+/-) 1 hr
            x.domain([d3.min(vis.deviceData, function (d) { return new Date(+d.startTime - 3600000); }),
              d3.max(vis.deviceData, function (d) { return new Date(+d.startTime + 3600000); })]);
              y.domain(vis.deviceData.map(function(d){ return d.category;}));


              chart.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

              chart.append("g")
              .attr("class", "y axis")
              .call(yAxis);

              /********************************/
              /*   Appending Progress Bar    */
              /*******************************/
          vis.bars = chart.selectAll(".bar")
                          .data(vis.deviceData)
                          .enter().append("rect")
                          .attr("class", "bar")
                          .attr("x", function(d) {return x(d.startTime); })
                          .attr("y", function(d) { return y(d.category); })
                          .attr("height", y.rangeBand())
                          .attr("width", function(d) { return x(d.endTime) - x(d.startTime); });
            }//end of if statement
        }

        function updateChart(s){
          /********************************/
          /*         Update Data          */
          /*******************************/
          vis.deviceData = [];
          (vis.Data).forEach(function(d){
            if(d.dhcpLease_macAddress == s)
             {
               var obj = {
                       deviceMac: d.dhcpLease_macAddress,
                       category: d.category,
                       startTime: vis.parseDate(d.dateTimeFirstSeen),
                       endTime: new Date((+vis.parseDate(d.dateTimeFirstSeen))+ ((+d.duration)*1000))
                     };
               vis.deviceData.push(obj);
             }
          });

          /*************************************/
          /*   Update Scale and Axis           */
          /************************************/
          if(vis.plotChart){
            //Verbose lines: for x axis extent of date (+/-) 1 hr
              x.domain([d3.min(vis.deviceData, function (d) { return new Date(+d.startTime - 3600000); }),
              d3.max(vis.deviceData, function (d) { return new Date(+d.startTime + 3600000); })]);
              y.domain(vis.deviceData.map(function(d){ return d.category;}));

            vis.bars.remove();
            var c = chart.transition();

            vis.bars = chart.selectAll(".bar")
                            .data(vis.deviceData)
                            .enter().append("rect")
                            .attr("class", "bar")
                            .attr("x", function(d) {return x(d.startTime); })
                            .attr("y", function(d) { return y(d.category); })
                            .attr("height", y.rangeBand())
                            .attr("width", function(d) { return x(d.endTime) - x(d.startTime); });

            c.select("g.x.axis") // change the x axis
                .duration(750)
                .call(xAxis);

            c.select("g.y.axis") // change the y axis
                .duration(750)
                .call(yAxis);
          }//end of if statement
        }

        d3.select(window).on('resize', resize);

        function resize() {
          /*Get the current width of canvas and update it*/
          width = parseInt(d3.select(vis.canvas).style('width'), 10);
          width = width - vis.margin.left - vis.margin.right;
          /*Update the range of x axis with the new canvas width */
            x.range([0, width]);
            d3.select(chart.node().parentNode)
                .style('height', (y.rangeExtent()[1] + vis.margin.top + vis.margin.bottom) + 'px')
                .style('width', (width + vis.margin.left + vis.margin.right) + 'px');
          /*Call the x axis function with updated width*/
            chart.select('g.x.axis').call(xAxis);
          /*Resize the  progress bars*/
          vis.bars.attr("x", function(d) {return x(d.startTime); })
          .attr("y", function(d) { return y(d.category); })
          .attr("height", y.rangeBand())
          .attr("width", function(d) { return x(d.endTime) - x(d.startTime); });
        }
  }

})()
