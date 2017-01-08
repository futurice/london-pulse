$(document).foundation();

const MONTH_FIELD = "Month";
const TRIBE_FIELD = "My tribe";
const MY_TRIBE = "London"
const VALUE_TO_DISPLAY_NAME = new Map ([
    ["", "Abstain"],
    [1, "Strongly disagree"],
    [2, "Disagree"],
    [3, "Agree"],
    [4, "Strongly agree"]
]);

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

const londonDataPromise = dataPromise.then(function(data) {
    return data.filter(function (row) {
        return row[TRIBE_FIELD] === MY_TRIBE;
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

function drawAverageChart(currentQuestion) {
    // body...
}

function drawMonthCharts(currentQuestion) {
    londonDataPromise.then(function(tribeData) {
        monthsPromise.then(function(months) {
            months.map(function(month) {
                drawMonthChart(currentQuestion, tribeData, month);
            });
        });
    });
}

function drawMonthChart(currentQuestion, tribeData, month){
    const valueCounter = new Map();
    for (let [key, value] of VALUE_TO_DISPLAY_NAME) {
        valueCounter.set(key, 0);
    };

    tribeData.filter(function(row) {
        return row[MONTH_FIELD] === month;
    }).map(function(row) {
        const key = row[currentQuestion];
        valueCounter.set(key, valueCounter.get(key) + 1);
    });

    $(`.month-graph[data-month="${month}"]`).highcharts({
        chart: {
            type: 'column'
        },
        xAxis: {
            categories: Array.from(VALUE_TO_DISPLAY_NAME.values())
        },
        series: [{
            data: Array.from(valueCounter.values())
        }]
    });
};

function drawCharts(currentQuestion) {
    drawAverageChart(currentQuestion);
    drawMonthCharts(currentQuestion);
};

$(document).ready(function() {
    const $questionSelect = $("#question-select");
    const $monthlyGraphs = $("#monthly-graphs");

    $questionSelect.on("change", function() {
        drawCharts($questionSelect.val());
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
