LobbyClient = function() {
	var gameClient, game, user, player, client;

	var $loginPanel = $('#loginPanel'),
	$loginButton = $('#loginButton'),
	$lobbyPanel = $('#lobbyPanel'),
	$nickField = $('#nickField'),
	$playNowButton = $('#playNowButton'),
	$createGameButton = $('#createGameButton');

	var init = function() {
		$nickField.keypress(function(e) {
			if (e.keyCode === 13) {
				login();
			}
		});
		$loginButton.click(function() {
			login();
		});

		$playNowButton.click(function() {
			playNow();
		});

		$createGameButton.click(function() {
			createGame();
		});

		$nickField.focus();
	};

	var startClient = function() {
		client = new io.Socket();
		client.connect();
		client.on('connect', function() {
			if (localStorage.guid) {
				client.send({
					cmd: 'authPlayer',
					data: {
						guid: user.guid
					}
				});
			}
		});
		client.on('message', function(msg) {
			if (msg.result !== 'error') {
				switch (msg.cmd) {
				case 'authPlayer':
					if (msg.result === 'OK') {
						showLobby();
					} else {
						utils.log('Snap!');
					}
					break;
				}
			} else  {
				utils.log('Error: ' + msg.cmd + ' - ' + msg.code + ' - ' + msg.msg);
			}

		});
	};

	var showLobby = function() {
		$loginPanel.hide();
		$lobbyPanel.show();
	}

	var createGame = function() {
		$.getJSON('/lobby?cmd=createGame&guid=' + user.guid, function(data) {
			utils.log(data);
			if (data.result === 'OK') {
				var game = Game.deserialize(data.data);
				gameClient = new GameClient(game, game.getPlayer(user.nick));
				$lobbyPanel.hide();
			}
		});
	};

	var playNow = function() {
		$.getJSON('/lobby?cmd=joinGame&guid=' + user.guid, function(data) {
			utils.log(data);
		});
	};

	var login = function() {
		if ($nickField.val().length > 0) {
			$.getJSON('/lobby?cmd=loginPlayer&nick=' + $nickField.val(), function(data) {
				utils.log(data);
				if (data.result === 'OK') {
					user = data.data;
					localStorage.guid = user.guid;
					startClient();
					showLobby();
				} else {
					$loginPanel.children('span').text('Nick taken!');
				}
				return false;
			});
		}
	};

	init();
};

