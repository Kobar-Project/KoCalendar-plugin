(function() {
  "use strict";
  const millisecondsInWeek = 6048e5;
  const millisecondsInDay = 864e5;
  const millisecondsInMinute = 6e4;
  const millisecondsInHour = 36e5;
  const constructFromSymbol = /* @__PURE__ */ Symbol.for("constructDateFrom");
  function constructFrom(date, value) {
    if (typeof date === "function") return date(value);
    if (date && typeof date === "object" && constructFromSymbol in date)
      return date[constructFromSymbol](value);
    if (date instanceof Date) return new date.constructor(value);
    return new Date(value);
  }
  function toDate(argument, context) {
    return constructFrom(context || argument, argument);
  }
  function addDays(date, amount, options) {
    const _date = toDate(date, options?.in);
    if (isNaN(amount)) return constructFrom(date, NaN);
    if (!amount) return _date;
    _date.setDate(_date.getDate() + amount);
    return _date;
  }
  function addMonths(date, amount, options) {
    const _date = toDate(date, options?.in);
    if (isNaN(amount)) return constructFrom(date, NaN);
    if (!amount) {
      return _date;
    }
    const dayOfMonth = _date.getDate();
    const endOfDesiredMonth = constructFrom(date, _date.getTime());
    endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
    const daysInMonth = endOfDesiredMonth.getDate();
    if (dayOfMonth >= daysInMonth) {
      return endOfDesiredMonth;
    } else {
      _date.setFullYear(
        endOfDesiredMonth.getFullYear(),
        endOfDesiredMonth.getMonth(),
        dayOfMonth
      );
      return _date;
    }
  }
  let defaultOptions = {};
  function getDefaultOptions() {
    return defaultOptions;
  }
  function startOfWeek(date, options) {
    const defaultOptions2 = getDefaultOptions();
    const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
    const _date = toDate(date, options?.in);
    const day = _date.getDay();
    const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
    _date.setDate(_date.getDate() - diff);
    _date.setHours(0, 0, 0, 0);
    return _date;
  }
  function startOfISOWeek(date, options) {
    return startOfWeek(date, { ...options, weekStartsOn: 1 });
  }
  function getISOWeekYear(date, options) {
    const _date = toDate(date, options?.in);
    const year = _date.getFullYear();
    const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
    fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
    fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
    const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
    const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
    fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
    fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
    const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
    if (_date.getTime() >= startOfNextYear.getTime()) {
      return year + 1;
    } else if (_date.getTime() >= startOfThisYear.getTime()) {
      return year;
    } else {
      return year - 1;
    }
  }
  function getTimezoneOffsetInMilliseconds(date) {
    const _date = toDate(date);
    const utcDate = new Date(
      Date.UTC(
        _date.getFullYear(),
        _date.getMonth(),
        _date.getDate(),
        _date.getHours(),
        _date.getMinutes(),
        _date.getSeconds(),
        _date.getMilliseconds()
      )
    );
    utcDate.setUTCFullYear(_date.getFullYear());
    return +date - +utcDate;
  }
  function normalizeDates(context, ...dates) {
    const normalize = constructFrom.bind(
      null,
      dates.find((date) => typeof date === "object")
    );
    return dates.map(normalize);
  }
  function startOfDay(date, options) {
    const _date = toDate(date, options?.in);
    _date.setHours(0, 0, 0, 0);
    return _date;
  }
  function differenceInCalendarDays(laterDate, earlierDate, options) {
    const [laterDate_, earlierDate_] = normalizeDates(
      options?.in,
      laterDate,
      earlierDate
    );
    const laterStartOfDay = startOfDay(laterDate_);
    const earlierStartOfDay = startOfDay(earlierDate_);
    const laterTimestamp = +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
    const earlierTimestamp = +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
    return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
  }
  function startOfISOWeekYear(date, options) {
    const year = getISOWeekYear(date, options);
    const fourthOfJanuary = constructFrom(date, 0);
    fourthOfJanuary.setFullYear(year, 0, 4);
    fourthOfJanuary.setHours(0, 0, 0, 0);
    return startOfISOWeek(fourthOfJanuary);
  }
  function isSameDay(laterDate, earlierDate, options) {
    const [dateLeft_, dateRight_] = normalizeDates(
      options?.in,
      laterDate,
      earlierDate
    );
    return +startOfDay(dateLeft_) === +startOfDay(dateRight_);
  }
  function isDate(value) {
    return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
  }
  function isValid(date) {
    return !(!isDate(date) && typeof date !== "number" || isNaN(+toDate(date)));
  }
  function endOfMonth(date, options) {
    const _date = toDate(date, options?.in);
    const month = _date.getMonth();
    _date.setFullYear(_date.getFullYear(), month + 1, 0);
    _date.setHours(23, 59, 59, 999);
    return _date;
  }
  function startOfMonth(date, options) {
    const _date = toDate(date, options?.in);
    _date.setDate(1);
    _date.setHours(0, 0, 0, 0);
    return _date;
  }
  function startOfYear(date, options) {
    const date_ = toDate(date, options?.in);
    date_.setFullYear(date_.getFullYear(), 0, 1);
    date_.setHours(0, 0, 0, 0);
    return date_;
  }
  const formatDistanceLocale = {
    lessThanXSeconds: {
      one: "less than a second",
      other: "less than {{count}} seconds"
    },
    xSeconds: {
      one: "1 second",
      other: "{{count}} seconds"
    },
    halfAMinute: "half a minute",
    lessThanXMinutes: {
      one: "less than a minute",
      other: "less than {{count}} minutes"
    },
    xMinutes: {
      one: "1 minute",
      other: "{{count}} minutes"
    },
    aboutXHours: {
      one: "about 1 hour",
      other: "about {{count}} hours"
    },
    xHours: {
      one: "1 hour",
      other: "{{count}} hours"
    },
    xDays: {
      one: "1 day",
      other: "{{count}} days"
    },
    aboutXWeeks: {
      one: "about 1 week",
      other: "about {{count}} weeks"
    },
    xWeeks: {
      one: "1 week",
      other: "{{count}} weeks"
    },
    aboutXMonths: {
      one: "about 1 month",
      other: "about {{count}} months"
    },
    xMonths: {
      one: "1 month",
      other: "{{count}} months"
    },
    aboutXYears: {
      one: "about 1 year",
      other: "about {{count}} years"
    },
    xYears: {
      one: "1 year",
      other: "{{count}} years"
    },
    overXYears: {
      one: "over 1 year",
      other: "over {{count}} years"
    },
    almostXYears: {
      one: "almost 1 year",
      other: "almost {{count}} years"
    }
  };
  const formatDistance = (token, count, options) => {
    let result;
    const tokenValue = formatDistanceLocale[token];
    if (typeof tokenValue === "string") {
      result = tokenValue;
    } else if (count === 1) {
      result = tokenValue.one;
    } else {
      result = tokenValue.other.replace("{{count}}", count.toString());
    }
    if (options?.addSuffix) {
      if (options.comparison && options.comparison > 0) {
        return "in " + result;
      } else {
        return result + " ago";
      }
    }
    return result;
  };
  function buildFormatLongFn(args) {
    return (options = {}) => {
      const width = options.width ? String(options.width) : args.defaultWidth;
      const format2 = args.formats[width] || args.formats[args.defaultWidth];
      return format2;
    };
  }
  const dateFormats = {
    full: "EEEE, MMMM do, y",
    long: "MMMM do, y",
    medium: "MMM d, y",
    short: "MM/dd/yyyy"
  };
  const timeFormats = {
    full: "h:mm:ss a zzzz",
    long: "h:mm:ss a z",
    medium: "h:mm:ss a",
    short: "h:mm a"
  };
  const dateTimeFormats = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: "{{date}}, {{time}}",
    short: "{{date}}, {{time}}"
  };
  const formatLong = {
    date: buildFormatLongFn({
      formats: dateFormats,
      defaultWidth: "full"
    }),
    time: buildFormatLongFn({
      formats: timeFormats,
      defaultWidth: "full"
    }),
    dateTime: buildFormatLongFn({
      formats: dateTimeFormats,
      defaultWidth: "full"
    })
  };
  const formatRelativeLocale = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: "P"
  };
  const formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];
  function buildLocalizeFn(args) {
    return (value, options) => {
      const context = options?.context ? String(options.context) : "standalone";
      let valuesArray;
      if (context === "formatting" && args.formattingValues) {
        const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
        const width = options?.width ? String(options.width) : defaultWidth;
        valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
      } else {
        const defaultWidth = args.defaultWidth;
        const width = options?.width ? String(options.width) : args.defaultWidth;
        valuesArray = args.values[width] || args.values[defaultWidth];
      }
      const index = args.argumentCallback ? args.argumentCallback(value) : value;
      return valuesArray[index];
    };
  }
  const eraValues = {
    narrow: ["B", "A"],
    abbreviated: ["BC", "AD"],
    wide: ["Before Christ", "Anno Domini"]
  };
  const quarterValues = {
    narrow: ["1", "2", "3", "4"],
    abbreviated: ["Q1", "Q2", "Q3", "Q4"],
    wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
  };
  const monthValues = {
    narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    abbreviated: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    wide: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ]
  };
  const dayValues = {
    narrow: ["S", "M", "T", "W", "T", "F", "S"],
    short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    wide: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ]
  };
  const dayPeriodValues = {
    narrow: {
      am: "a",
      pm: "p",
      midnight: "mi",
      noon: "n",
      morning: "morning",
      afternoon: "afternoon",
      evening: "evening",
      night: "night"
    },
    abbreviated: {
      am: "AM",
      pm: "PM",
      midnight: "midnight",
      noon: "noon",
      morning: "morning",
      afternoon: "afternoon",
      evening: "evening",
      night: "night"
    },
    wide: {
      am: "a.m.",
      pm: "p.m.",
      midnight: "midnight",
      noon: "noon",
      morning: "morning",
      afternoon: "afternoon",
      evening: "evening",
      night: "night"
    }
  };
  const formattingDayPeriodValues = {
    narrow: {
      am: "a",
      pm: "p",
      midnight: "mi",
      noon: "n",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      night: "at night"
    },
    abbreviated: {
      am: "AM",
      pm: "PM",
      midnight: "midnight",
      noon: "noon",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      night: "at night"
    },
    wide: {
      am: "a.m.",
      pm: "p.m.",
      midnight: "midnight",
      noon: "noon",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      night: "at night"
    }
  };
  const ordinalNumber = (dirtyNumber, _options) => {
    const number = Number(dirtyNumber);
    const rem100 = number % 100;
    if (rem100 > 20 || rem100 < 10) {
      switch (rem100 % 10) {
        case 1:
          return number + "st";
        case 2:
          return number + "nd";
        case 3:
          return number + "rd";
      }
    }
    return number + "th";
  };
  const localize = {
    ordinalNumber,
    era: buildLocalizeFn({
      values: eraValues,
      defaultWidth: "wide"
    }),
    quarter: buildLocalizeFn({
      values: quarterValues,
      defaultWidth: "wide",
      argumentCallback: (quarter) => quarter - 1
    }),
    month: buildLocalizeFn({
      values: monthValues,
      defaultWidth: "wide"
    }),
    day: buildLocalizeFn({
      values: dayValues,
      defaultWidth: "wide"
    }),
    dayPeriod: buildLocalizeFn({
      values: dayPeriodValues,
      defaultWidth: "wide",
      formattingValues: formattingDayPeriodValues,
      defaultFormattingWidth: "wide"
    })
  };
  function buildMatchFn(args) {
    return (string, options = {}) => {
      const width = options.width;
      const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
      const matchResult = string.match(matchPattern);
      if (!matchResult) {
        return null;
      }
      const matchedString = matchResult[0];
      const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
      const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
        // [TODO] -- I challenge you to fix the type
        findKey(parsePatterns, (pattern) => pattern.test(matchedString))
      );
      let value;
      value = args.valueCallback ? args.valueCallback(key) : key;
      value = options.valueCallback ? (
        // [TODO] -- I challenge you to fix the type
        options.valueCallback(value)
      ) : value;
      const rest = string.slice(matchedString.length);
      return { value, rest };
    };
  }
  function findKey(object, predicate) {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
        return key;
      }
    }
    return void 0;
  }
  function findIndex(array, predicate) {
    for (let key = 0; key < array.length; key++) {
      if (predicate(array[key])) {
        return key;
      }
    }
    return void 0;
  }
  function buildMatchPatternFn(args) {
    return (string, options = {}) => {
      const matchResult = string.match(args.matchPattern);
      if (!matchResult) return null;
      const matchedString = matchResult[0];
      const parseResult = string.match(args.parsePattern);
      if (!parseResult) return null;
      let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
      value = options.valueCallback ? options.valueCallback(value) : value;
      const rest = string.slice(matchedString.length);
      return { value, rest };
    };
  }
  const matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
  const parseOrdinalNumberPattern = /\d+/i;
  const matchEraPatterns = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i
  };
  const parseEraPatterns = {
    any: [/^b/i, /^(a|c)/i]
  };
  const matchQuarterPatterns = {
    narrow: /^[1234]/i,
    abbreviated: /^q[1234]/i,
    wide: /^[1234](th|st|nd|rd)? quarter/i
  };
  const parseQuarterPatterns = {
    any: [/1/i, /2/i, /3/i, /4/i]
  };
  const matchMonthPatterns = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
  };
  const parseMonthPatterns = {
    narrow: [
      /^j/i,
      /^f/i,
      /^m/i,
      /^a/i,
      /^m/i,
      /^j/i,
      /^j/i,
      /^a/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i
    ],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i
    ]
  };
  const matchDayPatterns = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
  };
  const parseDayPatterns = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
  };
  const matchDayPeriodPatterns = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
  };
  const parseDayPeriodPatterns = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i
    }
  };
  const match = {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: matchOrdinalNumberPattern,
      parsePattern: parseOrdinalNumberPattern,
      valueCallback: (value) => parseInt(value, 10)
    }),
    era: buildMatchFn({
      matchPatterns: matchEraPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseEraPatterns,
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: matchQuarterPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseQuarterPatterns,
      defaultParseWidth: "any",
      valueCallback: (index) => index + 1
    }),
    month: buildMatchFn({
      matchPatterns: matchMonthPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseMonthPatterns,
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: matchDayPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseDayPatterns,
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: matchDayPeriodPatterns,
      defaultMatchWidth: "any",
      parsePatterns: parseDayPeriodPatterns,
      defaultParseWidth: "any"
    })
  };
  const enUS = {
    code: "en-US",
    formatDistance,
    formatLong,
    formatRelative,
    localize,
    match,
    options: {
      weekStartsOn: 0,
      firstWeekContainsDate: 1
    }
  };
  function getDayOfYear(date, options) {
    const _date = toDate(date, options?.in);
    const diff = differenceInCalendarDays(_date, startOfYear(_date));
    const dayOfYear = diff + 1;
    return dayOfYear;
  }
  function getISOWeek(date, options) {
    const _date = toDate(date, options?.in);
    const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
    return Math.round(diff / millisecondsInWeek) + 1;
  }
  function getWeekYear(date, options) {
    const _date = toDate(date, options?.in);
    const year = _date.getFullYear();
    const defaultOptions2 = getDefaultOptions();
    const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
    const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
    firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
    firstWeekOfNextYear.setHours(0, 0, 0, 0);
    const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
    const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
    firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
    firstWeekOfThisYear.setHours(0, 0, 0, 0);
    const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
    if (+_date >= +startOfNextYear) {
      return year + 1;
    } else if (+_date >= +startOfThisYear) {
      return year;
    } else {
      return year - 1;
    }
  }
  function startOfWeekYear(date, options) {
    const defaultOptions2 = getDefaultOptions();
    const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
    const year = getWeekYear(date, options);
    const firstWeek = constructFrom(options?.in || date, 0);
    firstWeek.setFullYear(year, 0, firstWeekContainsDate);
    firstWeek.setHours(0, 0, 0, 0);
    const _date = startOfWeek(firstWeek, options);
    return _date;
  }
  function getWeek(date, options) {
    const _date = toDate(date, options?.in);
    const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
    return Math.round(diff / millisecondsInWeek) + 1;
  }
  function addLeadingZeros(number, targetLength) {
    const sign = number < 0 ? "-" : "";
    const output = Math.abs(number).toString().padStart(targetLength, "0");
    return sign + output;
  }
  const lightFormatters = {
    // Year
    y(date, token) {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
    },
    // Month
    M(date, token) {
      const month = date.getMonth();
      return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
    },
    // Day of the month
    d(date, token) {
      return addLeadingZeros(date.getDate(), token.length);
    },
    // AM or PM
    a(date, token) {
      const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
      switch (token) {
        case "a":
        case "aa":
          return dayPeriodEnumValue.toUpperCase();
        case "aaa":
          return dayPeriodEnumValue;
        case "aaaaa":
          return dayPeriodEnumValue[0];
        case "aaaa":
        default:
          return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
      }
    },
    // Hour [1-12]
    h(date, token) {
      return addLeadingZeros(date.getHours() % 12 || 12, token.length);
    },
    // Hour [0-23]
    H(date, token) {
      return addLeadingZeros(date.getHours(), token.length);
    },
    // Minute
    m(date, token) {
      return addLeadingZeros(date.getMinutes(), token.length);
    },
    // Second
    s(date, token) {
      return addLeadingZeros(date.getSeconds(), token.length);
    },
    // Fraction of second
    S(date, token) {
      const numberOfDigits = token.length;
      const milliseconds = date.getMilliseconds();
      const fractionalSeconds = Math.trunc(
        milliseconds * Math.pow(10, numberOfDigits - 3)
      );
      return addLeadingZeros(fractionalSeconds, token.length);
    }
  };
  const dayPeriodEnum = {
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  };
  const formatters = {
    // Era
    G: function(date, token, localize2) {
      const era = date.getFullYear() > 0 ? 1 : 0;
      switch (token) {
        // AD, BC
        case "G":
        case "GG":
        case "GGG":
          return localize2.era(era, { width: "abbreviated" });
        // A, B
        case "GGGGG":
          return localize2.era(era, { width: "narrow" });
        // Anno Domini, Before Christ
        case "GGGG":
        default:
          return localize2.era(era, { width: "wide" });
      }
    },
    // Year
    y: function(date, token, localize2) {
      if (token === "yo") {
        const signedYear = date.getFullYear();
        const year = signedYear > 0 ? signedYear : 1 - signedYear;
        return localize2.ordinalNumber(year, { unit: "year" });
      }
      return lightFormatters.y(date, token);
    },
    // Local week-numbering year
    Y: function(date, token, localize2, options) {
      const signedWeekYear = getWeekYear(date, options);
      const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
      if (token === "YY") {
        const twoDigitYear = weekYear % 100;
        return addLeadingZeros(twoDigitYear, 2);
      }
      if (token === "Yo") {
        return localize2.ordinalNumber(weekYear, { unit: "year" });
      }
      return addLeadingZeros(weekYear, token.length);
    },
    // ISO week-numbering year
    R: function(date, token) {
      const isoWeekYear = getISOWeekYear(date);
      return addLeadingZeros(isoWeekYear, token.length);
    },
    // Extended year. This is a single number designating the year of this calendar system.
    // The main difference between `y` and `u` localizers are B.C. years:
    // | Year | `y` | `u` |
    // |------|-----|-----|
    // | AC 1 |   1 |   1 |
    // | BC 1 |   1 |   0 |
    // | BC 2 |   2 |  -1 |
    // Also `yy` always returns the last two digits of a year,
    // while `uu` pads single digit years to 2 characters and returns other years unchanged.
    u: function(date, token) {
      const year = date.getFullYear();
      return addLeadingZeros(year, token.length);
    },
    // Quarter
    Q: function(date, token, localize2) {
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      switch (token) {
        // 1, 2, 3, 4
        case "Q":
          return String(quarter);
        // 01, 02, 03, 04
        case "QQ":
          return addLeadingZeros(quarter, 2);
        // 1st, 2nd, 3rd, 4th
        case "Qo":
          return localize2.ordinalNumber(quarter, { unit: "quarter" });
        // Q1, Q2, Q3, Q4
        case "QQQ":
          return localize2.quarter(quarter, {
            width: "abbreviated",
            context: "formatting"
          });
        // 1, 2, 3, 4 (narrow quarter; could be not numerical)
        case "QQQQQ":
          return localize2.quarter(quarter, {
            width: "narrow",
            context: "formatting"
          });
        // 1st quarter, 2nd quarter, ...
        case "QQQQ":
        default:
          return localize2.quarter(quarter, {
            width: "wide",
            context: "formatting"
          });
      }
    },
    // Stand-alone quarter
    q: function(date, token, localize2) {
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      switch (token) {
        // 1, 2, 3, 4
        case "q":
          return String(quarter);
        // 01, 02, 03, 04
        case "qq":
          return addLeadingZeros(quarter, 2);
        // 1st, 2nd, 3rd, 4th
        case "qo":
          return localize2.ordinalNumber(quarter, { unit: "quarter" });
        // Q1, Q2, Q3, Q4
        case "qqq":
          return localize2.quarter(quarter, {
            width: "abbreviated",
            context: "standalone"
          });
        // 1, 2, 3, 4 (narrow quarter; could be not numerical)
        case "qqqqq":
          return localize2.quarter(quarter, {
            width: "narrow",
            context: "standalone"
          });
        // 1st quarter, 2nd quarter, ...
        case "qqqq":
        default:
          return localize2.quarter(quarter, {
            width: "wide",
            context: "standalone"
          });
      }
    },
    // Month
    M: function(date, token, localize2) {
      const month = date.getMonth();
      switch (token) {
        case "M":
        case "MM":
          return lightFormatters.M(date, token);
        // 1st, 2nd, ..., 12th
        case "Mo":
          return localize2.ordinalNumber(month + 1, { unit: "month" });
        // Jan, Feb, ..., Dec
        case "MMM":
          return localize2.month(month, {
            width: "abbreviated",
            context: "formatting"
          });
        // J, F, ..., D
        case "MMMMM":
          return localize2.month(month, {
            width: "narrow",
            context: "formatting"
          });
        // January, February, ..., December
        case "MMMM":
        default:
          return localize2.month(month, { width: "wide", context: "formatting" });
      }
    },
    // Stand-alone month
    L: function(date, token, localize2) {
      const month = date.getMonth();
      switch (token) {
        // 1, 2, ..., 12
        case "L":
          return String(month + 1);
        // 01, 02, ..., 12
        case "LL":
          return addLeadingZeros(month + 1, 2);
        // 1st, 2nd, ..., 12th
        case "Lo":
          return localize2.ordinalNumber(month + 1, { unit: "month" });
        // Jan, Feb, ..., Dec
        case "LLL":
          return localize2.month(month, {
            width: "abbreviated",
            context: "standalone"
          });
        // J, F, ..., D
        case "LLLLL":
          return localize2.month(month, {
            width: "narrow",
            context: "standalone"
          });
        // January, February, ..., December
        case "LLLL":
        default:
          return localize2.month(month, { width: "wide", context: "standalone" });
      }
    },
    // Local week of year
    w: function(date, token, localize2, options) {
      const week = getWeek(date, options);
      if (token === "wo") {
        return localize2.ordinalNumber(week, { unit: "week" });
      }
      return addLeadingZeros(week, token.length);
    },
    // ISO week of year
    I: function(date, token, localize2) {
      const isoWeek = getISOWeek(date);
      if (token === "Io") {
        return localize2.ordinalNumber(isoWeek, { unit: "week" });
      }
      return addLeadingZeros(isoWeek, token.length);
    },
    // Day of the month
    d: function(date, token, localize2) {
      if (token === "do") {
        return localize2.ordinalNumber(date.getDate(), { unit: "date" });
      }
      return lightFormatters.d(date, token);
    },
    // Day of year
    D: function(date, token, localize2) {
      const dayOfYear = getDayOfYear(date);
      if (token === "Do") {
        return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
      }
      return addLeadingZeros(dayOfYear, token.length);
    },
    // Day of week
    E: function(date, token, localize2) {
      const dayOfWeek = date.getDay();
      switch (token) {
        // Tue
        case "E":
        case "EE":
        case "EEE":
          return localize2.day(dayOfWeek, {
            width: "abbreviated",
            context: "formatting"
          });
        // T
        case "EEEEE":
          return localize2.day(dayOfWeek, {
            width: "narrow",
            context: "formatting"
          });
        // Tu
        case "EEEEEE":
          return localize2.day(dayOfWeek, {
            width: "short",
            context: "formatting"
          });
        // Tuesday
        case "EEEE":
        default:
          return localize2.day(dayOfWeek, {
            width: "wide",
            context: "formatting"
          });
      }
    },
    // Local day of week
    e: function(date, token, localize2, options) {
      const dayOfWeek = date.getDay();
      const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
      switch (token) {
        // Numerical value (Nth day of week with current locale or weekStartsOn)
        case "e":
          return String(localDayOfWeek);
        // Padded numerical value
        case "ee":
          return addLeadingZeros(localDayOfWeek, 2);
        // 1st, 2nd, ..., 7th
        case "eo":
          return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
        case "eee":
          return localize2.day(dayOfWeek, {
            width: "abbreviated",
            context: "formatting"
          });
        // T
        case "eeeee":
          return localize2.day(dayOfWeek, {
            width: "narrow",
            context: "formatting"
          });
        // Tu
        case "eeeeee":
          return localize2.day(dayOfWeek, {
            width: "short",
            context: "formatting"
          });
        // Tuesday
        case "eeee":
        default:
          return localize2.day(dayOfWeek, {
            width: "wide",
            context: "formatting"
          });
      }
    },
    // Stand-alone local day of week
    c: function(date, token, localize2, options) {
      const dayOfWeek = date.getDay();
      const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
      switch (token) {
        // Numerical value (same as in `e`)
        case "c":
          return String(localDayOfWeek);
        // Padded numerical value
        case "cc":
          return addLeadingZeros(localDayOfWeek, token.length);
        // 1st, 2nd, ..., 7th
        case "co":
          return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
        case "ccc":
          return localize2.day(dayOfWeek, {
            width: "abbreviated",
            context: "standalone"
          });
        // T
        case "ccccc":
          return localize2.day(dayOfWeek, {
            width: "narrow",
            context: "standalone"
          });
        // Tu
        case "cccccc":
          return localize2.day(dayOfWeek, {
            width: "short",
            context: "standalone"
          });
        // Tuesday
        case "cccc":
        default:
          return localize2.day(dayOfWeek, {
            width: "wide",
            context: "standalone"
          });
      }
    },
    // ISO day of week
    i: function(date, token, localize2) {
      const dayOfWeek = date.getDay();
      const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      switch (token) {
        // 2
        case "i":
          return String(isoDayOfWeek);
        // 02
        case "ii":
          return addLeadingZeros(isoDayOfWeek, token.length);
        // 2nd
        case "io":
          return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
        // Tue
        case "iii":
          return localize2.day(dayOfWeek, {
            width: "abbreviated",
            context: "formatting"
          });
        // T
        case "iiiii":
          return localize2.day(dayOfWeek, {
            width: "narrow",
            context: "formatting"
          });
        // Tu
        case "iiiiii":
          return localize2.day(dayOfWeek, {
            width: "short",
            context: "formatting"
          });
        // Tuesday
        case "iiii":
        default:
          return localize2.day(dayOfWeek, {
            width: "wide",
            context: "formatting"
          });
      }
    },
    // AM or PM
    a: function(date, token, localize2) {
      const hours = date.getHours();
      const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
      switch (token) {
        case "a":
        case "aa":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting"
          });
        case "aaa":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting"
          }).toLowerCase();
        case "aaaaa":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "narrow",
            context: "formatting"
          });
        case "aaaa":
        default:
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "wide",
            context: "formatting"
          });
      }
    },
    // AM, PM, midnight, noon
    b: function(date, token, localize2) {
      const hours = date.getHours();
      let dayPeriodEnumValue;
      if (hours === 12) {
        dayPeriodEnumValue = dayPeriodEnum.noon;
      } else if (hours === 0) {
        dayPeriodEnumValue = dayPeriodEnum.midnight;
      } else {
        dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
      }
      switch (token) {
        case "b":
        case "bb":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting"
          });
        case "bbb":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting"
          }).toLowerCase();
        case "bbbbb":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "narrow",
            context: "formatting"
          });
        case "bbbb":
        default:
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "wide",
            context: "formatting"
          });
      }
    },
    // in the morning, in the afternoon, in the evening, at night
    B: function(date, token, localize2) {
      const hours = date.getHours();
      let dayPeriodEnumValue;
      if (hours >= 17) {
        dayPeriodEnumValue = dayPeriodEnum.evening;
      } else if (hours >= 12) {
        dayPeriodEnumValue = dayPeriodEnum.afternoon;
      } else if (hours >= 4) {
        dayPeriodEnumValue = dayPeriodEnum.morning;
      } else {
        dayPeriodEnumValue = dayPeriodEnum.night;
      }
      switch (token) {
        case "B":
        case "BB":
        case "BBB":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting"
          });
        case "BBBBB":
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "narrow",
            context: "formatting"
          });
        case "BBBB":
        default:
          return localize2.dayPeriod(dayPeriodEnumValue, {
            width: "wide",
            context: "formatting"
          });
      }
    },
    // Hour [1-12]
    h: function(date, token, localize2) {
      if (token === "ho") {
        let hours = date.getHours() % 12;
        if (hours === 0) hours = 12;
        return localize2.ordinalNumber(hours, { unit: "hour" });
      }
      return lightFormatters.h(date, token);
    },
    // Hour [0-23]
    H: function(date, token, localize2) {
      if (token === "Ho") {
        return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
      }
      return lightFormatters.H(date, token);
    },
    // Hour [0-11]
    K: function(date, token, localize2) {
      const hours = date.getHours() % 12;
      if (token === "Ko") {
        return localize2.ordinalNumber(hours, { unit: "hour" });
      }
      return addLeadingZeros(hours, token.length);
    },
    // Hour [1-24]
    k: function(date, token, localize2) {
      let hours = date.getHours();
      if (hours === 0) hours = 24;
      if (token === "ko") {
        return localize2.ordinalNumber(hours, { unit: "hour" });
      }
      return addLeadingZeros(hours, token.length);
    },
    // Minute
    m: function(date, token, localize2) {
      if (token === "mo") {
        return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
      }
      return lightFormatters.m(date, token);
    },
    // Second
    s: function(date, token, localize2) {
      if (token === "so") {
        return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
      }
      return lightFormatters.s(date, token);
    },
    // Fraction of second
    S: function(date, token) {
      return lightFormatters.S(date, token);
    },
    // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
    X: function(date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();
      if (timezoneOffset === 0) {
        return "Z";
      }
      switch (token) {
        // Hours and optional minutes
        case "X":
          return formatTimezoneWithOptionalMinutes(timezoneOffset);
        // Hours, minutes and optional seconds without `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `XX`
        case "XXXX":
        case "XX":
          return formatTimezone(timezoneOffset);
        // Hours, minutes and optional seconds with `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `XXX`
        case "XXXXX":
        case "XXX":
        // Hours and minutes with `:` delimiter
        default:
          return formatTimezone(timezoneOffset, ":");
      }
    },
    // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
    x: function(date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();
      switch (token) {
        // Hours and optional minutes
        case "x":
          return formatTimezoneWithOptionalMinutes(timezoneOffset);
        // Hours, minutes and optional seconds without `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `xx`
        case "xxxx":
        case "xx":
          return formatTimezone(timezoneOffset);
        // Hours, minutes and optional seconds with `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `xxx`
        case "xxxxx":
        case "xxx":
        // Hours and minutes with `:` delimiter
        default:
          return formatTimezone(timezoneOffset, ":");
      }
    },
    // Timezone (GMT)
    O: function(date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();
      switch (token) {
        // Short
        case "O":
        case "OO":
        case "OOO":
          return "GMT" + formatTimezoneShort(timezoneOffset, ":");
        // Long
        case "OOOO":
        default:
          return "GMT" + formatTimezone(timezoneOffset, ":");
      }
    },
    // Timezone (specific non-location)
    z: function(date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();
      switch (token) {
        // Short
        case "z":
        case "zz":
        case "zzz":
          return "GMT" + formatTimezoneShort(timezoneOffset, ":");
        // Long
        case "zzzz":
        default:
          return "GMT" + formatTimezone(timezoneOffset, ":");
      }
    },
    // Seconds timestamp
    t: function(date, token, _localize) {
      const timestamp = Math.trunc(+date / 1e3);
      return addLeadingZeros(timestamp, token.length);
    },
    // Milliseconds timestamp
    T: function(date, token, _localize) {
      return addLeadingZeros(+date, token.length);
    }
  };
  function formatTimezoneShort(offset, delimiter = "") {
    const sign = offset > 0 ? "-" : "+";
    const absOffset = Math.abs(offset);
    const hours = Math.trunc(absOffset / 60);
    const minutes = absOffset % 60;
    if (minutes === 0) {
      return sign + String(hours);
    }
    return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
  }
  function formatTimezoneWithOptionalMinutes(offset, delimiter) {
    if (offset % 60 === 0) {
      const sign = offset > 0 ? "-" : "+";
      return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
    }
    return formatTimezone(offset, delimiter);
  }
  function formatTimezone(offset, delimiter = "") {
    const sign = offset > 0 ? "-" : "+";
    const absOffset = Math.abs(offset);
    const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
    const minutes = addLeadingZeros(absOffset % 60, 2);
    return sign + hours + delimiter + minutes;
  }
  const dateLongFormatter = (pattern, formatLong2) => {
    switch (pattern) {
      case "P":
        return formatLong2.date({ width: "short" });
      case "PP":
        return formatLong2.date({ width: "medium" });
      case "PPP":
        return formatLong2.date({ width: "long" });
      case "PPPP":
      default:
        return formatLong2.date({ width: "full" });
    }
  };
  const timeLongFormatter = (pattern, formatLong2) => {
    switch (pattern) {
      case "p":
        return formatLong2.time({ width: "short" });
      case "pp":
        return formatLong2.time({ width: "medium" });
      case "ppp":
        return formatLong2.time({ width: "long" });
      case "pppp":
      default:
        return formatLong2.time({ width: "full" });
    }
  };
  const dateTimeLongFormatter = (pattern, formatLong2) => {
    const matchResult = pattern.match(/(P+)(p+)?/) || [];
    const datePattern = matchResult[1];
    const timePattern = matchResult[2];
    if (!timePattern) {
      return dateLongFormatter(pattern, formatLong2);
    }
    let dateTimeFormat;
    switch (datePattern) {
      case "P":
        dateTimeFormat = formatLong2.dateTime({ width: "short" });
        break;
      case "PP":
        dateTimeFormat = formatLong2.dateTime({ width: "medium" });
        break;
      case "PPP":
        dateTimeFormat = formatLong2.dateTime({ width: "long" });
        break;
      case "PPPP":
      default:
        dateTimeFormat = formatLong2.dateTime({ width: "full" });
        break;
    }
    return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
  };
  const longFormatters = {
    p: timeLongFormatter,
    P: dateTimeLongFormatter
  };
  const dayOfYearTokenRE = /^D+$/;
  const weekYearTokenRE = /^Y+$/;
  const throwTokens = ["D", "DD", "YY", "YYYY"];
  function isProtectedDayOfYearToken(token) {
    return dayOfYearTokenRE.test(token);
  }
  function isProtectedWeekYearToken(token) {
    return weekYearTokenRE.test(token);
  }
  function warnOrThrowProtectedError(token, format2, input) {
    const _message = message(token, format2, input);
    console.warn(_message);
    if (throwTokens.includes(token)) throw new RangeError(_message);
  }
  function message(token, format2, input) {
    const subject = token[0] === "Y" ? "years" : "days of the month";
    return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
  }
  const formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
  const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
  const escapedStringRegExp = /^'([^]*?)'?$/;
  const doubleQuoteRegExp = /''/g;
  const unescapedLatinCharacterRegExp = /[a-zA-Z]/;
  function format(date, formatStr, options) {
    const defaultOptions2 = getDefaultOptions();
    const locale = defaultOptions2.locale ?? enUS;
    const firstWeekContainsDate = defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
    const weekStartsOn = defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
    const originalDate = toDate(date, options?.in);
    if (!isValid(originalDate)) {
      throw new RangeError("Invalid time value");
    }
    let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
      const firstCharacter = substring[0];
      if (firstCharacter === "p" || firstCharacter === "P") {
        const longFormatter = longFormatters[firstCharacter];
        return longFormatter(substring, locale.formatLong);
      }
      return substring;
    }).join("").match(formattingTokensRegExp).map((substring) => {
      if (substring === "''") {
        return { isToken: false, value: "'" };
      }
      const firstCharacter = substring[0];
      if (firstCharacter === "'") {
        return { isToken: false, value: cleanEscapedString(substring) };
      }
      if (formatters[firstCharacter]) {
        return { isToken: true, value: substring };
      }
      if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
        );
      }
      return { isToken: false, value: substring };
    });
    if (locale.localize.preprocessor) {
      parts = locale.localize.preprocessor(originalDate, parts);
    }
    const formatterOptions = {
      firstWeekContainsDate,
      weekStartsOn,
      locale
    };
    return parts.map((part) => {
      if (!part.isToken) return part.value;
      const token = part.value;
      if (isProtectedWeekYearToken(token) || isProtectedDayOfYearToken(token)) {
        warnOrThrowProtectedError(token, formatStr, String(date));
      }
      const formatter = formatters[token[0]];
      return formatter(originalDate, token, locale.localize, formatterOptions);
    }).join("");
  }
  function cleanEscapedString(input) {
    const matched = input.match(escapedStringRegExp);
    if (!matched) {
      return input;
    }
    return matched[1].replace(doubleQuoteRegExp, "'");
  }
  function isSameMonth(laterDate, earlierDate, options) {
    const [laterDate_, earlierDate_] = normalizeDates(
      options?.in,
      laterDate,
      earlierDate
    );
    return laterDate_.getFullYear() === earlierDate_.getFullYear() && laterDate_.getMonth() === earlierDate_.getMonth();
  }
  function parseISO(argument, options) {
    const invalidDate = () => constructFrom(options?.in, NaN);
    const additionalDigits = 2;
    const dateStrings = splitDateString(argument);
    let date;
    if (dateStrings.date) {
      const parseYearResult = parseYear(dateStrings.date, additionalDigits);
      date = parseDate(parseYearResult.restDateString, parseYearResult.year);
    }
    if (!date || isNaN(+date)) return invalidDate();
    const timestamp = +date;
    let time = 0;
    let offset;
    if (dateStrings.time) {
      time = parseTime(dateStrings.time);
      if (isNaN(time)) return invalidDate();
    }
    if (dateStrings.timezone) {
      offset = parseTimezone(dateStrings.timezone);
      if (isNaN(offset)) return invalidDate();
    } else {
      const tmpDate = new Date(timestamp + time);
      const result = toDate(0, options?.in);
      result.setFullYear(
        tmpDate.getUTCFullYear(),
        tmpDate.getUTCMonth(),
        tmpDate.getUTCDate()
      );
      result.setHours(
        tmpDate.getUTCHours(),
        tmpDate.getUTCMinutes(),
        tmpDate.getUTCSeconds(),
        tmpDate.getUTCMilliseconds()
      );
      return result;
    }
    return toDate(timestamp + time + offset, options?.in);
  }
  const patterns = {
    dateTimeDelimiter: /[T ]/,
    timeZoneDelimiter: /[Z ]/i,
    timezone: /([Z+-].*)$/
  };
  const dateRegex = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;
  const timeRegex = /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;
  const timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/;
  function splitDateString(dateString) {
    const dateStrings = {};
    const array = dateString.split(patterns.dateTimeDelimiter);
    let timeString;
    if (array.length > 2) {
      return dateStrings;
    }
    if (/:/.test(array[0])) {
      timeString = array[0];
    } else {
      dateStrings.date = array[0];
      timeString = array[1];
      if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
        dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0];
        timeString = dateString.substr(
          dateStrings.date.length,
          dateString.length
        );
      }
    }
    if (timeString) {
      const token = patterns.timezone.exec(timeString);
      if (token) {
        dateStrings.time = timeString.replace(token[1], "");
        dateStrings.timezone = token[1];
      } else {
        dateStrings.time = timeString;
      }
    }
    return dateStrings;
  }
  function parseYear(dateString, additionalDigits) {
    const regex = new RegExp(
      "^(?:(\\d{4}|[+-]\\d{" + (4 + additionalDigits) + "})|(\\d{2}|[+-]\\d{" + (2 + additionalDigits) + "})$)"
    );
    const captures = dateString.match(regex);
    if (!captures) return { year: NaN, restDateString: "" };
    const year = captures[1] ? parseInt(captures[1]) : null;
    const century = captures[2] ? parseInt(captures[2]) : null;
    return {
      year: century === null ? year : century * 100,
      restDateString: dateString.slice((captures[1] || captures[2]).length)
    };
  }
  function parseDate(dateString, year) {
    if (year === null) return /* @__PURE__ */ new Date(NaN);
    const captures = dateString.match(dateRegex);
    if (!captures) return /* @__PURE__ */ new Date(NaN);
    const isWeekDate = !!captures[4];
    const dayOfYear = parseDateUnit(captures[1]);
    const month = parseDateUnit(captures[2]) - 1;
    const day = parseDateUnit(captures[3]);
    const week = parseDateUnit(captures[4]);
    const dayOfWeek = parseDateUnit(captures[5]) - 1;
    if (isWeekDate) {
      if (!validateWeekDate(year, week, dayOfWeek)) {
        return /* @__PURE__ */ new Date(NaN);
      }
      return dayOfISOWeekYear(year, week, dayOfWeek);
    } else {
      const date = /* @__PURE__ */ new Date(0);
      if (!validateDate(year, month, day) || !validateDayOfYearDate(year, dayOfYear)) {
        return /* @__PURE__ */ new Date(NaN);
      }
      date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
      return date;
    }
  }
  function parseDateUnit(value) {
    return value ? parseInt(value) : 1;
  }
  function parseTime(timeString) {
    const captures = timeString.match(timeRegex);
    if (!captures) return NaN;
    const hours = parseTimeUnit(captures[1]);
    const minutes = parseTimeUnit(captures[2]);
    const seconds = parseTimeUnit(captures[3]);
    if (!validateTime(hours, minutes, seconds)) {
      return NaN;
    }
    return hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * 1e3;
  }
  function parseTimeUnit(value) {
    return value && parseFloat(value.replace(",", ".")) || 0;
  }
  function parseTimezone(timezoneString) {
    if (timezoneString === "Z") return 0;
    const captures = timezoneString.match(timezoneRegex);
    if (!captures) return 0;
    const sign = captures[1] === "+" ? -1 : 1;
    const hours = parseInt(captures[2]);
    const minutes = captures[3] && parseInt(captures[3]) || 0;
    if (!validateTimezone(hours, minutes)) {
      return NaN;
    }
    return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute);
  }
  function dayOfISOWeekYear(isoWeekYear, week, day) {
    const date = /* @__PURE__ */ new Date(0);
    date.setUTCFullYear(isoWeekYear, 0, 4);
    const fourthOfJanuaryDay = date.getUTCDay() || 7;
    const diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay;
    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  }
  const daysInMonths = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function isLeapYearIndex(year) {
    return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
  }
  function validateDate(year, month, date) {
    return month >= 0 && month <= 11 && date >= 1 && date <= (daysInMonths[month] || (isLeapYearIndex(year) ? 29 : 28));
  }
  function validateDayOfYearDate(year, dayOfYear) {
    return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex(year) ? 366 : 365);
  }
  function validateWeekDate(_year, week, day) {
    return week >= 1 && week <= 53 && day >= 0 && day <= 6;
  }
  function validateTime(hours, minutes, seconds) {
    if (hours === 24) {
      return minutes === 0 && seconds === 0;
    }
    return seconds >= 0 && seconds < 60 && minutes >= 0 && minutes < 60 && hours >= 0 && hours < 25;
  }
  function validateTimezone(_hours, minutes) {
    return minutes >= 0 && minutes <= 59;
  }
  function subMonths(date, amount, options) {
    return addMonths(date, -amount, options);
  }
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  const useAppStore = window.useAppStore;
  const GCAL_COLOR = "#4285f4";
  const gcalSupported = () => typeof window !== "undefined" && window.api && typeof window.api.gcalListEvents === "function";
  const GCAL_TEXT = {
    en: { setup: "Google Calendar: set up in Settings > Integrations", reconnect: "Google Calendar: reconnect in Settings > Integrations", title: "Google Calendar (read-only)", allDay: "All day" },
    tr: { setup: "Google Takvim: Ayarlar > Entegrasyonlar bölümünden kurun", reconnect: "Google Takvim: Ayarlar > Entegrasyonlar bölümünden yeniden bağlanın", title: "Google Takvim (salt okunur)", allDay: "Tüm gün" }
  };
  const gcalDayKey = (d) => format(d, "yyyy-MM-dd");
  const gcalEventsOnDay = (events, day) => {
    const key = gcalDayKey(day);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return events.filter((ev) => {
      if (!ev || !ev.start) return false;
      if (ev.allDay) {
        const s2 = String(ev.start).slice(0, 10);
        const e2 = String(ev.end || ev.start).slice(0, 10);
        return s2 <= key && key <= (e2 < s2 ? s2 : e2);
      }
      const s = new Date(ev.start);
      const e = new Date(ev.end || ev.start);
      if (isNaN(s.getTime())) return false;
      if (isNaN(e.getTime()) || e <= s) return s >= dayStart && s < dayEnd;
      return s < dayEnd && e > dayStart;
    });
  };
  const T_SHELL = "var(--kb-bg-shell, var(--theme-bg-dark, #161922))";
  const T_SURFACE = "var(--kb-bg-surface, var(--theme-surface, #1e222c))";
  const T_TILE = "var(--kb-bg-tile, var(--theme-surface, #242833))";
  const T_INSET = "var(--kb-bg-inset, rgba(0,0,0,.28))";
  const T_CONTAINER = "var(--kb-bg-container, var(--theme-accent-glow, rgba(255,255,255,.1)))";
  const T_ON_CONTAINER = "var(--kb-on-container, #fff)";
  const T_ACCENT = "var(--kb-accent, var(--theme-primary, #7c9cff))";
  const T_ON_ACCENT = "var(--kb-on-accent, #fff)";
  const T_FG1 = "var(--kb-fg-1, #fff)";
  const T_FG2 = "var(--kb-fg-2, #aab)";
  const T_FG3 = "var(--kb-fg-3, #778)";
  const T_DISPLAY = "var(--kb-font-display, inherit)";
  const ICON_CSS = `
.kocal-panel .material-symbols-outlined { font-family: 'Material Symbols Rounded', 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0, 'wght' 400; }
.kocal-panel .kocal-fill { font-variation-settings: 'FILL' 1, 'wght' 400; }
.kocal-panel button { cursor: pointer; }
.kocal-panel .kocal-cell:focus-visible, .kocal-panel button:focus-visible { outline: 2px solid var(--kb-accent, #7c9cff); outline-offset: 2px; }
`;
  const iconBtn = { width: 36, height: 36, borderRadius: 18, border: 0, background: T_INSET, color: T_FG1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
  const pillFilled = { height: 40, padding: "0 20px", borderRadius: 20, border: 0, background: T_ACCENT, color: T_ON_ACCENT, fontWeight: 600, fontSize: 14 };
  const inputStyle = { width: "100%", background: T_INSET, border: 0, borderRadius: 16, padding: "10px 14px", color: T_FG1, fontSize: 13, outline: "none" };
  const BAR_ID = "ko-calender-plugin-btn";
  const CAL_TEXT = {
    en: { name: "Calendar", one: "{n} event today", other: "{n} events today" },
    tr: { name: "Takvim", one: "bugün {n} etkinlik", other: "bugün {n} etkinlik" },
    de: { name: "Kalender", one: "heute {n} Termin", other: "heute {n} Termine" },
    es: { name: "Calendario", one: "hoy {n} evento", other: "hoy {n} eventos" },
    fr: { name: "Calendrier", one: "{n} événement aujourd’hui", other: "{n} événements aujourd’hui" },
    ru: { name: "Календарь", one: "сегодня {n} событие", few: "сегодня {n} события", many: "сегодня {n} событий", other: "сегодня {n} события" },
    ar: { name: "التقويم", one: "حدث واحد اليوم", two: "حدثان اليوم", few: "{n} أحداث اليوم", many: "{n} حدثًا اليوم", other: "{n} حدث اليوم" },
    zh: { name: "日历", one: "今天有 {n} 个活动", other: "今天有 {n} 个活动" },
    ja: { name: "カレンダー", one: "今日は {n} 件の予定", other: "今日は {n} 件の予定" },
    hi: { name: "कैलेंडर", one: "आज {n} इवेंट", other: "आज {n} इवेंट" }
  };
  const barLang = () => {
    const l = window.useAppStore && window.useAppStore.getState().language || "en";
    return CAL_TEXT[l] ? l : "en";
  };
  const stripDot = (v) => String(v).replace(/\.+$/, "");
  const countTodayEvents = () => {
    try {
      const list = JSON.parse(localStorage.getItem("kobar_plugin_events") || "[]");
      if (!Array.isArray(list)) return 0;
      const now = /* @__PURE__ */ new Date();
      return list.filter((ev) => ev && ev.startTime && isSameDay(parseISO(ev.startTime), now)).length;
    } catch {
      return 0;
    }
  };
  let barVisible = true;
  let midnightTimer = null;
  const pushBarState = () => {
    const ext = window.KoBarExtensions;
    if (!ext || typeof ext.setBarItemState !== "function" || !barVisible) return;
    try {
      const lang = barLang();
      const tx = CAL_TEXT[lang];
      const now = /* @__PURE__ */ new Date();
      const n = countTodayEvents();
      const fmt = (opts) => new Intl.DateTimeFormat(lang, opts).format(now);
      let label = tx.name + " — " + fmt({ weekday: "long", day: "numeric", month: "long" });
      if (n > 0) {
        const cat = new Intl.PluralRules(lang).select(n);
        label += ", " + (tx[cat] || tx.other).replace("{n}", String(n));
      }
      ext.setBarItemState(BAR_ID, {
        label,
        caption: stripDot(fmt({ weekday: "short" })),
        value: String(now.getDate()),
        sub: stripDot(fmt({ month: "short" })),
        badge: n > 0 ? n : void 0
      });
    } catch {
    }
  };
  const scheduleMidnight = () => {
    if (midnightTimer) clearTimeout(midnightTimer);
    const next = /* @__PURE__ */ new Date();
    next.setHours(24, 0, 1, 0);
    midnightTimer = setTimeout(() => {
      pushBarState();
      scheduleMidnight();
    }, Math.max(1e3, next.getTime() - Date.now()));
  };
  scheduleMidnight();
  pushBarState();
  try {
    if (window.useAppStore) {
      window.useAppStore.subscribe((state, prev) => {
        if (state.language !== prev.language) pushBarState();
      });
    }
    if (typeof window.KoBarExtensions?.onBarItemChange === "function") {
      window.KoBarExtensions.onBarItemChange(BAR_ID, (info) => {
        const visible = !info || info.visible !== false;
        barVisible = visible;
        if (visible) {
          pushBarState();
          scheduleMidnight();
        } else if (midnightTimer) {
          clearTimeout(midnightTimer);
          midnightTimer = null;
        }
      });
    }
  } catch {
  }
  const KoCalendarPluginPanel = (props) => {
    const { onClose, anchorRect } = props;
    const edgePosition = useAppStore((state) => state.edgePosition);
    useAppStore((state) => state.design);
    useAppStore((state) => state.glassOpacity);
    const screenBounds = useAppStore((state) => state.screenBounds);
    const isSmartPositioning = useAppStore((state) => state.isPopupSmartPositioning);
    useAppStore((state) => state.isMac);
    const todos = (() => {
      try {
        return JSON.parse(localStorage.getItem("kobar_plugin_todos") || "[]");
      } catch {
        return [];
      }
    })();
    const [localEvents, setLocalEventsState] = useState(() => {
      try {
        const saved = localStorage.getItem("kobar_plugin_events");
        if (saved) return JSON.parse(saved);
      } catch (e) {
      }
      return [];
    });
    const [koCalendarColor, setKoCalendarColorState] = useState(() => {
      try {
        const saved = localStorage.getItem("kobar_plugin_calendar_color");
        if (saved) return saved;
      } catch (e) {
      }
      return "#60a5fa";
    });
    useEffect(() => {
      localStorage.setItem("kobar_plugin_events", JSON.stringify(localEvents));
      pushBarState();
    }, [localEvents]);
    useEffect(() => {
      const onKey = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);
    useEffect(() => {
      localStorage.setItem("kobar_plugin_calendar_color", koCalendarColor);
    }, [koCalendarColor]);
    const addCalendarEvent = (event) => {
      setLocalEventsState((prev) => [...prev, { ...event, id: Date.now().toString() + "-" + Math.floor(Math.random() * 1e3), colorId: event.colorId || koCalendarColor }]);
    };
    const updateCalendarEvent = (id, updatedEvent) => {
      setLocalEventsState((prev) => prev.map((e) => e.id === id ? { ...e, ...updatedEvent } : e));
    };
    const deleteCalendarEvent = (id) => {
      setLocalEventsState((prev) => prev.filter((e) => e.id !== id));
    };
    const setKoCalendarColor = (color) => {
      setKoCalendarColorState(color);
    };
    const t = useAppStore((state) => state.t) || ((k) => k);
    const language = useAppStore((state) => state.language);
    const gt = GCAL_TEXT[language] || GCAL_TEXT.en;
    const [currentDate, setCurrentDate] = useState(/* @__PURE__ */ new Date());
    const [gcalState, setGcalState] = useState(null);
    const [gcalEvents, setGcalEvents] = useState([]);
    const gcalMonthKey = format(currentDate, "yyyy-MM");
    useEffect(() => {
      if (!gcalSupported()) return void 0;
      let cancelled = false;
      const refresh = async () => {
        try {
          const st = await window.api.gcalStatus?.();
          if (cancelled) return;
          setGcalState(st || null);
          if (!st || st.state !== "connected" || !st.enabled) {
            setGcalEvents([]);
            return;
          }
          const base = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const from = startOfMonth(subMonths(base, 1));
          const to = endOfMonth(addMonths(base, 1));
          const list = await window.api.gcalListEvents({ from: from.toISOString(), to: to.toISOString() });
          if (!cancelled) setGcalEvents(Array.isArray(list) ? list : []);
        } catch {
          if (!cancelled) setGcalEvents([]);
        }
      };
      refresh();
      const timer = setInterval(() => {
        if (document.visibilityState !== "hidden") refresh();
      }, 15 * 60 * 1e3);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }, [gcalMonthKey]);
    const gcalActive = !!(gcalState && gcalState.state === "connected" && gcalState.enabled);
    const gcalNeedsSetup = !!(gcalSupported() && gcalState && (gcalState.state === "not-connected" || gcalState.state === "reconnect-needed"));
    const openGcalSettings = () => {
      try {
        window.api?.openSettings?.("integrations");
      } catch {
      }
    };
    const [selectedDate, setSelectedDate] = useState(/* @__PURE__ */ new Date());
    const [editingEventDate, setEditingEventDate] = useState(null);
    const [editingEventId, setEditingEventId] = useState(null);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventDescription, setNewEventDescription] = useState("");
    const [newEventMeetingLink, setNewEventMeetingLink] = useState("");
    const [newEventHours, setNewEventHours] = useState("12");
    const [newEventMinutes, setNewEventMinutes] = useState("00");
    const [newEventNotification, setNewEventNotification] = useState(true);
    const [newEventColor, setNewEventColor] = useState(koCalendarColor);
    const [pendingHolidays, setPendingHolidays] = useState(null);
    const [importColor, setImportColor] = useState(koCalendarColor);
    const [isPickerMode, setIsPickerMode] = useState(false);
    const sidebarPosition = useAppStore((state) => state.sidebarPosition);
    const orientation = useAppStore((state) => state.orientation);
    const getPopupStyle = () => {
      if (!anchorRect) return { display: "none" };
      const popupHeight = 680;
      const popupWidth = 480;
      const screenHeight = screenBounds?.height ?? 800;
      const screenWidth = screenBounds?.width ?? 1200;
      const offsetTop = sidebarPosition ? sidebarPosition.y : 0;
      const offsetLeft = sidebarPosition ? sidebarPosition.x : 0;
      const style = {
        position: "absolute",
        width: popupWidth,
        zIndex: 99999,
        backgroundColor: T_SHELL,
        border: "1px solid var(--kb-stroke-subtle, var(--theme-border))",
        borderRadius: 32,
        boxShadow: "var(--kb-shadow-e3, 0 12px 32px rgba(0,0,0,.45))",
        color: T_FG1,
        willChange: "transform, opacity",
        transitionProperty: "opacity, transform, filter"
      };
      const screenXInViewport = (screenBounds?.x ?? 0) - window.screenX;
      const screenYInViewport = (screenBounds?.y ?? 0) - window.screenY;
      if (orientation === "horizontal") {
        let adjustedLeft = anchorRect.left - offsetLeft + anchorRect.width / 2 - popupWidth / 2;
        const maxLeft = screenXInViewport + (screenWidth - offsetLeft) - popupWidth - 20;
        const minLeft = screenXInViewport - offsetLeft + 20;
        if (adjustedLeft < minLeft) adjustedLeft = minLeft;
        if (adjustedLeft > maxLeft) adjustedLeft = maxLeft;
        if (!isSmartPositioning) {
          style.left = "50%";
          style.transform = "translateX(-50%)";
        } else {
          style.left = adjustedLeft;
        }
        if (edgePosition === "top") {
          style.top = "100%";
          style.marginTop = "12px";
        } else {
          style.bottom = "100%";
          style.marginBottom = "12px";
        }
      } else {
        let adjustedTop = anchorRect.top - offsetTop - 20 + anchorRect.height / 2 - popupHeight / 2;
        const maxTop = screenYInViewport + (screenHeight - offsetTop) - popupHeight - 20;
        const minTop = screenYInViewport - offsetTop + 20;
        if (adjustedTop < minTop) adjustedTop = minTop;
        if (adjustedTop > maxTop) adjustedTop = maxTop;
        if (!isSmartPositioning) {
          style.top = "50%";
          style.transform = "translateY(-50%)";
        } else {
          style.top = adjustedTop;
        }
        if (edgePosition === "left") {
          style.left = "100%";
          style.marginLeft = "12px";
        } else {
          style.right = "100%";
          style.marginRight = "12px";
        }
      }
      return style;
    };
    const popupRef = useRef(null);
    const fileInputRef = useRef(null);
    const isSmartRef = useRef(isSmartPositioning);
    useEffect(() => {
      isSmartRef.current = isSmartPositioning;
    }, [isSmartPositioning]);
    useEffect(() => {
      const onDrag = (e) => {
        if (!popupRef.current || !anchorRect || !isSmartRef.current) return;
        const newX = e.detail.x;
        const newY = e.detail.y;
        const popupHeight = 680;
        const popupWidth = 480;
        const screenXInViewport = (screenBounds?.x ?? 0) - window.screenX;
        const screenYInViewport = (screenBounds?.y ?? 0) - window.screenY;
        if (orientation === "horizontal") {
          const screenWidth = screenBounds?.width ?? 1200;
          let adjustedLeft = anchorRect.left - newX + anchorRect.width / 2 - popupWidth / 2;
          const maxLeft = screenXInViewport + (screenWidth - newX) - popupWidth - 20;
          const minLeft = screenXInViewport - newX + 20;
          if (adjustedLeft < minLeft) adjustedLeft = minLeft;
          if (adjustedLeft > maxLeft) adjustedLeft = maxLeft;
          popupRef.current.style.left = `${adjustedLeft}px`;
        } else {
          const screenHeight = screenBounds?.height ?? 800;
          let adjustedTop = anchorRect.top - newY - 20 + anchorRect.height / 2 - popupHeight / 2;
          const maxTop = screenYInViewport + (screenHeight - newY) - popupHeight - 20;
          const minTop = screenYInViewport - newY + 20;
          if (adjustedTop < minTop) adjustedTop = minTop;
          if (adjustedTop > maxTop) adjustedTop = maxTop;
          popupRef.current.style.top = `${adjustedTop}px`;
        }
      };
      document.addEventListener("kobar-drag", onDrag);
      return () => document.removeEventListener("kobar-drag", onDrag);
    }, [anchorRect, screenBounds, orientation]);
    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => {
      const today = /* @__PURE__ */ new Date();
      setCurrentDate(today);
      setSelectedDate(today);
    };
    const handleImportHolidays = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result);
          if (json && json.holidays && Array.isArray(json.holidays)) {
            setPendingHolidays(json.holidays);
            setImportColor(koCalendarColor);
          }
        } catch (err) {
          console.error("Failed to parse holidays JSON", err);
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const dayIntervals = Array.from({ length: 42 }).map((_, i) => addDays(startDate, i));
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        ref: popupRef,
        className: "kocal-panel pointer-events-auto overflow-hidden flex flex-col",
        style: { ...getPopupStyle(), padding: 20 }
      },
      /* @__PURE__ */ window.React.createElement("style", null, ICON_CSS),
      /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center drag-region", style: { gap: 12, marginBottom: 16 } }, /* @__PURE__ */ window.React.createElement("div", { style: { width: 44, height: 44, borderRadius: 15, background: T_CONTAINER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined kocal-fill", style: { fontSize: 24, color: T_ACCENT } }, "calendar_month")), /* @__PURE__ */ window.React.createElement("div", { className: "min-w-0 flex-1 no-drag-region", style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ window.React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setIsPickerMode(!isPickerMode),
          className: "flex items-center whitespace-nowrap",
          style: { background: "transparent", border: 0, padding: 0, color: T_FG1, fontSize: 19, fontWeight: 600, fontFamily: T_DISPLAY, textAlign: "start", gap: 2 },
          title: t("jumpToDate") || "Jump to Date",
          "aria-expanded": isPickerMode
        },
        /* @__PURE__ */ window.React.createElement("span", { className: "truncate" }, t(`month_${currentDate.getMonth()}`), " ", currentDate.getFullYear()),
        /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 20, color: T_FG2 } }, isPickerMode ? "arrow_drop_up" : "arrow_drop_down")
      ), /* @__PURE__ */ window.React.createElement("div", { className: "flex", style: { gap: 8 } }, ["#60a5fa", "#f87171", "#4ade80", "#fbbf24", "#a78bfa"].map((color) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: color,
          type: "button",
          "aria-label": color,
          "aria-pressed": koCalendarColor === color,
          onClick: () => setKoCalendarColor(color),
          style: { width: 12, height: 12, borderRadius: 6, border: 0, padding: 0, backgroundColor: color, opacity: koCalendarColor === color ? 1 : 0.45, boxShadow: koCalendarColor === color ? "0 0 0 2px " + T_SHELL + ", 0 0 0 3.5px " + T_FG2 : "none" }
        }
      )))), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center shrink-0 no-drag-region" }, /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: () => onClose(), style: iconBtn, "aria-label": t("close") || "Close" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 20 } }, "close")))),
      /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center no-drag-region", style: { gap: 6, marginBottom: 16 } }, /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: handlePrevMonth, style: iconBtn, "aria-label": "‹" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 22 } }, "chevron_left")), /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: handleNextMonth, style: iconBtn, "aria-label": "›" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 22 } }, "chevron_right")), /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: handleToday, style: { height: 32, padding: "0 14px", borderRadius: 16, border: 0, background: T_CONTAINER, color: T_ON_CONTAINER, fontSize: 13, fontWeight: 600 } }, t("today")), /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: () => fileInputRef.current?.click(), style: iconBtn, title: t("importHolidays") || "Import Holidays", "aria-label": t("importHolidays") || "Import Holidays" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 20 } }, "download")), /* @__PURE__ */ window.React.createElement(
        "input",
        {
          type: "file",
          accept: ".json",
          ref: fileInputRef,
          onChange: handleImportHolidays,
          style: { display: "none" }
        }
      )),
      isPickerMode ? /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-col gap-4 flex-1", style: { background: T_SURFACE, borderRadius: 24, padding: 16 } }, /* @__PURE__ */ window.React.createElement("style", null, `
                        .hide-number-arrows::-webkit-outer-spin-button,
                        .hide-number-arrows::-webkit-inner-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                    `), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center justify-center gap-4" }, /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: () => setCurrentDate(subMonths(currentDate, 12)), style: iconBtn }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[20px]" }, "chevron_left")), /* @__PURE__ */ window.React.createElement(
        "input",
        {
          type: "number",
          value: currentDate.getFullYear(),
          onChange: (e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) {
              const d = new Date(currentDate);
              d.setFullYear(val);
              setCurrentDate(d);
            }
          },
          className: "bg-transparent text-center w-20 outline-none no-drag-region hide-number-arrows",
          style: { WebkitAppearance: "none", margin: 0, fontSize: 22, fontWeight: 600, fontFamily: T_DISPLAY, color: T_FG1, fontVariantNumeric: "tabular-nums" }
        }
      ), /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: () => setCurrentDate(addMonths(currentDate, 12)), style: iconBtn }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[20px]" }, "chevron_right"))), /* @__PURE__ */ window.React.createElement("div", { className: "grid grid-cols-3 gap-2 flex-1 mt-2" }, Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: i,
          onClick: () => {
            const d = new Date(currentDate);
            d.setMonth(i);
            setCurrentDate(d);
            setIsPickerMode(false);
          },
          className: "flex items-center justify-center text-sm h-12",
          style: { borderRadius: 16, border: 0, fontWeight: 600, background: currentDate.getMonth() === i ? T_ACCENT : T_TILE, color: currentDate.getMonth() === i ? T_ON_ACCENT : T_FG1 }
        },
        t(`month_${i}`)
      )))) : /* @__PURE__ */ window.React.createElement(window.React.Fragment, null, /* @__PURE__ */ window.React.createElement("div", { className: "grid grid-cols-7", style: { gap: 4, paddingBottom: 6 } }, [5, 6, 7, 8, 9, 10, 11].map((day, i) => /* @__PURE__ */ window.React.createElement("div", { key: i, className: "text-center text-xs font-semibold", style: { color: T_FG3 } }, new Intl.DateTimeFormat(language || "en", { weekday: "short" }).format(new Date(2026, 0, day))))), /* @__PURE__ */ window.React.createElement("div", { className: "grid grid-cols-7 custom-scrollbar overflow-y-auto", style: { gap: 4, marginBottom: 12 } }, dayIntervals.map((day, i) => {
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, /* @__PURE__ */ new Date());
        const isSelected = isSameDay(day, selectedDate);
        const isWeekend = i % 7 >= 5;
        const dayEvents = localEvents.filter((ev) => ev.startTime && isSameDay(parseISO(ev.startTime), day));
        const dayTodos = todos.filter((t2) => t2.dueDate && isSameDay(parseISO(t2.dueDate), day));
        return /* @__PURE__ */ window.React.createElement(
          "div",
          {
            key: i,
            onClick: () => setSelectedDate(day),
            onDoubleClick: () => {
              setEditingEventDate(day);
              setNewEventColor(koCalendarColor);
            },
            className: "kocal-cell flex flex-col h-[62px] p-1.5 relative cursor-pointer group",
            style: {
              borderRadius: 12,
              background: isWeekend ? T_TILE : T_SURFACE,
              opacity: isCurrentMonth ? 1 : 0.35,
              boxShadow: isSelected ? "inset 0 0 0 2px " + koCalendarColor : editingEventDate && isSameDay(day, editingEventDate) ? "inset 0 0 0 2px " + T_ACCENT : "none",
              overflow: "hidden"
            }
          },
          /* @__PURE__ */ window.React.createElement("div", { className: "flex justify-center items-center", style: { marginBottom: 4 } }, /* @__PURE__ */ window.React.createElement(
            "span",
            {
              className: "flex items-center justify-center",
              style: {
                width: 26,
                height: 26,
                borderRadius: 13,
                fontSize: 13,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                background: isToday ? T_ACCENT : "transparent",
                color: isToday ? T_ON_ACCENT : isCurrentMonth ? T_FG1 : T_FG3
              }
            },
            format(day, "d")
          )),
          /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-wrap justify-center mt-auto", style: { gap: 3 } }, dayEvents.slice(0, 3).map((ev, ei) => /* @__PURE__ */ window.React.createElement("div", { key: ei, style: { width: 6, height: 6, borderRadius: 3, backgroundColor: ev.colorId || koCalendarColor }, title: ev.title })), gcalActive && gcalEventsOnDay(gcalEvents, day).length > 0 && /* @__PURE__ */ window.React.createElement("div", { style: { width: 6, height: 6, borderRadius: 3, backgroundColor: GCAL_COLOR }, title: gt.title }), dayTodos.length > 0 && /* @__PURE__ */ window.React.createElement("div", { style: { width: 6, height: 6, borderRadius: 3, backgroundColor: T_FG3 } }))
        );
      })), pendingHolidays ? /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-col gap-2 flex-1", style: { background: T_SURFACE, borderRadius: 24, padding: 16 } }, /* @__PURE__ */ window.React.createElement("div", { className: "flex justify-between items-center mb-1" }, /* @__PURE__ */ window.React.createElement("span", { className: "text-sm font-semibold", style: { color: T_FG1 } }, t("importHolidays") || "Import Holidays"), /* @__PURE__ */ window.React.createElement("button", { type: "button", onClick: () => setPendingHolidays(null), style: { ...iconBtn, width: 28, height: 28, borderRadius: 14 }, "aria-label": t("close") || "Close" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[16px]" }, "close"))), /* @__PURE__ */ window.React.createElement("div", { className: "text-xs mb-2", style: { color: T_FG2 } }, "Found ", pendingHolidays.length, " holidays. Select a color to associate with them:"), /* @__PURE__ */ window.React.createElement("div", { className: "flex gap-2 w-fit mx-auto mb-2", style: { background: T_INSET, borderRadius: 16, padding: 8 } }, ["#60a5fa", "#f87171", "#4ade80", "#fbbf24", "#a78bfa"].map((color) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: color,
          type: "button",
          onClick: () => setImportColor(color),
          style: { width: 20, height: 20, borderRadius: 10, border: 0, backgroundColor: color, opacity: importColor === color ? 1 : 0.45, boxShadow: importColor === color ? "0 0 0 2px " + T_INSET + ", 0 0 0 3.5px " + T_FG2 : "none" }
        }
      ))), /* @__PURE__ */ window.React.createElement("div", { className: "mt-auto pt-2 flex justify-end" }, /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: () => {
            const currentEvents = useAppStore.getState().localEvents || [];
            const addedKeys = /* @__PURE__ */ new Set();
            pendingHolidays.forEach((holiday) => {
              if (holiday.date) {
                const date = new Date(holiday.date);
                date.setHours(0, 0, 0, 0);
                const startTime = date.toISOString();
                const title = holiday.name || "Holiday";
                const key = `${title}-${startTime}`;
                const isDuplicate = currentEvents.some((ev) => ev.title === title && ev.startTime === startTime);
                if (!isDuplicate && !addedKeys.has(key)) {
                  addedKeys.add(key);
                  addCalendarEvent({
                    title,
                    startTime,
                    endTime: startTime,
                    notificationEnabled: false,
                    notificationMinutes: 15,
                    colorId: importColor
                  });
                }
              }
            });
            setPendingHolidays(null);
          },
          style: { ...pillFilled, width: "100%" }
        },
        "Import ",
        pendingHolidays.length,
        " Holidays"
      ))) : editingEventDate ? /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-col gap-2 flex-1", style: { background: T_SURFACE, borderRadius: 24, padding: 16 } }, /* @__PURE__ */ window.React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ window.React.createElement("span", { className: "text-xs font-semibold", style: { color: T_FG1 } }, editingEventId ? t("editEvent") || "Edit Event" : t("addEvent") || "Add Event", ": ", format(editingEventDate, "MMM d, yyyy")), /* @__PURE__ */ window.React.createElement("button", { onClick: () => {
        setEditingEventDate(null);
        setEditingEventId(null);
        setNewEventTitle("");
        setNewEventDescription("");
        setNewEventMeetingLink("");
      }, style: { ...iconBtn, width: 28, height: 28, borderRadius: 14 }, "aria-label": t("close") || "Close" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[16px]" }, "close"))), /* @__PURE__ */ window.React.createElement("form", { onSubmit: (e) => {
        e.preventDefault();
        const eventStart = new Date(editingEventDate);
        eventStart.setHours(parseInt(newEventHours, 10));
        eventStart.setMinutes(parseInt(newEventMinutes, 10));
        eventStart.setSeconds(0);
        if (editingEventId) {
          updateCalendarEvent(editingEventId, {
            title: newEventTitle.trim(),
            description: newEventDescription.trim(),
            meetingLink: newEventMeetingLink.trim(),
            startTime: eventStart.toISOString(),
            endTime: eventStart.toISOString(),
            notificationEnabled: newEventNotification,
            colorId: newEventColor
          });
        } else {
          addCalendarEvent({
            title: newEventTitle.trim(),
            description: newEventDescription.trim(),
            meetingLink: newEventMeetingLink.trim(),
            startTime: eventStart.toISOString(),
            endTime: eventStart.toISOString(),
            notificationEnabled: newEventNotification,
            notificationMinutes: 15,
            colorId: newEventColor
          });
        }
        setNewEventTitle("");
        setNewEventDescription("");
        setNewEventMeetingLink("");
        setEditingEventDate(null);
        setEditingEventId(null);
      }, className: "flex flex-col gap-2" }, /* @__PURE__ */ window.React.createElement("div", { className: "relative flex flex-col gap-2" }, /* @__PURE__ */ window.React.createElement("div", { className: "relative" }, /* @__PURE__ */ window.React.createElement(
        "input",
        {
          autoFocus: true,
          type: "text",
          placeholder: t("eventTitle") || "Event Title",
          value: newEventTitle,
          onChange: (e) => setNewEventTitle(e.target.value),
          className: "no-drag-region",
          style: { ...inputStyle, paddingRight: 40 }
        }
      ), /* @__PURE__ */ window.React.createElement("div", { className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[14px]" }, "event"))), /* @__PURE__ */ window.React.createElement(
        "textarea",
        {
          placeholder: t("eventDescription") || "Description (optional)",
          value: newEventDescription,
          onChange: (e) => setNewEventDescription(e.target.value),
          className: "no-drag-region resize-none custom-scrollbar",
          style: inputStyle,
          rows: 2
        }
      ), /* @__PURE__ */ window.React.createElement("div", { className: "relative" }, /* @__PURE__ */ window.React.createElement(
        "input",
        {
          type: "text",
          placeholder: t("meetingLink") || "Meeting Link (optional)",
          value: newEventMeetingLink,
          onChange: (e) => setNewEventMeetingLink(e.target.value),
          className: "no-drag-region",
          style: { ...inputStyle, paddingLeft: 34 }
        }
      ), /* @__PURE__ */ window.React.createElement("div", { className: "absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[14px]" }, "link")))), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-1", style: { background: T_INSET, borderRadius: 16, padding: 6 } }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[14px] text-slate-500 ml-1" }, "schedule"), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center" }, /* @__PURE__ */ window.React.createElement(
        "input",
        {
          type: "text",
          maxLength: 2,
          value: newEventHours,
          onChange: (e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 2);
            if (parseInt(v) < 24 || v === "") setNewEventHours(v);
          },
          onBlur: () => setNewEventHours((prev) => prev.padStart(2, "0")),
          className: "w-6 bg-transparent text-center text-xs text-white outline-none font-bold"
        }
      ), /* @__PURE__ */ window.React.createElement("span", { className: "text-slate-600" }, ":"), /* @__PURE__ */ window.React.createElement(
        "input",
        {
          type: "text",
          maxLength: 2,
          value: newEventMinutes,
          onChange: (e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 2);
            if (parseInt(v) < 60 || v === "") setNewEventMinutes(v);
          },
          onBlur: () => setNewEventMinutes((prev) => prev.padStart(2, "0")),
          className: "w-6 bg-transparent text-center text-xs text-white outline-none font-bold"
        }
      ))), /* @__PURE__ */ window.React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setNewEventNotification(!newEventNotification),
          className: "flex items-center gap-2 text-[11px] font-semibold",
          style: { height: 32, padding: "0 12px", borderRadius: 16, border: 0, background: newEventNotification ? T_CONTAINER : T_TILE, color: newEventNotification ? T_ON_CONTAINER : T_FG2 }
        },
        /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[16px]" }, newEventNotification ? "notifications_active" : "notifications_off"),
        newEventNotification ? t("alertOn") || "Alert On" : t("noAlert") || "No Alert"
      )), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-2 mt-1" }, /* @__PURE__ */ window.React.createElement("div", { className: "flex gap-2", style: { background: T_INSET, borderRadius: 16, padding: 8 } }, ["#60a5fa", "#f87171", "#4ade80", "#fbbf24", "#a78bfa"].map((color) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: color,
          type: "button",
          onClick: () => setNewEventColor(color),
          "aria-label": color,
          "aria-pressed": newEventColor === color,
          style: { width: 16, height: 16, borderRadius: 8, border: 0, backgroundColor: color, opacity: newEventColor === color ? 1 : 0.45, boxShadow: newEventColor === color ? "0 0 0 2px " + T_INSET + ", 0 0 0 3.5px " + T_FG2 : "none" }
        }
      ))), /* @__PURE__ */ window.React.createElement("button", { type: "submit", disabled: !newEventTitle.trim(), className: "ml-auto disabled:opacity-50 disabled:cursor-not-allowed", style: pillFilled }, editingEventId ? t("updateEvent") || "Update" : t("saveEvent") || "Save")))) : /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-col gap-2 flex-1 relative group overflow-hidden", style: { background: T_SURFACE, borderRadius: 24, padding: 16 } }, (() => {
        const targetStartOfDay = new Date(selectedDate);
        targetStartOfDay.setHours(0, 0, 0, 0);
        const agendaData = localEvents.filter((e) => e.startTime && new Date(e.startTime) >= targetStartOfDay).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const selectedDayHasEvent = agendaData.length > 0 && isSameDay(parseISO(agendaData[0].startTime), selectedDate);
        return /* @__PURE__ */ window.React.createElement(window.React.Fragment, null, gcalNeedsSetup && (typeof window.api?.openSettings === "function" ? /* @__PURE__ */ window.React.createElement("button", { onClick: openGcalSettings, className: "text-[10px] text-left underline", style: { color: GCAL_COLOR } }, gcalState.state === "reconnect-needed" ? gt.reconnect : gt.setup) : /* @__PURE__ */ window.React.createElement("span", { className: "text-[10px] text-slate-400" }, gcalState.state === "reconnect-needed" ? gt.reconnect : gt.setup)), /* @__PURE__ */ window.React.createElement("div", { className: "flex justify-between items-center pr-1" }, /* @__PURE__ */ window.React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: T_FG2 } }, selectedDayHasEvent ? `${format(selectedDate, "MMM d")} - ${t("events") || "Events"}` : t("upcomingEvents") || "Upcoming Events"), /* @__PURE__ */ window.React.createElement("button", { onClick: () => {
          setEditingEventDate(selectedDate);
          setNewEventColor(koCalendarColor);
        }, className: "flex items-center justify-center relative z-20", style: { width: 32, height: 32, borderRadius: 16, border: 0, background: T_CONTAINER, color: T_ON_CONTAINER }, "aria-label": t("addEvent") || "Add Event" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[18px]" }, "add"))), /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar h-[160px] animate-in fade-in slide-in-from-top-1 pr-1" }, gcalActive && gcalEventsOnDay(gcalEvents, selectedDate).map((gev) => /* @__PURE__ */ window.React.createElement("div", { key: gev.id, title: gt.title, className: "flex justify-between items-center text-sm px-3 py-2 cursor-default select-none", style: { borderRadius: 16, backgroundColor: T_TILE } }, /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-2.5 flex-1 min-w-0 mr-3" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[14px] shrink-0", style: { color: GCAL_COLOR } }, "event"), /* @__PURE__ */ window.React.createElement("span", { className: "truncate", style: { color: T_FG1 } }, gev.title)), /* @__PURE__ */ window.React.createElement("span", { className: "text-xs shrink-0", style: { color: GCAL_COLOR } }, gev.allDay ? gt.allDay : format(new Date(gev.start), "HH:mm")))), agendaData.slice(0, 8).map((ev) => {
          const eventDate = parseISO(ev.startTime);
          const isEvToday = isSameDay(eventDate, /* @__PURE__ */ new Date());
          const isEvSelected = isSameDay(eventDate, selectedDate);
          return /* @__PURE__ */ window.React.createElement(
            "div",
            {
              key: ev.id,
              onClick: () => {
                setSelectedDate(eventDate);
                setCurrentDate(eventDate);
              },
              className: "flex justify-between items-center text-sm group/event px-3 py-2 cursor-pointer",
              style: { borderRadius: 16, backgroundColor: T_TILE }
            },
            /* @__PURE__ */ window.React.createElement("div", { className: "flex items-start gap-2.5 flex-1 min-w-0 mr-3 mt-1" }, /* @__PURE__ */ window.React.createElement("div", { className: "shrink-0 mt-1", style: { width: 8, height: 8, borderRadius: 4, backgroundColor: isEvSelected ? ev.colorId || koCalendarColor : isEvToday ? T_ACCENT : T_FG3 } }), /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-col min-w-0 flex-1" }, /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ window.React.createElement("span", { className: "truncate", style: { color: T_FG1, fontWeight: isEvSelected ? "600" : "400" } }, ev.title), ev.meetingLink && /* @__PURE__ */ window.React.createElement("button", { onClick: (e) => {
              e.stopPropagation();
              window.api?.openExternal?.(ev.meetingLink);
            }, className: "text-blue-400 hover:text-blue-300 ml-1 shrink-0 bg-blue-400/10 rounded-full w-5 h-5 flex items-center justify-center transition-colors", title: t("joinMeeting") || "Join Meeting" }, /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[12px]" }, "videocam")), ev.notificationEnabled && /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-xs text-primary/50 shrink-0" }, "notifications_active")), ev.description && /* @__PURE__ */ window.React.createElement("span", { className: "text-[11px] truncate mt-0.5", style: { color: T_FG2 }, title: ev.description }, ev.description))),
            /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ window.React.createElement("span", { className: "text-xs group-hover/event:hidden", style: { color: T_FG2, fontVariantNumeric: "tabular-nums" } }, isEvSelected ? format(eventDate, "HH:mm") : format(eventDate, "MMM d")), /* @__PURE__ */ window.React.createElement(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  const d = parseISO(ev.startTime);
                  setEditingEventDate(d);
                  setEditingEventId(ev.id);
                  setNewEventTitle(ev.title);
                  setNewEventDescription(ev.description || "");
                  setNewEventMeetingLink(ev.meetingLink || "");
                  setNewEventHours(format(d, "HH"));
                  setNewEventMinutes(format(d, "mm"));
                  setNewEventNotification(!!ev.notificationEnabled);
                  setNewEventColor(ev.colorId || koCalendarColor);
                },
                className: "hidden group-hover/event:flex w-4 h-4 items-center justify-center text-blue-400 hover:text-blue-300 bg-blue-400/10 rounded"
              },
              /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[12px]" }, "edit")
            ), /* @__PURE__ */ window.React.createElement(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  deleteCalendarEvent(ev.id);
                },
                className: "hidden group-hover/event:flex w-4 h-4 items-center justify-center text-red-400 hover:text-red-300 bg-red-400/10 rounded"
              },
              /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[12px]" }, "delete")
            ))
          );
        }), agendaData.length === 0 && /* @__PURE__ */ window.React.createElement("div", { className: "flex flex-col items-center justify-center h-full opacity-30 mt-1" }, /* @__PURE__ */ window.React.createElement("span", { className: "text-[11px]", style: { color: T_FG3 } }, t("noEventsFound") || "No events found"))));
      })()))
    );
  };
  window.KoBarExtensions.registerPanel("ko-calender-plugin-panel", {
    id: "ko-calender-plugin-panel",
    render: (props) => React.createElement(KoCalendarPluginPanel, props)
  });
  window.KoBarExtensions.registerSidebarButton({
    id: "ko-calender-plugin-btn",
    icon: "calendar_month",
    label: "KoCalendar",
    tile: { template: "value-caption", sensitive: false, live: false, pinnable: false },
    onClick: (e, anchorRect) => {
      const state = window.useAppStore.getState();
      if (state.activeExtensionPanelId === "ko-calender-plugin-panel") {
        state.closeAllUtilityPopups?.();
        window.useAppStore.setState({ activeExtensionPanelId: null, activeExtensionAnchorRect: null });
      } else {
        state.closeAllUtilityPopups?.();
        window.useAppStore.setState({
          activeExtensionPanelId: "ko-calender-plugin-panel",
          activeExtensionAnchorRect: anchorRect
        });
      }
    }
  });
})();
