# 🌟 London Pulse Results 🌟

A visualisation of pulse data for the London tribe only to help analyse results and facilitate monthly discussions:

* How do tribes compare to each other? (high's & low's)
* How does our own tribe compare to others?
* How does one tribe compare with itself month by month?
* Responses distribution per question, per month, just because.

CSV data is from https://pulse-results.app.futurice.com

Note: this project uses Foundation with the ZURB Template (http://foundation.zurb.com/sites).

## To-dos

* Ability to select the focus tribe
* Select year (or something to handle it)
* "Analyse" page giving some info for the selected tribe (e.g. Question where selected tribe ranks higher than other tribes;=, improved from last month,...)


## Deployment

Currently deployed on S3 on my personal account.
From the `ansible/` directory, run:

```ansible-playbook site.yml```


## Installation

```bash
npm install
bower install
```

Run `npm start` to run Gulp.

```
http://localhost:8000
```

To create compressed, production-ready assets, run `npm run build`.
