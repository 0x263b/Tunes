var sortObject = function(obj, sorter, each){
	var list = [];
	for (var prop in obj) {
		list.push({field: prop, value: obj[prop]});
	}
	list.sort(function(a, b){
		return sorter(a.value, b.value);
	});
	for (var i in list) {
		each(list[i].field, list[i].value);
	}
};
