var express = require('express'),
    app = express(),
    request = require('request'),
    bodyParser = require('body-parser'),
    fs = require('fs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/events2017', express.static('public'));

const port = process.env.PORT || 8090;
var check;
if (port === 8090) {
    check = 'http://localhost:8090/events2017/check_token'
} else {
    check = 'https://events.eu-gb.mybluemix.net/events2017/check_token'
}
var key = 'X4HkNGrwMBXp5NGd';
var category = "technology";

app.get('/events2017/events', function(req, resp) {
    resp.type('json');
    fs.readFile( __dirname + "/data/" + "events.json", 'utf8', function (err, data) {
        var list = JSON.parse(data);
        var query = 'https://api.eventful.com/json/events/search?app_key=' +
            key +
            '&location=location=United%20Kingdom&category=' +
            category;
        request(query, function (error, response, body) {
            var events = JSON.parse(body)["events"]["event"];
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                var icon;
                if (event["image"] !== null) {
                    icon = event["image"]["medium"]["url"];
                } else {
                    icon = undefined;
                }
                var json = {
                    "event_id": event["id"],
                    "title": event["title"],
                    "blurb": event["description"],
                    "date": event["start_time"],
                    "url": event["url"],
                    "venue": {
                        "name": event["venue_name"],
                        "postcode": event["postal_code"],
                        "town": event["city_name"],
                        "url": event["venue_url"],
                        "icon": icon,
                        "venue_id": event["venue_id"]
                    }
                };
                list["events"].push(json);
            }
            resp.status(200).send(JSON.stringify(list, null, 2));
        });
    });
});

app.get('/events2017/events/search', function(req, resp) {
    var search = req.query.search;
    var date = req.query.date;
    var api_date;
    if (search === undefined && date === undefined){
        fs.readFile( __dirname + "/data/" + "events.json", 'utf8', function (err, data) {
            resp.set('Content-Type', 'application/json');
            resp.status(200).send(data);
        });
    } else {
        if (search === undefined) {
            search = "";
        }
        if (date === undefined || date === "") {
            date = "";
            api_date = "";
        } else {
            date = new Date(date);
            api_date = date.getFullYear().toString();
            if (1 + date.getMonth() < 10) {
                api_date += '0' + (1 + date.getMonth()).toString()
            } else {
                api_date += (1 + date.getMonth()).toString()
            }
            if (date.getDate() < 10) {
                api_date += '0' + date.getDate().toString()
            } else {
                api_date += date.getDate().toString()
            }
            api_date += '00';
            date = date.toDateString();
        }
        fs.readFile( __dirname + "/data/" + "events.json", 'utf8', function (err, data) {
            var events = JSON.parse(data);
            var matches = [];
            for (var i = 0; i < events["events"].length; i++) {
                var event = events["events"][i];
                var title = event["title"].toLowerCase();
                var event_date = new Date(event["date"]);
                var date_string = event_date.toDateString();
                if (title.includes(search.toLowerCase()) && date_string.includes(date)) {
                    matches.push(event);
                }
                // } else if (blurb.includes(search.toLowerCase()) && date_string.includes(date)) {
                //     matches.push(event);
                // }
            }
            resp.type('json');
            var query = 'https://api.eventful.com/json/events/search?app_key=' +
                key +
                '&location=location=United%20Kingdom&category=' +
                category +
                '&keywords=' +
                search +
                '&date=' +
                api_date + '-' + api_date;
            request(query, function (error, respons, body) {
                if (JSON.parse(body)["events"] !== null) {
                    var events = JSON.parse(body)["events"]["event"];
                    for (var i = 0; i < events.length; i++) {
                        var event = events[i];
                        var icon;
                        if (event["image"] !== null) {
                            icon = event["image"]["medium"]["url"];
                        } else {
                            icon = undefined;
                        }
                        if (event["description"] === null) {
                            event["description"] = ""
                        }
                        var clean = event["description"].replace(/<[^>]+?>/g, "");
                        var date = event["start_time"].replace(" ", "T");
                        var json = {
                            "event_id": event["id"],
                            "title": event["title"],
                            "blurb": clean,
                            "date": date,
                            "url": event["url"],
                            "venue": {
                                "name": event["venue_name"],
                                "postcode": event["postal_code"],
                                "town": event["city_name"],
                                "url": event["venue_url"],
                                "icon": icon,
                                "venue_id": event["venue_id"]
                            }
                        };
                        matches.push(json);
                    }
                }
                var response;
                if (matches.length === 0){
                    response = {"error": "no such event"};
                } else {
                    response = {"events": matches};
                }
                resp.send(JSON.stringify(response, null, 2));
            });
        });
    }
});

