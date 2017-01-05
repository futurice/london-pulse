$(document).foundation();

const dataFiles = [
    "assets/data/pulse_data.csv",
    "assets/data/answers_september.csv",
    "assets/data/answers_october.csv",
    "assets/data/answers_november.csv"
];

function loadCSV(url) {
    return $.get(url).then(function(data){
        return Papa.parse(data, {
            header: true,
            dynamicTyping: true
        });
    });
};

const dataPromise = Promise.all(
    dataFiles.map(loadCSV)
).then(function(results){
    return results.map(function(result) {
        return result.data;
    }).reduce(function(a,b) {
        return a.concat(b);
    });
});

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
