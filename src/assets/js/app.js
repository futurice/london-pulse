$(document).foundation();
$(document).ready(function() {
    $.get('assets/data/responses.csv', function(csv) {
        $('#response-container').highcharts({
            chart: {
                type: 'area',
                height: 320,
            },
            data: {
                csv: csv
            },
            title: {
                text: 'Number of responses'
            },
            yAxis: {
                title: {
                    text: 'Number'
                }
            }
        });
    });
});

