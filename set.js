
var List = require("./list");
var Reducible = require("./reducible");
var Operators = require("./operators");
var TreeLog = require("./tree-log");
var Iterator = require("./iterator");

var object_has = Object.prototype.hasOwnProperty;

module.exports = Set;

function Set(copy, equals, hash) {
    if (!(this instanceof Set)) {
        return new Set(copy, options);
    }
    equals = equals || Set.equals || Operators.equals;
    hash = hash || Set.hash || Operators.hash;
    this.equals = equals;
    this.hash = hash;
    this.buckets = {};
    this.length = 0;
    if (copy) {
        copy.forEach(this.add, this);
    }
}

Set.prototype.Bucket = List;

Set.prototype.has = function (value) {
    var hash = this.hash(value);
    var buckets = this.buckets;
    return object_has.call(buckets, hash) && buckets[hash].has(value);
};

Set.prototype.get = function (value) {
    var hash = this.hash(value);
    var buckets = this.buckets;
    if (object_has.call(buckets, hash)) {
        return buckets[hash].get(value);
    }
};

Set.prototype['delete'] = function (value) {
    var hash = this.hash(value);
    var buckets = this.buckets;
    if (object_has.call(buckets, hash)) {
        var bucket = buckets[hash];
        if (bucket["delete"](value)) {
            this.length--;
            if (bucket.length === 0) {
                delete buckets[hash];
            }
            return true;
        }
    }
    return false;
};

Set.prototype.add = function (value) {
    var hash = this.hash(value);
    var buckets = this.buckets;
    if (!object_has.call(buckets, hash)) {
        buckets[hash] = new this.Bucket(null, this.equals);
    }
    if (!buckets[hash].has(value)) {
        buckets[hash].add(value);
        this.length++;
    }
};

Set.prototype.reduce = function (callback, basis /*, thisp*/) {
    var thisp = arguments[2];
    var buckets = this.buckets;
    return Object.keys(buckets).reduce(function (basis, hash) {
        var bucket = buckets[hash];
        return bucket.reduce(callback, basis, thisp);
    }, basis);
};

Set.prototype.forEach = Reducible.forEach;
Set.prototype.map = Reducible.map;
Set.prototype.toArray = Reducible.toArray;
Set.prototype.filter = Reducible.filter;
Set.prototype.every = Reducible.every;
Set.prototype.some = Reducible.some;
Set.prototype.all = Reducible.all;
Set.prototype.any = Reducible.any;
Set.prototype.min = Reducible.min;
Set.prototype.max = Reducible.max;
Set.prototype.count = Reducible.count;
Set.prototype.sum = Reducible.sum;
Set.prototype.average = Reducible.average;
Set.prototype.flatten = Reducible.flatten;

Set.prototype.iterate = function () {
    var buckets = this.buckets;
    var hashes = Object.keys(buckets);
    return Iterator.concat(hashes.map(function (hash) {
        return buckets[hash].iterate();
    }));
};

Set.prototype.log = function (charmap, stringify) {
    charmap = charmap || TreeLog.unicodeSharp;
    stringify = stringify || this.stringify;

    var buckets = this.buckets;
    var hashes = Object.keys(buckets);
    hashes.forEach(function (hash, index) {
        var branch;
        var leader;
        if (index === hashes.length - 1) {
            branch = charmap.fromAbove;
            leader = ' ';
        } else {
            branch = charmap.fromBoth;
            leader = charmap.strafe;
        }
        var bucket = buckets[hash];
        console.log(branch + charmap.through + charmap.branchDown + ' ' + hash);
        bucket.forEach(function (value, node) {
            var branch;
            if (node === bucket.head.prev) {
                branch = charmap.fromAbove;
            } else {
                branch = charmap.fromBoth;
            }
            console.log(stringify(
                value,
                leader + ' ' + branch + charmap.through + charmap.through + ' ',
                leader + '     '
            ));
        });
    });
};

Set.prototype.stringify = function (value, leader) {
    if (Object(value) === value) {
        return leader + JSON.stringify(value);
    } else {
        return leader + value;
    }
};

