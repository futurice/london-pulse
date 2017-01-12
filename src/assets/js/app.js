$(document).foundation();

const MONTH_FIELD = "Month";
const TRIBE_FIELD = "My tribe";
const MY_TRIBE = "London"
const VALUE_TO_DISPLAY_NAME = new Map ([
    ["", "Abstain"],
    [1, "Str disagree"],
    [2, "Disagree"],
    [3, "Agree"],
    [4, "Str agree"]
]);

const dataFiles = [
    "assets/data/pulse_data.csv",
    "assets/data/answers_september.csv",
    "assets/data/answers_october.csv",
    "assets/data/answers_november.csv",
    "assets/data/answers_december.csv"
];

function loadCSV(url) {
    return $.get(url).then(
        data => Papa.parse(data, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        })
    );
};

const dataPromise = Promise.all(
    dataFiles.map(loadCSV)
).then(
    results => results.map(
        result => result.data
    ).reduce(
        (a,b) => a.concat(b)
    ).filter(
        row => (
            row[TRIBE_FIELD] !== "Others" &&
            row[TRIBE_FIELD] !== "Employees whose supervisor is Teemu Moisala" &&
            row[TRIBE_FIELD] !== "Employees whose supervisor is Tuomas Syrjänen"
        )
    )
);

function getTribeDataPromise(tribe) {
    return dataPromise.then(
        data => data.filter(
            row => (row[TRIBE_FIELD] === tribe)
        )
    );
}

const questionsPromise = dataPromise.then(data => {
    const allQuestions = data.map(
        row => Object.keys(row)
    ).reduce(
        (a,b) => a.concat(b) //flatten
    );
    const uniqueQuestions = new Set(allQuestions);
    uniqueQuestions.delete(MONTH_FIELD);
    uniqueQuestions.delete(TRIBE_FIELD);

    return Array.from(uniqueQuestions).sort();
})

const monthsPromise = dataPromise.then(data => {
    const allMonths = data.map(
        row => row[MONTH_FIELD]
    );
    const uniqueMonths = new Set(allMonths);
    return Array.from(uniqueMonths);
});

const tribesPromise = dataPromise.then(data => {
    const allTribes = data.map(
        row => row[TRIBE_FIELD]
    );
    const uniqueTribes = new Set(allTribes);
    return Array.from(allTribes).sort(function(a, b) {
        if (a === MY_TRIBE) {  /* Always put MY_TRIBE first */
            return -1;
        } else if (b === MY_TRIBE){
            return 1;
        } else if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        }
        return 0;
    });
});


function drawAverageChart(currentQuestion) {
    Promise.all([
        monthsPromise,
        tribesPromise,
        dataPromise
    ]).then(([months, tribes, data]) => {
        const allResponses = new Map();

        tribes.forEach(function(tribe) {
            const tribeResponses = new Map();
            months.forEach(
                month => tribeResponses.set(month, [])
            );
            allResponses.set(tribe, tribeResponses);
        });

        //step 2: fill.
        data.forEach(row => {
            const tribeResponses = allResponses.get(row[TRIBE_FIELD]);
            const monthReponses = tribeResponses.get(row[MONTH_FIELD]);
            if (row[currentQuestion] !== "") {
                monthReponses.push(row[currentQuestion]);
            }
        });

        //step 3: calculate averages
        allResponses.forEach((tribeResponses, tribe) => {
            tribeResponses.forEach((monthReponses, month) => {
                const avg = calculateAverage(monthReponses);
                tribeResponses.set(month, avg);
            });
        })

        //step 4: create series
        const series = [];
        allResponses.forEach( (tribeResponses, tribe) => {
            const seriesEntry = {
                name: tribe,
                data: Array.from(tribeResponses.values())
            };
            series.push(seriesEntry);
        });

        //Draw
        $("#average-graph-container").highcharts({
            chart: {
                type: "column"
            },
            title: {
                text: "Monthly average"
            },
            spacingBottom: 30,
            marginTop: 30,
            xAxis: {
                categories: months
            },
            series
        });
    });
}

function calculateAverage(array){
    if (array.length === 0) {
        return 0;
    }
    const sum = array.reduce((a, b) => a + b, 0);
    return sum / array.length;
}


