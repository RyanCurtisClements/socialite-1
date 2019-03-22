var http = require('http')
var mysql = require('mysql')
var fs = require('fs')
var qs = require('querystring')
var Cookies = require('cookies')
var url = require('url')

var con = mysql.createConnection({
	host: 'localhost',
	user: 'node',
	password: 'nodepassword',
	database: 'socialite'
})

con.connect(function(err){
	if (err) throw err;
	console.log('MYSQL connected to database socialite')	
})

http.createServer(function(req, res) {
	var cookies = new Cookies(req, res)
	var username = cookies.get('username')

	if (username) 
	{
		console.log('user: ' + username)

		switch (req.method)
		{
			case 'GET':
				serve_page(res, 'feed.html')
			break

			case 'POST':
			console.log('POST')

			switch(url.parse(req.url).path)
			{
				case '/signout':
					console.log('Sign Out')
					cookies.set('username')
					serve_page(res, 'login.html')
				break
			}
			break
		}			
	} else 
	{
		console.log('no user signed in')
		switch (req.method)
		{
			case 'GET':
			serve_page(res, 'login.html')
			break
			
			case 'POST':
				var body = ''
				req.on('data', (data) => { body += data })	
				var post = qs.parse(body, true)
				console.log(post.username + ' ' + post.password)

				req.on('end', () => {
					switch(url.parse(req.url).path)
					{
						case '/login':
						begin_signon(res, post, cookies)
					
						break

						case '/createuser':
							insert_user(res, post)
						break
					}
				})			
			break
		}
	}
}).listen(8080);

function serve_page(res, page) {
	fs.readFile(page, 'utf8', (err, data) => {
		if (err) throw err;

		res.writeHead(200, {'Content-Type':'text/html'})
		res.write(data)
		res.end()
	})
}

// currently not used
function insert_user(res, post) {


	con.query({
		sql: 'INSERT INTO user (name, password) VALUES(?, ?)',
		values: [post.username, post.password]
	}, (err,result) => {
		if (err) throw err;
		else console.log('user inserted')
		
		serve_page(res, 'login.html')
	})
}

function begin_signon(res, post, cookies){
	

	con.query({
		sql: 'SELECT password FROM user WHERE name = ?',
		values: [post.username]
	}, function(err, result) {
		if (err) throw err;

		if (result.length > 0) {
			if(post.password == result[0].password) {
				// initiate session
				console.log('user exists, password accurate')
				cookies.set('username', post.username)
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
			serve_page(res, 'user.html')
		}
	})
}
