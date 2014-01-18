(function(){

var extend = function(target, source, deep) {
	for (key in source) {
		if (deep && $.isPlainObject(source[key])) {
			if (!$.isPlainObject(target[key])) target[key] = {}
			extend(target[key], source[key], deep)
		}
		else if (source[key] !== undefined) target[key] = source[key]
	}
}

// Copy all but undefined properties from one or more
// objects to the `target` object.
$.extend = function(target){
	var deep, args = Array.prototype.slice.call(arguments, 1)
	if (typeof target == 'boolean') {
		deep = target
		target = args.shift()
	}
	args.forEach(function(arg){ extend(target, arg, deep) })
	return target
}

})();