function drawMonthCharts(currentQuestion) {
    Promise.all([
        getTribeDataPromise(MY_TRIBE),
        monthsPromise
    ]).then(([tribeData, months]) => {
        months.forEach(month => drawMonthChart(currentQuestion, tribeData, month));
    });
    $("#question-subtitle").html(`${currentQuestion}`);
}

function drawMonthChart(currentQuestion, tribeData, month){
    const valueCounter = new Map();
    VALUE_TO_DISPLAY_NAME.forEach(
        (value, key) => valueCounter.set(key, 0)
    );

    tribeData.filter(
        row => (row[MONTH_FIELD] === month)
    ).map(row => {
        const key = row[currentQuestion];
        valueCounter.set(key, valueCounter.get(key) + 1);
    });

    $(`.month-graph[data-month="${month}"]`).highcharts({
        chart: {
            type: "column"
        },
        xAxis: {
            categories: Array.from(VALUE_TO_DISPLAY_NAME.values())
        },
        yAxis: {
            title: {
                text: "# responses"
            }
        },
        series: [{
            data: Array.from(valueCounter.values())
        }],
        legend: {
            enabled: false
        },
        title: {
            text: null
        },
        subtitle: {
            text: month,
            x: 20
        }
    });
};


function drawTribeQuestionCharts(currentQuestion) {
    questionsPromise.then(
        questions => questions.forEach(
            question => drawTribeQuestionChart(question)
        )
    );
}

function drawTribeQuestionChart(currentQuestion) {
    Promise.all([
        monthsPromise,
        getTribeDataPromise(MY_TRIBE)
    ]).then(([months, data]) => {
        //Create empty map of map
        const allResponses = new Map();
        VALUE_TO_DISPLAY_NAME.forEach(value => {
            const valueResponses = new Map();
            months.forEach(
                month => valueResponses.set(month, 0)
            );
            allResponses.set(value, valueResponses);
        });

        // Fill
        data.forEach(row => {
            if(!(currentQuestion in row)) {
                return;
            }
            const monthName = row[MONTH_FIELD]
            const valueLabel = VALUE_TO_DISPLAY_NAME.get(row[currentQuestion]);
            const n = allResponses.get(valueLabel).get(monthName);
            allResponses.get(valueLabel).set(monthName, n+1);
        });

        //convert to series for highcharts
        const series = [];
        allResponses.forEach((valueResponses, valueLabel) => {
            const seriesEntry = {
                name: valueLabel,
                data: Array.from(valueResponses.values())
            };
            series.push(seriesEntry);
        });

        //Draw
        $(`.question-graph[data-question="${currentQuestion}"]`).highcharts({
            chart: {
                type: "column"
            },
            title: {
                text: null
            },
            subtitle: {
                text: currentQuestion
            },
            spacingBottom: 30,
            marginTop: 30,
            xAxis: {
                categories: months
            },
            yAxis: {
                title: null
            },
            series,
            plotOptions: {
                column: {
                    stacking: "normal",
                }
            },
            legend: {
                enabled: false
            }
        });
    });
}

function drawCharts(currentQuestion) {
    if(currentQuestion === "All questions") {
        $("#monthly-graphs").hide();
        $(".averages-graph").hide();
        $("#question-graphs").show();
        drawTribeQuestionCharts(currentQuestion);
    } else {
        $("#question-graphs").hide();
        $("#monthly-graphs").show();
        $(".averages-graph").show();
        drawAverageChart(currentQuestion);
        drawMonthCharts(currentQuestion);
    }
};

$(document).ready(function() {
    const $questionSelect = $("#question-select");
    const $monthlyGraphs = $("#monthly-graphs");
    const $questionGraphs = $("#question-graphs");

    $questionSelect.on("change", function() {
        drawCharts($questionSelect.val());
    });

    questionsPromise.then(questions => {
        questions.forEach(question => {
            $questionSelect.append(`<option value="${question}">${question}</option>`);
            $questionGraphs.append(`
                <div class="large-4 columns">
                    <div class="question-graph" data-question="${question}"></div>
                </div>`);
        });
        $questionSelect.trigger("change");
    });

    //Create monthly graphs container
    monthsPromise.then(months => {
        months.map(month => {
            $monthlyGraphs.append(`
                <div class="large-3 columns">
                    <div class="month-graph" data-month="${month}"></div>
                </div>`);
        })
    });
});
