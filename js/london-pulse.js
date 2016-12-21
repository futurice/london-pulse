$(document).ready(function() {
    var ctx = document.getElementById("myChart").getContext("2d");

    var labels = [];
    var data2 = [];

    $.getJSON( "data/test.json", function(pulseData) {
        // console.log(pulseData);
        $(pulseData["months"]).each(function(key, value) {
            labels.push(value.name);
            data2.push(value.responses);
        });

        var chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: "Number of responses",
                    data: data2,
                    borderWidth: 3,
                    borderColor: chartColors.red,
                    backgroundColor: chartColors.red,
                    fill: false,
                    cubicInterpolationMode: "monotone",
                    lineTension: 0,
                    pointRadius: 6,
                    pointBorderWidth: 3,
                    pointBackgroundColor: "#fff"

                }]
            },
            options: {
                responsive: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                }
            }
        });
    });
});

