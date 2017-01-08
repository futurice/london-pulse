$(document).foundation();

const MONTH_FIELD = "Month";
const TRIBE_FIELD = "My tribe";

const dataFiles = [
    "assets/data/pulse_data.csv",
    "assets/data/answers_september.csv",
    "assets/data/answers_october.csv",
    "assets/data/answers_november.csv",
    "assets/data/answers_december.csv"
];

function loadCSV(url) {
    return $.get(url).then(function(data){
        return Papa.parse(data, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
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

const monthsPromise = dataPromise.then(function(data) {
    const allMonths = data.map(function(row) {
        return row[MONTH_FIELD];
    });
    const uniqueMonths = new Set(allMonths);
    return Array.from(uniqueMonths);
});

$(document).ready(function() {
    const $questionSelect = $("#question-select");
    const $monthlyGraphs = $("#monthly-graphs");

    $questionSelect.on("change", function() {
        $questionSelect.val();
    });

    questionsPromise.then(function(questions) {
        questions.forEach(function(question) {
            $questionSelect.append(`<option value="${question}">${question}</option>`);
        });
        $questionSelect.trigger("change");
    });

    //Create monthly graphs container
    monthsPromise.then(function(months) {
        months.map(function(month) {
            $monthlyGraphs.append(`
                <div class="large-3 columns">
                    <div class="month-graph" data-month="${month}"></div>
                </div>`);
        })
    });
});
