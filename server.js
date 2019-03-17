var http = require('http')
var mysql = require('mysql')
var fs = require('fs')
var qs = require('querystring')
var Cookies = require('cookies')
var url = require('url')

var con = mysql.createConnection({
	host: 'localhost',
	user: 'node',
	password: 'nodepassword'
})

con.connect(function(err){
	if (err) throw err;
	console.log('MYSQL connected')

	con.query('USE socialite', function(err, result){
		if (err) throw err
		else console.log('Using database socialite')
	})	
})

http.createServer(function(req, res) {
	var cookies = new Cookies(req, res)
	var username = cookies.get('username')

	if (username) 
	{
		console.log('user: ' + username)
		if (req.method == 'GET') {
			serve_page(res, 'feed.html')
		}
		// get -> 
			// feed, post page
		// post -> 
			// posting a post or signing out
		if (req.method == 'POST') 
		{
			var q = url.parse(req.url, true)
			if (q.path == '/signout') {
				cookies.set('username')
				serve_page(res, 'login.html')
			}
		}
	} else 
	{
		console.log('no user signed in')

		if (req.method == 'GET') 
		{
			serve_page(res, 'login.html')

		} else if (req.method == 'POST') 
		{
			var body = ''

			req.on('data', function(data) { body += data })

			req.on('end', function(){
				var post = qs.parse(body)

				begin_signon(res, post.username, post.password, cookies)
			})			
		}
	}
}).listen(8080);

function serve_page(res, page) {
	fs.readFile(page, 'utf8', function(err, data){
		if (err) throw err;

		res.writeHead(200, {'Content-Type':'text/html'})
		res.write(data)
		res.end()
	})
}

// currently not used
function insert_user(username, password) {
	con.query({
		sql: 'INSERT INTO user (name, password) VALUES(?, ?)',
		values: [username, password]
	}, function(err,result){
		if (err) throw err;
		else console.log('user inserted')
	})
}

function begin_signon(res, username, password, cookies){
	con.query({
		sql: 'SELECT password FROM user WHERE name = ?',
		values: [username]
	}, function(err, result) {
		if (err) throw err;

		if (result.length > 0) {
			if(password == result[0].password) {
				// initiate session
				console.log('user exists, password accurate')
				cookies.set('username', username)
				serve_page(res, 'feed.html')
			}
			else {
				// initiate invalid password redirect
				console.log('user exists, bad password')
				serve_page(res, 'login.html')
			}
		}
		else {
			// initiate invalid user redirect
			console.log('user does not exist')
			serve_page(res, 'login.html')
		}
	})
}
