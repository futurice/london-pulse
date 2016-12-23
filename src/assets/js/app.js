$(document).foundation();

window.chartColors = {
    red: 'rgb(255, 99, 132)',
    lightRed: 'rgba(255, 99, 132,0.2)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(231,233,237)'
};

$(document).ready(function() {
    var ctx = document.getElementById("average-response").getContext("2d");

    var months = [];
    var responses = [];

    $.getJSON( "assets/data/responses.json", function(pulseData) {
        $.each(pulseData, function(key, value) {
            if (key == "months") {
                for( var i=0; i<value.length; i++) {
                    months.push(value[i]);
                }
            } else {
                for( var i=0; i<value.length; i++) {
                    responses.push(value[i]);
                }
            }
        });


        var chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: "Number of responses",
                    data: responses,
                    borderWidth: 3,
                    borderColor: chartColors.red,
                    backgroundColor: chartColors.lightRed,
                    fill: true,
                    cubicInterpolationMode: "monotone",
                    lineTension: 0,
                    pointRadius: 6,
                    pointBorderWidth: 3,
                    pointBackgroundColor: "#fff"

                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'NUMBER OF RESPONSES',
                    padding: 40,
                    fontSize: 16
                },
                responsive: true,
                maintainAspectRatio : false,
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                }
            }
        });
    });
});