app.get('/events2017/events/get/:id', function (req, resp) {
    fs.readFile( __dirname + "/data/" + "events.json", 'utf8', function (err, data) {
        var events = JSON.parse(data);
        var id = req.params.id;
        var event = null;
        for (var i = 0; i < events["events"].length; i++) {
            if (events["events"][i]["event_id"] === id) {
                event = events["events"][i]
            }
        }
        resp.type('json');
        if (event === null){
            var query = 'https://api.eventful.com/json/events/get?app_key=' +
                key +
                '&id=' +
                id;
            request(query, function (error, respons, body) {
                body = JSON.parse(body);
                if (body["error"] === undefined) {
                    var icon;
                    if (body["image"] !== undefined) {
                        icon = body["image"]["medium"]["url"];
                    } else {
                        icon = undefined;
                    }
                    var json = {
                        "event_id": body["id"],
                        "title": body["title"],
                        "blurb": body["description"],
                        "date": body["start_time"],
                        "url": body["url"],
                        "venue": {
                            "name": body["venue_name"],
                            "postcode": body["postal_code"],
                            "town": body["city_name"],
                            "url": body["venue_url"],
                            "icon": icon,
                            "venue_id": body["venue_id"]
                        }
                    };
                    resp.send(JSON.stringify(json, null, 2));
                } else {
                    event = {"error": "no such event"};
                    resp.send(JSON.stringify(event, null, 2));
                }
            });
        } else {
            resp.send(JSON.stringify(event, null, 2));
        }
    });
});

app.get('/events2017/events/get/', function (req, resp) {
    var event = {"error": "no such event"};
    resp.type('json');
    resp.send(JSON.stringify(event, null, 2));
});

app.get('/events2017/venues', function(req, resp) {
    fs.readFile( __dirname + "/data/" + "venues.json", 'utf8', function (err, data) {
        resp.type('json');
        resp.send(data);
    });
});

app.post('/events2017/venues/add', function (req, resp) {
    console.log(req.body);
    resp.type('json');
    var ip;
    if (req.headers['x-forwarded-for'] !== undefined) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else {
        ip = req.ip;
    }
    request(check + '?ip=' + ip + '&auth_token=' +req.body.auth_token, function (error, respon, body) {
        console.log(body);
        if (body === "True") {
            if (req.body.name === undefined) {
                resp.status(400).send(JSON.stringify({"error": "'name' parameter not supplied"}, null, 2));
                return;
            } else {
                var venue = {};
                venue["name"] = req.body.name;
                if (req.body.postcode !== undefined) {
                    venue["postcode"] = req.body.postcode;
                }
                if (req.body.town !== undefined) {
                    venue["town"] = req.body.town;
                }
                if (req.body.url !== undefined) {
                    venue["url"] = req.body.url;
                }
                if (req.body.icon !== undefined) {
                    venue["icon"] = req.body.icon;
                }
            }
            fs.readFile( __dirname + "/data/" + "venues.json", 'utf8', function (err, data) {
                data = JSON.parse(data);
                var venues = data["venues"];
                for (var i = 1; i < 100000; i++) {
                    var key = "v_" + i;
                    if (venues[key] === undefined) {
                        data["venues"][key] = venue;
                        break;
                    }
                }
                fs.writeFile( __dirname + "/data/" + "venues.json", JSON.stringify(data, null, 2), 'utf8', function (err, data) {

                });
                resp.send(JSON.stringify(data));
            });
        } else {
            resp.status(400).send(JSON.stringify({"error": "not authorised, wrong token for ip " + ip}, null, 2));
        }
    });
});

