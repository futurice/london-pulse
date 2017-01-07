$(document).foundation();

const MONTH_FIELD = "Month";
const TRIBE_FIELD = "My tribe";

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

const questionsPromise = dataPromise.then(function(data) {
    const allQuestions = data.map(function(row) {
        return Object.keys(row);
    }).reduce(function(a,b) {
        return a.concat(b); //flatten
    });
    const uniqueQuestions = new Set(allQuestions);
    uniqueQuestions.delete(MONTH_FIELD);
    uniqueQuestions.delete(TRIBE_FIELD);

    return Array.from(uniqueQuestions).sort();
})

$(document).ready(function() {
    questionsPromise.then(function(questions) {
        const $questionSelect = $("#question-select");
        questions.forEach(function(question) {
            $questionSelect.append(`<option value="${question}">${question}</option>`);
        })
    });


    getData().then(function(results){
        $('#response-container').highcharts({
            chart: {
                type: 'column',
                height: 340,
                spacingBottom: 30,
                spacingTop: 30,
            },
            // we'll use series instead of data.
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
