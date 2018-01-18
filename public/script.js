$(document).ready(function () {

    var ip;

    if($('body').hasClass('admin')){
        $.get("https://freegeoip.net/json/?", function(data) {
            ip = data["ip"];
            var cookie = document.cookie;
            var token = cookie.substr(cookie.indexOf('=') + 1);
            var query = '/events2017/check_token?ip=' + ip + '&auth_token=' + token;
            $.get(query, function(data) {
                refresh();
                if (data === "True") {
                    $('#login_page').addClass("hidden");
                    $('#admin_page').removeClass("hidden");
                }
            })
        });
    }

    // Called when the search button is clicked on the events page.
    $("#event_search").submit(function () {
        event.preventDefault();
        $("#event_row").empty();
        var string = "/events2017/events/search?search=" + $("#keywords").val() + "&date=" + $("#date").val();
        $.get(string, function (data) {
            if (data["error"] !== undefined) {
                $('#events_container').addClass('hidden');
                $("#event_disp").text("No matching events found, please try again!");
            } else {
                $('#events_container').removeClass('hidden');
                var matches = data["events"];
                var match_no = matches.length;
                $("#event_disp").text(match_no + " result(s) found!");
                for (var i = 0; i < match_no; i++) {
                    var event = matches[i];
                    var date = new Date(event["date"]);
                    var date_string = date.toDateString();
                    var info = event["title"] + "<br>" + date_string + "<br>";
                    if (event["venue"]["name"] !== undefined) {
                        info = info + event["venue"]["name"];
                    } else {
                        info = info + event["venue"]["venue_id"]
                    } //TODO Make buttons less blue.
                    var button = "<button type=\"button\" data-toggle=\"modal\" data-target=\"#information\" class=\"btn btn-primary gradient btn-block\" id=\"e_id\">" + info + "</button>";
                    $("#event_row").append("<div class=\"col-lg-6 event\">" + button + "<p class='hidden'>" + JSON.stringify(event, null, 2) + "</p>" + "</div>");
                }
            }
        })
    });

    // Handler for pop up information about events.
    $('#information').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        var info = JSON.parse(button.next().text()); // Get event info from button
        var modal = $(this);
        modal.find('#e_title').text("Event Name: " + info["title"]);
        modal.find('#e_blurb').text("Event Summary: " + info["blurb"]);
        modal.find('#e_date').text("Date: " + info["date"]);
        if (info["url"] !== undefined) {
            modal.find('#e_url').html("URL: <a href='" + info["url"] + "'>" + info["url"] + "</a>");
        } else {
            modal.find('#e_url').html("");
        }
        modal.find('#e_event_id').text("Event ID: " + info["event_id"]);

        modal.find('#v_name').text("Venue Name: " + info["venue"]["name"]);
        modal.find('#v_town').text("Town: " + info["venue"]["town"]);
        modal.find('#v_postcode').text("Postcode: " + info["venue"]["postcode"]);
        if (info["venue"]["url"] !== undefined) {
            modal.find('#v_url').html("URL: <a href='" + info["venue"]["url"] + "'>" + info["venue"]["url"] + "</a>");
        } else {
            modal.find('#v_url').html("");
        }
        try {
            modal.find('#v_icon').remove();
        } catch (e) {
            alert(e.message);
        }
        if (info["venue"]["icon"] !== undefined) {
            modal.find('#e_modal_body').append("<img id=\"v_icon\" class=\"icon_small\" src=\"" + info["venue"]["icon"] + "\">");
        }
        modal.find('#v_venue_id').text("Venue ID: " + info["venue"]["venue_id"]);
    });

    // Called when the login button is clicked on the admin page.
    $("#login").submit(function () {
        event.preventDefault();
        var data = {"user": $("#username").val(),
            "pass": $("#password").val(),
            "ip": ip
        };
        $.post('/events2017/authenticate', data).done(
            function (jqXHR) {
                document.cookie = "token=" + jqXHR["token"];
                $('#login_page').addClass("hidden");
                $('#admin_page').removeClass("hidden");
            }
        ).fail (
            function (jqXHR) {
                var error = JSON.parse(jqXHR.responseText)["error"];
                alert(error);
            }
        );
    });

    // Updates Venue Information
    function refresh(){
        $("#venue_row").empty();
        $.get("/events2017/venues", function (data) {
            var venues = data["venues"];
            var keys = Object.keys(venues);
            var num = keys.length;
            $("#venue_disp").text(num + " venue(s) found.");
            for (var i = 0; i < num; i++) {
                var venue = venues[keys[i]];
                venue["venue_id"] = keys[i];
                var info = venue["name"] + "<br>" + venue["town"] + "<br>" + venue["postcode"];
                var button = "<button type=\"button\" class=\"btn btn-primary gradient btn-block\" data-toggle=\"modal\" data-target=\"#venue_modal2\">" + info + "</button>";
                $("#venue_row").append("<div class=\"col-md-6 col-xl-4 event\">" + button + "<p class='hidden'>" + JSON.stringify(venue, null, 2) + "</p>" + "</div>");
            }
        })
    }

    // Handler for pop up information about venues.
    $('#venue_modal2').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        var info = JSON.parse(button.next().text()); // Get event info from button
        var modal = $(this);
        modal.find('#v_name').text("Venue Name: " + info["name"]);
        modal.find('#v_town').text("Town: " + info["town"]);
        modal.find('#v_postcode').text("Postcode: " + info["postcode"]);
        if (info["url"] !== undefined) {
            modal.find('#v_url').html("URL: <a href='" + info["url"] + "'>" + info["url"] + "</a>");
        } else {
            modal.find('#v_url').html("");
        }
        try {
            modal.find('#v_icon').remove();
        } catch (e) {
            alert(e.message);
        }
        if (info["icon"] !== undefined) {
            modal.find('#v_modal_body').prepend("<img id=\"v_icon\" class=\"icon\" src=\"" + info["icon"] + "\">");
        }
        modal.find('#v_venue_id').text("Venue ID: " + info["venue_id"]);
    });

    $("#add_event").click(function () {
        var venue = $("#v_venue_id").text() + "§";
        venue += $("#v_name").text() + "§";
        venue += $("#v_town").text() + "§";
        venue += $("#v_postcode").text() + "§";
        venue += $("#v_url").text();
        var image = $("img").first()[0];
        if (image !== undefined) {
            venue += "§" + image.src;
        }
        $("#venue_passed").text(venue);
        $("#event_modal").modal('toggle');
    });

    $("#event_submit").click(function () {
        var cookie = document.cookie;
        var venue = $("#venue_passed").text().split('§'); //Could use this to automatically fill venue information.
        var venue_id = venue[0].replace("Venue ID: ", "");
        var title = $("#event_title").val();
        var event_id = $("#event_id").val();
        var date = $("#event_date").val();
        var warn = $("#warning2");
        if (title === "") {
            warn.removeClass("hidden");
            warn.text("* Event name is required.");
            return;
        } else if (event_id === "") {
            warn.removeClass("hidden");
            warn.text("* Event ID is required.");
            return;
        } else if (date === "") {
            warn.removeClass("hidden");
            warn.text("* Event date is required.");
            return;
        }
        warn.addClass("hidden");

        var data = {"title": title,
            "event_id": event_id,
            "venue_id": venue_id,
            "date": date,
            "auth_token": cookie.substr(cookie.indexOf('=') + 1)
        };

        var blurb = $("#event_blurb").val();
        var url = $("#event_url").val();
        if (url !== "") {
            data["url"] = url;
        }
        if (blurb !== "") {
            data["blurb"] = blurb;
        }

        $.post('/events2017/events/add', data).done(
            function () {
                $('#event_modal').modal('toggle');
                clear_event();
            }
        ).fail (
            function (jqXHR) {
                var error = JSON.parse(jqXHR.responseText)["error"];
                alert(error);
                if (error.startsWith("not authorised")) {
                    $('#event_modal').modal('toggle');
                    clear_event();
                    $('#login_page').removeClass("hidden");
                    $('#admin_page').addClass("hidden");
                }
            }
        );
    });

    function clear_event() {
        $("#event_title").val('');
        $("#event_id").val('');
        $("#event_date").val('');
        $("#event_blurb").val('');
        $("#event_url").val('');
    }

    function clear_venue() {
        $("#venue_name").val('');
        $("#venue_town").val('');
        $("#venue_postcode").val('');
        $("#venue_url").val('');
        $("#venue_icon").val('');
    }

    $("#venue_submit").click(function () {
        event.preventDefault();
        var cookie = document.cookie;
        var name = $("#venue_name").val();
        var town = $("#venue_town").val();
        var postcode = $("#venue_postcode").val();
        var url = $("#venue_url").val();
        var icon = $("#venue_icon").val();
        var warn = $("#warning");
        if (name === "") {
            warn.removeClass("hidden");
            return;
        }
        warn.addClass("hidden");
        var data = {"name": name,
            "auth_token": cookie.substr(cookie.indexOf('=') + 1)
        };
        if (town !== "") {
            data["town"] = town;
        }
        if (postcode !== "") {
            data["postcode"] = postcode;
        }
        if (url !== "") {
            data["url"] = url;
        }
        if (icon !== "") {
            data["icon"] = icon;
        }
        $.post('/events2017/venues/add', data).done(
            function () {
                $('#venue_modal').modal('toggle');
                clear_venue();
                refresh();
            }
        ).fail (
            function (jqXHR) {
                var error = JSON.parse(jqXHR.responseText)["error"];
                alert(error);
                $('#venue_modal').modal('toggle');
                clear_venue();
                $('#login_page').removeClass("hidden");
                $('#admin_page').addClass("hidden");
            }
        );
    });
});
