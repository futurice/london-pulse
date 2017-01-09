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
    }).filter(function (row) {
        return (
            row[TRIBE_FIELD] !== "Others" &&
            row[TRIBE_FIELD] !== "Employees whose supervisor is Teemu Moisala" &&
            row[TRIBE_FIELD] !== "Employees whose supervisor is Tuomas Syrjänen"
        );
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

const tribesPromise = dataPromise.then(function(data) {
    const allTribes = data.map(function(row) {
        return row[TRIBE_FIELD];
    });
    const uniqueTribes = new Set(allTribes);
    return Array.from(allTribes).sort(function(a, b) {
        if (a === "London") {  /* Always put London first */
            return -1;
        } else if (b === "London"){
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
    Promise.all([monthsPromise, tribesPromise, dataPromise]).then(function([months, tribes, data]) {
        const allResponses = new Map();

        tribes.forEach(function(tribe) {
            const tribeResponses = new Map();
            months.forEach(function (month) {
                tribeResponses.set(month, []);
            });
            allResponses.set(tribe, tribeResponses);
        });

        //step 2: fill.
        data.forEach(function (row) {
            const tribeResponses = allResponses.get(row[TRIBE_FIELD]);
            const monthReponses = tribeResponses.get(row[MONTH_FIELD]);
            if (row[currentQuestion] !== "") {
                monthReponses.push(row[currentQuestion]);
            }
        });

        //step 3: calculate averages
        allResponses.forEach(function (tribeResponses, tribe) {
            tribeResponses.forEach(function (monthReponses, month) {
                const avg = calculateAverage(monthReponses);
                tribeResponses.set(month, avg);
            });
        })

        //step 4: create series
        const series = [];
        allResponses.forEach(function (tribeResponses, tribe) {
            const seriesEntry = {
                name: tribe,
                data: Array.from(tribeResponses.values())
            };
            series.push(seriesEntry);
        });

        //Draw
        $("#average-graph-container").highcharts({
            chart: {
                type: 'column'
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
    if(array.length > 0){
        const sum = array.reduce(function(a, b) {
          return a + b;
        }, 0);
        return sum/array.length;
    } else {
        return 0;
    }
}


function drawMonthCharts(currentQuestion) {
    londonDataPromise.then(function(tribeData) {
        monthsPromise.then(function(months) {
            months.map(function(month) {
                drawMonthChart(currentQuestion, tribeData, month);
            });
        });
    });
    $('#question-subtitle').html(`${currentQuestion}`);
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
            text: month
        }
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
