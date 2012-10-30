"use strict";

module.exports = SortedArray;

require("./array");
require("./object");
var Reducible = require("./reducible");
var Observable = require("./observable");

function SortedArray(values, equals, compare, content) {
    if (!(this instanceof SortedArray)) {
        return new SortedArray(values, equals, compare, content);
    }
    if (Array.isArray(values)) {
        this.array = values;
        values = values.splice(0, values.length);
    } else {
        this.array = [];
    }
    this.contentEquals = equals || Object.equals;
    this.contentCompare = compare || Object.compare;
    this.content = content || Function.noop;

    this.length = 0;
    this.addEach(values);
}

function search(array, value, compare) {
    var first = 0;
    var last = array.length - 1;
    while (first <= last) {
        var middle = (first + last) >> 1; // Math.floor( / 2)
        var comparison = compare(value, array[middle]);
        if (comparison > 0) {
            first = middle + 1;
        } else if (comparison < 0) {
            last = middle - 1;
        } else {
            return middle;
        }
    }
    return -(first + 1);
}

function searchFirst(array, value, compare, equals) {
    var index = search(array, value, compare);
    if (index < 0) {
        return -1;
    } else {
        while (index > 0 && equals(value, array[index - 1])) {
            index--;
        }
        if (!equals(value, array[index])) {
            return -1;
        } else {
            return index;
        }
    }
}

function searchLast(array, value, compare, equals) {
    var index = search(array, value, compare);
    if (index < 0) {
        return -1;
    } else {
        while (index < array.length - 1 && equals(value, array[index + 1])) {
            index++;
        }
        if (!equals(value, array[index])) {
            return -1;
        } else {
            return index;
        }
    }
}

function searchForInsertionIndex(array, value, compare) {
    var index = search(array, value, compare);
    if (index < 0) {
        return -index - 1;
    } else {
        var last = array.length - 1;
        while (index < last && compare(value, array[index + 1]) === 0) {
            index++;
        }
        return index;
    }
}

SortedArray.prototype.constructClone = function (values) {
    return new this.constructor(
        values,
        this.contentEquals,
        this.contentCompare,
        this.content
    );
};

SortedArray.prototype.has = function (value) {
    var index = search(this.array, value, this.contentCompare);
    return index >= 0 && this.contentEquals(this.array[index], value);
};

SortedArray.prototype.get = function (value) {
    var index = searchFirst(this.array, value, this.contentCompare, this.contentEquals);
    if (index !== -1) {
        return this.array[index];
    } else {
        return this.content(value);
    }
};

SortedArray.prototype.add = function (value) {
    var index = searchForInsertionIndex(this.array, value, this.contentCompare);
    if (this.isObserved) {
        this.dispatchBeforeContentChange([value], [], index);
    }
    this.array.splice(index, 0, value);
    this.length++;
    if (this.isObserved) {
        this.dispatchContentChange([value], [], index);
    }
    return true;
};

SortedArray.prototype["delete"] = function (value) {
    var index = searchFirst(this.array, value, this.contentCompare, this.contentEquals);
    if (index !== -1) {
        if (this.isObserved) {
            this.dispatchBeforeContentChange([], [value], index);
        }
        this.array.splice(index, 1);
        this.length--;
        if (this.isObserved) {
            this.dispatchContentChange([], [value], index);
        }
        return true;
    } else {
        return false;
    }
};

SortedArray.prototype.indexOf = function (value) {
    return searchFirst(this.array, value, this.contentCompare, this.contentEquals);
};

SortedArray.prototype.lastIndexOf = function (value) {
    return searchLast(this.array, value, this.contentCompare, this.contentEquals);
};

SortedArray.prototype.push = function () {
    this.addEach(arguments);
};

SortedArray.prototype.unshift = function () {
    this.addEach(arguments);
};

SortedArray.prototype.pop = function () {
    return this.array.pop();
};

SortedArray.prototype.shift = function () {
    return this.array.shift();
};

SortedArray.prototype.slice = function () {
    return this.array.slice.apply(this.array, arguments);
};

SortedArray.prototype.splice = function (index, length /*...plus*/) {
    return this.swap(index, length, Array.prototype.slice.call(arguments, 2));
};

SortedArray.prototype.swap = function (index, length, plus) {
    if (index === undefined && length === undefined) {
        return [];
    }
    index = index || 0;
    if (index < 0) {
        index += this.length;
    }
    if (length === undefined) {
        length = Infinity;
    }
    var minus = this.slice(index, index + length);
    if (this.isObserved) {
        this.dispatchBeforeContentChange(plus, minus, index);
    }
    this.array.splice(index, length);
    this.addEach(plus);
    if (this.isObserved) {
        this.dispatchContentChange(plus, minus, index);
    }
    return minus;
};

SortedArray.prototype.reduce = function () {
    return this.array.reduce.apply(this.array, arguments);
};

SortedArray.prototype.reduceRight = function () {
    return this.array.reduce.apply(this.array, arguments);
};

SortedArray.prototype.addEach = Reducible.addEach;
SortedArray.prototype.forEach = Reducible.forEach;
SortedArray.prototype.map = Reducible.map;
SortedArray.prototype.toArray = Reducible.toArray;
SortedArray.prototype.filter = Reducible.filter;
SortedArray.prototype.every = Reducible.every;
SortedArray.prototype.some = Reducible.some;
SortedArray.prototype.all = Reducible.all;
SortedArray.prototype.any = Reducible.any;
SortedArray.prototype.sum = Reducible.sum;
SortedArray.prototype.average = Reducible.average;
SortedArray.prototype.concat = Reducible.concat;
SortedArray.prototype.flatten = Reducible.flatten;
SortedArray.prototype.zip = Reducible.flatten;
SortedArray.prototype.sorted = Reducible.sorted;
SortedArray.prototype.clone = Reducible.clone;

SortedArray.prototype.getContentChangeDescriptor = Observable.getContentChangeDescriptor;
SortedArray.prototype.addContentChangeListener = Observable.addContentChangeListener;
SortedArray.prototype.removeContentChangeListener = Observable.removeContentChangeListener;
SortedArray.prototype.dispatchContentChange = Observable.dispatchContentChange;
SortedArray.prototype.addBeforeContentChangeListener = Observable.addBeforeContentChangeListener;
SortedArray.prototype.removeBeforeContentChangeListener = Observable.removeBeforeContentChangeListener;
SortedArray.prototype.dispatchBeforeContentChange = Observable.dispatchBeforeContentChange;

SortedArray.prototype.min = function () {
    if (this.length) {
        return this.array[0];
    }
};

SortedArray.prototype.max = function () {
    if (this.length) {
        return this.array[this.length - 1];
    }
};

SortedArray.prototype.one = function () {
    return this.array.one();
};

SortedArray.prototype.only = function () {
    return this.array.only();
};

SortedArray.prototype.clear = function () {
    var minus;
    if (this.isObserved) {
        minus = this.array.slice();
        this.dispatchBeforeContentChange([], minus, 0);
    }
    this.length = 0;
    this.array.clear();
    if (this.isObserved) {
        this.dispatchContentChange([], minus, 0);
    }
};

SortedArray.prototype.iterate = function (start, end) {
    return new this.Iterator(this.array, start, end);
};

SortedArray.prototype.Iterator = Array.prototype.Iterator;
