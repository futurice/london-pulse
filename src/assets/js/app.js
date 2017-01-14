$(document).foundation();

const MONTH_FIELD = "Month";
const TRIBE_FIELD = "My tribe";
const MY_TRIBE = "London";
const ALL_QUESTIONS = "All questions";

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
    return Array.from(uniqueTribes).sort(function(a, b) {
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

function drawAllQuestionCharts(currentQuestion, tribe) {
    questionsPromise.then(
        questions => questions.forEach(
            question => drawQuestionChart(question, tribe, "question", false)
        )
    );
}

function drawTribesQuestionCharts(currentQuestion) {
    tribesPromise.then(
        tribes => tribes.forEach(
            tribe => drawQuestionChart(currentQuestion, tribe, "tribe", true)
        )
    );
}

function drawQuestionChart(currentQuestion, tribe, graphTitle, ratioCalc) {
    Promise.all([
        monthsPromise,
        getTribeDataPromise(tribe)
    ]).then(([months, data]) => {
        let subtitle = tribe;
        let chartCeiling = 100;
        let yAxisTitle = "% responses";

        if (graphTitle === "question") {
            subtitle = currentQuestion;
            chartCeiling = null;
            yAxisTitle = "Number of responses";
        }

        //Create empty map of map
        const allResponses = new Map();
        VALUE_TO_DISPLAY_NAME.forEach(
            value => allResponses.set(
                value,
                createMapFromArray(months, () => 0)
            )
        );
        const monthTotals = createMapFromArray(months, () => 0);


        // Fill
        data.forEach(row => {
            if(!(currentQuestion in row)) {
                return;
            }
            const monthName = row[MONTH_FIELD]
            const valueLabel = VALUE_TO_DISPLAY_NAME.get(row[currentQuestion]);
            const n = allResponses.get(valueLabel).get(monthName);
            allResponses.get(valueLabel).set(monthName, n + 1);
            monthTotals.set(monthName, monthTotals.get(monthName) + 1);
        });

        // calculate % if needed
        if (ratioCalc) {
            allResponses.forEach((valueResponses, valueLabel) => {
                valueResponses.forEach((monthReponses, monthName) => {
                    const ratio = 100 * (monthReponses / monthTotals.get(monthName));
                    valueResponses.set(monthName, ratio);
                })
            });
        }

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
        $(`.small-graph[data-question="${currentQuestion}"][data-tribe="${tribe}"`).highcharts({
            chart: {
                type: "column"
            },
            title: {
                text: null
            },
            subtitle: {
                text: subtitle
            },
            spacingBottom: 30,
            marginTop: 30,
            xAxis: {
                categories: months
            },
            yAxis: {
                title: {
                    text: yAxisTitle
                },
                ceiling: chartCeiling
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

function createMapFromArray(keys, valueFunc) {
    const counter = new Map();
    keys.forEach(key => counter.set(key, valueFunc()));
    return counter;
}

function drawCharts(currentQuestion) {
    if(currentQuestion === ALL_QUESTIONS) {
        $("#tribe-graphs").hide();
        $(".averages-graph").hide();
        $("#question-graphs").show();
        drawAllQuestionCharts(currentQuestion, MY_TRIBE);
    } else {
        $("#question-graphs").hide();
        $("#tribe-graphs").show();
        $(".averages-graph").show();
        drawAverageChart(currentQuestion);
        drawTribesQuestionCharts(currentQuestion);
    }
};

$(document).ready(function() {
    const $questionSelect = $("#question-select");
    const $tribeGraphs = $("#tribe-graphs");
    const $questionGraphs = $("#question-graphs");

    $questionSelect.on("change", function() {
        $(".tribe-graph").attr("data-question", $questionSelect.val());
        drawCharts($questionSelect.val());
    });

    $questionSelect.append(`<option value="${ALL_QUESTIONS}">All questions for London</option>`);

    questionsPromise.then(questions => {
        questions.forEach(question => {
            $questionSelect.append(`<option value="${question}">${question}</option>`);
            $questionGraphs.append(`
                <div class="large-4 columns">
                    <div class="question-graph small-graph" data-tribe="${MY_TRIBE}" data-question="${question}"></div>
                </div>`);
        });
        $questionSelect.trigger("change");
    });

    //Create graph container for tribe results
    tribesPromise.then(tribes => {
        tribes.forEach(tribe => {
            $tribeGraphs.append(`
                <div class="large-4 columns">
                    <div class="tribe-graph small-graph" data-tribe="${tribe}" data-question=""></div>
                </div>`);
        })
    });
});