app.post('/events2017/events/add', function (req, resp) {
    resp.type('json');
    var response;
    var ip;
    if (req.headers['x-forwarded-for'] !== undefined) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else {
        ip = req.ip;
    }
    request(check + '?ip=' + ip + '&auth_token=' +req.body.auth_token, function (error, respon, body) {
        if (body === "True") {
            if (req.body.event_id === undefined) {
                response = {"error": "'event_id' parameter not supplied"};
                resp.status(400).send(JSON.stringify(response, null, 2));
            } else if (req.body.title === undefined) {
                response = {"error": "'title' parameter not supplied"};
                resp.status(400).send(JSON.stringify(response, null, 2));
            } else if (req.body.venue_id === undefined) {
                response = {"error": "'venue_id' parameter not supplied"};
                resp.status(400).send(JSON.stringify(response, null, 2));
            } else if (req.body.date === undefined) {
                response = {"error": "'date' parameter not supplied"};
                resp.status(400).send(JSON.stringify(response, null, 2));
            } else if (new Date(req.body.date).toString() === "Invalid Date") {
                response = {"error": "'date' parameter doesn't conform with ISO8601"};
                resp.status(400).send(JSON.stringify(response, null, 2));
            } else {
                var event = {};
                event["event_id"] = req.body.event_id;
                event["title"] = req.body.title;
                if (req.body.blurb !== undefined) {
                    event["blurb"] = req.body.blurb;
                }
                event["date"] = req.body.date;
                if (req.body.url !== undefined) {
                    event["url"] = req.body.url;
                }
                event["venue"] = {
                    "venue_id": req.body.venue_id
                };
                fs.readFile( __dirname + "/data/" + "events.json", 'utf8', function (err, data) {
                    data = JSON.parse(data);
                    var events = data["events"];
                    var overwrite = null;
                    for (var i = 0; i < events.length; i++) {
                        if (events[i]["event_id"] === event["event_id"]) {
                            overwrite = i;
                        }
                    }
                    if (overwrite !== null) {
                        events[overwrite] = event;
                    } else {
                        events.push(event);
                    }
                    data = JSON.stringify(data, null, 2);
                    fs.writeFile( __dirname + "/data/" + "events.json", data, 'utf8', function () {
                        resp.send(data);
                    });
                });
            }
        } else {
            response = {"error": "not authorised, wrong token for ip " + ip};
            resp.status(400).send(JSON.stringify(response, null, 2));
        }
    });
});

var logins = {"admin": "password1", "jordan": "qwerty1234"};
var tokens = {"127.0.0.1": {"token": "concertina", "valid until": 9999999999999}};

app.post('/events2017/authenticate', function (req, resp) {
    resp.type('json');
    var username = req.body.user;
    var password = req.body.pass;
    if (logins[username] !== password) {
        var error = {"error": "username or password is incorrect"};
        resp.status(400).send(JSON.stringify(error, null, 2));
        return;
    }
    var ip_address = req.body.ip;
    var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var token = "";
    for (var i = 0; i < 10; i++) {
        token += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    var current_time = (new Date()).getTime();
    tokens[ip_address] = {"token": token, "valid until": current_time + (2 * 60 * 60 * 1000)};
    tokens["127.0.0.1"] = {"token": token, "valid until": current_time + (2 * 60 * 60 * 1000)};
    resp.send(JSON.stringify(tokens[ip_address], null, 2));
});

app.get('/events2017/check_token', function (req, resp) {
    var ip_address = req.query.ip;
    if (ip_address.startsWith("::ffff:")) {
        ip_address = ip_address.substring(7);
    }
    var token = req.query.auth_token;
    var time = (new Date()).getMilliseconds();
    var response;
    if (ip_address.startsWith("129.234") && token === "concertina") {
        response = "True";
    } else if (ip_address === "127.0.0.1" && token === "concertina") {
        response = "True";
    } else if (ip_address === undefined || token === undefined || tokens[ip_address] === undefined) {
        response = "False";
    } else if (tokens[ip_address]["token"] === token && tokens[ip_address]["valid until"] > time) {
        response = "True";
    } else {
        response = "False";
    }
    resp.send(response)
});

app.listen(port, function () {
    console.log('App running at http://127.0.0.1:' + port + '/events2017!');
});