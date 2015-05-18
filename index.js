
/*
 * @fileoverview Custom stylish reporter for gulp-scss-lint
 * @author J-Sek
 */
var cl, gutil, lastFailingFile, logStylish, pluralize, printLinter, printPath, printPathLine, printPlaceRaw, printSeverity, reportWithSummary, severityColor, stylishErrorsSummary, stylishPrintErrorsInFile, stylishPrintFile, stylishReporter, stylishSummary, table, through, writeStylishResults;

gutil = require('gulp-util');

table = require('text-table');

through = require('through2');

lastFailingFile = null;

cl = gutil.colors;

severityColor = {
  warning: cl.yellow,
  error: cl.red
};

printPath = function(path) {
  return '\n' + cl.magenta(path);
};

printPlaceRaw = function(issue) {
  return "(" + issue.line + "," + issue.column + ")";
};

printSeverity = function(issue) {
  return severityColor[issue.severity](issue.severity);
};

printLinter = function(issue) {
  return cl.gray(issue.linter);
};

pluralize = function(word, count) {
  if (count > 1) {
    return word + 's';
  } else {
    return word;
  }
};

printPathLine = function(file) {
  if (lastFailingFile !== file.path) {
    lastFailingFile = file.path;
    return console.log(printPath(lastFailingFile));
  }
};

logStylish = function(issues) {
  var data, issue, results, tableOptions;
  data = (function() {
    var i, len, results1;
    results1 = [];
    for (i = 0, len = issues.length; i < len; i++) {
      issue = issues[i];
      results1.push(["", issue.line, issue.column, printSeverity(issue), issue.reason, printLinter(issue)]);
    }
    return results1;
  })();
  tableOptions = {
    align: ["", "r", "l"],
    stringLength: function(str) {
      return cl.stripColor(str).length;
    }
  };
  results = table(data, tableOptions).split('\n').map(function(x) {
    return x.replace(/(\d+)\s+(\d+)/, function(m, p1, p2) {
      return cl.gray(p1 + ':' + p2);
    });
  }).join('\n');
  return console.log(results);
};


/*
 * Inspired by 'stylish' ESLint reporter
 * Usage: stream element, like for ESLint
 */

stylishPrintFile = function(file) {
  if (!file.scsslint.success) {
    printPathLine(file);
    return logStylish(file.scsslint.issues);
  }
};

stylishPrintErrorsInFile = function(file) {
  if (file.scsslint.errors > 0) {
    printPathLine(file);
    return logStylish(file.scsslint.issues.filter(function(x) {
      return x.severity === 'error';
    }));
  }
};

stylishSummary = function(total, errors, warnings) {
  if (total > 0) {
    return console.log(cl.red.bold("\n\u2716  " + total + " " + (pluralize('problem', total)) + " (" + errors + " " + (pluralize('error', errors)) + ", " + warnings + " " + (pluralize('warning', warnings)) + ")\n"));
  }
};

stylishErrorsSummary = function(total, errors, warnings) {
  if (total > 0) {
    return console.log(cl.red.bold("\n\u2716  " + errors + " " + (pluralize('error', errors)) + "!\n"));
  }
};

writeStylishResults = function(results, fileFormatter, summaryFormatter) {
  var errors, i, len, result, total, warnings;
  total = errors = warnings = 0;
  for (i = 0, len = results.length; i < len; i++) {
    result = results[i];
    fileFormatter(result);
    total += result.scsslint.issues.length;
    errors += result.scsslint.errors;
    warnings += result.scsslint.warnings;
  }
  if (total > 0) {
    return summaryFormatter(total, errors, warnings);
  }
};

reportWithSummary = function(fileFormatter, summaryFormatter) {
  var passAll, printResults, results;
  results = [];
  passAll = function(file, enc, cb) {
    if (!file.scsslint.success) {
      results.push(file);
    }
    return cb(null, file);
  };
  printResults = function(cb) {
    if (results.length) {
      writeStylishResults(results, fileFormatter, summaryFormatter);
    }
    results = [];
    return cb();
  };
  return through.obj(passAll, printResults);
};

stylishReporter = function(opts) {
  opts = opts || {};
  if (opts.errorsOnly) {
    return reportWithSummary(stylishPrintErrorsInFile, stylishErrorsSummary);
  } else {
    return reportWithSummary(stylishPrintFile, stylishSummary);
  }
};

module.exports = {
  suppress: function() {},
  stylish: stylishReporter
};