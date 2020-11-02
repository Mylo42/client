let localData = {};
let chartData = [];

let margin = { top: 20, right: 20, bottom: 30, left: 40 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

let x0 = d3.scale.ordinal()
  .rangeRoundBands([0, width], .1);

let x1 = d3.scale.ordinal();

let y = d3.scale.linear()
  .range([height, 0]);

let xAxis = d3.svg.axis()
  .scale(x0)
  .tickSize(0)
  .orient("bottom");

let yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

let color = d3.scale.ordinal()
  .range(["#2ecc71", "#f1c40f", "#e74c3c"]);

let svg = d3.select('#chart').append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function getQuery(name) {
  let results = new RegExp('[\?&]' + name + '=([^&#]*)')
    .exec(window.location.search);
  return results ? results[1] : '';
}

function update() {
  // get data
  let tag = getQuery('q').split(',')[0];
  $.post('/update', { 'q': tag }, function (result) {
    localData[tag] = result;

    // update chart
    let pos = 0;
    let neu = 0;
    let neg = 0;

    for (const [tag, value] of Object.entries(localData)) {
      for (i of Object.values(value)) {
        let s = i.sentiment;
        s > 0 ? pos++ : s == 0 ? neu++ : neg++;
      }

      let obj =
        [{
          "tag": tag,
          "values": [
            {
              "value": pos,
              "sentiment": "Positive"
            },
            {
              "value": neu,
              "sentiment": "Neutral"
            },
            {
              "value": neg,
              "sentiment": "Negative"
            }
          ]
        }]
      console.log(obj[0].values);
      chartData = [...chartData, ...obj]
    }

    $("#chart > svg > g > g").remove();
    creatChart(chartData);

    // update tweet
    for (i of Object.keys(localData)) {
      for (j of Object.keys(localData[i])) {
        addCard(localData[i][j]);
      }
    }
  })


}

function creatChart(data) {
  let tagNames = data.map(function (d) { return d.tag; });
  let sentimentNames = data[0].values.map(function (d) { return d.sentiment; });
  (x0);
  x0.domain(tagNames);
  x1.domain(sentimentNames).rangeRoundBands([0, x0.rangeBand()]);
  y.domain([0, d3.max(data, function (tag) { return d3.max(tag.values, function (d) { return d.value; }); })]);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .style('font-weight', 'bold')
    .text("Value");

  let slice = svg.selectAll(".slice")
    .data(data)
    .enter().append("g")
    .attr("class", "g")
    .attr("transform", function (d) { return "translate(" + x0(d.tag) + ",0)"; });

  slice.selectAll("rect")
    .data(function (d) { return d.values; })
    .enter().append("rect")
    .attr("width", x1.rangeBand())
    .attr("x", function (d) { return x1(d.sentiment); })
    .style("fill", function (d) { return color(d.sentiment) })
    .attr("y", function (d) { return y(0); })
    .attr("height", function (d) { return height - y(0); })
    .on("mouseover", function (d) {
      d3.select(this).style("fill", d3.rgb(color(d.sentiment)).darker(2));
    })
    .on("mouseout", function (d) {
      d3.select(this).style("fill", color(d.sentiment));
    });

  slice.selectAll("rect")
    .attr("y", function (d) { return y(d.value); })
    .attr("height", function (d) { return height - y(d.value); });

  //Legend
  let legend = svg.selectAll(".legend")
    .data(data[0].values.map(function (d) { return d.sentiment; }).reverse())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; })

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function (d) { return color(d); });

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function (d) { return d; });

};

function addCard(info) {
  let card_body = $('<div class="card-body">')
  card_body.append($(`<h5 class="card-title">${info.name}</h5>`));
  let color = info.sentiment == 1 ? "#228b22" : info.sentiment == 0 ? "#ffff66" : "#FF0000";
  let text = info.sentiment == 1 ? "#positive" : info.sentiment == 0 ? "neutral" : "negitive";
  card_body.append($(`<span class="sentiment-score" style="background-color: ${color};">${text}</span>`));
  card_body.append($(`<h6 class="card-subtitle mb-2 text-muted">@${info.screen_name}</h6>`));
  card_body.append($(`<p class="card-text">${info.text}</p>`));
  $('#tweetTiles').append($('<div class="card">').append(card_body));
}

function startStream() {
  $.get(`/stream?q=${getQuery('q').split(',')[0]}`);
}

startStream();
update();
let inter = setInterval(update, 5000);

$("#stopBtn").click(function () {
  $.get(`/stop`);
  clearInterval(inter);
})