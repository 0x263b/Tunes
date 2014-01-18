var library = require('./lib/library'),
    api     = require('./lib/api');

api.server.listen(5775);

library.file(__dirname+'/database.json');
library.restore();