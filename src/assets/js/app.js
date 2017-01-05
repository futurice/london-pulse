$(document).foundation();
var url = 'assets/data/responses.csv';

function getData() {
    return $.get(url).then(function(results){
        return results;
    });
};

$(document).ready(function() {
    getData().then(function(results){
        $('#response-container').highcharts({
            chart: {
                type: 'column',
                height: 340,
                spacingBottom: 30,
                spacingTop: 30,
            },
            data: {
                csv: results
            },
            title: {
                text: 'Average'
            },
            yAxis: {
                title: {
                    text: 'Number'
                }
            }
        });
    })
});
